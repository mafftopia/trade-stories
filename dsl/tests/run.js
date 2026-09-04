// The parser test suite. Each case is a story run through verify() and checked
// against an expected outcome. The cases are plain data, so they survive a
// change of parser.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { verify } from "../src/verify.js";
import { renderStory } from "../src/writer.js";

const here = dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(readFileSync(join(here, "cases.json"), "utf8"));

let passed = 0;
const failures = [];

for (const c of cases) {
  const options = {};
  if (c.defaults !== undefined) options.defaultsText = c.defaults;
  const { errors, hints, merged, working } = verify(c.story, options);
  const messages = errors.map((e) => e.message).join(" | ");
  const hintText = hints.map((h) => h.message).join(" | ");
  let ok;

  if (c.expect === "ok") {
    ok = errors.length === 0;
  } else {
    ok = errors.length > 0 && (!c.contains || messages.includes(c.contains));
  }
  if (ok && c.hintContains) ok = hintText.includes(c.hintContains);
  if (ok && c.hintLine) ok = hints.some((h) => h.line === c.hintLine);

  if (ok && c.workingContains) ok = working.includes(c.workingContains);

  // A story already in the layout write-story produces must come back from the
  // renderer unchanged. Only for a case with no defaults, since a default would
  // reach merged without belonging in the trader's file.
  if (ok && c.rendersBackToItself) ok = renderStory(merged) === c.story;

  // A predicate is a line per entry, so an expectation names them joined.
  if (ok && c.mergedHas) {
    ok = c.mergedHas.every((want) =>
      merged.some((m) =>
        m.keyword === want.keyword &&
        m.predicate.map((t) => t.text).join("\n") === want.predicate &&
        (want.source === undefined || m.source === want.source)));
  }

  if (ok) {
    passed++;
  } else {
    failures.push({ name: c.name, expect: c.expect, contains: c.contains, messages });
  }
  console.log(`${ok ? "ok  " : "FAIL"}  ${c.name}${ok ? "" : "   -> " + (messages || "no errors")}`);
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length > 0) process.exitCode = 1;
