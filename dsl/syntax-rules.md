# Trade Stories - Syntax Rules

Each line that starts with a recognised keyword (not counting whitespace) followed by text is a clause.

The text to the right of a keyword is a predicate.

Keywords are case insensitive.

## Keyword sets

Keywords are grouped into the following sets; the sets must appear in the order listed here. With the exception of `And`, each keyword must stay within its own set:

### Header keywords

- `Story`
- `Trading`
- `Source`/`Sources`

### Trade Setup keywords

- `Given`
- `When`
- `Then`
- `With`
- `Except`
- `Or except`

### Trade Management keywords (once the position is open)

- `Until`/`Or until`
- `Taking`
- `SL`
- `Unless`/`Or unless`

### Footer keywords

- `Reversed`/`Reversed:`/`Reversal`/`Reversal:`
- `Notes`/`Notes:`


## Syntax rules

Everything after `Notes` is “free text” and not parsed. (Suggest light grey for `Notes` text)

Keywords can be indented by up to 10 spaces.

Tab characters not allowed; spaces only. Also, only “normal” ASCII-style spaces; no weird UTF-8 characters that are rendered as space-like.

No more than one clause per line.

Continuation blocks: each predicate can be multi-line - this makes it a “block” predicate (or block clause). The continuation lines must all be positioned at column >= 12 with only whitespace to the left.

`Reversed` opens the Reversed section: every clause after it, up to `Notes` or the end of the file, belongs to it. `Reversed` is alone on its line, with nothing to its right. Inside the section every rule here applies except Mandatory keywords — clauses stack and order as they do in a story, and any may be left out.

Reversible tokens only appear in predicates, and are case insensitive. The full list of recognised reversible tokens (including the square brackets) is:

- `[BUY]`
- `[SELL]`
- `[above]`
- `[below]`

Any other bracketed text is ordinary predicate text.

A line starting with # (not counting whitespace) is a single-line comment and not parsed.

### Mandatory keywords

At least one of each of the following must be present:

- `Story`
- `Trading`
- `Given`
- `When`
- `Then`
- `With`
- `SL`
- `Until`
- `Taking`

### Once-only keywords

Keywords that aren't AND-stackable or OR-stackable can only appear once.

### AND-stackable clauses

The following keywords can be stacked - that is, repeated together in a group or “stack” with a different predicate each; they count as an AND stack, i.e. all predicates in the stack must be true for the overall condition to be true.
For the follow-up keywords in a stack, `And` can optionally be used in place of the keyword

The following keywords are AND-stackable:

- `Source`
- `Given`
- `When`
- `Then`

### OR-stackable clauses

The following keywords can be stacked; each clause is essentially independent and so this counts as an OR stack, i.e. only one predicate in the stack need be true - its action is taken independently of the other clauses in the stack.

The following keywords are OR-stackable:

- `Except`/`Or except`
- (`Until`/`Or until`) and `Taking` - taken as a pair. There can be multiple OR-stacked pairs.
- `Unless`/`Or unless`

### Keyword ordering

Where the listed keywords are stackable, the keyword listed here means the full stack. Stacks can’t be split, i.e. there can’t be separate `Given` stacks either side of some other keyword.

Not counting whitespace or comment lines:

- `Story` must always be the first keyword
- `Trading` and `Source` are always after `Story`
- `Given` is always the first of the Trade Setup keywords
- `Then` is always after `When`
- `With` is always after `Then`
- `Until`/`Or until` is always after `With`
- Each `Taking` is always immediately after its `Until`/`Or until`
- Any `Or until`s are always after the first `Until`
- Any `Or except`s are always after the first `Except`
- Any `Or unless`es are always after the first `Unless`
- `Reversed` must be the final keyword not counting `Notes`
- `Notes` must be the final keyword

Provided they’re not splitting up an AND stack or OR stack, or breaking the keyword ordering rules:

- Trade Setup keywords may appear between, before or after any other Trade Setup keywords
- Trade Management keywords may appear between, before or after any other Trade Management keywords
