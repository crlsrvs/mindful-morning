import { mkdtempSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, read } from './core.mjs';
const directory = mkdtempSync(join(tmpdir(), 'morning-content-typecheck-'));
const pairs = [['questions.json', 'Question', true], ['reflections.json', 'Reflection', true], ['reflection-families.json', 'ReflectionFamily', true], ['dimensions.json', 'Dimension', true], ['content-sources.json', 'ContentSource', true], ['support-resources.json', 'SupportResource', true], ['manifest.json', 'Manifest', false]];
try {
  copyFileSync(new URL('content-contract.ts', ROOT), join(directory, 'content-contract.ts'));
  const imports = `import type { ${pairs.map((x) => x[1]).join(', ')} } from './content-contract';\n`;
  const expressions = pairs.map(([file, type, array], i) => `const content${i} = ${JSON.stringify(read(file))} satisfies ${array ? `readonly ${type}[]` : type};\nvoid content${i};\n`).join('');
  writeFileSync(join(directory, 'fixture.ts'), imports + expressions);
  const args = ['--noEmit', '--strict', '--target', 'ES2022', '--skipLibCheck', join(directory, 'fixture.ts')];
  const compiler = process.env.CONTENT_TSC;
  if (compiler) execFileSync(process.execPath, [compiler, ...args], { stdio: 'inherit' });
  else execFileSync('tsc', args, { stdio: 'inherit' });
  console.log('TypeScript strict: all seven core JSON files satisfy their contracts.');
} finally {
  // Only remove the fresh private temporary directory created above.
  rmSync(directory, { recursive: true });
}
