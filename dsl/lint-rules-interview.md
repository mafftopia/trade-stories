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

**When** One story covers both a long and a short in one set of clauses — `Then`
naming both directions, "respectively", or any clause branching on direction.
The `Reversed` section is where the other direction is written.

**Warn** This story trades both directions. Backtest results will blend two
different setups.

**Because** An uptrending sample flatters the long side and punishes the short,
so the numbers end up describing the market rather than the setup. Put the other
direction under `Reversed`, or in a story of its own.

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

### opening-stop-beyond-price

**When** The opening stop isn't an offset from the entry price (a fixed price,
an indicator's value, a swing low), and the story's conditions let it sit at
the entry price or beyond it: above the entry for a long, below it for a short.
Read the `Given`, `When` and every other condition together to decide where it
can sit at entry. A stop at a fixed offset on the losing side of the entry gets
no warning, and neither does a level the conditions keep on the losing side. A
stop the story puts beyond the price on every trade is an error, not this.

**Warn** `<clause>` can put the stop beyond the entry price, so the trade is
stopped out as soon as it opens. Add a fallback stop for when the level is at
or beyond the entry price.

**Because** The backtest counts those trades and their fees among the setup's
results, though the setup never held them.

### moved-stop-beyond-price

**When** The story moves the stop once a condition is met, and that condition
doesn't make sure the price is already further into profit than the new stop
when it moves. `once in profit, move SL to 2% above entry` warns, because a
long 1% in profit has its stop moved above the price. `once price is 3% above
entry, move SL to 2% above entry` doesn't, and neither does a move to entry
once in profit. A move the story puts beyond the price every time it's made is
an error, not this.

**Warn** `<clause>` can move the stop beyond the price, so the trade is stopped
out as soon as the stop moves. Make the move only once the price is further
into profit than the new stop.

**Because** A move meant to protect a winner ends it instead, at whatever
profit it had.
