import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// QA reference implementation only; the application engine must be built and
// cross-tested separately. These functions never approve or mutate content.
export const D = ['valence', 'activation', 'tension', 'mentalLoad', 'connection', 'motivation'];
export const CONTEXT = D.slice(2);
export const ROOT = new URL('../', import.meta.url);
export const read = (name) => JSON.parse(readFileSync(new URL(name, ROOT), 'utf8'));
export const sha = (value) => createHash('sha256').update(value).digest('hex');
export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
export const HASH_FILES = ['categories.json', 'content-sources.json', 'dimensions.json', 'questions.json', 'reflection-families.json', 'reflections.json', 'support-resources.json', 'ui-copy.json'];
export function packHash() {
  const manifest = { ...read('manifest.json') };
  delete manifest.hash;
  return sha(canonical(Object.fromEntries([['manifest.json', manifest], ...HASH_FILES.map((f) => [f, read(f)])])));
}

export function estimate(observed) {
  const ordered = [...observed].sort((a, b) => a.questionId.localeCompare(b.questionId, 'en'));
  const result = {};
  for (const dimension of D) {
    const effects = ordered.flatMap((x) => x.answer?.effects.filter((e) => e.dimension === dimension) ?? []);
    if (!effects.length) { result[dimension] = { mu: null, variance: null, nEff: 0, confidence: 0, n: 0 }; continue; }
    const sumWeight = effects.reduce((sum, e) => sum + e.weight, 0);
    const mu = effects.reduce((sum, e) => sum + e.value * e.weight, 0) / sumWeight;
    const nEff = sumWeight ** 2 / effects.reduce((sum, e) => sum + e.weight ** 2, 0);
    const variance = effects.reduce((sum, e) => sum + e.weight * (e.value - mu) ** 2, 0) / sumWeight;
    result[dimension] = { mu, variance, nEff, confidence: Math.min(.85, nEff / 3) * (1 - variance), n: effects.length };
  }
  return result;
}
export function classify(e) {
  const v = e.valence;
  const sufficient = v.n >= 2 && v.nEff >= 1.8 && v.confidence >= .60 && v.variance <= .15;
  return { mode: sufficient && v.mu >= .35 ? 'positive' : 'nonlabel', distress: sufficient && v.mu <= -.35 };
}
export function family(e, recent = []) {
  if (classify(e).mode === 'positive') return 'fam_positive_grounded';
  const possibilities = [
    ['tension', 1, 'fam_tension'], ['mentalLoad', 1, 'fam_mental_load'], ['connection', -1, 'fam_connection_low'],
    ['motivation', -1, 'fam_motivation_low'], ['activation', 1, 'fam_activation_high'], ['activation', -1, 'fam_activation_low'],
  ].filter(([d, sign]) => e[d].mu !== null && e[d].mu * sign >= .35 && e[d].confidence >= .60 && e[d].n >= 2);
  const counts = new Map();
  for (const id of recent.slice(-7)) counts.set(id, (counts.get(id) ?? 0) + 1);
  possibilities.sort((a, b) => (counts.get(a[2]) ?? 0) - (counts.get(b[2]) ?? 0));
  return possibilities[0]?.[2] ?? 'fam_neutral_generic';
}
export function supportEligible(day, sessions, lastShown) {
  const current = sessions.find((x) => x.day === day && x.completed);
  return Boolean(current?.distress && sessions.filter((x) => x.completed && x.distress && x.day >= day - 4 && x.day <= day).length >= 3 && (lastShown === null || day - lastShown >= 7));
}
export function informationGain(observed, candidate, recent = []) {
  const before = estimate(observed); const outcomes = new Set();
  const gains = candidate.answers.map((answer) => {
    const after = estimate([...observed, { questionId: candidate.id, answer }]);
    outcomes.add(`${classify(after).mode}|${family(after, recent)}`);
    const deltaC = Math.max(0, after.valence.confidence - before.valence.confidence);
    const deltaV = before.valence.variance === null || after.valence.variance === null ? 0 : Math.max(0, before.valence.variance - after.valence.variance);
    const contextGain = Math.max(0, CONTEXT.reduce((s, d) => s + after[d].confidence - before[d].confidence, 0) / 4);
    return Math.min(1, deltaC + .5 * deltaV + .25 * contextGain);
  });
  return { gain: gains.reduce((s, x) => s + x, 0) / gains.length, distinctOutcomes: outcomes.size };
}

const bitCount = (x) => { let n = 0; while (x) { n += x & 1; x >>>= 1; } return n; };
const styles = ['metaphor', 'daily_situation', 'observation', 'gentle_introspection'];
export function prepare(questions) {
  return questions.map((q, index) => ({ ...q, index, v: Number(q.coveragePotential.valence >= .75), a: Number(q.coveragePotential.activation >= .5),
    contexts: CONTEXT.reduce((mask, d, i) => mask | (q.coveragePotential[d] >= .5 ? 1 << i : 0), 0), styleBit: 1 << styles.indexOf(q.style) }));
}
export function compatible(chosen, q) {
  return chosen.every((x) => x.id !== q.id && x.semanticClusterId !== q.semanticClusterId && x.narrativeTemplateId !== q.narrativeTemplateId);
}
export function trioValid(items, relaxation = 0) {
  const v = items.reduce((s, q) => s + q.v, 0); const a = items.reduce((s, q) => s + q.a, 0);
  return (relaxation >= 4 || v >= 2) && (relaxation >= 1 || a >= 2) &&
    (relaxation >= 2 || bitCount(items.reduce((mask, q) => mask | q.contexts, 0)) >= 2) &&
    (relaxation >= 3 || bitCount(items.reduce((mask, q) => mask | q.styleBit, 0)) >= 2);
}
function canComplete(chosen, pool, relaxation) {
  if (chosen.length === 3) return trioValid(chosen, relaxation);
  for (let i = 0; i < pool.length; i++) {
    const q = pool[i]; if (!compatible(chosen, q)) continue;
    if (chosen.length === 2) { if (trioValid([...chosen, q], relaxation)) return true; }
    else for (let j = i + 1; j < pool.length; j++) {
      const other = pool[j];
      if (compatible([...chosen, q], other) && trioValid([...chosen, q, other], relaxation)) return true;
    }
  }
  return false;
}
export function baseScore(chosen, q, day, last) {
  const v = q.v && chosen.reduce((s, x) => s + x.v, 0) < 2 ? 1 : 0;
  const a = q.a && chosen.reduce((s, x) => s + x.a, 0) < 2 ? 1 : 0;
  const k = q.contexts & ~chosen.reduce((mask, x) => mask | x.contexts, 0) ? 1 : 0;
  const coverage = .5 * v + .25 * a + .25 * k;
  const diversity = diversityScore(chosen, q);
  const novelty = last[q.index] < 0 ? 1 : Math.min(1, (day - last[q.index]) / 120);
  return .35 * coverage + .25 * diversity + .25 * novelty + .15 * q.editorialPriority;
}
export function diversityScore(chosen, q) {
  const s = chosen.some((x) => x.style === q.style) ? 0 : 1;
  const tags = new Set(chosen.flatMap((x) => x.scenarioTags));
  const t = q.scenarioTags.some((tag) => !tags.has(tag)) ? 1 : 0;
  const c = chosen.some((x) => x.semanticClusterId === q.semanticClusterId) ? 0 : 1;
  return (s + t + c) / 3;
}
export function selectBase(pool, day, last, seed) {
  const eligible = pool.filter((q) => !q.followUpOnly && (last[q.index] < 0 || day - last[q.index] > 30));
  const hashes = new Map(); const tie = (q) => { if (!hashes.has(q.id)) hashes.set(q.id, sha(`${seed}|${q.id}`)); return hashes.get(q.id); };
  for (let relaxation = 0; relaxation <= 4; relaxation++) {
    const chosen = [];
    for (let position = 0; position < 3; position++) {
      const ranked = eligible.filter((q) => compatible(chosen, q) && (position !== 0 || q.intensity === 'gentle'))
        .map((q) => ({ q, score: baseScore(chosen, q, day, last) }))
        .sort((x, y) => y.score - x.score || (tie(x.q) < tie(y.q) ? -1 : tie(x.q) > tie(y.q) ? 1 : x.q.id < y.q.id ? -1 : 1));
      const picked = ranked.find(({ q }) => canComplete([...chosen, q], eligible, relaxation));
      if (!picked) break;
      chosen.push(picked.q);
    }
    if (chosen.length === 3) return { chosen, relaxation };
  }
  throw new Error(`No completable base trio at day ${day}`);
}
export function selectFourth(pool, observed, selected, day, last, seed, recent = []) {
  if (observed.filter((o) => o.answer).length < 2) return null;
  const before = estimate(observed); const v = before.valence;
  if (!(v.mu === null || v.confidence < .60 || Math.abs(v.mu) < .35 || v.variance > .15)) return null;
  const conflict = v.n >= 2 && v.variance >= .16;
  const skipped = new Set(observed.filter((o) => !o.answer).map((o) => o.primaryDimension));
  let best = null;
  for (const q of pool) {
    if (!q.adaptiveEligible || (last[q.index] >= 0 && day - last[q.index] <= 30) || !compatible(selected, q) || skipped.has(q.primaryDimension)) continue;
    const vectors = new Set(q.answers.map((a) => canonical(a.effects)));
    if (vectors.size < 2) continue;
    const info = informationGain(observed, q, recent);
    if (info.gain < .08 || !(conflict || info.distinctOutcomes >= 2)) continue;
    const unmet = ['valence', ...CONTEXT].filter((d) => before[d].confidence < .60);
    const denominator = unmet.reduce((sum, d) => sum + (d === 'valence' ? 2 : 1), 0);
    const coverage = denominator ? unmet.reduce((sum, d) => sum + (q.coveragePotential[d] > 0 ? d === 'valence' ? 2 : 1 : 0), 0) / denominator : 0;
    const novelty = last[q.index] < 0 ? 1 : Math.min(1, (day - last[q.index]) / 120);
    const score = .45 * Math.min(1, info.gain) + .25 * coverage + .20 * novelty + .10 * diversityScore(selected, q);
    if (!best || score > best.score || (score === best.score && sha(`${seed}|${q.id}`) < sha(`${seed}|${best.q.id}`))) best = { q, score, ...info, reason: conflict ? 'CONFLICT' : 'OUTCOME_SENSITIVE' };
  }
  return best;
}
export function chooseReflection(reflections, familyId, day, exposures, seed) {
  const candidates = reflections.filter((r) => r.familyId === familyId);
  const history = (r) => exposures.filter((x) => x.id === r.id);
  const last = (r) => history(r).at(-1)?.day ?? -10000;
  const free = candidates.filter((r) => day - last(r) > 7);
  const pool = free.length ? free : candidates;
  pool.sort((a, b) => history(a).filter((x) => day - x.day <= 30).length - history(b).filter((x) => day - x.day <= 30).length ||
    last(a) - last(b) || (sha(`${seed}|${a.id}`) < sha(`${seed}|${b.id}`) ? -1 : 1));
  if (!pool.length) throw new Error(`Empty reflection family: ${familyId}`);
  return { reflection: pool[0], cooldownRelaxed: !free.length };
}
