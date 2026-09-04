// Trade Stories DSL v1.0 — structural grammar
//
// Turns a story into a clause list, each a keyword and a predicate. It
// recognises clauses, attaches continuation lines, and treats everything after
// Notes as opaque. Clause order, cardinality and required clauses are checked
// mechanically against this output, which gives better errors than a parse
// failure would.
//
// A predicate is never interpreted here. See domain-rules.md.
//
// A clause keyword is indented by up to 10 spaces; a line indented further is
// continuation text of the clause above it. See syntax-rules.md.
//
// Regenerate src/parser.js after any edit here:
//   npx peggy@5.1.0 --format es -o dsl/src/parser.js dsl/grammar.peggy
//
// Tabs are rejected before parsing, so no rule below admits one.

{{
  const KEYWORDS = [
    "story", "trading", "source", "sources", "given", "when", "and",
    "except", "then", "with", "until", "or until", "taking", "sl",
    "unless", "or unless", "or except"
  ];

  // Source and Sources are one keyword, the plural reading naturally with a
  // list. Everything downstream sees "source".
  function normHead(name) {
    const n = name.toLowerCase();
    return n === "sources" ? "source" : n;
  }

  // A clause is a keyword and a predicate. The predicate is a line per entry:
  // the keyword's own line first, then any continuation under it. Nothing
  // distinguishes the first from the rest.
  function textLine(text, line) {
    return {
      text: text,
      line: line,
      opensWithKeyword: KEYWORDS.some(function (k) {
        return new RegExp("^" + k.replace(" ", "\\s+") + "\\b", "i").test(text);
      })
    };
  }
}}

Document
  = Skip* clauses:Clause* notes:NotesSection? {
      return { clauses, notes };
    }

Clause
  = HeadClause
  / BodyClause

// Source stacks by repeating or by And.
HeadClause
  = ind:Indent kw:HeadKeyword text:InlineText? NL
    conts:(Skip* c:ContLine { return textLine(c.text, c.line); })*
    Skip*
    {
      return {
        keyword: kw.name,
        raw: kw.raw,
        column: ind.length,
        predicate: [textLine(text === null ? "" : text.trim(), kw.line)].concat(conts)
      };
    }

BodyClause
  = ind:Indent kw:BodyKeyword text:InlineText? NL
    conts:(Skip* c:ContLine { return textLine(c.text, c.line); })*
    Skip*
    {
      return {
        keyword: kw.name,
        raw: kw.raw,
        column: ind.length,
        predicate: [textLine(text === null ? "" : text.trim(), kw.line)].concat(conts)
      };
    }

// A continuation carries any text at all, including a line opening with a
// keyword. Indentation alone decides, so `and price is above the 200 EMA`
// indented past the keyword column under a Given is continuation text rather
// than an And clause. The column is not carried past the clause that claims it.
ContLine
  = ind:ContIndent text:$[^\r\n]+ NL {
      return { line: location().start.line, column: ind.length, text: text.trim() };
    }

// Notes is last and stands apart. Everything after it is opaque. It may be
// written Notes or Notes:.
NotesSection
  = ind:Indent kw:NotesKeyword rest:$(.*) {
      return {
        column: ind.length,
        raw: kw,
        predicate: [textLine(rest.replace(/^\n/, ""), location().start.line)]
      };
    }

// Notes: is a synonym for Notes, the one place a colon closes a keyword.
NotesKeyword
  = name:$("notes"i) ":" SP* { return name + ":"; }
  / name:$("notes"i) KeywordSep { return name; }

HeadKeyword
  = name:$("story"i / "trading"i / "sources"i / "source"i) KeywordSep {
      return { name: normHead(name), raw: name, line: location().start.line };
    }

// A two-word keyword may be written with any run of spaces between the words;
// the name it returns always has one.
BodyKeyword
  = name:BodyKeywordWord KeywordSep {
      return {
        name: name.toLowerCase().replace(/\s+/g, " "),
        raw: name,
        line: location().start.line
      };
    }

BodyKeywordWord
  = $( "given"i / "when"i / "and"i / "except"i / ("or"i SP+ "except"i)
     / "then"i / "with"i
     / "until"i / ("or"i SP+ "until"i) / "taking"i / "sl"i
     / "unless"i / ("or"i SP+ "unless"i) )

// A keyword must be followed by a space or the end of the line. This is what
// makes `Taking-`, `Taking;`, `takingall`, `taking100%` and `Taking:` errors
// rather than a keyword with odd text after it.
KeywordSep
  = SP+
  / &NL
  / !.

InlineText
  = $[^\r\n]+

// A clause keyword takes up to 10 spaces of indent; 11 or more makes the line
// continuation text of the clause above it.
Indent
  = $(SP|0..10|)

ContIndent
  = $(SP|11..|)

// Anything carrying no meaning: an empty line, or a comment. A comment runs
// from a # to the end of its line, at any indentation, and may sit anywhere a
// blank line may — including inside a block, between continuation lines. In
// Markdown files, use # as a heading to separate areas of the story.
Skip
  = Blank
  / Comment

Blank
  = SP* NL

Comment
  = SP* "#" [^\r\n]* NL

NL
  = "\r\n" / "\n"

SP
  = " "
