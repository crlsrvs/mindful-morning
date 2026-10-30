import { writeFileSync } from 'node:fs';
import { ROOT, D, read } from './core.mjs';
const questions = read('questions.json');
const dimensions = Object.fromEntries(D.map((d) => [d, { negative: 0, zero: 0, positive: 0, unknownAlternatives: 0 }]));
const positivePositions = [0, 0, 0, 0], negativePositions = [0, 0, 0, 0], unknownPositions = [0, 0, 0, 0];
const wordCounts = [];
for (const q of questions) {
  q.answers.forEach((a, position) => {
    for (const d of D) {
      const e = a.effects.find((x) => x.dimension === d);
      dimensions[d][!e ? 'unknownAlternatives' : e.value > 0 ? 'positive' : e.value < 0 ? 'negative' : 'zero']++;
    }
    const v = a.effects.find((x) => x.dimension === 'valence');
    if (v?.value > 0) positivePositions[position]++;
    if (v?.value < 0) negativePositions[position]++;
    if (!a.effects.length) unknownPositions[position]++;
  });
  wordCounts.push({ id: q.id, words: `${q.prompt} ${q.helperText ?? ''} ${q.answers.map((a) => a.text).join(' ')}`.split(/\s+/u).filter(Boolean).length });
}
const sorted = [...wordCounts].sort((a, b) => a.words - b.words);
const result = { schemaVersion: 1, contentVersion: read('manifest.json').version, dimensions, positivePositions, negativePositions, unknownPositions,
  readingWords: { min: sorted[0].words, median: sorted[Math.floor(sorted.length / 2)].words, max: sorted.at(-1).words, longestQuestionIds: sorted.slice(-5).map((x) => x.id) },
  note: 'Counts of authored alternatives, not response probabilities or distributions of people. Reading length is not a timed accessibility test. Uniform ±0.6/weight 1 is an editorial convention, not calibrated measurement.' };
writeFileSync(new URL('editorial-stats.json', ROOT), `${JSON.stringify(result, null, 2)}\n`);
const report = read('similarity-report.json');
const review = { schemaVersion: 1, contentVersion: read('manifest.json').version, authorRole: 'content_agent', independentHumanReview: false,
  questionPairs: report.questionPairsAtOrAboveThreshold.map((x) => ({ ...x, agentDisposition: 'retain_pending_independent_review', rationale: {
    'q_0125,q_0148': 'Espera real ante el control frente a expectativa social de responder a otra persona.',
    'q_0108,q_0130': 'Desnivel ya presente frente a hueco disponible para una acción; revisión de redundancia del estímulo necesaria.',
    'q_0093,q_0118': 'Sonido único frente a distinguir dos formas; posible redundancia de atención a revisar con personas.',
    'q_0098,q_0131': 'Punto de apoyo físico frente a disponibilidad de la pregunta en pantalla.',
    'q_0124,q_0161': 'Objeto de uso compartido frente a participación presencial sin seguir conversación.',
    'q_0115,q_0134': 'Movimiento mínimo general frente a abrir y volver a cerrar; potencial redundancia de impulso pendiente.',
    'q_0105,q_0116': 'Familiaridad de señal del lugar frente a sensación de pertenencia; comprobar distinción subjetiva.'
  }[x.ids.join(',')] ?? 'Semejanza léxica que requiere juicio independiente; no se certifica distinción semántica.' })),
  reflectionPairs: report.reflectionPairsAtOrAboveThreshold.map((x) => ({ ...x, agentDisposition: 'shared_support_function_pending_human_review', rationale: 'Variantes de la misma invitación adicional; comparten acceso funcional a Necesito apoyo. Revisar si la variación de tono aporta valor.' })),
  decision: 'No claim of zero semantic duplicates. All flagged pairs remain visible for human adjudication; all entries remain draft.' };
writeFileSync(new URL('semantic-review.json', ROOT), `${JSON.stringify(review, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
