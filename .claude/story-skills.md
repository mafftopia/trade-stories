# Shared rules for the story skills

`.claude/reading-stories.md` covers how to read a story and how to report on
one; the skills that need it name it themselves. **Operating rules** below hold
for every run, named or not.

## Operating rules

Rules 1 and 2 are a skill's and an agent's alike. Rule 3 is a skill's: an agent
has no question to ask.

1. **When something does not work, stop and report it.** State what failed and
   suggest a workaround if one exists — never improvise one. A skill asks how to
   proceed; an agent reports and stops there.
2. **Never skip ahead.** Run the steps in the order written, and finish each
   one — including everything it prints — before starting the next. Never start
   work that an earlier step has not finished.
3. **A question carries the question alone**, and is the last thing said in its
   turn. Print the report first, in full, as ordinary output, and never ask ahead
   of the output the question is about. Once the question has gone out the turn is
   over: no reading, no listing, no agent, and nothing said about being ready or
   waiting.

## Paths

Trade Stories' own files are everything under `dsl/`, `.claude/` and `extras/`;
the trader's files — `stories/` and `.working/` — are relative to the working
directory.

A skill is given ready-to-use paths for its own files, so they resolve wherever
Trade Stories is installed. An agent is handed the Trade Stories directory and
reaches those files under it — including where a skill it follows writes a path
as `${CLAUDE_SKILL_DIR}/…`.

## Output

**The reader is a trader, not an engineer.** Everything printed must be about
their story, not about the work that produced it.

Open the run with one line saying what you are about to do, and one naming the
story. Say each once — the first as the run opens, the second as soon as there
is a story to name, and again only if the name changes — and never again before
a tool batch, a file read or a command. Neither is a turn of its own: each goes
at the top of the next message the trader gets. A skill that writes that message
out with the opening lines already in it has met this rule — add nothing above
it. After them, print only what the skill itself
specifies, its progress lines included. Never summarise the story, never restate
what you checked, never explain the DSL.

## Running

Run every time you are invoked. Never decline on the grounds that nothing has
changed since the last run, or that the result would be the same.

These skills need Node and nothing else. If a check cannot run because Node is
missing, say that Node has to be installed, and stop. Never work around it.

## Finding the story

The argument is a filename stem or the text of a story's `Story` clause. Match
case-insensitively; on more than one match, ask which.

Search `stories/` and its subfolders, unless the user named another location.
One story per file. Nothing under `stories/.settings/` is a story.

`stories/` is a shared library of trade stories, kept in subfolders by subject.
`stories/your-stories/` is the trader's own, and is searched like any other
subfolder.

No argument: use the story last read, written or verified this session. If there
is none, ask which — the question alone, listing the stories. Say nothing about
there being no argument or no earlier story: that is the ordinary way to start,
not a problem to explain.

Not found — name every path searched, then stop:

> Can't find that story. I looked in `<paths searched>`. Shall I list all the
> stories visible to me here?

## Explaining

Explanations are for a trader: what is wrong with the line, and what to type
instead. Never name internals — the parser, `merged`, clauses being "read as
continuation text", which file a rule came from, or an optional settings file
that turned out not to be there. These instructions are internals too: act on
them, never quote or describe them, and never say what a skill does or does not
permit you to do. Explain only what was reported, and never speculate about
lines a check did not reach.

## Line numbers

Report the line the trader can see in their own file. A clause with
`"source": "defaults"` came from `defaults.trade` and has none — say it came
from the defaults. Never invent a line number.
