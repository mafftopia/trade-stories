# Trade Story lint rules

Advice, not errors. A story that trips every rule here is still valid and can become a strategy. Lint never blocks anything.

Read this file AND lint-rules-interview.md. The complete set of lint rules are contained in both files.

## Rule format

Each rule is one `###` heading naming its id, then three lines:

- **When** — what to look for. Written for a reader, not a regex.
- **Warn** — the wording shown to the trader, verbatim.
- **Because** — one line. What goes wrong if it is ignored.

IDs are kebab-case and permanent: a trader's overrides refer to them.

## Overrides

A trader may keep `stories/.settings/lint-overrides.md`, listing rule ids to
suppress, one per line, optionally followed by a story name to suppress it for
that story alone. Ids from either file go there:

```
inferred-value
timeframe-notation   EMA Trend & RVI Volatility
```

The file is gitignored, so it survives a `git pull`. Suppressed rules produce
no output at all.

---

### one-and-per-and-clause

**When** For keywords that can be "AND" stacked, it's recommended that each
clause only contains one condition. "This and that" belong in a clause each.
"This or that" is one condition.

**Warn** `<keyword>` holds conditions that must all be true. Give each a line of
its own, stacking the rest under `<stacking keyword>`.

**Because** One condition to a line is what lets the setup be read at a glance,
and lets each line map to one test in the strategy. A clause holding several has
to be taken apart again on every reading, and nothing downstream can say which
part of it fired.

### one-or-per-or-clause

**When** For keywords that can be "OR" stacked, it's recommended that each clause
only contains one condition. "This or that" belong in a clause each. "This and
that" is one condition. `Until`/`Taking` has an exception to this rule: `Until`
can list multiple "or" targets, each of which is addressed in its paired `Taking`
clause.

**Warn** `<keyword>` holds alternative conditions. Give each a line of its own,
stacking the rest under `<stacking keyword>`.

**Because** Every clause of an OR stack fires on its own, so alternatives written
into one clause cannot be told apart, and nothing downstream can say which fired.

### continuation-opens-with-keyword

**When** A continuation line begins with a DSL keyword.

**Warn** This line opens with a keyword but is indented past its clause, so it
reads as continuation text rather than a clause of its own.

**Because** It is the one place where a story does something other than it
looks. Indent it back to the other clauses to make it a clause, or reword the
opening if continuation text was meant.

### unless-before-exits

**When** An `Unless` or `Or unless` clause is positioned before an `Until`/`Taking`
pair.

**Warn** `<keyword>` is positioned before the `Until`/`Taking` pairs. The clauses
read as one sentence — hold the position until the target, unless the early exit
fires — so the early exits come last.

**Because** The keywords keep their English meaning in the order they are written,
so an `Unless` before its `Until` states an exception to a target the reader has
not reached yet.

### timeframe-notation

**When** A timeframe is written in any form other than the canonical one — `4hr`,
`1 hour`, `hourly`, `daily`, `one-hr`. The canonical forms are tabled under
**Timeframes** in `domain-rules.md`.

**Warn** `<as written>` is not the canonical timeframe form. Canonically that is
`<canonical>`.

**Because** No clause holds a timeframe in a field of its own, so every one sits
in free text and has to be inferred. Canonical forms remove the guesswork, and
an agent that guesses wrong picks the wrong chart.
