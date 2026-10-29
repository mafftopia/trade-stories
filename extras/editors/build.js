// Regenerates every editor file that repeats the DSL's keyword table, so the
// editor packages cannot drift from dsl/. Nothing here is a source: edit dsl/
// and run
//
//   node extras/editors/build.js
//
// Sources read:
//   dsl/syntax-rules.md    keyword forms by set, and the mandatory keywords
//   dsl/keywords.md        the question each keyword puts to the trader
//   dsl/grammar.peggy      the stack continuation keyword (And)
//   dsl/src/writer.js      the layout a story is written in
//   dsl/src/reversal.js    the reversible tokens
//
// Files written:
//   bb-edit/…/Clippings/Trade Stories.trade/*           one clipping a keyword, and New Trade Story
//   bb-edit/…/Language Modules/TradeStories.plist       the Keyword Pattern and Function Pattern only
//   bb-edit/…/Text Filters/Flip Reversible Tokens       the token table
//   sublime-text/snippets/*.sublime-snippet              one snippet a keyword, and New Trade Story
//   sublime-text/TradeStory.sublime-completions
//   sublime-text/trade-stories-sublime-plugin.py         the block between the generated markers

import {
  readFileSync, writeFileSync, readdirSync, unlinkSync, mkdirSync, chmodSync
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderStory } from "../../dsl/src/writer.js";
import { SYNONYM, CANONICAL_ORDER } from "../../dsl/src/defaults.js";
import { REVERSIBLE } from "../../dsl/src/reversal.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const DSL = join(HERE, "..", "..", "dsl");
const BBEDIT = join(HERE, "bb-edit", "Trade Stories.bbpackage", "Contents");
const CLIPPINGS = join(BBEDIT, "Clippings", "Trade Stories.trade");
const PLIST = join(BBEDIT, "Language Modules", "TradeStories.plist");
const FILTER = join(BBEDIT, "Text Filters", "Flip Reversible Tokens");
const SUBLIME = join(HERE, "sublime-text");
const SNIPPETS = join(SUBLIME, "snippets");
const COMPLETIONS = join(SUBLIME, "TradeStory.sublime-completions");
const PLUGIN = join(SUBLIME, "trade-stories-sublime-plugin.py");

const SKELETON = "New Trade Story";
const AND_PLACEHOLDER = "the next condition in this stack";

// Two keyword forms the grammar reads as another keyword: normHead and
// ReversedKeyword in grammar.peggy.
const ALIAS = { sources: "source", reversal: "reversed" };

const nameOf = (surface) =>
  surface.toLowerCase().replace(/:$/, "").replace(/\s+/g, " ");
const canonical = (name) => ALIAS[name] || SYNONYM[name] || name;

// ---------------------------------------------------------------------------
// Sources

const syntaxRules = readFileSync(join(DSL, "syntax-rules.md"), "utf8");
const keywordsMd = readFileSync(join(DSL, "keywords.md"), "utf8");
const grammar = readFileSync(join(DSL, "grammar.peggy"), "utf8");

// Every backticked item in the bullets under a heading, up to the next heading.
function bullets(md, heading) {
  const lines = md.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim().startsWith(heading));
  if (start === -1) throw new Error(`syntax-rules.md: heading "${heading}" not found`);
  const out = [];
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,6}\s/.test(line)) break;
    if (!line.startsWith("- ")) continue;
    for (const m of line.matchAll(/`([^`]+)`/g)) out.push(m[1]);
  }
  return out;
}

const SETS = {
  header: bullets(syntaxRules, "### Header keywords"),
  setup: bullets(syntaxRules, "### Trade Setup keywords"),
  management: bullets(syntaxRules, "### Trade Management keywords"),
  footer: bullets(syntaxRules, "### Footer keywords")
};
const mandatory = bullets(syntaxRules, "### Mandatory keywords").map(nameOf);

// The grammar's keyword list adds the forms the rules file only describes in
// prose, which is And.
const grammarList = grammar.match(/const KEYWORDS = \[([\s\S]*?)\];/);
if (!grammarList) throw new Error("grammar.peggy: KEYWORDS array not found");
const known = new Set(Object.values(SETS).flat().map(nameOf));
for (const m of grammarList[1].matchAll(/"([^"]+)"/g)) {
  if (known.has(m[1])) continue;
  SETS.setup.push(m[1].replace(/\b\w/g, (c) => c.toUpperCase()));
  known.add(m[1]);
}

const surfaces = Object.values(SETS).flat();
const footer = new Set(SETS.footer.map(nameOf));

// The question each keyword asks, from the code block in keywords.md. A
// keyword's line starts with the keyword; a line under it continues the
// question until it ends in a question mark, and a parenthesis is an aside.
function questions(md) {
  const block = md.match(/```\n([\s\S]*?)```/);
  if (!block) throw new Error("keywords.md: code block not found");
  const out = {};
  let current = null;
  for (const raw of block[1].split("\n")) {
    const line = raw.trim();
    if (line === "") continue;
    const head = raw.match(/^\s*([A-Za-z]+:?)(?:\s{2,}(.*)|\s*)$/);
    if (head && known.has(nameOf(head[1]))) {
      current = canonical(nameOf(head[1]));
      out[current] = (head[2] || "").trim();
      continue;
    }
    if (current === null) continue;
    if (out[current] === "") {
      out[current] = line.replace(/^\([^)]*\)\s*/, "");
    } else if (!line.startsWith("(") && !out[current].endsWith("?")) {
      out[current] += " " + line;
    }
  }
  return out;
}

const QUESTIONS = questions(keywordsMd);
for (const s of surfaces) {
  const name = canonical(nameOf(s));
  if (name === "and") continue;
  if (!QUESTIONS[name]) throw new Error(`keywords.md: no question found for "${s}"`);
}
const questionFor = (surface) =>
  nameOf(surface) === "and" ? AND_PLACEHOLDER : QUESTIONS[canonical(nameOf(surface))];

// ---------------------------------------------------------------------------
// Layout, measured from what writer.js renders rather than restated here.

const PROBE = "PROBE";
const render = (keyword, text) =>
  renderStory([{ keyword, predicate: [{ text }] }]).split("\n");
const COLUMN = render("story", PROBE)[0].indexOf(PROBE);
const NOTES_INDENT = render("notes", PROBE)[1].search(/\S/);
const indentOf = (name) => render(canonical(name), PROBE)[0].search(/\S/);

// A clause as a trader writes it: the keyword at its indent, the predicate at
// the column. Footer keywords stand alone with their text on the line under.
function clause(surface, text) {
  const name = nameOf(surface);
  if (footer.has(name)) {
    return `${surface}\n${" ".repeat(NOTES_INDENT)}${text}`;
  }
  return (" ".repeat(indentOf(name)) + surface).padEnd(COLUMN) + text;
}

// The footer keywords are written the way writer.js writes them, colon and all.
const writtenFooter = (name) =>
  render(name, PROBE)[0] === "" ? render(name, PROBE)[1] : render(name, PROBE)[0];

// The keyword forms that get a clipping or snippet: every non-footer form, and
// the footer keywords as writer.js spells them.
const templated = surfaces.filter((s) => !footer.has(nameOf(s)))
  .concat([...new Set(SETS.footer.map(nameOf).map(canonical))].map(writtenFooter));

// The skeleton: the mandatory clauses in canonical order, then Notes.
function skeleton(wrap) {
  let n = 0;
  const ordered = mandatory.slice()
    .sort((a, b) => CANONICAL_ORDER.indexOf(canonical(a)) - CANONICAL_ORDER.indexOf(canonical(b)));
  const clauses = ordered.map((k) => ({
    keyword: canonical(k), predicate: [{ text: wrap(QUESTIONS[canonical(k)], ++n) }]
  }));
  clauses.push({ keyword: "notes", predicate: [{ text: wrap(QUESTIONS.notes, ++n) }] });
  return renderStory(clauses);
}

// ---------------------------------------------------------------------------
// Regex alternations, longest form first so a colon or plural is never left
// behind by a shorter alternative.

const byLength = surfaces.slice().sort((a, b) => b.length - a.length || a.localeCompare(b));
const pcreAlternation = (list) => list.map((s) => s.replace(/ /g, "[ ]+")).join("|");
const pythonAlternation = (list) => list.map((s) => s.replace(/ /g, "\\s+")).join("|");

function wrapAlternation(alt, indent) {
  const out = [];
  let line = "";
  for (const part of alt.split("|")) {
    if (line && (line + "|" + part).length > 72) {
      out.push(indent + line + "|");
      line = part;
    } else {
      line = line ? line + "|" + part : part;
    }
  }
  out.push(indent + line);
  return out.join("\n");
}

const notesForms = byLength.filter((s) => canonical(nameOf(s)) === "notes");
const otherForms = byLength.filter((s) => canonical(nameOf(s)) !== "notes");

const KEYWORD_PATTERN = `(?ix)
^[ ]{0,10}
(?:
${wrapAlternation(pcreAlternation(byLength), "  ")}
)
(?=[ ]|$)`;

// Each clause is a function: its keyword line names it, and the fold takes in
// the continuation, comment and blank lines under it. Notes takes everything
// to the end of the file, as the DSL reads it.
const FUNCTION_PATTERN = `(?xi)
(?P<function>
  ^[ ]{0,10}
  (?P<function_name>
    (?:
      (?P<notes>${pcreAlternation(notesForms)})
      |
${wrapAlternation(pcreAlternation(otherForms), "      ")}
    )
    (?=[ ]|$)[^\\r\\n]*?
  )[ ]*$
  (?(notes)
    (?s:.*)
  |
    (?: \\r?\\n (?: [ ]{11,}[^\\r\\n]* | [ ]*\\#[^\\r\\n]* | [ ]*(?=\\r?\\n|\\z) ) )*
  )
)`;

// ---------------------------------------------------------------------------
// Writers

const written = [];
function write(path, text, mode) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
  if (mode) chmodSync(path, mode);
  written.push(path);
}

// Replaces one CDATA pattern in the language module, leaving the rest as it is.
function replacePattern(plist, key, pattern) {
  const re = new RegExp(`(<key>${key}</key>\\s*<string><!\\[CDATA\\[)[\\s\\S]*?(\\]\\]></string>)`);
  if (!re.test(plist)) throw new Error(`TradeStories.plist: "${key}" not found`);
  return plist.replace(re, (m, open, close) => `${open}${pattern}\n${close}`);
}

function bbeditClippings() {
  const keep = new Set();
  for (const s of templated) {
    write(join(CLIPPINGS, s), clause(s, `<#${questionFor(s)}#>`));
    keep.add(s);
  }
  write(join(CLIPPINGS, SKELETON), skeleton((q) => `<#${q}#>`));
  keep.add(SKELETON);
  for (const stale of readdirSync(CLIPPINGS).filter((f) => !keep.has(f))) {
    unlinkSync(join(CLIPPINGS, stale));
  }
}

function bbeditModule() {
  let plist = readFileSync(PLIST, "utf8");
  plist = replacePattern(plist, "Keyword Pattern", KEYWORD_PATTERN);
  plist = replacePattern(plist, "Function Pattern", FUNCTION_PATTERN);
  write(PLIST, plist);
}

function bbeditFilter() {
  const words = Object.keys(REVERSIBLE);
  const table = words.map((w) => `${w} => "${REVERSIBLE[w]}"`).join(", ");
  write(FILTER, `#!/usr/bin/perl
# BBEdit text filter: flips every reversible token in the selection, or in the
# whole document when nothing is selected, keeping each word's case.
# Generated by extras/editors/build.js from dsl/src/reversal.js.
use strict;
use warnings;

my %flip = (${table});
my $token = qr/\\[(${words.join("|")})\\]/i;

sub shape {
    my ($word, $to) = @_;
    return uc $to if $word eq uc $word;
    return ucfirst $to if substr($word, 0, 1) eq uc substr($word, 0, 1);
    return $to;
}

while (my $line = <STDIN>) {
    $line =~ s/$token/"[" . shape($1, $flip{lc $1}) . "]"/ge;
    print $line;
}
`, 0o755);
}

const xml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const field = (text, n) => "${" + n + ":" + text.replace(/[\\$}]/g, "\\$&") + "}";
const trigger = (s) => nameOf(s).replace(/[ :]/g, "");

function snippet(content, tabTrigger, description) {
  return `<snippet>
  <content><![CDATA[${content}]]></content>
  <tabTrigger>${tabTrigger}</tabTrigger>
  <scope>source.trade</scope>
  <description>${xml(description)}</description>
</snippet>
`;
}

function sublimeSnippets() {
  const keep = new Set();
  for (const s of templated) {
    const file = `${s.replace(/:$/, "")}.sublime-snippet`;
    write(join(SNIPPETS, file), snippet(clause(s, field(questionFor(s), 1)), trigger(s), questionFor(s)));
    keep.add(file);
  }
  const file = `${SKELETON}.sublime-snippet`;
  write(join(SNIPPETS, file), snippet(skeleton(field), "newstory", "A new Trade Story: the mandatory clauses and Notes"));
  keep.add(file);
  for (const stale of readdirSync(SNIPPETS).filter((f) => !keep.has(f))) {
    unlinkSync(join(SNIPPETS, stale));
  }
}

function sublimeCompletions() {
  const entries = surfaces.map((s) => ({
    trigger: s, contents: s, kind: "keyword", details: questionFor(s)
  }));
  write(COMPLETIONS, JSON.stringify({ scope: "source.trade", completions: entries }, null, 2) + "\n");
}

// The plugin's data: the question by keyword form, the mandatory keywords, a
// label for each, the alias table, and the alternation its patterns build on.
function sublimePlugin() {
  const py = (v) => JSON.stringify(v);
  const dict = (obj) =>
    "{\n" + Object.entries(obj).map(([k, v]) => `    ${py(k)}: ${py(v)},`).join("\n") + "\n}";
  const questionByForm = {};
  for (const s of surfaces) {
    if (nameOf(s) === "and") continue;
    questionByForm[nameOf(s)] = questionFor(s);
  }
  const labels = {};
  for (const s of surfaces) {
    const name = nameOf(s);
    if (!(name in labels)) labels[name] = s;
  }
  const block = [
    "# >>> generated by extras/editors/build.js from dsl/ - edit dsl/ and rebuild, not this",
    `QUESTIONS = ${dict(questionByForm)}`,
    `MANDATORY = ${py(mandatory)}`,
    `LABELS = ${dict(labels)}`,
    `ALIASES = ${dict(ALIAS)}`,
    `KEYWORDS = r"${pythonAlternation(byLength)}"`,
    "# <<< generated"
  ].join("\n");
  const source = readFileSync(PLUGIN, "utf8");
  const re = /# >>> generated[^\n]*\n[\s\S]*?# <<< generated/;
  if (!re.test(source)) throw new Error("trade-stories-sublime-plugin.py: generated markers not found");
  write(PLUGIN, source.replace(re, block));
}

bbeditClippings();
bbeditModule();
bbeditFilter();
sublimeSnippets();
sublimeCompletions();
sublimePlugin();

for (const path of written) console.log(path.slice(HERE.length + 1));
