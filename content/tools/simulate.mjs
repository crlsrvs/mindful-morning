import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { ROOT, read, prepare, estimate, classify, family, supportEligible, selectBase, selectFourth, compatible, chooseReflection, sha } from './core.mjs';

const valueOf = (answer, dimension) => answer.effects.find((e) => e.dimension === dimension)?.value ?? 0;
const profiles = ['all_skipped', 'indeterminate', 'pleasant', 'unpleasant', 'activation_only', 'polarized', 'mixed', 'abandoned'];
const getArgument = (key, fallback) => { const value = process.argv.find((x) => x.startsWith(`${key}=`)); return value ? Number(value.split('=')[1]) : fallback; };
const seeds = getArgument('--seeds', 1000), days = getArgument('--days', 365);
assert.ok(Number.isInteger(seeds) && seeds > 0 && Number.isInteger(days) && days >= 30);
const questions = prepare(read('questions.json')), reflections = read('reflections.json'), manifest = read('manifest.json');
const counts = { sessions: 0, completed: 0, abandoned: 0, exposures: 0, adaptiveShown: 0, adaptiveSkipped: 0, supportShown: 0, repetitionViolations: 0, exhaustedSessions: 0, relaxedBaseSessions: 0, strictBaseSessions: 0, first30Strict: 0, first30Sessions: 0, reflectionCooldownRelaxations: 0 };
const familyCounts = {}, styleCounts = {}, primaryCounts = {}, choicePositions = {}, profileCounts = {}, modes = {}, reasons = {};
const trace = [];
function choose(q, profile, day, seed, position) {
  if (profile === 'all_skipped') return null;
  if (profile === 'indeterminate') return q.answers.find((a) => !a.effects.length);
  if (profile === 'activation_only') return q.answers.find((a) => valueOf(a, 'activation') > 0 && !a.effects.some((e) => e.dimension === 'valence')) ?? q.answers.find((a) => !a.effects.length);
  if (profile === 'pleasant' || profile === 'unpleasant' || profile === 'polarized') {
    const direction = profile === 'pleasant' ? 1 : profile === 'unpleasant' ? -1 : (position + day) % 2 ? -1 : 1;
    return [...q.answers].sort((a, b) => direction * (valueOf(b, 'valence') - valueOf(a, 'valence')) || valueOf(b, 'mentalLoad') - valueOf(a, 'mentalLoad'))[0];
  }
  const n = Number.parseInt(sha(`${seed}|${day}|${q.id}|answer`).slice(0, 8), 16) % 6;
  return n >= q.answers.length ? null : q.answers[n];
}
const start = performance.now();
for (let installation = 0; installation < seeds; installation++) {
  const profile = profiles[installation % profiles.length];
  const last = new Int32Array(questions.length).fill(-1);
  let recentFamilies = [], recentReflections = [], sessions = [], lastSupport = null;
  for (let day = 0; day < days; day++) {
    const localDate = new Date(Date.UTC(2026, 0, 1 + day)).toISOString().slice(0, 10);
    const seed = sha(`synthetic-install-${installation}|${localDate}|1.0.0|${manifest.hash}`);
    let base;
    try { base = selectBase(questions, day, last, seed); }
    catch (error) { counts.exhaustedSessions++; throw error; }
    counts.sessions++; profileCounts[profile] = (profileCounts[profile] ?? 0) + 1;
    if (base.relaxation) counts.relaxedBaseSessions++; else counts.strictBaseSessions++;
    if (day < 30) { counts.first30Sessions++; if (!base.relaxation) counts.first30Strict++; }
    const abandoned = profile === 'abandoned' && day % 3 === 0;
    const selected = abandoned ? base.chosen.slice(0, day % 2 + 1) : [...base.chosen];
    const observed = [];
    const expose = (q, position) => {
      assert.ok(last[q.index] < 0 || day - last[q.index] > 30, 'question cooldown violated');
      last[q.index] = day; counts.exposures++;
      styleCounts[q.style] = (styleCounts[q.style] ?? 0) + 1; primaryCounts[q.primaryDimension] = (primaryCounts[q.primaryDimension] ?? 0) + 1;
      const answer = choose(q, profile, day, installation, position);
      choicePositions[answer ? q.answers.indexOf(answer) + 1 : 'skip'] = (choicePositions[answer ? q.answers.indexOf(answer) + 1 : 'skip'] ?? 0) + 1;
      observed.push({ questionId: q.id, primaryDimension: q.primaryDimension, answer });
    };
    selected.forEach(expose);
    let adaptive = null;
    if (!abandoned) {
      adaptive = selectFourth(questions, observed, selected, day, last, seed, recentFamilies);
      if (adaptive) {
        assert.ok(adaptive.gain >= .08); assert.ok(!observed.some((x) => !x.answer && x.primaryDimension === adaptive.q.primaryDimension));
        selected.push(adaptive.q); expose(adaptive.q, 3); counts.adaptiveShown++;
        reasons[adaptive.reason] = (reasons[adaptive.reason] ?? 0) + 1;
        if (!observed[3].answer) counts.adaptiveSkipped++;
      }
      assert.ok(selected.length === 3 || selected.length === 4);
      if (profile === 'all_skipped') { assert.equal(adaptive, null); assert.ok(Object.values(estimate(observed)).every((x) => x.mu === null)); }
      if (profile === 'activation_only') assert.equal(classify(estimate(observed)).distress, false);
    }
    if (abandoned) { counts.abandoned++; if (installation < 8 && day < 31) trace.push({ installation, profile, localDate, state: 'abandoned', exposedIds: selected.map((q) => q.id), answers: observed.map((o) => o.answer?.id ?? 'skip') }); continue; }
    counts.completed++;
    const e = estimate(observed), classification = classify(e), familyId = family(e, recentFamilies);
    modes[classification.mode] = (modes[classification.mode] ?? 0) + 1;
    familyCounts[familyId] = (familyCounts[familyId] ?? 0) + 1;
    const r = chooseReflection(reflections, familyId, day, recentReflections, seed);
    if (r.cooldownRelaxed) counts.reflectionCooldownRelaxations++;
    assert.equal(r.reflection.familyId, familyId);
    recentReflections.push({ id: r.reflection.id, day }); recentReflections = recentReflections.filter((x) => day - x.day <= 30);
    recentFamilies.push(familyId); recentFamilies = recentFamilies.slice(-7);
    sessions.push({ day, completed: true, distress: classification.distress }); sessions = sessions.filter((x) => day - x.day <= 4);
    const support = supportEligible(day, sessions, lastSupport);
    let supportReflection = null;
    if (support) {
      counts.supportShown++; lastSupport = day;
      supportReflection = chooseReflection(reflections, 'fam_support_invitation', day, recentReflections, seed).reflection;
      assert.equal(supportReflection.kind, 'support');
      recentReflections.push({ id: supportReflection.id, day });
    }
    if (installation < 8 && day < 31) trace.push({ installation, profile, localDate, state: 'completed', baseRelaxation: base.relaxation, exposedIds: selected.map((q) => q.id), answers: observed.map((o) => o.answer?.id ?? 'skip'), adaptiveReason: adaptive?.reason ?? null, adaptiveGain: adaptive?.gain ?? null, mode: classification.mode, familyId, reflectionId: r.reflection.id, supportShown: support, supportReflectionId: supportReflection?.id ?? null });
  }
  if ((installation + 1) % 100 === 0) console.log(`Decision simulation: ${installation + 1}/${seeds} installations`);
}

// Independent availability stress: force a fourth eligible question every day.
// This tests capacity, deliberately bypassing ambiguity/gain gates, and never
// claims the real engine should prolong those sessions.
const stress = { seeds, daysPerSeed: days, sessions: 0, exposures: 0, exhaustedSessions: 0, relaxedBaseSessions: 0, repetitionViolations: 0, maxWindowExposures: 0, first30DistinctMinimum: 180 };
const stressTrace = [];
for (let installation = 0; installation < seeds; installation++) {
  const last = new Int32Array(questions.length).fill(-1); const first30 = new Set();
  for (let day = 0; day < days; day++) {
    const seed = sha(`stress-${installation}|${day}|${manifest.hash}`);
    const base = selectBase(questions, day, last, seed); if (base.relaxation) stress.relaxedBaseSessions++;
    const candidates = questions.filter((q) => compatible(base.chosen, q) && (last[q.index] < 0 || day - last[q.index] > 30));
    const target = ['valence', 'activation', 'tension', 'mentalLoad', 'connection', 'motivation'][installation % 6];
    candidates.sort((a, b) => b.coveragePotential[target] - a.coveragePotential[target] || b.v - a.v || a.index - b.index);
    const fourth = candidates[0]; assert.ok(fourth, `No stress fourth at seed ${installation}, day ${day}`);
    const selected = [...base.chosen, fourth];
    for (const q of selected) {
      assert.ok(last[q.index] < 0 || day - last[q.index] > 30);
      last[q.index] = day; stress.exposures++;
      if (day < 30) first30.add(q.id);
    }
    stress.sessions++;
    stress.maxWindowExposures = Math.max(stress.maxWindowExposures, Array.from(last).filter((d) => d >= 0 && day - d <= 30).length);
    if (installation === 0 && day < 31) stressTrace.push({ installation, day, baseRelaxation: base.relaxation, exposedIds: selected.map((q) => q.id) });
  }
  stress.first30DistinctMinimum = Math.min(stress.first30DistinctMinimum, first30.size);
  if ((installation + 1) % 100 === 0) console.log(`Four/day capacity stress: ${installation + 1}/${seeds} installations`);
}
const result = { schemaVersion: 1, contentVersion: manifest.version, contentPackHash: manifest.hash, fixtureStartDate: '2026-01-01', seeds, daysPerSeed: days, profileAssignment: 'installationIndex modulo 8; deterministic SHA-256 ties; 1000 installation IDs 0…999 by default',
  scope: 'Preapproval content QA using contract reference functions, not a released application or empirical user study. Draft items are intentionally available only inside these tools.',
  passed: counts.exhaustedSessions === 0 && counts.repetitionViolations === 0 && stress.exhaustedSessions === 0 && counts.strictBaseSessions / counts.sessions >= .95,
  counts, strictBaseRatio: counts.strictBaseSessions / counts.sessions, profileCounts, familyCounts, styleCounts, primaryCounts, choicePositions, modes, adaptiveReasons: reasons, stress,
  elapsedSeconds: Math.round((performance.now() - start) / 1000), limitations: ['Finite deterministic profiles; not proof for every possible response/exposure history.', 'Preapproval assumption does not satisfy release approval gates.', 'Adaptive stops at three when gain/candidate filters fail; forced fourth capacity test is separate.', 'Native app, accessibility, time-zone persistence, encryption and actual TypeScript engine integration are not tested here.'] };
writeFileSync(new URL('simulation-results.json', ROOT), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(new URL('simulation-traces.json', ROOT), `${JSON.stringify({ schemaVersion: 1, contentVersion: manifest.version, contentPackHash: manifest.hash, decisionTraces: trace, forcedFourthTraces: stressTrace }, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.passed ? 0 : 1;
