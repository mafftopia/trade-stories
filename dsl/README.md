# Trade Stories DSL

A Trade Story is a trade setup written as a short list of keyword clauses —
mostly natural language, just formal enough for an AI agent to parse and act on
without guessing.

Version 1.0.

## Files

| File | For |
|------|-----|
| `keywords.md` | The question each keyword puts to the trader |
| `syntax-rules.md` | How a story is structured: the keywords, indentation, stacking, ordering |
| `grammar.peggy` | The grammar those rules compile to, generating `src/parser.js` |
| `domain-rules.md` | The rules: terms, clauses, what makes a story unusable, defaults, timeframes |
| `lint-rules.md` | Style and trade-design warnings decided by the finished story |
| `lint-rules-interview.md` | The warnings a trader can be asked about while describing the setup |
| `src/parser.js` | Generated from the grammar |
| `src/verify.js` | Every check that can be made mechanically |
| `src/defaults.js` | Reads `defaults.trade` and merges it into a story |
| `src/writer.js` | Renders clauses as a story file, or as the merged working copy |

Start with `syntax-rules.md` and `domain-rules.md`, and see `stories/` for worked
stories. Run the test suite with `npm test`.

`src/parser.js` is generated from `grammar.peggy` and committed, so nothing here
needs building. Editing the grammar means regenerating it:

```
npx peggy@5.1.0 --format es -o dsl/src/parser.js dsl/grammar.peggy
```
