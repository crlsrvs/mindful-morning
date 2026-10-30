import { readdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ROOT, read } from './core.mjs';
import { validatePack } from './validate.mjs';
for (const file of readdirSync(new URL('tools/', ROOT)).filter((name) => name.endsWith('.mjs'))) execFileSync(process.execPath, ['--check', fileURLToPath(new URL(`tools/${file}`, ROOT))], { stdio: 'inherit' });
const errors = validatePack().errors;
for (const file of readdirSync(ROOT).filter((name) => /\.(json|md|ts)$/.test(name))) {
  const text = readFileSync(new URL(file, ROOT), 'utf8');
  if (text !== text.normalize('NFC')) errors.push(`${file}: non-NFC text`);
  if (!text.endsWith('\n')) errors.push(`${file}: no final newline`);
  if (/\t|[ \t]+$/m.test(text)) errors.push(`${file}: tab or trailing whitespace`);
}
for (const q of read('questions.json')) {
  if (!q.prompt.endsWith('?')) errors.push(`${q.id}: not a question`);
  if (/[<>]|\b(?:depresión|diagnóstico|suicidio|trauma)\b/iu.test(q.prompt)) errors.push(`${q.id}: prohibited or markup language`);
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('Lint passed: script syntax, strict content contract, copy checks, Unicode and whitespace.');
