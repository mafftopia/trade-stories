# Trade Stories for BBEdit

A BBEdit package for `.trade` files: a codeless language module for colouring,
and a clipping set with one clipping per keyword.

## Requirements

BBEdit 11 or later. The Verify Trade Story script also needs Node.js, and
BBEdit's command-line tools (**BBEdit → Install Command Line Tools**) for the
results window.

## Install

1. In BBEdit, choose **BBEdit → Folders → Packages**.
2. Copy `Trade Stories.bbpackage` into the folder that opens.
3. Quit and relaunch BBEdit.

Files ending in `.trade` open as Trade Stories. Any other file can be switched
to it from the language menu at the bottom of the window.

## What you get

**Colouring**

- Keywords, coloured only where a story reads them as keywords: at the start of
  a line, indented by up to ten spaces, and followed by a space or the end of the
  line. An `and`, `when` or `with` inside a predicate stays plain.
- Every keyword, including `And`, the `Or …` forms, `Reversed`/`Reversal` and
  `Notes`, with or without the colon.
- The reversible tokens `[BUY]`, `[SELL]`, `[above]` and `[below]`, in the
  string colour.
- Comment lines starting with `#`.
- `Notes` and everything after it, in the comment colour.
- Numbers inside predicates.

**Editing**

- Spell-checking inside predicates; keywords are skipped.
- The function popup lists the story's clauses, and a clause whose predicate
  runs to several lines folds.
- Code completion offers the clipping names, which are the keywords.
- `#` is the comment character for Un/Comment Selection.
- **Find in Reference** on a keyword opens the Trade Stories DSL page.

**Scripts menu**

- **Verify Trade Story** runs the mechanical verify checks on the saved front
  document. Errors open in a results window, each a click from its line; a
  clean story gets a notification. The script looks for trade-stories above the
  story, or in the folder `TRADE_STORIES_DIR` names in your shell profile.

**Text Filters menu**

- **Flip Reversible Tokens** swaps `[BUY]` with `[SELL]` and `[above]` with
  `[below]` in the selection, or the whole document when nothing is selected,
  keeping each word's case.

**Clippings**

The set `Trade Stories.trade` attaches to `.trade` documents. There is one
clipping per keyword. Each inserts the clause laid out as a story is written -
head keywords at the left margin, body keywords indented two spaces, predicates
at column 12 - with the keyword's question as a placeholder:

```
  Given     <#What must already be true for the trade to be considered?#>
```

**Go → Go to Next Placeholder** selects the next placeholder to type over.

- **New Trade Story** inserts the mandatory clauses and a `Notes:` section.
- **Reversed:** inserts the keyword on its own line with a placeholder beneath
  it, since nothing may follow `Reversed` on its line.

## What it does not do

A codeless language module colours text; it does not parse it. While you type,
this package will not:

- check keyword order, stacks, or that every mandatory keyword is present
- flag tabs or non-ASCII spaces
- show a keyword's question until a clipping is inserted

Run **Verify Trade Story** from the Scripts menu, or `/verify-story`, for those
checks.

## Generated files

The clippings, the Keyword and Function patterns in the language module, and
the text filter are written by `extras/editors/build.js` from the DSL. Change
`dsl/` and rebuild rather than editing them.
