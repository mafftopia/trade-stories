# The answers log

`.working/stories/<story filename stem>.answers.md` holds what the trader said
while `/write-story` interviewed them. `write-story` writes it; `story-writer`
composes the story from it; `new-story-reviewer` checks the story against it.

Each answer goes under the keyword it answers, verbatim, in the trader's own
words, with the question that was put to them on an `**Asked:**` line above it.
That line is the skill's; every other line under a keyword is the trader's.

```
## Given
**Asked:** What must already be true for the trade to be considered?
the market is trending
```

Take the question and the answer together. They only make sense when paired.
Use the pair to write a predicate that answers the clause's keyword and stands
on its own, away from the conversation that produced it.

Every value in a story must come only from this log or from
`stories/.settings/defaults.trade`, nowhere else.
