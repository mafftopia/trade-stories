# Trade Stories — DSL rules

The domain vocabulary, what each part of a story means, and what makes a story
valid.

The scope here is platform-neutral, but where a naming convention is needed
we've borrowed and adapted from TradingView/Pine Script rather than invent a
new scheme.

## Terms

`syntax-rules.md` defines keyword, predicate, clause and block.

- **Rule** — every clause but `Notes`. Rules are what an agent acts on.
- **Complement** — `Taking` completes the `Until` or `Or Until` it belongs to.
  The two together are a **complement pair**, and a keyword that takes one is
  **complemented**.

A predicate may state a detail belonging to the platform the story will run on
rather than to the DSL — a trading fee, the starting capital. The DSL neither
defines nor disallows these. Whatever maps a story onto a platform should watch
for them and let them override its own defaults and settings.


## Clauses

All clauses are defined in `syntax-rules.md`, and `keywords.md` gives the question each keyword asks to the trader.

Some domain-level details for each clause:

`Story` is the story's name, usually at least similar to the filename. The story name has no execution meaning of its own.

`SL` defines the trade's stop loss - a specific price, an offset from entry, a loss stated in P&L or ROI, or some other condition that triggers an immediate exit before the target is reached.

`Notes` - not a Rule. Never act on it; use it for context when a Rule is ambiguous.

`Source` is optional and names the indicators, chart patterns and plotted series
a setup reads — including a series plotted from a built-in library, such as
`ta.ema()`.

`When` - the entry trigger. If there are several `When`/`And` clauses stacked, all of the conditions in the stack must be true. There is no alternative "or" entry trigger — a second way into the trade belongs in its own story.

`Taking` counts in shares of the position as opened. Each complemented exit is
self-contained and accounts for the whole position on its own; shares are never
summed across exits.


## What makes a story unusable

This section defines every error a story can carry beyond its structure.

**Every Rule must resolve to something actionable** — a condition that can be
tested, a price, a size, an action. One that cannot is an error, whichever
clause it is and whether or not it was required.

The test is whether the Rule can become code without a value being chosen that
is the trader's to choose. If it cannot, it is an error, never a lint warning.
Lint is for a Rule that **can** be coded, where another reader might reasonably
have coded it differently. Nothing that would stop the code being written is
left to lint.

A clause that fails that test never reaches the second one. For a clause that
codes cleanly: would the strategy never work properly, or only sometimes? Never
is an error. Sometimes is lint. Vague is not the same as clean — a clause that
needs a threshold invented before it becomes code has already failed the first
test, and does not get demoted to a warning for being merely imprecise.

A clause marked undecided is an error, whatever else it holds. `TBD`, `to be
confirmed`, `not sure yet` and their like resolve to nothing, so `Trading
BTC/USD, timeframe TBD` fails on the timeframe though the pair is clear.

A story that contradicts itself is an error — a direction its exits cannot
satisfy, an `Except` that cancels its own `When`.

A condition that can never be met is the same error: an indicator asked to leave
its own range, a level price cannot reach. A Rule that cannot fire makes the
story unrunnable, not weak.

`With` must say both an amount and what the amount is *of*. "500 USD of
position" and "2% of equity" are clear. "margin 500 USD" is not, because margin
implies leverage and the position could be any size. Neither is "equity 500",
which is a number with no unit.

`Taking` that does not close everything at once must say what becomes of the
rest — a trailing stop, further tranches. An unaccounted remainder is an error.

`SL` as a bare P&L percentage is an error: margin and notional differ by the
leverage, so the stop price is indeterminate rather than merely debatable. ROI
conventionally means return on margin, so that resolves.

A `Source` clause must name only what the story uses. A source listed there but
appearing nowhere else in the story is an error — the list has to match the
setup. The converse is not an error: a source the story uses need not be listed
in a `Source` clause.

## What might APPEAR to make a story unusable but is actually OK

A clause asking for something of the chart rather than of the market — an
indicator being present, say — is not unusable. It is satisfied before the
strategy runs rather than by it, so the strategy carries no test for it and none
is missing.

Whether a setup is any good is not a question the DSL answers.


## Defaults

`stories/.settings/defaults.trade` supplies any clauses not included in a story
file, so a setting that never varies need not be repeated in every file. It uses
the same style and format as a story. Clauses needn't appear in the order a normal
trade story would require, but stacked clauses and complement pairs must be kept
together, unseparated:

```
SL          3% of start price
            moved to entry once 2% in profit
```

Any keyword may have a default, on its own or as an AND or OR stack, and a block
predicate is as valid here as in a story. `And` counts only as the follow-up in a
stack, never on its own. `Notes` is a special case: its lines are always added at
the end, and where the story has `Notes` of its own they are appended to it rather
than starting a second `Notes`.

The story always wins — a default fills a keyword the story does not use, or uses
with no text. How each kind merges:

| Default | Merges as |
|---------|-----------|
| A clause, or an AND stack | Used where the story does not use that keyword at all |
| A stack alternate — `Or until`, `Or except`, `Or unless` | Always added to the end of that stack, however many the story already has |
| A complement pair | Used only where the story closes no complemented clause of its own. More than one, the first is used |
| A complement on its own | Completes every clause the story leaves open. More than one, the first is used |

Checks run against the merged result, so a required clause supplied by a default
counts as present.

## Timeframes

| Unit    | Form | Examples |
|---------|------|----------|
| Seconds | `S`, optionally with an interval | `S`, `30S` |
| Minutes | bare interval, or interval + `m` | `15`, `45`, `15m` |
| Hours   | interval + `H`, or the interval in minutes | `4H`, `240` |
| Days    | `D`, optionally with an interval | `D`, `1D`, `3D` |
| Weeks   | `W`, optionally with an interval | `W`, `1W`, `2W` |
| Months  | `M`, optionally with an interval | `M`, `3M`, `12M` |

`m` is minutes and `M` is months — the DSL's one case-sensitive point.

A timeframe value without a unit is minutes (`m`) by default. For clarity,
anyone writing should include the `m`.

The canonical forms in full:

```
^(?:\d*[SsDdWw]|\d*M|\d+[Hh]|\d+m|[1-9]\d*)$
```

`1hr`, `1h`, `1H`, `1 hour`, `one hr`, `one-hr`, `hourly`, `4hr`, `daily` and
`weekly` all appear in stories and are valid.
