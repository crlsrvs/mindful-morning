import {
  Answer,
  C,
  DimensionId,
  Observation,
  Question,
  canonical,
  classify,
  day,
  estimate,
  hash,
} from "../src/domain/engine/core";
import {
  Exposure,
  compatible,
  eligible,
  selectBase,
  selectFourth,
} from "../src/domain/engine/questions";
import {
  PatternSession,
  ReflectionExposure,
  family,
  selectReflection,
  supportEligible,
} from "../src/domain/engine/reflections";
import { fixtureCatalog } from "./fixtures";

const PROFILES = [
  "all_skipped",
  "indeterminate",
  "pleasant",
  "unpleasant",
  "activation_only",
  "polarized",
  "mixed",
  "abandoned",
] as const;
export type SimulationProfile = (typeof PROFILES)[number];

const valueOf = (answer: Answer, dimension: DimensionId) =>
  answer.effects.find((e) => e.dimension === dimension)?.value ?? 0;

function chooseAnswer(
  q: Question,
  profile: SimulationProfile,
  dayIndex: number,
  installation: number,
  position: number,
): Answer | null {
  if (profile === "all_skipped") return null;
  if (profile === "indeterminate")
    return q.answers.find((a) => !a.effects.length) ?? null;
  if (profile === "activation_only")
    return (
      q.answers.find(
        (a) =>
          valueOf(a, "activation") > 0 &&
          !a.effects.some((e) => e.dimension === "valence"),
      ) ??
      q.answers.find((a) => !a.effects.length) ??
      null
    );
  if (
    profile === "pleasant" ||
    profile === "unpleasant" ||
    profile === "polarized"
  ) {
    const direction =
      profile === "pleasant"
        ? 1
        : profile === "unpleasant"
          ? -1
          : (position + dayIndex) % 2
            ? -1
            : 1;
    return [...q.answers].sort(
      (a, b) =>
        direction * (valueOf(b, "valence") - valueOf(a, "valence")) ||
        valueOf(b, "mentalLoad") - valueOf(a, "mentalLoad"),
    )[0];
  }
  const n =
    Number.parseInt(
      hash(`${installation}|${dayIndex}|${q.id}|answer`).slice(0, 8),
      16,
    ) % 6;
  return n >= q.answers.length ? null : q.answers[n];
}

export function runProductionSimulation(seeds = 1000, days = 365) {
  const start = performance.now();
  const questions = fixtureCatalog.questions;
  const reflections = fixtureCatalog.reflections;
  const manifest = fixtureCatalog.manifest;
  const qIndex = new Map(questions.map((q, i) => [q.id, i]));

  const dates = Array.from({ length: days }, (_, d) =>
    new Date(Date.UTC(2026, 0, 1 + d)).toISOString().slice(0, 10),
  );
  const ordinals = dates.map(day);

  const counts = {
    sessions: 0,
    completed: 0,
    abandoned: 0,
    exposures: 0,
    adaptiveShown: 0,
    adaptiveSkipped: 0,
    supportShown: 0,
    repetitionViolations: 0,
    exhaustedSessions: 0,
    relaxedBaseSessions: 0,
    strictBaseSessions: 0,
    first30Strict: 0,
    first30Sessions: 0,
    reflectionCooldownRelaxations: 0,
    fullHistoryCrossChecks: 0,
  };
  const familyCounts: Record<string, number> = {};
  const styleCounts: Record<string, number> = {};
  const primaryCounts: Record<string, number> = {};
  const profileCounts: Record<string, number> = {};
  const modes: Record<string, number> = {};
  const reasons: Record<string, number> = {};

  for (let installation = 0; installation < seeds; installation++) {
    const profile = PROFILES[installation % PROFILES.length];
    const lastDayByIndex = new Int32Array(questions.length).fill(-1000);
    const compactHistory: Exposure[] = [];
    const compactIndexById = new Map<string, number>();
    const fullHistory: Exposure[] = [];
    let recentFamilies: string[] = [];
    let recentReflections: ReflectionExposure[] = [];
    let patternSessions: PatternSession[] = [];
    let lastSupportDate: string | null = null;

    const recordExposure = (
      questionId: string,
      localDate: string,
      d: number,
    ) => {
      const idx = qIndex.get(questionId)!;
      if (
        lastDayByIndex[idx] >= 0 &&
        d - lastDayByIndex[idx] <= C.questionCooldownCalendarDays
      ) {
        counts.repetitionViolations++;
        throw new Error(
          `Cooldown violation for ${questionId} at seed ${installation}, day ${d}`,
        );
      }
      lastDayByIndex[idx] = d;
      const existing = compactIndexById.get(questionId);
      if (existing === undefined) {
        compactIndexById.set(questionId, compactHistory.length);
        compactHistory.push({ questionId, date: localDate });
      } else {
        compactHistory[existing] = { questionId, date: localDate };
      }
      if (installation < 2) fullHistory.push({ questionId, date: localDate });
    };

    for (let d = 0; d < days; d++) {
      const localDate = dates[d];
      const seed = hash(
        `synthetic-install-${installation}|${localDate}|${C.engineVersion}|${manifest.hash}`,
      );
      let base: { chosen: Question[]; relaxation: number };
      try {
        base = selectBase(questions, localDate, compactHistory, seed);
      } catch (e) {
        counts.exhaustedSessions++;
        throw e;
      }
      if (installation < 2) {
        const fullBase = selectBase(questions, localDate, fullHistory, seed);
        if (
          fullBase.relaxation !== base.relaxation ||
          canonical(fullBase.chosen.map((q) => q.id)) !==
            canonical(base.chosen.map((q) => q.id))
        )
          throw new Error("FULL_HISTORY_BASE_MISMATCH");
        counts.fullHistoryCrossChecks++;
      }
      if (
        base.chosen.length !== C.baseQuestionCount ||
        base.chosen[0].intensity !== "gentle" ||
        new Set(base.chosen.map((q) => q.narrativeTemplateId)).size !== 3 ||
        new Set(base.chosen.map((q) => q.semanticClusterId)).size !== 3
      )
        throw new Error("BASE_INVARIANT_VIOLATED");

      counts.sessions++;
      profileCounts[profile] = (profileCounts[profile] ?? 0) + 1;
      if (base.relaxation > 0) counts.relaxedBaseSessions++;
      else counts.strictBaseSessions++;
      if (d < 30) {
        counts.first30Sessions++;
        if (base.relaxation === 0) counts.first30Strict++;
      }

      const abandoned = profile === "abandoned" && d % 3 === 0;
      const selected = abandoned
        ? base.chosen.slice(0, (d % 2) + 1)
        : [...base.chosen];
      const observed: Observation[] = [];

      const expose = (q: Question, position: number) => {
        recordExposure(q.id, localDate, d);
        counts.exposures++;
        styleCounts[q.style] = (styleCounts[q.style] ?? 0) + 1;
        primaryCounts[q.primaryDimension] =
          (primaryCounts[q.primaryDimension] ?? 0) + 1;
        const answer = chooseAnswer(q, profile, d, installation, position);
        observed.push({
          questionId: q.id,
          primaryDimension: q.primaryDimension,
          answer,
        });
      };

      selected.forEach(expose);

      if (abandoned) {
        counts.abandoned++;
        continue;
      }

      const adaptive = selectFourth(
        questions,
        observed,
        selected,
        localDate,
        compactHistory,
        seed,
      );
      if (installation < 2) {
        const fullAdaptive = selectFourth(
          questions,
          observed,
          selected,
          localDate,
          fullHistory,
          seed,
        );
        if ((fullAdaptive?.q.id ?? null) !== (adaptive?.q.id ?? null))
          throw new Error("FULL_HISTORY_FOURTH_MISMATCH");
      }
      if (adaptive) {
        if (
          adaptive.gain < C.adaptiveMinExpectedGain ||
          !compatible(selected, adaptive.q) ||
          observed.some(
            (o) =>
              o.answer === null &&
              o.primaryDimension === adaptive.q.primaryDimension,
          )
        )
          throw new Error("FOURTH_INVARIANT_VIOLATED");
        selected.push(adaptive.q);
        expose(adaptive.q, 3);
        counts.adaptiveShown++;
        reasons[adaptive.reason] = (reasons[adaptive.reason] ?? 0) + 1;
        if (observed[3].answer === null) counts.adaptiveSkipped++;
      }

      const e = estimate(observed);
      const classification = classify(e);
      if (
        classification.mode !== "positive" &&
        classification.mode !== "nonlabel"
      )
        throw new Error("INVALID_CLOSURE_MODE");
      if (profile === "all_skipped") {
        if (
          adaptive !== null ||
          Object.values(e).some((s) => s.mu !== null) ||
          classification.mode !== "nonlabel" ||
          classification.distress !== false
        )
          throw new Error("ALL_SKIPPED_INVARIANT_VIOLATED");
      }
      if (profile === "activation_only" && classification.distress)
        throw new Error("ACTIVATION_ONLY_DISTRESS_VIOLATED");

      const familyId = family(e, recentFamilies);
      if (profile === "all_skipped" && familyId !== "fam_neutral_generic")
        throw new Error("ALL_SKIPPED_FAMILY_VIOLATED");

      counts.completed++;
      modes[classification.mode] = (modes[classification.mode] ?? 0) + 1;
      familyCounts[familyId] = (familyCounts[familyId] ?? 0) + 1;

      const r = selectReflection(
        reflections,
        familyId,
        localDate,
        recentReflections,
        seed,
      );
      if (r.reflection.familyId !== familyId)
        throw new Error("REFLECTION_FAMILY_MISMATCH");
      if (r.cooldownRelaxed) counts.reflectionCooldownRelaxations++;
      recentReflections.push({
        id: r.reflection.id,
        familyId: r.reflection.familyId,
        date: localDate,
      });
      const todayOrd = ordinals[d];
      recentReflections = recentReflections.filter(
        (x) => todayOrd - day(x.date) <= 30,
      );
      recentFamilies.push(familyId);
      if (recentFamilies.length > 7) recentFamilies = recentFamilies.slice(-7);

      const currentSession: PatternSession = {
        date: localDate,
        state: "completed",
        distress: classification.distress,
      };
      const support = supportEligible(
        currentSession,
        patternSessions,
        lastSupportDate,
      );
      patternSessions.push(currentSession);
      patternSessions = patternSessions.filter(
        (x) => todayOrd - day(x.date) <= C.patternWindowDays,
      );
      if (support) {
        counts.supportShown++;
        lastSupportDate = localDate;
        const supRef = selectReflection(
          reflections,
          "fam_support_invitation",
          localDate,
          recentReflections,
          seed,
        ).reflection;
        if (supRef.kind !== "support") throw new Error("SUPPORT_KIND_MISMATCH");
        recentReflections.push({
          id: supRef.id,
          familyId: supRef.familyId,
          date: localDate,
        });
      }
    }
  }

  const stress = {
    seeds,
    daysPerSeed: days,
    sessions: 0,
    exposures: 0,
    exhaustedSessions: 0,
    relaxedBaseSessions: 0,
    repetitionViolations: 0,
    first30DistinctMinimum: questions.length,
  };
  const targets: readonly DimensionId[] = [
    "valence",
    "activation",
    "tension",
    "mentalLoad",
    "connection",
    "motivation",
  ];
  for (let installation = 0; installation < seeds; installation++) {
    const lastDayByIndex = new Int32Array(questions.length).fill(-1000);
    const compactHistory: Exposure[] = [];
    const compactIndexById = new Map<string, number>();
    const first30 = new Set<string>();
    const target = targets[installation % targets.length];

    for (let d = 0; d < days; d++) {
      const localDate = dates[d];
      const seed = hash(`stress-${installation}|${d}|${manifest.hash}`);
      const base = selectBase(questions, localDate, compactHistory, seed);
      if (base.relaxation > 0) stress.relaxedBaseSessions++;
      const candidates = questions.filter(
        (q, idx) =>
          compatible(base.chosen, q) &&
          (lastDayByIndex[idx] < 0 ||
            d - lastDayByIndex[idx] > C.questionCooldownCalendarDays),
      );
      candidates.sort(
        (a, b) =>
          b.coveragePotential[target] - a.coveragePotential[target] ||
          Number(b.coveragePotential.valence >= 0.75) -
            Number(a.coveragePotential.valence >= 0.75) ||
          qIndex.get(a.id)! - qIndex.get(b.id)!,
      );
      const fourth = candidates[0];
      if (!fourth) {
        stress.exhaustedSessions++;
        throw new Error(`No stress fourth at seed ${installation}, day ${d}`);
      }
      if (!eligible(fourth, localDate, compactHistory))
        throw new Error("STRESS_FOURTH_NOT_ELIGIBLE");
      for (const q of [...base.chosen, fourth]) {
        const idx = qIndex.get(q.id)!;
        if (
          lastDayByIndex[idx] >= 0 &&
          d - lastDayByIndex[idx] <= C.questionCooldownCalendarDays
        ) {
          stress.repetitionViolations++;
          throw new Error("STRESS_COOLDOWN_VIOLATION");
        }
        lastDayByIndex[idx] = d;
        const existing = compactIndexById.get(q.id);
        if (existing === undefined) {
          compactIndexById.set(q.id, compactHistory.length);
          compactHistory.push({ questionId: q.id, date: localDate });
        } else {
          compactHistory[existing] = { questionId: q.id, date: localDate };
        }
        stress.exposures++;
        if (d < 30) first30.add(q.id);
      }
      stress.sessions++;
    }
    stress.first30DistinctMinimum = Math.min(
      stress.first30DistinctMinimum,
      first30.size,
    );
  }

  const strictBaseRatio = counts.strictBaseSessions / counts.sessions;
  const passed =
    counts.exhaustedSessions === 0 &&
    counts.repetitionViolations === 0 &&
    stress.exhaustedSessions === 0 &&
    stress.repetitionViolations === 0 &&
    strictBaseRatio >= 0.95;

  return {
    contentVersion: manifest.version,
    contentPackHash: manifest.hash,
    engineVersion: C.engineVersion,
    seeds,
    daysPerSeed: days,
    passed,
    strictBaseRatio,
    counts,
    profileCounts,
    familyCounts,
    styleCounts,
    primaryCounts,
    modes,
    adaptiveReasons: reasons,
    stress,
    elapsedMs: Math.round(performance.now() - start),
  };
}
