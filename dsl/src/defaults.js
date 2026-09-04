// defaults.trade supplies a clause the story leaves out. It is written in story
// syntax, a clause to a keyword, in any order, and read by the story parser.

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import * as parser from "./parser.js";

// Canonical order, used both to validate a default's keyword and to place a
// default in the merged story. SL may sit anywhere; between With and Until is
// where the worked examples put it. And is absent: a default
// has no clause above it to take a keyword from.
const KEYWORDS = [
  "story", "trading", "source", "given", "when", "except", "or except", "then",
  "with", "sl", "until", "taking", "or until", "unless", "or unless", "notes"
];

export const CANONICAL_ORDER = KEYWORDS;

// A complemented clause is closed by the complement below it: Taking completes
// an Until or an Or Until, and the two together are a complement pair.
export const COMPLEMENTED = ["until", "or until"];
export const COMPLEMENT = "taking";

// Each stands in for the keyword it follows, and ranks as that keyword.
export const SYNONYM = {
  "or except": "except", "or until": "until", "or unless": "unless"
};

// The clauses that stack, by repeating the keyword or by And.
export const STACKS = ["given", "when", "then", "source"];

// Keywords that may appear as more than one group of their own: a complement
// belongs to each complemented clause, a complemented clause recurs once per
// pair, and a stack takes any number of alternates.
const REPEATABLE = [COMPLEMENT, ...COMPLEMENTED, ...Object.keys(SYNONYM)];

const baseOf = (keyword) => SYNONYM[keyword] || keyword;

export function loadDefaults(dir) {
  const path = join(dir, "defaults.trade");
  if (!existsSync(path)) return { defaults: [], errors: [], path };
  return { ...parseDefaults(readFileSync(path, "utf8")), path };
}

// The story parser reads this file, so a default is a clause and may run to a
// block. Order is not checked here: verify.js orders the merged story.
export function parseDefaults(source) {
  const defaults = [];
  const errors = [];
  const lines = source.split(/\r?\n/);
  const at = (n) => ({ line: n, text: n ? lines[n - 1] : null });

  let parsed;
  try {
    parsed = parser.parse(source.endsWith("\n") ? source : source + "\n");
  } catch (e) {
    const line = e.location ? e.location.start.line : null;
    const word = line ? (lines[line - 1] || "").trim().split(/\s+/)[0] : null;
    errors.push({ ...at(line),
      message: word ? `"${word}" is not a clause keyword.` : e.message });
    return { defaults, errors };
  }

  const clauses = parsed.clauses.slice();

  // And takes the keyword of the clause above it, as it does in a story.
  for (let i = 0; i < clauses.length; i++) {
    if (clauses[i].keyword !== "and") continue;
    const above = clauses[i - 1];
    if (above && STACKS.includes(above.keyword)) {
      clauses[i] = { ...clauses[i], keyword: above.keyword };
      continue;
    }
    errors.push({ ...at(clauses[i].predicate[0].line),
      message: `"And" must follow a "Given", "When", "Then" or "Source".` });
    clauses.splice(i--, 1);
  }

  // A stack is a run of one keyword, so consecutive clauses are one default.
  for (const c of clauses) {
    const line = c.predicate[0].line;
    const predicate = c.predicate.map((p) => p.text);
    const open = defaults[defaults.length - 1];

    if (predicate.join("").trim() === "") {
      errors.push({ ...at(line), message: `"${c.keyword}" default has no value.` });
      continue;
    }
    if (open && open.keyword === c.keyword && STACKS.includes(c.keyword)) {
      open.clauses.push(predicate);
      continue;
    }
    if (!REPEATABLE.includes(c.keyword) &&
        defaults.some((d) => d.keyword === c.keyword)) {
      errors.push({ ...at(line), message: `"${c.keyword}" already has a default.` });
      continue;
    }

    defaults.push({ keyword: c.keyword, line, clauses: [predicate] });
  }

  // Notes is parsed apart from the clauses, and always merges last.
  if (parsed.notes) {
    const predicate = parsed.notes.predicate.map((p) => p.text);
    if (predicate.join("").trim() !== "") {
      defaults.push({
        keyword: "notes",
        line: parsed.notes.predicate[0].line,
        clauses: [predicate]
      });
    }
  }

  return { defaults, errors };
}

// A default fills a keyword the story does not use at all, or uses with an
// empty predicate. The story always wins, except for a stack alternate, which
// adds to whatever the story already has. The story keeps the order it was
// written in, so only a default is placed.
export function mergeDefaults(clauses, defaults) {
  const said = (c) => c.predicate.some((t) => t.text !== "");

  const supplied = new Set(clauses.filter(said).map((c) => c.keyword));

  const merged = clauses
    .filter(said)
    .map((c) => ({ ...c, source: "story" }));

  const units = group(defaults);
  const alternate = (u) => u.keyword in SYNONYM;

  // A pair is used only where the story closes no complemented clause of its
  // own, and only the first of them.
  const closed = merged.some((c, i) =>
    COMPLEMENTED.includes(c.keyword) && merged[i + 1]?.keyword === COMPLEMENT);
  const pair = units.find((u) => u.pair && !alternate(u));

  for (const u of units) {
    if (u.keyword === "notes") continue;
    if (u.keyword === COMPLEMENT && !u.pair) continue;
    if (alternate(u)) {
      append(merged, u);
      continue;
    }
    if (u.pair && (closed || u !== pair)) continue;
    if (supplied.has(u.keyword)) continue;
    place(merged, u);
  }

  // A complement belongs to one clause, so a solitary one completes every
  // clause the story leaves open rather than being placed once.
  const solitary = units.find((u) => u.keyword === COMPLEMENT && !u.pair);
  if (solitary) {
    for (let i = merged.length - 1; i >= 0; i--) {
      if (!COMPLEMENTED.includes(merged[i].keyword)) continue;
      if (merged[i + 1] && merged[i + 1].keyword === COMPLEMENT) continue;
      merged.splice(i + 1, 0, ...clausesOf(solitary));
    }
  }

  const notes = units.find((u) => u.keyword === "notes");
  if (notes) addNotes(merged, notes);

  return merged;
}

// A complemented default and the complement below it travel together.
function group(defaults) {
  const units = [];
  for (let i = 0; i < defaults.length; i++) {
    const d = defaults[i];
    const next = defaults[i + 1];
    if (COMPLEMENTED.includes(d.keyword) && next && next.keyword === COMPLEMENT) {
      units.push({ ...d, pair: next });
      i++;
      continue;
    }
    units.push({ ...d, pair: null });
  }
  return units;
}

function clausesOf(u) {
  const out = u.clauses.map((predicate) => defaultClause(u.keyword, predicate));
  if (u.pair) {
    for (const predicate of u.pair.clauses) {
      out.push(defaultClause(u.pair.keyword, predicate));
    }
  }
  return out;
}

function place(merged, u) {
  const rank = CANONICAL_ORDER.indexOf(u.keyword);
  const at = merged.findIndex(
    (c) => CANONICAL_ORDER.indexOf(c.keyword) > rank);

  if (at === -1) merged.push(...clausesOf(u));
  else merged.splice(at, 0, ...clausesOf(u));
}

// An alternate joins the end of its own stack, however many the story has. With
// no stack to join it is placed anyway: verify.js reports the missing opener,
// so the rule lives in one place.
function append(merged, u) {
  const base = baseOf(u.keyword);
  let last = -1;
  merged.forEach((c, i) => {
    if (baseOf(c.keyword) === base) last = i;
  });

  if (last === -1) {
    place(merged, u);
    return;
  }
  if (merged[last + 1] && merged[last + 1].keyword === COMPLEMENT) last++;
  merged.splice(last + 1, 0, ...clausesOf(u));
}

// Notes is one clause however many sources it has, so a default joins the
// story's own lines rather than opening a second Notes.
function addNotes(merged, u) {
  const lines = u.clauses.flat().map(
    (text) => ({ text, line: null, opensWithKeyword: false }));
  const own = merged.find((c) => c.keyword === "notes");
  if (!own) {
    merged.push(defaultClause("notes", u.clauses.flat()));
    return;
  }

  // Notes runs to the end of the file, so the story's own carries whatever
  // blank lines closed it. They would show as a gap mid-block.
  const kept = own.predicate.slice();
  while (kept.length && kept[kept.length - 1].text.trim() === "") kept.pop();
  if (kept.length) {
    const last = kept[kept.length - 1];
    kept[kept.length - 1] = { ...last, text: last.text.replace(/\s+$/, "") };
  }
  own.predicate = kept.concat(lines);
}

function defaultClause(keyword, predicate) {
  return {
    keyword,
    raw: keyword,
    column: null,
    predicate: predicate.map(
      (text) => ({ text, line: null, opensWithKeyword: false })),
    source: "defaults"
  };
}

