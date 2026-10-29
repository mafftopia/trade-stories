# Editor support

| Folder | Editor |
|--------|--------|
| `bb-edit/` | BBEdit: a package with the language module, clippings, a verify script and a text filter |
| `sublime-text/` | Sublime Text: a package with the syntax, the hints plugin, snippets, completions and a build system |

Each folder's README says how to install it and what it does.

## Shared

`verify-report.js` runs the mechanical verify checks on one story and prints
each finding as `path:line: error: message`, the form editors jump from. The
BBEdit package calls it. The Sublime package carries its own Python copy of the
checks.

`build.js` regenerates these parts of both packages, which repeat the DSL's
keywords: the BBEdit clippings, the Keyword and Function patterns in the BBEdit
language module and the Flip Reversible Tokens filter; the Sublime snippets,
completions and the generated block in the hints plugin. It reads
`dsl/syntax-rules.md`, `dsl/keywords.md`, `dsl/grammar.peggy`,
`dsl/src/writer.js` and `dsl/src/reversal.js`. After changing any of them:

```
node extras/editors/build.js
```

The files it writes are committed, so a trader installs an editor package
without running anything.
