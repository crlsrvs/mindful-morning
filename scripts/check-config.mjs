import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const c = JSON.parse(
  readFileSync(
    new URL("../config/engine-config.v1.json", import.meta.url),
    "utf8",
  ),
);
for (const weights of [c.baseWeights, c.adaptiveWeights]) {
  assert(Object.values(weights).every((v) => v >= 0 && v <= 1));
  assert(
    Math.abs(Object.values(weights).reduce((a, b) => a + b, 0) - 1) < 1e-12,
  );
}
assert(c.reflectionWaitSeconds >= 20 && c.reflectionWaitSeconds <= 30);
assert.equal(c.baseQuestionCount, 3);
assert.equal(c.maxQuestionCount, 4);
assert.equal(c.engineContractVersion, 1);
console.log("Engine config v1 valid.");
