const { getDefaultConfig } = require("expo/metro-config");
const { execFileSync } = require("node:child_process");
// Structural validation is read-only and mandatory for every native bundle.
execFileSync(process.execPath, ["content/tools/validate.mjs"], {
  cwd: __dirname,
  stdio: "pipe",
});
module.exports = getDefaultConfig(__dirname);
