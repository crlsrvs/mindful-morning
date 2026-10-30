import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { ROOT, D, read, canonical, packHash, sha } from './core.mjs';

export function validateSchema(value, schema, definitions, path = '$') {
  const errors = [];
  const fail = (message) => errors.push(`${path}: ${message}`);
  if (schema.$ref) return validateSchema(value, definitions[schema.$ref.split('/').at(-1)], definitions, path);
  if (schema.anyOf) {
    if (!schema.anyOf.some((candidate) => validateSchema(value, candidate, definitions, path).length === 0)) fail('no anyOf branch matches');
    return errors;
  }
  if (schema.enum && !schema.enum.some((x) => canonical(x) === canonical(value))) fail('invalid enum');
  if (schema.type) {
    const matches = schema.type === 'null' ? value === null : schema.type === 'array' ? Array.isArray(value) : schema.type === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value) : schema.type === 'integer' ? Number.isInteger(value) : schema.type === 'number' ? typeof value === 'number' && Number.isFinite(value) : typeof value === schema.type;
    if (!matches) { fail(`expected ${schema.type}`); return errors; }
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) fail('below minimum');
    if (schema.maximum !== undefined && value > schema.maximum) fail('above maximum');
    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) fail('below exclusive minimum');
  }
  if (typeof value === 'string') {
    if (value !== value.normalize('NFC')) fail('non-NFC string');
    if (schema.minLength !== undefined && [...value].length < schema.minLength) fail('too short');
    if (schema.maxLength !== undefined && [...value].length > schema.maxLength) fail('too long');
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) fail('pattern mismatch');
    if (schema.format === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) fail('invalid date');
    if (schema.format === 'uri') { try { const u = new URL(value); if (!['https:', 'http:'].includes(u.protocol)) fail('invalid URL protocol'); } catch { fail('invalid URL'); } }
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) fail('too few items');
    if (schema.maxItems !== undefined && value.length > schema.maxItems) fail('too many items');
    if (schema.items) value.forEach((item, i) => errors.push(...validateSchema(item, schema.items, definitions, `${path}[${i}]`)));
  } else if (value && typeof value === 'object') {
    for (const key of schema.required ?? []) if (!(key in value)) fail(`missing ${key}`);
    for (const [key, item] of Object.entries(value)) {
      if (schema.properties?.[key]) errors.push(...validateSchema(item, schema.properties[key], definitions, `${path}.${key}`));
      else if (schema.additionalProperties === false) fail(`unknown field ${key}`);
    }
  }
  return errors;
}
export const normalized = (text) => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export function validatePack({ release = false, checkHash = true } = {}) {
  const errors = []; const check = (condition, message) => { if (!condition) errors.push(message); };
  const schema = read('schema/contract.v1.schema.json'); const files = read('schema/files.json');
  for (const [name, shape] of Object.entries(files)) errors.push(...validateSchema(read(name), shape, schema.$defs, name));
  const q = read('questions.json'), r = read('reflections.json'), f = read('reflection-families.json'), s = read('content-sources.json'), resources = read('support-resources.json'), manifest = read('manifest.json');
  const sourceIds = new Set(s.map((x) => x.id)); const familyIds = new Set(f.map((x) => x.id));
  const tags = new Set(read('categories.json').scenarioTags.map((x) => x.id));
  const ids = new Set(); const prompts = new Set(); const bodies = new Set();
  const counters = (entries, property) => Object.fromEntries([...new Set(entries.map((x) => x[property]))].sort().map((key) => [key, entries.filter((x) => x[property] === key).length]));
  const signalIndex = new Map(read('signal-rationales.json').entries.map((x) => [x.answerId, x]));
  for (const item of [...q, ...r, ...f, ...s, ...resources, ...read('dimensions.json')]) {
    check(!ids.has(item.id), `duplicate ID ${item.id}`); ids.add(item.id);
    for (const sourceId of item.sourceIds ?? (item.sourceId ? [item.sourceId] : [])) check(sourceIds.has(sourceId), `unknown source ${sourceId}`);
    if (release && item.quality) {
      check(item.quality.status === 'approved', `${item.id}: not approved`);
      check(Boolean(item.quality.reviewedAt) && item.quality.originalityChecked && item.quality.accessibilityChecked && item.quality.approvals.length > 0 && item.quality.reviewerRole !== 'pending_human_review', `${item.id}: missing human approval`);
    }
  }
  for (const x of q) {
    check(!prompts.has(normalized(x.prompt)), `duplicate prompt ${x.id}`); prompts.add(normalized(x.prompt));
    check(x.scenarioTags.every((tag) => tags.has(tag)), `${x.id}: unknown tag`);
    check(x.coveragePotential[x.primaryDimension] > 0, `${x.id}: primary dimension absent`);
    const localText = new Set();
    for (const answer of x.answers) {
      check(!ids.has(answer.id), `duplicate answer ${answer.id}`); ids.add(answer.id);
      check(!localText.has(normalized(answer.text)), `${x.id}: repeated answer text`); localText.add(normalized(answer.text));
      check(!/prefiero no responder/i.test(answer.text), `${x.id}: skip inside answers`);
      const dimensions = answer.effects.map((e) => e.dimension);
      check(new Set(dimensions).size === dimensions.length, `${answer.id}: repeated dimension`);
      check(signalIndex.has(answer.id), `${answer.id}: no rationale`);
      check(canonical(signalIndex.get(answer.id)?.effects) === canonical(answer.effects), `${answer.id}: rationale mismatch`);
    }
    for (const d of D) {
      const derived = x.answers.filter((a) => a.effects.some((e) => e.dimension === d)).length / x.answers.length;
      check(Math.abs(derived - x.coveragePotential[d]) <= 1e-9, `${x.id}: wrong coverage ${d}`);
    }
    if (x.adaptiveEligible) check(new Set(x.answers.map((a) => canonical(a.effects))).size >= 2, `${x.id}: no adaptive alternatives`);
  }
  const forbidden = /\b(?:estás ansios[oa]|estás triste|tienes ansiedad|te diagnosticamos|sabemos cómo te sientes|todo estará bien|OMS (?:valida|recomienda|certifica) esta app)\b/iu;
  for (const x of r) {
    check(familyIds.has(x.familyId), `${x.id}: unknown family`);
    check(f.find((z) => z.id === x.familyId)?.kind === x.kind, `${x.id}: family kind mismatch`);
    check(!bodies.has(normalized(x.body)), `${x.id}: duplicate body`); bodies.add(normalized(x.body));
    check(!forbidden.test(`${x.title} ${x.body} ${x.optionalAction ?? ''}`), `${x.id}: forbidden claim`);
    if (x.familyId !== 'fam_positive_grounded' && x.kind === 'closing') check(x.title === 'Una idea para acompañarte', `${x.id}: nonlabel title`);
    if (x.practiceInspiration === null) check(x.sourceRelationship === 'original_product_heuristic', `${x.id}: wrong original relationship`);
  }
  const minimum = { fam_positive_grounded: 18, fam_neutral_generic: 18, fam_tension: 8, fam_mental_load: 8, fam_connection_low: 8, fam_motivation_low: 8, fam_activation_high: 4, fam_activation_low: 4, fam_support_invitation: 6 };
  for (const [id, n] of Object.entries(minimum)) check(r.filter((x) => x.familyId === id).length >= n, `${id}: quota`);
  for (const style of read('categories.json').styles) check(q.filter((x) => x.style === style.id).length === 45, `${style.id}: style quota`);
  check(q.filter((x) => x.coveragePotential.valence >= .75).length >= 110, 'valence coverage quota');
  check(q.filter((x) => x.coveragePotential.activation >= .5).length >= 90, 'activation coverage quota');
  check(q.filter((x) => x.adaptiveEligible).length >= 50, 'adaptive quota');
  check(q.filter((x) => x.adaptiveEligible && x.primaryDimension !== 'valence').length >= 20, 'non-valence adaptive quota');
  check(manifest.questionCount === q.length && manifest.reflectionCount === r.length, 'manifest counts mismatch');
  check(canonical(read('dimensions.json').map((x) => x.id)) === canonical(D), 'canonical dimension order');
  const skip = read('ui-copy.json').skipControl;
  check(skip.text === 'Prefiero no responder' && skip.availableImmediately && skip.effects.length === 0 && skip.answerId === null, 'skip functional contract');
  if (checkHash) check(packHash() === manifest.hash, 'manifest hash mismatch');
  if (release) check(manifest.review.releaseReady && manifest.review.status === 'approved', 'manifest release gate');
  const result = { schemaVersion: 1, contentVersion: manifest.version, contentPackHash: manifest.hash, mode: release ? 'release' : 'draft', passed: errors.length === 0, errors, counts: { questions: q.length, answers: q.reduce((sum, x) => sum + x.answers.length, 0), reflections: r.length, families: f.length, sources: s.length, supportResources: resources.length },
    distributions: { styles: counters(q, 'style'), primaryDimensions: counters(q, 'primaryDimension'), intensities: counters(q, 'intensity'), reflectionFamilies: counters(r, 'familyId') },
    coverage: { valenceAtLeast075: q.filter((x) => x.coveragePotential.valence >= .75).length, activationAtLeast050: q.filter((x) => x.coveragePotential.activation >= .5).length, adaptive: q.filter((x) => x.adaptiveEligible).length, adaptiveNonValence: q.filter((x) => x.adaptiveEligible && x.primaryDimension !== 'valence').length },
    exactDuplicatePrompts: q.length - prompts.size, exactDuplicateReflections: r.length - bodies.size,
    uniqueAnswerTexts: new Set(q.flatMap((x) => x.answers.map((a) => normalized(a.text)))).size,
    tripleEffectAnswers: q.reduce((sum, x) => sum + x.answers.filter((a) => a.effects.length === 3).length, 0),
    humanReviewCompleted: false, clinicalValidation: false };
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = validatePack({ release: process.argv.includes('--release') });
  if (process.argv.includes('--write')) writeFileSync(new URL(result.mode === 'release' ? 'release-gate.json' : 'validation-results.json', ROOT), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ ...result, errors: result.errors.slice(0, 15), errorCount: result.errors.length }, null, 2));
  process.exitCode = result.passed ? 0 : 1;
}
