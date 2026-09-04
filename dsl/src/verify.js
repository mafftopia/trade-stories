// Step 1 of verify-story: every check that can be made mechanically.
// Anything needing inference belongs to step 2 and is not here.
//
// Order and cardinality checks run on what the trader wrote. Only the
// required-clause check runs after defaults.trade has been merged in, so a
// badly ordered story cannot be silently reordered by the merge.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import * as parser from "./parser.js";
import {
  loadDefaults, parseDefaults, mergeDefaults, COMPLEMENTED, SYNONYM, STACKS
} from "./defaults.js";
import { renderWorkingCopy } from "./writer.js";

// Mandatory keywords in ../syntax-rules.md is the authoritative list; keep this
// in step with it. Checked against the merge, so a default satisfies any of them.
// Taking is not here: each one is checked against the exit it completes.
const REQUIRED = ["story", "trading", "given", "when", "then", "with", "sl", "until"];

// The keyword sets, in the order a story must use them. A keyword sits anywhere
// among its own set unless RANK fixes its place, so Except may go anywhere in
// the setup set and SL anywhere in the management set.
const SETS = [
  ["story", "trading", "source"],
  ["given", "when", "then", "with", "except"],
  ["until", "taking", "sl", "unless"]
];

// Story anchors the header; Trading and the Source stack follow it in either
// order, so Source ranks alongside Trading rather than at its own place.
const RANK = {
  story: 0, trading: 1, source: 1,
  given: 0, when: 1, then: 2, with: 3
};

const AT_MOST_ONE = ["story", "trading", "with", "sl"];

const LABEL = {
  story: "Story", trading: "Trading", given: "Given", when: "When",
  and: "And", except: "Except", "or except": "Or Except",
  then: "Then", with: "With", source: "Source",
  until: "Until", taking: "Taking", "or until": "Or Until",
  unless: "Unless", "or unless": "Or Unless", sl: "SL", notes: "Notes"
};

function err(line, text, message) {
  return { line, text, message };
}

// A clause sits on the line its keyword is on, which is the first line of its
// predicate. A clause supplied by the defaults has none.
function lineOf(c) {
  return c.predicate[0].line;
}

export function verify(source, options = {}) {
  const lines = source.split(/\r?\n/);
  const errors = [];
  const hints = [];

  const tabLine = findTab(lines);
  if (tabLine) {
    errors.push(err(tabLine, lines[tabLine - 1],
      "Tabs are not allowed anywhere in a story."));
    return { errors, hints, clauses: [], merged: [], working: null };
  }

  const text = source.endsWith("\n") ? source : source + "\n";

  let parsed;
  try {
    parsed = parser.parse(text);
  } catch (e) {
    const line = e.location ? e.location.start.line : null;
    errors.push(err(line, line ? lines[line - 1] : null, parseMessage(e, lines)));
    return { errors, hints, clauses: [], merged: [], working: null };
  }

  const clauses = parsed.clauses;

  resolveAnd(clauses, lines, errors);
  checkCardinality(clauses, lines, errors);
  checkOrder(clauses, lines, errors);
  collectHints(clauses, hints);

  const { defaults, errors: defaultErrors } =
    options.defaultsText !== undefined ? parseDefaults(options.defaultsText)
    : options.settingsDir ? loadDefaults(options.settingsDir)
    : { defaults: [], errors: [] };

  for (const d of defaultErrors) {
    errors.push(err(null, d.text, `defaults.trade line ${d.line}: ${d.message}`));
  }

  // Notes is parsed apart from the clauses and checked by none of them, but the
  // merged copy carries it so a skill reading only that still has the context.
  const forMerge = parsed.notes
    ? clauses.concat([{ ...parsed.notes, keyword: "notes" }])
    : clauses;

  const merged = mergeDefaults(forMerge, defaults);
  checkAlternates(merged, lines, errors);
  checkRequired(merged, clauses, lines, errors);
  checkExitPairs(merged, lines, errors);
  checkUndecided(merged, clauses, lines, errors);

  return { errors, hints, clauses, merged, working: renderWorkingCopy(merged) };
}

function findTab(lines) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("\t")) return i + 1;
  }
  return null;
}

function parseMessage(e, lines) {
  if (!e.location) return e.message;
  const n = e.location.start.line;
  const raw = lines[n - 1] || "";

  // A line indented past the keyword column is continuation text, so one that
  // reaches the parser has no clause above it to continue.
  if (raw.length - raw.replace(/^ +/, "").length > 10) {
    return "Indented too far to be a clause: a keyword takes up to 10 spaces.";
  }

  const word = raw.trim().split(/\s+/)[0];
  return word ? `"${word}" not recognised.` : e.message;
}

function checkRequired(merged, clauses, lines, errors) {
  for (const name of REQUIRED) {
    if (merged.some((c) => c.keyword === name)) continue;

    const empty = clauses.find((c) => c.keyword === name);
    if (empty) {
      errors.push(err(lineOf(empty), lines[lineOf(empty) - 1],
        `"${LABEL[name]}" clause is empty, and defaults.trade has no default for it.`));
    } else {
      errors.push(err(null, null, `"${LABEL[name]}" clause is missing.`));
    }
  }
}

// TBD and a blank predicate both say the trader has not decided yet. Notes is
// not a Rule, so an empty one is simply no notes.
function checkUndecided(merged, clauses, lines, errors) {
  for (const c of clauses) {
    if (c.keyword === "notes" || REQUIRED.includes(c.keyword)) continue;
    const text = c.predicate.map((p) => p.text.trim()).join(" ").trim();
    if (text !== "") continue;
    if (merged.some((m) => m.keyword === c.keyword)) continue;
    errors.push(err(lineOf(c), lines[lineOf(c) - 1],
      `"${LABEL[c.keyword]}" clause is undecided.`));
  }

  // TBD alone on a line. Inside other text it may be a ticker or an indicator's
  // acronym, so that reading needs step 2.
  for (const c of merged) {
    if (c.keyword === "notes") continue;
    const line = c.predicate.find((p) => /^tbd$/i.test(p.text.trim()));
    if (!line) continue;
    errors.push(err(line.line, line.line ? lines[line.line - 1] : null,
      `"${LABEL[c.keyword]}" clause is still TBD.`));
  }
}

// An And takes the keyword above it. One with nothing to take is dropped, so no
// later check meets a clause with no keyword of its own.
function resolveAnd(clauses, lines, errors) {
  for (let i = 0; i < clauses.length; i++) {
    const c = clauses[i];
    if (c.keyword !== "and") continue;

    const prev = clauses[i - 1];
    if (prev && STACKS.includes(prev.keyword)) {
      c.keyword = prev.keyword;
      continue;
    }
    errors.push(err(lineOf(c), lines[lineOf(c) - 1],
      `"And" must follow a "Given", "When", "Then" or "Source".`));
    clauses.splice(i--, 1);
  }
}

function checkCardinality(clauses, lines, errors) {
  for (const name of AT_MOST_ONE) {
    const found = clauses.filter((c) => c.keyword === name);
    for (const extra of found.slice(1)) {
      errors.push(err(lineOf(extra), lines[lineOf(extra) - 1],
        `Only one "${LABEL[name]}" clause is allowed.`));
    }
  }
}

// An exit and its Taking are a pair, and nothing may come between them.
function checkExitPairs(merged, lines, errors) {
  merged.forEach((c, i) => {
    const line = lineOf(c);
    const text = line ? lines[line - 1] : null;

    if (COMPLEMENTED.includes(c.keyword) &&
        (!merged[i + 1] || merged[i + 1].keyword !== "taking")) {
      errors.push(err(line, text,
        `"${LABEL[c.keyword]}" must be followed by a "Taking".`));
    }
    if (c.keyword === "taking" &&
        (i === 0 || !COMPLEMENTED.includes(merged[i - 1].keyword))) {
      errors.push(err(line, text,
        `"Taking" must follow an "Until" or an "Or Until".`));
    }
  });
}

function checkOrder(clauses, lines, errors) {
  const nameOf = (c) => SYNONYM[c.keyword] || c.keyword;
  const setOf = (c) => SETS.findIndex((s) => s.includes(nameOf(c)));
  const rankOf = (c) => (nameOf(c) in RANK ? RANK[nameOf(c)] : -1);

  let set = -1;
  let opener = null;
  let highest = -1;

  for (const c of clauses) {
    const mine = setOf(c);
    if (mine === -1) continue;

    if (mine < set) {
      errors.push(err(lineOf(c), lines[lineOf(c) - 1],
        `"${LABEL[c.keyword]}" must come before "${LABEL[opener.keyword]}".`));
      continue;
    }
    if (mine > set) {
      set = mine;
      opener = c;
      highest = -1;
    }

    const rank = rankOf(c);
    if (rank === -1) continue;
    if (rank < highest) {
      const earlier = clauses.find((o) => setOf(o) === mine && rankOf(o) === highest);
      errors.push(err(lineOf(c), lines[lineOf(c) - 1],
        `"${LABEL[c.keyword]}" must come before "${LABEL[earlier.keyword]}".`));
    } else {
      highest = rank;
    }
  }

}

// A stack alternate needs the keyword it stands in for, above it. This runs on
// the merged story rather than the trader's, because a default supplies an
// alternate too and the rule belongs in one place. Order is positional: a
// default-supplied clause has no line to compare.
function checkAlternates(list, lines, errors) {
  for (const [second, first] of Object.entries(SYNONYM)) {
    const or = list.findIndex((c) => c.keyword === second);
    if (or === -1) continue;

    const base = list.findIndex((c) => c.keyword === first);
    if (base !== -1 && base < or) continue;

    const line = lineOf(list[or]);
    errors.push(err(line, line ? lines[line - 1] : null,
      `"${LABEL[second]}" must come after "${LABEL[first]}".`));
  }
}

function collectHints(clauses, hints) {
  for (const c of clauses) {
    for (const cont of c.predicate.slice(1)) {
      if (cont.opensWithKeyword) {
        hints.push({
          line: cont.line,
          text: cont.text,
          message: `Read as continuation text of "${LABEL[c.keyword]}", not as a clause, because it is indented past it.`
        });
      }
    }
  }
}

if (process.argv[1] && process.argv[1].endsWith("verify.js")) {
  const path = process.argv[2];

  // defaults.trade is written in story syntax and named like one, so it would
  // check as a story. Nothing in the settings folder is a story.
  if (dirname(path).split(/[\\/]/).pop() === ".settings") {
    console.error(`${path} is a settings file, not a story.`);
    process.exit(1);
  }

  // The settings a story draws on and the working copies written as it is
  // checked belong to the project the story is in — the working directory. That
  // is the product itself when run standalone, and the host project when this
  // runs inside a plugin.
  const root = process.cwd();
  const result = verify(readFileSync(path, "utf8"), {
    settingsDir: join(root, "stories", ".settings")
  });

  if (result.working) {
    const workingDir = join(root, ".working", "stories");
    mkdirSync(workingDir, { recursive: true });
    writeFileSync(join(workingDir, basename(path)), result.working);
  }

  console.log(JSON.stringify({
    errors: result.errors,
    hints: result.hints,
    merged: result.merged
  }, null, 2));
}
