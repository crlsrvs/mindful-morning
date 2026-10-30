import { writeFileSync } from 'node:fs';
import { ROOT, read } from './core.mjs';
import { normalized } from './validate.mjs';
const stop = new Set('a al algo ante ahora alguna algun algunas algunos ambos cada como con cual cuando de del desde donde el ella ellas ellos en entre era es esa ese esta este estos estas fuera hay hoy la las le lo los mas me mi mis ni no nos o otra otro para pero por porque puede puedes que quien se si sin sobre solo son su sus te tener ti tiene tienes tu tus un una unas unos y ya'.split(' '));
const lexicon = new Map(Object.entries({ empezar: 'iniciar', comienzo: 'iniciar', comenzar: 'iniciar', iniciarlo: 'iniciar', iniciarla: 'iniciar', cercania: 'conexion', contacto: 'conexion', grato: 'agradable', grata: 'agradable', agrado: 'agradable', incomodo: 'desagradable', incomoda: 'desagradable', incomodaria: 'desagradable', despacio: 'lento', despacio_: 'lento', lentamente: 'lento', asuntos: 'asunto', ideas: 'idea', pensamientos: 'pensamiento', pequenas: 'pequeno', pequena: 'pequeno', sencillo: 'pequeno', sencilla: 'pequeno', imaginar: 'imaginar', imagina: 'imaginar', imaginado: 'imaginar', notas: 'notar', notar: 'notar', observar: 'notar', observas: 'notar', sientes: 'sentir', sentiria: 'sentir' }));
function tokens(text) { return normalized(text).split(' ').filter((x) => x.length > 2 && !stop.has(x)).map((x) => lexicon.get(x) ?? x); }
function vectors(items, textOf) {
  const docs = items.map((x) => tokens(textOf(x))); const df = new Map();
  for (const words of docs) for (const term of new Set(words)) df.set(term, (df.get(term) ?? 0) + 1);
  return docs.map((words) => { const counts = new Map(); for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1); let length = 0; const vector = new Map();
    for (const [word, count] of counts) { const value = (1 + Math.log(count)) * Math.log(1 + docs.length / df.get(word)); vector.set(word, value); length += value ** 2; }
    return { vector, length: Math.sqrt(length) }; });
}
const cosine = (a, b) => a.length && b.length ? [...a.vector].reduce((sum, [word, value]) => sum + value * (b.vector.get(word) ?? 0), 0) / a.length / b.length : 0;
function pairs(items, textOf) {
  const v = vectors(items, textOf); const list = [];
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) list.push({ ids: [items[i].id, items[j].id], similarity: Number(cosine(v[i], v[j]).toFixed(4)), texts: [textOf(items[i]), textOf(items[j])], reviewStatus: 'pending_independent_human_review' });
  return list.sort((a, b) => b.similarity - a.similarity || a.ids.join().localeCompare(b.ids.join()));
}
const q = read('questions.json'), r = read('reflections.json');
const qp = pairs(q, (x) => x.prompt); const rp = pairs(r, (x) => x.body);
const repeatedAnswers = new Map();
for (const item of q) for (const a of item.answers) { const key = normalized(a.text); if (!repeatedAnswers.has(key)) repeatedAnswers.set(key, []); repeatedAnswers.get(key).push(a.id); }
const clusters = new Map(); for (const item of q) { if (!clusters.has(item.semanticClusterId)) clusters.set(item.semanticClusterId, []); clusters.get(item.semanticClusterId).push(item.id); }
const report = { schemaVersion: 1, version: read('manifest.json').version, method: 'TF-IDF cosine of Spanish normalized prompt/body tokens with explicit small synonym lexicon. Internal answer text reuse checked separately. No external model, embeddings or network.',
  limitation: 'Lexical-conceptual triage only: high scores are review candidates; low scores do not rule out semantic duplication. Distinct cluster IDs do not prove distinct meaning. No guarantee of corpus-wide originality or human semantic approval.',
  threshold: .35, questionPairsCompared: qp.length, reflectionPairsCompared: rp.length,
  questionPairsAtOrAboveThreshold: qp.filter((x) => x.similarity >= .35), reflectionPairsAtOrAboveThreshold: rp.filter((x) => x.similarity >= .35),
  questionTop40: qp.slice(0, 40), reflectionTop20: rp.slice(0, 20),
  repeatedAnswerTexts: [...repeatedAnswers].filter(([, ids]) => ids.length > 1).map(([text, ids]) => ({ text, answerIds: ids, severity: 'review_context_not_automatic_duplicate_question' })),
  repeatedSemanticClusters: [...clusters].filter(([, ids]) => ids.length > 1).map(([id, ids]) => ({ id, questionIds: ids })),
  semanticApproval: 'pending_human_review' };
writeFileSync(new URL('similarity-report.json', ROOT), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ compared: [qp.length, rp.length], highSimilarityQuestionPairs: report.questionPairsAtOrAboveThreshold.length, highSimilarityReflectionPairs: report.reflectionPairsAtOrAboveThreshold.length, repeatedAnswerTextGroups: report.repeatedAnswerTexts.length, topQuestions: qp.slice(0, 12) }, null, 2));
