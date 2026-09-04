# Reading a Trade Story

What an agent does with a story: how to read one, and how to report on it. The
rules themselves live in `dsl/`, which describes the DSL and nothing else. Every
section here names the part of the DSL it belongs to, so a rule and what to do
about it are never more than one hop apart.

## Interpreting a clause

For **The clauses** in `dsl/domain-rules.md`.

A clause arrives as one free-text string. Interpret it yourself, and expect
variation in everything but the keyword.

## Taking a story as the trader meant it

For `dsl/domain-rules.md` throughout.

Accept what the trader meant. Resolve from surrounding context before asking.
Context outranks the canonical timeframe forms, which govern what you write
rather than what you must be given: `1M` in a story whose every other timeframe
is intraday means one minute. Say which reading you took and why.

`With` absent from the story and from `defaults.trade` leaves size to
whatever executes the story — say so, and supply none.

Never silently pick a reading you are unsure of, and never write a threshold,
session window or position size into a story or a strategy when the story does
not state it.

Offering one is different. Asked to fix a story, put the candidates to the
trader as options and let them choose. What is banned is the silent version:
filling the gap yourself and carrying on.

## Reporting an unusable clause

For **What makes a story unusable** in `dsl/domain-rules.md`.

Name the clause, and what in it could not be resolved. Where a story
contradicts itself, name both clauses.

An unclear position size is reported as `Unclear position size.`

A clause the trader left undecided needs no diagnosis: name what is undecided
and stop there.

Whether the setup is any good is not your judgement.

## Timeframes in your own output

For **Timeframes** in `dsl/domain-rules.md`.

The canonical forms govern what you write, never what you are given. Check your
own output against them, and never hold a story to them — a story carries
whatever the trader wrote. Read them all, then use the canonical form yourself.

## Putting a keyword to a trader

For `dsl/keywords.md`.

Use those questions, either directly or as the basis for further questioning,
when asking a trader for the details of their own setup.

## Reporting a hint as a warning

For **continuation-opens-with-keyword** in `dsl/lint-rules.md`.

`verify.js` reports these as hints. Report the warning whether or not the story
also has errors.

## Working copies

Not a DSL rule — where the working copy goes.

The merged story is written to `.working/stories/` as it is checked. It is
generated on every run and gitignored; edit the story, never the working copy.
It opens with a `#` comment saying as much, and carries `Notes` after the Rules,
so a skill reading only the working copy still has the context a Rule may need.
