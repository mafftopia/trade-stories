<p align="center">
  <img src="trade-stories-banner.jpg" width="100%" alt="Trade Stories project banner" />
</p>

# Trade Stories

***Write your trade setups in a commonly understood format and set of conventions.***

When a setup is written as a Trade Story, you can:

* have an AI assistant or other tools check it for gaps, contradictions and ambiguity
* turn it into a strategy and backtest it on real historical data, or forward-test it on a demo account
* fine-tune it until it's a fully backtested, consistently profitable trading strategy
* share it with others, and compare versions of it
* ***trade*** it!


## What is a Trade Story?

A Trade Story is one trade setup, written as a short list of keyword clauses: mostly natural language, just formal enough for an AI or a tool to parse and act on without guessing. Here's one:

```
Story       9 EMA VWAP pullback
Trading     btc/usdt perpetuals on KuCoin, 12m
Sources     9 EMA, VWAP

  Given     price above 9 EMA (uptrend)
  And       VWAP is below the 9 EMA
  When      the price pulls back to the 9 EMA
  Then      BUY
  With      100 usdt margin, 10x leverage
  SL        at the VWAP at entry
            Move SL up to 1% profit once the position is >= 2% in profit
  Until     the price candle closes below the 9 EMA
  Taking    100% - close the position
```

Each line is a **clause**: a **keyword**, then a **predicate** in your own words. Think of the keyword as a question bundled into one word (`When` asks "what triggers entry?") and the predicate as your answer. Answer each question in turn and the setup is defined.

There are also invalidation clauses, several take-profit levels, early exits, a mirror-image (reversed) version of the trade, and defaults so you don't repeat yourself. All of it is under [The DSL](#the-dsl) below.


## Why write setups as Trade Stories?

* **Consistency** - every setup has the same shape and language, so you can compare them and come back to them
* **Thinking about the right things** - each keyword is a question a complete setup has to answer
* **Editor support** - syntax colouring, error highlighting and completions for Sublime Text and BBEdit, in `extras/editors/`
* **AI support** - an assistant that understands Trade Stories can write one with you, check it, turn it into a strategy, backtest it, and give *meaningful feedback* on it

The [introductory article](https://mafftopia.medium.com/trade-stories-4e33fda35b80) digs further into the why.


## Getting started

**With a chat AI** (Claude, ChatGPT, Gemini and the like): point it at this page and say what you want.

> Read https://github.com/mafftopia/trade-stories so you know all about Trade Stories, then help me write one.
>
> ... then check this story for me: *(paste the story)*
>
> ... then turn this story into a TradingView Pine v6 strategy that matches it 1:1: *(paste the story)*

This page is written to be enough on its own for those three jobs.

**With Claude Code** (or another coding agent): clone the repo and work inside it.

```
git clone https://github.com/mafftopia/trade-stories.git
```

[Node.js](https://nodejs.org/en/download) lets the agent run the bundled checker. [Claude Code](https://claude.com/product/claude-code) finds the skills here as soon as it's opened in the folder: `/write-story` interviews you and writes the story, `/verify-story` finds the errors that would stop it becoming a strategy, `/lint-story` warns about style and trade-design issues, and `/indicator-details` prints the notes held on an indicator. Or bring the skills into a project of your own:

```
/plugin marketplace add mafftopia/trade-stories
```

To go on from a story to a TradingView strategy, a backtest and an analysis of the results, install [Trade Story System](https://github.com/mafftopia/trade-story-system), which uses this repo as a plugin.

**By hand**: copy `stories/starter-template.trade` into `stories/your-stories/` and answer each keyword.

For help, feedback or trade-setup talk, find us on Discord at [Save With Crypto](https://savewithcrypto.org/discord), or find me (maff) at [mafftopia.com](https://mafftopia.com).


## If you're an AI assistant

This page holds what you need to write a Trade Story with a trader, check one, or turn one into a strategy. The files under [Going deeper](#going-deeper) add detail and worked examples, but nothing here depends on them: if a link won't open for you, say so and carry on from this page.

Read [The DSL](#the-dsl) through once, then the section for the job in hand. Four rules hold for every job:

1. **The story is the source of truth.** Never add a condition, a value or a default the story doesn't state, and never silently pick a reading you're unsure of. Say which reading you took and why, or ask. Offering candidate values for the trader to choose from is welcome; filling the gap yourself is not.
2. **Interpret predicates yourself.** They're free text and vary in everything but the keyword. Resolve from the surrounding story before asking: `1M` in a story whose every other timeframe is intraday means one minute.
3. **Whether the setup is any good is not your call.** Check that it's complete, consistent and codeable, and leave its merit to the trader.
4. **The reader is a trader, not an engineer.** Talk about their story in their terms, not about parsers, files or the work you did.

For anything bigger than a one-off (a library of stories, repeated checks, a backtest pipeline) ask the trader to clone the repo and work from the clone. It adds the mechanical checker (`node dsl/src/verify.js <story>`), a test suite, the defaults file and the Claude Code skills.


## The DSL

### Shape

* One clause per line: a keyword, then its predicate. Keywords are case-insensitive and must be followed by a space or the end of the line, so `Taking:`, `Taking-` and `taking100%` are not keywords. `Notes` and `Reversed` are the exceptions and may take a colon.
* A keyword may be indented by up to 10 spaces. A line indented 11 spaces or more is a **continuation** of the clause above it, which makes that a **block** predicate. By convention predicates line up in a column at 13 and continuation lines sit under them, as in the example above. A continuation line that happens to start with a keyword is still continuation text.
* Spaces only: no tabs, and no Unicode characters that render as spaces.
* A line whose first non-space character is `#` is a comment. Blank lines go anywhere.
* `And` continues the stackable clause above it.
* `Notes` ends the parsed story. Everything after it is free text, keywords included.
* A **Rule** is any clause but `Notes`. Rules are what gets acted on; `Notes` is context only.

### Keywords

The four sets below must appear in this order. Within the table, "AND" and "OR" say how a keyword stacks (see [Stacking](#stacking)).

| Set              | Keyword                | Asks the trader                                                 | Required | Stacks                   |
|------------------|------------------------|-----------------------------------------------------------------|----------|--------------------------|
| Header           | `Story`                | What are you calling this setup?                                | yes      | no                       |
| Header           | `Trading`              | What instrument/market and timeframe is this for?               | yes      | no                       |
| Header           | `Source` / `Sources`   | Which indicators, chart patterns or plotted series does it use? | no       | AND                      |
| Trade Setup      | `Given`                | What must already be true for the trade to be considered?       | yes      | AND                      |
| Trade Setup      | `When`                 | What event or signal triggers entry?                            | yes      | AND                      |
| Trade Setup      | `Except` / `Or except` | What invalidates entry even if the trigger fires?               | no       | OR                       |
| Trade Setup      | `Then`                 | What action does the trade take?                                | yes      | AND                      |
| Trade Setup      | `With`                 | What's the position size? Fixed amount or %? Any leverage?      | yes      | no                       |
| Trade Management | `SL`                   | Where's the stop-loss?                                          | yes      | no                       |
| Trade Management | `Until` / `Or until`   | What level, or set of levels, should the trade be closed at?    | yes      | OR, each with a `Taking` |
| Trade Management | `Taking`               | How much profit to take at each level? Must add up to 100%      | yes      | one per `Until`          |
| Trade Management | `Unless` / `Or unless` | What condition, arising early, exits before target?             | no       | OR                       |
| Footer           | `Reversed`             | Which clauses change for the flipped version of the trade?      | no       | opens a section          |
| Footer           | `Notes`                | What context helps a reader, without being acted on?            | no       | free text                |

What each one means, beyond the question:

* `Story` is the name. It has no execution meaning and usually matches the filename.
* `Trading` is the chart: the instrument, the exchange or market, and the timeframe.
* `Source` names what the setup reads: indicators, chart patterns, plotted series, including a series from a built-in library such as an EMA. A source listed but used nowhere draws a lint warning, not an error. The converse is fine: a source the story uses need not be listed.
* `Given` is the context that must hold for the trade to be considered at all: a regime, a trend, price relative to a level. If a keyword genuinely doesn't apply, the trader puts a meaningful catch-all such as "any market regime".
* `When` is the entry trigger. Every condition in the stack must be true. There is no "or" entry: a second way into the trade is its own story.
* `Except` blocks entry even when the trigger fires. Any one firing blocks.
* `Then` is the direction: long or short, buy or sell.
* `With` must say an amount **and what the amount is of**: "500 USD of position", "2% of equity", "100 USDT margin, 10x leverage". "margin 500 USD" on its own is not enough, because the position could be any size; neither is "equity 500", a number with no unit.
* `SL` is a price, an offset from entry, a loss in ROI (return on margin), or any condition that exits immediately before the target. A bare P&L percentage is an error: margin and notional differ by the leverage, so the stop price is indeterminate.
* `Until` and its `Taking` are a **complement pair**: one exit. `Taking` counts in shares of the position as opened, and each pair accounts for the whole position on its own; shares are never summed across pairs. A `Taking` that doesn't close everything must say what becomes of the rest (a trailing stop, further tranches).
* `Unless` exits early, before the target. Any one firing exits.
* A predicate may state a detail belonging to the platform rather than the DSL: a trading fee, the starting capital. Whatever runs the story lets it override the platform's own defaults.

### Stacking

* **AND stacks**: `Source`, `Given`, `When`, `Then`. Repeat the keyword, or write `And` for the follow-ups. Every predicate in the stack must be true.
* **OR stacks**: `Except` / `Or except`, `Unless` / `Or unless`, and `Until` / `Or until` with its `Taking`. Each clause is independent: any one being true takes its own action.
* A stack can't be split by another keyword. Everything that isn't stackable appears once.

### Order

Not counting blank and comment lines:

* `Story` first; `Trading` and `Source` after it.
* `Given` opens the Trade Setup keywords. `Then` comes after `When`, and `With` after `Then`.
* `Until` comes after `With`. Each `Taking` comes immediately after its `Until` or `Or until`, and every `Or until` after the first `Until`. Likewise `Or except` after the first `Except`, and `Or unless` after the first `Unless`.
* Otherwise the Trade Setup keywords may sit in any order among themselves, and the Trade Management keywords likewise: `Except` between `Then` and `With` is fine, and `SL` may come before or after the exit pairs.
* `Reversed` is the last keyword but `Notes`; `Notes` is last.

The whole layout, every keyword in a conventional place (`Source`, `Except`, `Or until`, `Unless`, `Reversed` and `Notes` are optional):

```
Story       ...
Trading     ...
Source      ...

  Given     ...
  And       ...
  When      ...
  And       ...
  Except    ...
  Or except ...
  Then      ...
  With      ...

  SL        ...
  Until     ...
  Taking    ...
  Or until  ...
  Taking    ...
  Unless    ...
  Or unless ...

Reversed
  ...

Notes:
  ...
```

### Reversed

A story may carry the mirror-image trade. The story above `Reversed` is the **primary**; the **reversed story** is the primary with two kinds of change applied:

* **Reversible tokens** flip. `[BUY]` ↔ `[SELL]` and `[above]` ↔ `[below]`, case-insensitive, square brackets included, anywhere in a Rule's predicate. Any other bracketed text is ordinary.
* **The `Reversed` section** replaces clauses the tokens can't express. `Reversed` (or `Reversal`, with or without a colon) stands alone on its line, and every clause after it up to `Notes` belongs to the section. Any clause may be left out. One that's present replaces the primary's clause of that keyword: a stack replaces the whole stack, and `Until`/`Taking` pairs replace all of the primary's pairs. An empty clause says nothing and the primary's stands.

A story is reversed when it has a `Reversed` clause or a token in any Rule. The reversed story takes the opposite direction, so a `Then` that reads the same in both is an error, and so is `Reversed` with nothing under it and no token in the story. Nothing under `Reversed` is filled from the defaults, so an `Until` there needs its own `Taking`. `Notes` belongs to both stories.

The example story with a reversed side, which the tokens flip and the section fills in:

```
  Given     price above 9 EMA (uptrend)
  And       VWAP is below the 9 EMA
  When      the price pulls back to the 9 EMA
  Then      [BUY]
  With      100 usdt margin, 10x leverage
  SL        at the VWAP at entry
  Until     the price candle closes [below] the 9 EMA
  Taking    100%

Reversed
  Given     price below 9 EMA (downtrend)
  And       VWAP is above the 9 EMA
```

### Defaults

`stories/.settings/defaults.trade` supplies any clause a story doesn't use, in story format, so a setting that never varies isn't repeated in every file. The story always wins: a default fills a keyword the story leaves out or leaves empty. Stacks and complement pairs are kept together, an `Or until`, `Or except` or `Or unless` default is added to the end of the story's stack, and `Notes` is appended to the story's own. Checks run against the merged result, so a required clause supplied by a default counts as present.

So a story file may lack `With`, `SL` or `Taking` and still be complete. Given a story on its own, ask whether a defaults file supplies them before calling them missing.

### Timeframes

| Unit    | Form                                        | Examples          |
|---------|---------------------------------------------|-------------------|
| Seconds | `S`, optionally with an interval            | `S`, `30S`        |
| Minutes | bare interval, or interval + `m`            | `15`, `15m`       |
| Hours   | interval + `H`, or the interval in minutes  | `4H`, `240`       |
| Days    | `D`, optionally with an interval            | `D`, `1D`, `3D`   |
| Weeks   | `W`, optionally with an interval            | `W`, `2W`         |
| Months  | `M`, optionally with an interval            | `M`, `3M`         |

`m` is minutes and `M` is months, the DSL's one case-sensitive point. These canonical forms govern what you write; a story carries whatever the trader wrote (`1hr`, `4 hour`, `hourly`, `daily` all appear and are valid), and context outranks the form when reading one.


## Writing a story

With a trader, or from a description they've given:

1. **Get the setup in their words first**, then work through the keywords in table order, asking only what's still unanswered. Ask with the keyword's own question, and offer to explain or give an example. A long answer may cover several keywords: take it whole and cross them off.
2. **A keyword counts as answered only by an answer to its own question.** An indicator state can be context (`Given`) or the trigger (`When`); which one it is depends on what the trader means, not on which keyword you've reached. "Any market regime" is the trader's answer to give for `Given`, never one to assume.
3. **Never write a value the trader didn't give.** Offer candidates, naming the conventional one and leaving room for their own, and let them choose. "I don't know yet" is an answer: write `TBD` and say the checks will fail on it until it's filled in.
4. **An answer nothing could be coded from isn't yet an answer.** "When RVI is low" needs a number. Ask once more for the missing part, offering candidates, then take what comes.
5. **Raise the interview warnings as they come up** ([Warnings](#warnings) marks which ones), as help rather than refusal: say what it would cost this setup, offer the way round, and offer leaving it as it is. Never offer a candidate the rules would warn about.
6. **Write it to the conventions**: one condition per line, stacking the rest with `And`; the trader's intent on the clause's first line and the testable detail indented beneath it as a block; timeframes in canonical form; keywords in order; context in `Notes`, not in a Rule.
7. **One story to a name.** The filename is the name in lowercase, punctuation dropped, words joined by hyphens, `.trade` on the end, in `stories/your-stories/`.
8. **Then check it**, as the next section says.

A fix to an existing story follows the same rule as writing one: keep the trader's own line and add the mechanism beneath it. Replacing `Given market is in an uptrend` with an ADX condition outright loses *why* the Rule is there.


## Checking a story

Two passes, in order: **structure**, then **meaning**. If the structure fails, stop and report that: a meaning check on a mis-parsed story reads clauses the trader didn't write. From a clone, `node dsl/src/verify.js <story>` does the structure pass mechanically and prints its errors, the merged story, and hints.

### Errors

An error stops the story becoming a strategy. Structure:

* A required keyword missing (after the defaults are merged in).
* A keyword out of [Order](#order), a once-only keyword repeated, a stack split by another keyword, a `Taking` not immediately after its `Until`.
* A tab, or a keyword not followed by a space (`Taking:`, `taking100%`).
* `Reversed` with nothing under it and no reversible token; a reversed story whose `Then` reads the same as the primary's.

Meaning, with two tests applied in order to every Rule:

1. **Can it become code without choosing a value that's the trader's to choose?** If not, error. "When RVI is low" fails here; vague is not the same as clean, and an imprecise clause is never demoted to a warning.
2. **If it codes, would the strategy never work properly, or only sometimes?** Never is an error; sometimes is a warning.

Which gives these:

* A clause left undecided: `TBD`, `to be confirmed`, `not sure yet`. `Trading BTC/USD, timeframe TBD` fails on the timeframe though the pair is clear.
* A story that contradicts itself: a direction its exits can't satisfy, an `Except` that cancels its own `When`.
* A condition that can never be met: an indicator asked to leave its own range, a level price can't reach.
* `With` without both an amount and what it's of; `SL` as a bare P&L percentage; a `Taking` that leaves a remainder unaccounted for; a `Source` entry the story never uses.

Not an error: a clause asking for something of the chart rather than the market, such as an indicator being present. That's satisfied when the chart is set up, so the strategy carries no test for it and none is missing.

**Reporting.** For each error give the line number in the trader's own file, the offending line alone, and what in it couldn't be resolved; where the story contradicts itself, name both clauses. Quote keyword names (`"Until"` clause). A clause that came from the defaults has no line number: say it came from the defaults. Never speculate about lines the check didn't reach. Then offer fixes as options the trader chooses from, each keeping their line and adding the detail beneath it, and make no edit until they've seen the exact change.

### Warnings

Advice, never errors: a story that trips every one is still valid. Each has a permanent id, and a trader may suppress one in `stories/.settings/lint-overrides.md`, one id per line, optionally followed by a story name to suppress it for that story alone.

Decided by the finished story:

* `one-and-per-and-clause`: an AND-stacked clause holding conditions that must all be true. Give each its own line. "This or that" is one condition.
* `one-or-per-or-clause`: an OR-stacked clause holding alternatives. Give each its own line. `Until` may list several targets where its `Taking` addresses each.
* `continuation-opens-with-keyword`: a continuation line that starts with a keyword, so it reads as continuation text rather than a clause.
* `unless-before-exits`: an `Unless` placed before the `Until`/`Taking` pairs. The clauses read as one sentence, so the early exits come last.
* `timeframe-notation`: a timeframe in other than the canonical form. Say what the canonical form is.

Also raised while a trader describes the setup, since each is triggered by what the setup does:

* `both-directions`: one story trading long and short in one set of clauses (`Then` naming both, "respectively", any clause branching on direction). Backtest results would blend two setups. The other direction belongs under `Reversed` or in its own story.
* `chart-requirement`: a `Given` or `When` asking for an indicator to be on the chart rather than stating a market condition. Nothing is lost, but the strategy won't check it.
* `inferred-value`: a clause that codes, but only after a convention was applied that nothing settles, so another reader could take it differently: `for 2 bars` or `after 2 bars` (inclusive or exclusive?), a timeframe settled from the surrounding ones. Not this: a count carrying its own comparator (`more than 2 bars`), or a threshold crossing read as the crossing edge (`drops below 20`), which is settled.

Report a warning with its id, the line and its text where one line is responsible, and the plain-words reason. Asked to elaborate, apply the reason to *this* story: name the clauses, say what it would cost this setup, and what to change.


## Turning a story into a strategy

**1:1 means the strategy does what the story says and nothing more.** Every Rule becomes code; `Notes` doesn't. No extra filter, no safety stop, no default the story didn't state. Yours to choose: an indicator's conventional periods, exposed as inputs. Not yours: entry levels, targets, stops, sizes, session windows. Missing one of those, stop and say what's missing rather than inventing it; it's a defect in the story, and the [checks](#checking-a-story) are where it gets fixed.

The keyword meanings above say what each clause does. In code:

* `Given` and `When` together are the entry condition, every clause in both stacks true at once. `Except`: any one true, no entry. `Unless`: any one true, close what's open.
* Each `Until`/`Taking` pair is one exit. `Taking` is a share of the position as opened, so check that a later tranche isn't taken against what an earlier exit left.
* A series plotted by another indicator can't be referenced by name from a strategy. It becomes an input the trader connects by hand once the strategy is on the chart; name each one in your report.
* `Reversed` is a second, mirrored strategy: the primary with the section's clauses swapped in and every token flipped.
* A clause asking for an indicator to be present isn't coded; it's met when the chart is set up. A platform detail stated in a predicate (a fee, the starting capital) overrides the platform's default.

Report what the trader has to act on: the inputs to connect, and anything the story says that the platform can't express, with the nearest alternative named but never written into the story.

### On TradingView (Pine v6)

* Every backtest setting (initial capital, order size and its type, commission, pyramiding, margin) is an argument of `strategy()`, and each is a constant, so none can come from an `input`.
* Leverage is `margin_long` and `margin_short`: the percentage of the position covered by the trader's own funds, 100 divided by the leverage, so 10x is 10. Write it as a float, since Pine divides two integers into an integer.
* A series from another indicator is an `input.source()`. Unconnected, it reads `close` and the strategy enters on almost every bar.
* Write the Pine you know, have the trader compile it in the Pine Editor, and fix from the errors it reports rather than looking everything up first.


## Going deeper

| File                                                                   | Holds                                                                                 |
|------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| [`dsl/keywords.md`](dsl/keywords.md)                                   | The question each keyword asks, as put to a trader                                    |
| [`dsl/syntax-rules.md`](dsl/syntax-rules.md)                           | The structure in full: keyword sets, stacking, ordering, continuation blocks          |
| [`dsl/domain-rules.md`](dsl/domain-rules.md)                           | What each clause means, every error beyond structure, defaults, reversal, timeframes  |
| [`dsl/lint-rules.md`](dsl/lint-rules.md)                               | The warnings decided by the finished story, with the wording shown to the trader      |
| [`dsl/lint-rules-interview.md`](dsl/lint-rules-interview.md)           | The warnings a trader can be asked about while describing a setup                     |
| [`dsl/grammar.peggy`](dsl/grammar.peggy)                               | The grammar the structure rules compile to                                            |
| [`stories/`](stories/)                                                 | Worked stories in subfolders by subject, and `starter-template.trade`                 |
| [`stories/.settings/defaults.trade`](stories/.settings/defaults.trade) | A defaults file, in story format                                                      |
| [`extras/indicators/`](extras/indicators/)                             | What third-party indicators mean, so a check can tell real ambiguity from settled     |
| [`extras/editors/`](extras/editors/)                                   | The Sublime Text and BBEdit packages                                                  |
| [`.claude/`](.claude/)                                                 | The Claude Code skills, their agents, and the reading and reporting rules they share  |

An assistant that can't open a relative link can try the raw form, for example `https://raw.githubusercontent.com/mafftopia/trade-stories/main/dsl/domain-rules.md`.

The repo runs on Node alone: nothing to install or build. `npm test` runs the DSL's test suite.
