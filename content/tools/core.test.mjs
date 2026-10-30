import test from 'node:test';
import assert from 'node:assert/strict';
import { D, read, prepare, canonical, estimate, classify, family, informationGain, supportEligible, selectBase, selectFourth, trioValid, chooseReflection } from './core.mjs';
import { validatePack, validateSchema } from './validate.mjs';
const signal = (id, effects) => ({ questionId: id, answer: { effects: effects.map(([dimension, value, weight = 1]) => ({ dimension, value, weight })) } });
const valence = (values) => values.map((v, i) => signal(`q_${i}`, [['valence', v]]));
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('S1, S2 and S7 retain conservative classifications', () => {
  const good = estimate(valence([.6, .4])); close(good.valence.mu, .5); close(good.valence.variance, .01); close(good.valence.confidence, .66); assert.equal(classify(good).mode, 'positive');
  const bad = estimate(valence([-.6, -.5])); close(bad.valence.mu, -.55); assert.deepEqual(classify(bad), { mode: 'nonlabel', distress: true });
  const neutral = estimate(valence([0, 0])); close(neutral.valence.confidence, 2 / 3); assert.deepEqual(classify(neutral), { mode: 'nonlabel', distress: false });
});
test('S3 computes actionable conflict gain without promising positivity', () => {
  const observations = valence([.8, -.6]); observations.push(signal('q_context', [['tension', .6]]));
  const q = { id: 'candidate', answers: [-.8, 0, .8].map((v) => ({ effects: [{ dimension: 'valence', value: v, weight: 1 }] })) };
  const info = informationGain(observations, q); assert.ok(info.gain >= .08);
  const after = estimate([...observations, signal('q_more', [['valence', 0]])]); close(after.valence.mu, 1 / 15); assert.equal(classify(after).mode, 'nonlabel');
});
test('unknown, explicit zero and omission stay distinct; all skips stop at three', () => {
  const empty = estimate([]), zero = estimate(valence([0])); assert.equal(empty.valence.mu, null); assert.equal(zero.valence.mu, 0);
  assert.deepEqual(estimate([{ questionId: 'skip', answer: null }]), empty);
  const q = prepare(read('questions.json')); const last = new Int32Array(q.length).fill(-1);
  assert.equal(selectFourth(q, q.slice(0, 3).map((x) => ({ questionId: x.id, primaryDimension: x.primaryDimension, answer: null })), q.slice(0, 3), 0, last, 'test'), null);
});
test('S4 skipped primary dimension is excluded from fourth candidates', () => {
  const q = prepare(read('questions.json')).filter((x) => x.primaryDimension === 'valence');
  const observed = [...valence([.8, -.6]), { questionId: 'skipped', primaryDimension: 'valence', answer: null }];
  assert.equal(selectFourth(q, observed, [], 0, new Int32Array(180).fill(-1), 's4'), null);
});
test('S5 activation never invents valence or tension; S6 unequal evidence fails label', () => {
  const active = estimate([signal('a', [['activation', .9]]), signal('b', [['activation', .7]])]);
  assert.equal(active.valence.mu, null); assert.equal(active.tension.mu, null); assert.equal(classify(active).mode, 'nonlabel'); assert.equal(family(active), 'fam_activation_high');
  const unequal = estimate([signal('a', [['valence', .9]]), signal('b', [['valence', .8, .1]])]); assert.ok(unequal.valence.nEff < 1.8); assert.equal(classify(unequal).mode, 'nonlabel');
});
test('weighted estimates are deterministic, bounded and invariant to ordering/skips', () => {
  for (let i = 0; i < 100000; i++) {
    const observed = Array.from({ length: 4 }, (_, j) => signal(`q_${j}`, D.map((d, k) => [d, Math.sin(i * 11 + j * 7 + k), .1 + ((i + j + k) % 9) / 10])));
    const e = estimate(observed); assert.equal(canonical(e), canonical(estimate([...observed].reverse())));
    assert.equal(canonical(e), canonical(estimate([...observed, { questionId: 'skip', answer: null }])));
    for (const d of D) { assert.ok(Math.abs(e[d].mu) <= 1); assert.ok(e[d].variance >= 0 && e[d].variance <= 1); assert.ok(e[d].confidence >= 0 && e[d].confidence <= .85); }
  }
});
test('inclusive valence boundaries and polarity coexist with high load', () => {
  assert.equal(classify(estimate(valence([.35, .35]))).mode, 'positive');
  assert.equal(classify(estimate(valence([.35 - 1e-10, .35 - 1e-10]))).mode, 'nonlabel');
  assert.equal(classify(estimate(valence([-.35, -.35]))).distress, true);
  const observed = ['a', 'b'].map((id) => signal(id, [['valence', .6], ['mentalLoad', .6]])); assert.equal(family(estimate(observed)), 'fam_positive_grounded');
});
test('S8 support counts calendar dates and requires current distress/cooldown', () => {
  const sessions = [0, 2, 4].map((day) => ({ day, completed: true, distress: true }));
  assert.equal(supportEligible(4, sessions, null), true); assert.equal(supportEligible(4, sessions, -2), false); assert.equal(supportEligible(4, sessions, -3), true);
  assert.equal(supportEligible(5, [...sessions, { day: 5, completed: true, distress: false }], null), false);
  assert.equal(supportEligible(6, [...sessions, { day: 6, completed: false, distress: true }], null), false);
});
test('base selection obeys day 30/31 boundary and strict trio constraints', () => {
  const q = prepare(read('questions.json')); const last = new Int32Array(q.length).fill(-1); const first = selectBase(q, 0, last, 'seed');
  assert.equal(first.chosen[0].intensity, 'gentle'); assert.ok(trioValid(first.chosen));
  for (const x of first.chosen) last[x.index] = 0;
  const day30 = selectBase(q, 30, last, 'seed'); assert.ok(day30.chosen.every((x) => !first.chosen.includes(x)));
  const onlyOld = first.chosen; assert.throws(() => selectBase(onlyOld, 30, last, 'seed'));
  assert.equal(selectBase(onlyOld, 31, last, 'seed').chosen.length, 3);
});
test('reflection cooldown alone may relax in a four-item activation family', () => {
  const r = read('reflections.json'); const active = r.filter((x) => x.familyId === 'fam_activation_high');
  const history = active.map((x, i) => ({ id: x.id, day: i }));
  const selected = chooseReflection(r, 'fam_activation_high', 4, history, 'seed'); assert.equal(selected.cooldownRelaxed, true); assert.equal(selected.reflection.familyId, 'fam_activation_high');
});
test('strict schema rejects unknown fields, illegal effect weights and values', () => {
  const definitions = read('schema/contract.v1.schema.json').$defs; const shape = { $ref: '#/$defs/effect' };
  for (const invalid of [{ dimension: 'activation', value: 2, weight: 1 }, { dimension: 'valence', value: 0, weight: 0 }, { dimension: 'valence', value: 0, weight: 1, diagnosis: 'x' }]) assert.ok(validateSchema(invalid, shape, definitions).length > 0);
  assert.equal(validateSchema({ dimension: 'valence', value: 0, weight: 1 }, shape, definitions).length, 0);
});
test('complete draft passes structural checks and truthfully fails release approval', () => {
  assert.deepEqual(validatePack().errors, []);
  const release = validatePack({ release: true }); assert.equal(release.passed, false); assert.ok(release.errors.some((x) => x.includes('human approval')));
});
