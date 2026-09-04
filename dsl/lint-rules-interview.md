# Lint rules that are also in scope when /write-story interviews the trader for a new setup.

These are the rules a trader can answer for — each one is triggered by what the
setup *does*, so it can be raised while they are still describing it. The rest
are decided by the wording and layout of the finished file, and are nobody's to
raise during an interview.

Each rule is one `###` heading naming its id, then **When** — what to look for,
**Warn** — the wording shown to the trader, verbatim, and **Because** — what goes
wrong if it is ignored. IDs are kebab-case and permanent: a trader's overrides
refer to them.

---

### both-directions

**When** One story covers both a long and a short. `Then` naming both
directions, "respectively", or any clause branching on direction.

**Warn** This story trades both directions. Backtest results will blend two
different setups.

**Because** An uptrending sample flatters the long side and punishes the short,
so the numbers end up describing the market rather than the setup. Split it into
one story per direction.

### chart-requirement

**When** A `Given` or `When` asks for an indicator to be on the chart
rather than stating something about the market.

**Warn** `<clause>` asks for an indicator to be present rather than for a market
condition. Its presence is arranged when the chart is set up, not tested by the
strategy, so the strategy won't check for it.

**Because** Nothing is lost, but the check won't appear in the strategy. Knowing
the requirement is met when the chart is set up is what makes leaving it out of
the strategy safe.

### inferred-value

**When** A clause that does code, but where a convention had to be applied to
get there — a bar count that could be read inclusively or exclusively, a
timeframe settled from the surrounding ones. Applies to every clause, required
or not. A clause that could not be coded without choosing a value belonging to
the trader is an error, not this.

A count carrying its own comparator states its boundary, so nothing is inferred
and nothing is warned: `more than 2 bars`, `at least 3 bars`, `under 5 bars`.
`for 2 bars` and `after 2 bars` are the ambiguous ones. Restating what the words
already say is not a warning.

A choice this project already settles is not inferred either. A threshold
crossing is read as the crossing edge unless the story plainly describes a
state, so `drops below 20` warns about nothing. This rule is for a
choice **nothing here decides**, where two readers following every rule in the
project could still land differently. Applying a convention is not the trigger;
every clause needs some convention applied, so that reading warns on everything.

**Warn** `<clause>` relies on `<what>` being read the way you meant. Another
reader could take it differently.

**Because** A convention is not a statement. Two runs can apply it differently,
so the same story can produce two strategies that behave alike in most bars and
differ where it matters.
