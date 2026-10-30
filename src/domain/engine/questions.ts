import {
  Answer,
  C,
  CONTEXT,
  Estimate,
  Observation,
  Question,
  selectable,
  canonical,
  classify,
  compare,
  day,
  estimate,
  tie,
} from "./core";
import { family } from "./reflections";
export interface Exposure {
  questionId: string;
  date: string;
}
export const compatible = (chosen: readonly Question[], q: Question) =>
  chosen.every(
    (x) =>
      x.id !== q.id &&
      x.semanticClusterId !== q.semanticClusterId &&
      x.narrativeTemplateId !== q.narrativeTemplateId,
  );
export function eligible(
  q: Question,
  date: string,
  history: readonly Exposure[],
  localPreview = false,
): boolean {
  return (
    selectable(q.quality, localPreview) &&
    q.locale === "es-CL" &&
    q.sessionContexts.includes("morning_intent") &&
    q.answers.length >= 3 &&
    q.answers.length <= 5 &&
    !history.some(
      (h) =>
        h.questionId === q.id &&
        day(date) - day(h.date) >= 0 &&
        day(date) - day(h.date) <= C.questionCooldownCalendarDays,
    )
  );
}
export const diversity = (chosen: readonly Question[], q: Question) =>
  ((chosen.some((x) => x.style === q.style) ? 0 : 1) +
    (q.scenarioTags.some((t) => !chosen.some((x) => x.scenarioTags.includes(t)))
      ? 1
      : 0) +
    (chosen.some((x) => x.semanticClusterId === q.semanticClusterId) ? 0 : 1)) /
  3;
function lastExposureMap(today: number, history: readonly Exposure[]) {
  const map = new Map<string, number>();
  for (const h of history) {
    const d = day(h.date);
    if (d <= today) {
      const prev = map.get(h.questionId);
      if (prev === undefined || d > prev) map.set(h.questionId, d);
    }
  }
  return map;
}
function noveltyFromLast(today: number, lastDay: number | undefined) {
  return lastDay !== undefined ? Math.min(1, (today - lastDay) / 120) : 1;
}
const metaCache = new WeakMap<
  Question,
  { v: number; a: number; ctx: number }
>();
function qMeta(q: Question) {
  let m = metaCache.get(q);
  if (!m) {
    m = {
      v: Number(q.coveragePotential.valence >= 0.75),
      a: Number(q.coveragePotential.activation >= 0.5),
      ctx:
        (q.coveragePotential.tension >= 0.5 ? 1 : 0) |
        (q.coveragePotential.mentalLoad >= 0.5 ? 2 : 0) |
        (q.coveragePotential.connection >= 0.5 ? 4 : 0) |
        (q.coveragePotential.motivation >= 0.5 ? 8 : 0),
    };
    metaCache.set(q, m);
  }
  return m;
}
const vectorCountCache = new WeakMap<readonly Answer[], number>();
function distinctVectors(answers: readonly Answer[]) {
  let n = vectorCountCache.get(answers);
  if (n === undefined) {
    n = new Set(
      answers.map((a) =>
        canonical(
          [...a.effects].sort((x, y) => compare(x.dimension, y.dimension)),
        ),
      ),
    ).size;
    vectorCountCache.set(answers, n);
  }
  return n;
}
const contexts = (qs: readonly Question[]) =>
  new Set(CONTEXT.filter((d) => qs.some((q) => q.coveragePotential[d] >= 0.5)));
const valences = (qs: readonly Question[]) =>
  qs.reduce((s, q) => s + qMeta(q).v, 0);
const activations = (qs: readonly Question[]) =>
  qs.reduce((s, q) => s + qMeta(q).a, 0);
function trioValid(q: readonly Question[], relaxation: number) {
  const ctxMask = q.reduce((m, x) => m | qMeta(x).ctx, 0);
  return (
    (relaxation >= 4 || valences(q) >= 2) &&
    (relaxation >= 1 || activations(q) >= 2) &&
    (relaxation >= 2 || (ctxMask & (ctxMask - 1)) !== 0) &&
    (relaxation >= 3 ||
      (q.length === 3
        ? !(q[0].style === q[1].style && q[1].style === q[2].style)
        : new Set(q.map((x) => x.style)).size >= 2))
  );
}
function canComplete(
  chosen: readonly Question[],
  pool: readonly Question[],
  relaxation: number,
): boolean {
  if (chosen.length === C.baseQuestionCount)
    return trioValid(chosen, relaxation);
  for (let i = 0; i < pool.length; i++) {
    const q = pool[i];
    if (!compatible(chosen, q)) continue;
    if (chosen.length === 2 && trioValid([...chosen, q], relaxation))
      return true;
    if (chosen.length === 1)
      for (let j = i + 1; j < pool.length; j++)
        if (
          compatible([...chosen, q], pool[j]) &&
          trioValid([...chosen, q, pool[j]], relaxation)
        )
          return true;
  }
  return false;
}
export function selectBase(
  pool: readonly Question[],
  date: string,
  history: readonly Exposure[],
  seed: string,
  localPreview = false,
) {
  const today = day(date);
  const last = lastExposureMap(today, history);
  const safe = pool
    .filter(
      (q) =>
        !q.followUpOnly &&
        selectable(q.quality, localPreview) &&
        q.locale === "es-CL" &&
        q.sessionContexts.includes("morning_intent") &&
        q.answers.length >= 3 &&
        q.answers.length <= 5 &&
        (!last.has(q.id) ||
          today - last.get(q.id)! > C.questionCooldownCalendarDays),
    )
    .sort((a, b) => compare(a.id, b.id));
  const novelties = new Map(
    safe.map((q) => [q.id, noveltyFromLast(today, last.get(q.id))]),
  );
  for (let relaxation = 0; relaxation <= 4; relaxation++) {
    const chosen: Question[] = [];
    for (let position = 0; position < C.baseQuestionCount; position++) {
      const chosenContexts = contexts(chosen);
      const chosenValences = valences(chosen);
      const chosenActivations = activations(chosen);
      const score = (q: Question) => {
        const coverage =
          0.5 *
            Number(q.coveragePotential.valence >= 0.75 && chosenValences < 2) +
          0.25 *
            Number(
              q.coveragePotential.activation >= 0.5 && chosenActivations < 2,
            ) +
          0.25 *
            Number(
              CONTEXT.some(
                (d) => q.coveragePotential[d] >= 0.5 && !chosenContexts.has(d),
              ),
            );
        const w = C.baseWeights;
        return (
          w.coverage * coverage +
          w.diversity * diversity(chosen, q) +
          w.novelty * novelties.get(q.id)! +
          w.editorial * q.editorialPriority
        );
      };
      const ranked = safe
        .filter(
          (q) =>
            compatible(chosen, q) && (position > 0 || q.intensity === "gentle"),
        )
        .map((q) => ({ q, score: score(q) }))
        .sort((a, b) => b.score - a.score || tie(seed, a.q.id, b.q.id));
      const picked = ranked.find(({ q }) =>
        canComplete([...chosen, q], safe, relaxation),
      );
      if (!picked) break;
      chosen.push(picked.q);
    }
    if (chosen.length === C.baseQuestionCount) return { chosen, relaxation };
  }
  throw new Error("NO_ELIGIBLE_TRIO");
}
export function informationGain(
  observed: readonly Observation[],
  candidate: Question,
  before: Estimate = estimate(observed),
) {
  const outcomes = new Set<string>();
  const gains = candidate.answers.map((answer) => {
    const after = estimate([
      ...observed,
      {
        questionId: candidate.id,
        primaryDimension: candidate.primaryDimension,
        answer,
      },
    ]);
    outcomes.add(`${classify(after).mode}|${family(after)}`);
    const deltaC = Math.max(
      0,
      after.valence.confidence - before.valence.confidence,
    );
    const deltaV =
      before.valence.variance === null || after.valence.variance === null
        ? 0
        : Math.max(0, before.valence.variance - after.valence.variance);
    const context = Math.max(
      0,
      CONTEXT.reduce(
        (s, d) => s + after[d].confidence - before[d].confidence,
        0,
      ) / CONTEXT.length,
    );
    return Math.min(1, deltaC + 0.5 * deltaV + 0.25 * context);
  });
  return {
    gain: gains.reduce((a, b) => a + b, 0) / gains.length,
    distinctOutcomes: outcomes.size,
  };
}
export function selectFourth(
  pool: readonly Question[],
  observed: readonly Observation[],
  chosen: readonly Question[],
  date: string,
  history: readonly Exposure[],
  seed: string,
  localPreview = false,
) {
  if (
    observed.length !== C.baseQuestionCount ||
    observed.filter((o) => o.answer !== null).length <
      C.minNonSkippedForAdaptive
  )
    return null;
  const before = estimate(observed),
    v = before.valence;
  if (!(
    v.mu === null ||
    v.confidence < C.minValenceConfidenceForLabel ||
    Math.abs(v.mu) < C.positiveValenceThreshold ||
    (v.variance ?? 0) > C.maxValenceVarianceForLabel
  ))
    return null;
  const conflict = v.n >= 2 && (v.variance ?? 0) >= C.adaptiveConflictVariance;
  const skipped = new Set(
    observed.filter((o) => o.answer === null).map((o) => o.primaryDimension),
  );
  const today = day(date);
  const last = lastExposureMap(today, history);
  const candidates = pool.filter(
    (q) =>
      q.adaptiveEligible &&
      selectable(q.quality, localPreview) &&
      q.locale === "es-CL" &&
      q.sessionContexts.includes("morning_intent") &&
      q.answers.length >= 3 &&
      q.answers.length <= 5 &&
      (!last.has(q.id) ||
        today - last.get(q.id)! > C.questionCooldownCalendarDays) &&
      compatible(chosen, q) &&
      !skipped.has(q.primaryDimension),
  );
  // Activation is not a contextual evidence dimension (DECISION_ENGINE §6).
  const unmet = (["valence", ...CONTEXT] as const).filter(
    (d) => before[d].confidence < C.minContextConfidence,
  );
  const denominator = unmet.reduce((s, d) => s + (d === "valence" ? 2 : 1), 0);
  const ranked = candidates
    .flatMap((q) => {
      if (distinctVectors(q.answers) < C.adaptiveCandidateMinDistinctOutcomes)
        return [];
      const info = informationGain(observed, q, before);
      if (
        info.gain < C.adaptiveMinExpectedGain ||
        (!conflict && info.distinctOutcomes < 2)
      )
        return [];
      const coverage = denominator
        ? unmet.reduce(
            (s, d) =>
              s + (q.coveragePotential[d] > 0 ? (d === "valence" ? 2 : 1) : 0),
            0,
          ) / denominator
        : 0;
      const w = C.adaptiveWeights;
      return [
        {
          q,
          ...info,
          reason: conflict ? "CONFLICT" : "OUTCOME_SENSITIVE",
          score:
            w.information * Math.min(1, info.gain) +
            w.coverage * coverage +
            w.novelty * noveltyFromLast(today, last.get(q.id)) +
            w.diversity * diversity(chosen, q),
        },
      ];
    })
    .sort((a, b) => b.score - a.score || tie(seed, a.q.id, b.q.id));
  return ranked[0] ?? null;
}
