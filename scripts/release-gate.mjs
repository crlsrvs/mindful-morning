import { validatePack } from "../content/tools/validate.mjs";
import { readFileSync } from "node:fs";
const report = validatePack({ release: true });
const ui = JSON.parse(
  readFileSync(new URL("../content/ui-copy.json", import.meta.url), "utf8"),
);
if (!report.passed || ui.status !== "approved") {
  console.error(
    `Release blocked: ${report.errors.length} content approval/validation diagnostics; UI copy approved: ${ui.status === "approved"}.`,
  );
  process.exitCode = 1;
} else console.log("Release content approved and structurally valid.");
