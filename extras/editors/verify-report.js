// Runs the mechanical verify checks on one story and prints each finding as a
// line an editor can jump from:
//
//   node extras/editors/verify-report.js stories/ema/ema-rvi-buy.trade
//   /full/path/ema-rvi-buy.trade:8: error: "Then" must come before "With".
//
// The project the story belongs to is the nearest folder above it holding a
// stories/ folder, and its stories/.settings/defaults.trade is applied, as
// verify.js does when run from that folder. Nothing is written. Exits 1 when
// there are errors, 0 otherwise.

import { readFileSync, existsSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { verify } from "../../dsl/src/verify.js";

const given = process.argv[2];
if (!given) {
  console.error("Usage: verify-report.js <story.trade>");
  process.exit(2);
}

const path = resolve(given);
if (basename(dirname(path)) === ".settings") {
  console.error(`${path} is a settings file, not a story.`);
  process.exit(2);
}

let root = dirname(path);
for (let dir = root; ; dir = dirname(dir)) {
  if (existsSync(join(dir, "stories"))) { root = dir; break; }
  if (dirname(dir) === dir) break;
}

const result = verify(readFileSync(path, "utf8"), {
  settingsDir: join(root, "stories", ".settings")
});

for (const e of result.errors) console.log(`${path}:${e.line || 1}: error: ${e.message}`);
for (const h of result.hints) console.log(`${path}:${h.line || 1}: warning: ${h.message}`);
if (result.errors.length === 0 && result.hints.length === 0) console.log(`${path}: no errors`);

process.exit(result.errors.length === 0 ? 0 : 1);
