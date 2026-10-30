import { writeFileSync } from 'node:fs';
import { ROOT, HASH_FILES, read, packHash } from './core.mjs';
const manifest = read('manifest.json');
manifest.hash = packHash();
writeFileSync(new URL('manifest.json', ROOT), `${JSON.stringify(manifest, null, 2)}\n`);
writeFileSync(new URL('hash-scope.json', ROOT), `${JSON.stringify({ schemaVersion: 1, algorithm: 'SHA-256', encoding: 'UTF-8', canonicalization: 'Recursively sort object keys ascending; retain array order; serialize primitives using JSON.stringify; no whitespace, no trailing newline; all strings NFC.', scope: ['manifest.json (without hash)', ...HASH_FILES], excludes: ['audit and simulation reports', 'tools', 'schema', 'review evidence extensions'], implementation: 'tools/core.mjs:packHash' }, null, 2)}\n`);
console.log(manifest.hash);
