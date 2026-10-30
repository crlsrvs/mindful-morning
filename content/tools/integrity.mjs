import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import assert from 'node:assert/strict';
import { ROOT, read, sha, packHash } from './core.mjs';
const root = fileURLToPath(ROOT);
function list(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? list(join(directory, entry.name)) : [join(directory, entry.name)]);
}
const files = Object.fromEntries(list(root).filter((file) => relative(root, file) !== 'checksums.json').sort().map((file) => [relative(root, file), sha(readFileSync(file))]));
if (process.argv.includes('--write')) {
  writeFileSync(new URL('checksums.json', ROOT), `${JSON.stringify({ schemaVersion: 1, contentVersion: read('manifest.json').version, contentPackHash: read('manifest.json').hash, algorithm: 'SHA-256', scope: 'Exact bytes of all delivered files except checksums.json itself.', files }, null, 2)}\n`);
} else {
  assert.deepEqual(files, read('checksums.json').files, 'file byte checksum mismatch');
}
assert.equal(packHash(), read('manifest.json').hash, 'canonical content hash mismatch');
const docsArg = process.argv.find((x) => x.startsWith('--docs='));
const docs = docsArg ? docsArg.slice('--docs='.length) : fileURLToPath(new URL('../docs/', ROOT));
const original = read('reference-integrity.json').files;
for (const [name, expected] of Object.entries(original)) assert.equal(sha(readFileSync(join(docs, name))), expected, `Original document changed: ${name}`);
console.log(`Integrity passed: ${Object.keys(files).length} delivered files; ${Object.keys(original).length} original documents unchanged; canonical pack hash matches.`);
