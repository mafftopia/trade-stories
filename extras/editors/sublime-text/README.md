# Trade Stories for Sublime Text

A Sublime Text package for `.trade` files: syntax colouring with error
highlighting, ghost-text questions, a snippet per keyword, completions, a build
system that runs the mechanical verify checks, and settings for the whitespace
rules.

## Install

Link this folder into Sublime's Packages folder as `TradeStory`, then restart
Sublime. **Preferences → Browse Packages…** opens the Packages folder.

```
Linux    ln -s /full/path/to/trade-stories/extras/editors/sublime-text ~/.config/sublime-text/Packages/TradeStory
macOS    ln -s /full/path/to/trade-stories/extras/editors/sublime-text ~/Library/Application\ Support/Sublime\ Text/Packages/TradeStory
Windows  copy this folder to %APPDATA%\Sublime Text\Packages\TradeStory
```

A link keeps Sublime on the repo's current files. A copy works too.

## What you get

**Colouring**

- Keywords, predicates, the reversible tokens `[BUY]`, `[SELL]`, `[above]` and
  `[below]`, `#` comments, and everything after `Notes` greyed.
- Errors highlighted as you type: a keyword out of order, a split stack, an
  `And` with nothing to follow, `Or except` without an `Except`, an `Until`
  without its `Taking`, text after `Reversed`, a line that is not a clause, and
  tabs or non-ASCII spaces.

**Ghost text**

- An empty keyword line shows the keyword's question until you answer it.
- Under the story's last line: `Missing: …`, naming any mandatory keyword not
  yet written, allowing for the clauses `stories/.settings/defaults.trade`
  supplies.

**Writing**

- **Snippets**: type a keyword in lowercase and press Tab - `given`, `orexcept`,
  `until`, `notes` - to insert the clause laid out as a story is written, with
  its question selected to type over. `newstory` inserts the mandatory clauses
  and a `Notes:` section.
- **Completions** list the keywords, each with its question.
- **Goto Symbol** (Ctrl/Cmd+R) shows the story's title.
- **Toggle Comment** (Ctrl/Cmd+/) inserts `#`.
- Spaces only, tab width 2, a ruler at column 12 where predicates start, and
  leading and trailing whitespace drawn.

**Checking**

- **Build** (Ctrl/Cmd+B) runs the mechanical verify checks on the open story
  and lists each error with its line; click one to go there.

## Generated files

`snippets/`, `TradeStory.sublime-completions` and the block between the
`generated` markers in `trade-stories-sublime-plugin.py` are written by
`extras/editors/build.js` from the DSL. Change `dsl/` and rebuild rather than
editing them.

## The Python copy of the checks

This folder's `dsl/` is a Python copy of the mechanical verify checks in
trade-stories' `dsl/grammar.peggy` and `dsl/src/`, and `dsl/report.py` copies
`extras/editors/verify-report.js`. A change to those needs the same change
here. Then, from this folder:

```
python3 tests/test_cases.py     runs trade-stories' dsl/tests/cases.json against the copy
python3 tests/test_report.py    checks the lines Build lists
```

Restart Sublime after changing anything under `dsl/`: Sublime reloads the
plugin file when it is saved, but not the modules it imports.
