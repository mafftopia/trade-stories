// Renders clauses as text, in either of the two layouts a story is written in:
// the working copy verify.js generates, and a trader's own story file. Both
// read two fields of a clause, its keyword and the lines of its predicate.
//
//   node dsl/src/writer.js <clauses.json> <story.trade>
//
// writes a story file from clauses given as
// [{ "keyword": "given", "predicate": ["price regime is ranging", "ADX below 20"] }]

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const LABEL = {
  story: "Story", trading: "Trading", source: "Source", given: "Given",
  when: "When", and: "And", except: "Except", "or except": "Or Except",
  then: "Then", with: "With", sl: "SL",
  until: "Until", taking: "Taking", "or until": "Or Until",
  unless: "Unless", "or unless": "Or Unless", notes: "Notes"
};

const HEADER = "# Generated copy with all defaults applied - don't edit.\n\n";

const HEADS = ["story", "trading", "source"];

// A trader's story puts every predicate at the same column, whatever the
// keyword, with the body indented under the head pair.
const COLUMN = 12;
const BODY_INDENT = 2;

const linesOf = (c) => c.predicate.map((p) => p.text);

// Notes is rendered as a block, since its predicate may run to several lines.
export function renderWorkingCopy(merged) {
  if (merged.length === 0) return "";

  const rules = merged.filter((c) => c.keyword !== "notes");
  const notes = merged.find((c) => c.keyword === "notes");
  const lines = [];

  // The keyword's own line, then any continuation under it, at the column the
  // labels pad to — never left of COLUMN, which is where a continuation starts.
  if (rules.length > 0) {
    const width = Math.max(
      COLUMN, Math.max(...rules.map((c) => LABEL[c.keyword].length)) + 2);
    for (const c of rules) {
      const [first, ...rest] = linesOf(c);
      lines.push(LABEL[c.keyword].padEnd(width) + first);
      for (const cont of rest) lines.push(" ".repeat(width) + cont);
    }
  }

  if (notes) {
    if (lines.length > 0) lines.push("");
    lines.push(LABEL.notes);
    for (const line of notesLines(notes)) lines.push(line);
  }

  return HEADER + lines.join("\n") + "\n";
}

export function renderStory(clauses) {
  if (clauses.length === 0) return "";

  const heads = clauses.filter((c) => HEADS.includes(c.keyword));
  const rules = clauses.filter(
    (c) => !HEADS.includes(c.keyword) && c.keyword !== "notes");
  const notes = clauses.find((c) => c.keyword === "notes");
  const lines = [];

  for (const c of heads) lines.push(...clauseLines(c, 0));
  if (heads.length > 0 && rules.length > 0) lines.push("");
  for (const c of rules) lines.push(...clauseLines(c, BODY_INDENT));

  if (notes) {
    if (lines.length > 0) lines.push("");
    lines.push(LABEL.notes + ":");
    for (const line of notesLines(notes)) lines.push(line);
  }

  return lines.join("\n") + "\n";
}

function clauseLines(c, indent) {
  const [first, ...rest] = linesOf(c);
  const label = " ".repeat(indent) + LABEL[c.keyword];
  const out = [(label.padEnd(COLUMN) + first).replace(/\s+$/, "")];
  for (const cont of rest) out.push(" ".repeat(COLUMN) + cont);
  return out;
}

function notesLines(notes) {
  return linesOf(notes).join("\n").replace(/\s+$/, "").split("\n")
    .map((line) => (line.trim() === "" ? "" : "  " + line.trim()));
}

// The predicate of a clause handed in is a list of plain lines, since a caller
// writing a new story has no line numbers to give.
function asClauses(given) {
  return given.map((c) => ({
    keyword: c.keyword,
    predicate: c.predicate.map(
      (text) => ({ text, line: null, opensWithKeyword: false }))
  }));
}

if (process.argv[1] && process.argv[1].endsWith("writer.js")) {
  const [clausesPath, storyPath] = process.argv.slice(2);

  if (!clausesPath || !storyPath) {
    console.error("Usage: writer.js <clauses.json> <story.trade>");
    process.exit(1);
  }
  if (existsSync(storyPath)) {
    console.error(`${storyPath} already exists. Stories are never written over.`);
    process.exit(1);
  }

  const given = JSON.parse(readFileSync(clausesPath, "utf8"));
  writeFileSync(storyPath, renderStory(asClauses(given)));
  console.log(storyPath);
}
