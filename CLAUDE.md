# Claude instructions

Trade Stories: a semi-prescriptive DSL for trade setups, and the checks that
find errors in them. Mostly natural language, formal enough for an agent to
parse and act on.

Writing and checking stories needs Node and nothing else.

## Opening a session

When the trader's first message does not name a skill or a story, tell them what
is here before answering: writing trade stories, and checking them for errors
and for style. Point at `/write-story` first, and `/verify-story` after that.
Two or three lines, once per session, and never once they have asked for
something specific.

## The skills

| Skill | What it does |
|-------|--------------|
| `/write-story` | Asks a trader through a setup and writes the story |
| `/verify-story` | Structural and trade-setup errors |
| `/lint-story` | Style and trade-design warnings |

## Where things are

| Path | What |
|------|------|
| `dsl/` | The DSL: its rules, its worked examples and its checks. `dsl/README.md` says what each file is for |
| `.claude/story-skills.md` | Rules shared by every story skill |
| `.claude/reading-stories.md` | How to read a story and report on one, against the rules in `dsl/` |
| `stories/` | A shared library of trade stories, in subfolders by subject |
| `stories/your-stories/` | The trader's own stories. Gitignored |

`npm test` runs the DSL test suite.

**This project has no dependencies.** `dsl/src/parser.js` is generated from
`dsl/grammar.peggy` and committed, so nothing needs installing or building —
Node alone runs everything here. Changing the grammar is the one thing that
needs a tool, and it is not declared here:

```
npx peggy@5.1.0 --format es -o dsl/src/parser.js dsl/grammar.peggy
```
