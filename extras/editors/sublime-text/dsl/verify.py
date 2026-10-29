"""A Python copy of trade-stories' dsl/src/verify.js, step 1 of verify-story, without the working copy it writes."""

import re

from .defaults import COMPLEMENTED, STACKS, SYNONYM, merge_defaults, parse_defaults, said
from .parser import KEYWORD_INDENT, ParseError, parse
from .reversal import has_reversible, reverse

REQUIRED = ["story", "trading", "given", "when", "then", "with", "sl", "until"]

SETS = [
    ["story", "trading", "source"],
    ["given", "when", "then", "with", "except"],
    ["until", "taking", "sl", "unless"],
]

RANK = {"story": 0, "trading": 1, "source": 1, "given": 0, "when": 1, "then": 2, "with": 3}

AT_MOST_ONE = ["story", "trading", "with", "sl"]

LABEL = {
    "story": "Story", "trading": "Trading", "given": "Given", "when": "When",
    "and": "And", "except": "Except", "or except": "Or Except",
    "then": "Then", "with": "With", "source": "Source",
    "until": "Until", "taking": "Taking", "or until": "Or Until",
    "unless": "Unless", "or unless": "Or Unless", "sl": "SL", "notes": "Notes",
    "reversed": "Reversed",
}


def label(clause):
    return LABEL[clause["keyword"]]


def line_of(clause):
    return clause["predicate"][0]["line"]


def error(lines, line, message):
    return {"line": line, "text": lines[line - 1] if line else None, "message": message}


def verify(source, defaults_text=None):
    """The story's errors and hints, and the merged story with its reversed story, as verify.js reports them."""
    lines = re.split(r"\r?\n", source)
    errors = []
    hints = []

    tab = next((number for number, line in enumerate(lines, 1) if "\t" in line), None)
    if tab:
        return {"errors": [error(lines, tab, "Tabs are not allowed anywhere in a story.")], "hints": hints, "merged": []}

    try:
        parsed = parse(source if source.endswith("\n") else source + "\n")
    except ParseError as e:
        return {"errors": [error(lines, e.line, parse_message(e.line, lines))], "hints": hints, "merged": []}

    clauses = parsed["clauses"]
    collect_hints(clauses, hints)
    check_cardinality(clauses, ["reversed"], lines, errors)

    at = next((i for i, clause in enumerate(clauses) if clause["keyword"] == "reversed"), -1)
    marker = None if at == -1 else clauses[at]
    primary = clauses if at == -1 else clauses[:at]
    section = [] if at == -1 else [clause for clause in clauses[at + 1:] if clause["keyword"] != "reversed"]

    if marker and said(marker):
        errors.append(error(lines, line_of(marker),
                            '"Reversed" must be alone on its line. The clauses that differ go on the lines under it.'))

    for part in (primary, section):
        resolve_and(part, lines, errors)
        check_cardinality(part, AT_MOST_ONE, lines, errors)
        check_order(part, lines, errors)

    defaults, default_errors = parse_defaults(defaults_text) if defaults_text is not None else ([], [])
    for fault in default_errors:
        errors.append({"line": None, "text": fault["text"],
                       "message": f"defaults.trade line {fault['line']}: {fault['message']}"})

    for_merge = (primary + [{**parsed["notes"], "keyword": "notes"}]) if parsed["notes"] else primary

    merged = merge_defaults(for_merge, defaults)
    check_alternates(merged, lines, errors)
    check_required(merged, primary, lines, errors)
    check_exit_pairs(merged, lines, errors)
    check_undecided(merged, primary, lines, errors)

    whole = with_reversed(merged, marker, section, lines, errors)

    return {"errors": unique(errors), "hints": hints, "merged": whole}


def with_reversed(merged, marker, section, lines, errors):
    rules = [clause for clause in merged if clause["keyword"] != "notes"]
    notes = [clause for clause in merged if clause["keyword"] == "notes"]
    flippable = has_reversible(rules)

    if marker and not any(said(clause) for clause in section) and not flippable:
        errors.append(error(lines, line_of(marker),
                            '"Reversed" has nothing to reverse. Add the clauses that differ under it, '
                            'or mark direction words as [BUY], [SELL], [above] or [below].'))
        return merged
    if not marker and not flippable:
        return merged

    reversed_story = reverse(rules, section)
    check_alternates(reversed_story, lines, errors)
    check_exit_pairs(reversed_story, lines, errors)
    check_undecided(reversed_story, section, lines, errors)
    check_direction(rules, reversed_story, marker, lines, errors)

    own = {**marker, "source": "story"} if marker else {
        "keyword": "reversed", "raw": "Reversed", "column": None, "source": "story",
        "predicate": [{"text": "", "line": None, "opens_with_keyword": False}],
    }

    return rules + [own] + reversed_story + notes


def check_direction(primary, reversed_story, marker, lines, errors):
    def then(clauses):
        return "\n".join("\n".join(entry["text"] for entry in clause["predicate"])
                         for clause in clauses if clause["keyword"] == "then")

    if then(primary) == "" or then(primary) != then(reversed_story):
        return

    errors.append(error(lines, line_of(marker) if marker else None,
                        '"Then" is the same in the reversed story. Put a "Then" under "Reversed", '
                        'or write the direction as [BUY] or [SELL].'))


def unique(errors):
    seen = set()
    kept = []
    for fault in errors:
        key = (fault["line"], fault["message"])
        if key not in seen:
            seen.add(key)
            kept.append(fault)
    return kept


def parse_message(number, lines):
    raw = lines[number - 1] if number <= len(lines) else ""
    if len(raw) - len(raw.lstrip(" ")) > KEYWORD_INDENT:
        return "Indented too far to be a clause: a keyword takes up to 10 spaces."
    words = raw.split()
    return f'"{words[0]}" not recognised.' if words else "Not recognised."


def check_required(merged, clauses, lines, errors):
    for name in REQUIRED:
        if any(clause["keyword"] == name for clause in merged):
            continue
        empty = next((clause for clause in clauses if clause["keyword"] == name), None)
        if empty:
            errors.append(error(lines, line_of(empty),
                                f'"{LABEL[name]}" clause is empty, and defaults.trade has no default for it.'))
        else:
            errors.append(error(lines, None, f'"{LABEL[name]}" clause is missing.'))


def check_undecided(merged, clauses, lines, errors):
    for clause in clauses:
        if clause["keyword"] == "notes" or clause["keyword"] in REQUIRED:
            continue
        if " ".join(entry["text"].strip() for entry in clause["predicate"]).strip() != "":
            continue
        if any(other["keyword"] == clause["keyword"] for other in merged):
            continue
        errors.append(error(lines, line_of(clause), f'"{label(clause)}" clause is undecided.'))

    for clause in merged:
        if clause["keyword"] == "notes":
            continue
        tbd = next((entry for entry in clause["predicate"] if entry["text"].strip().lower() == "tbd"), None)
        if tbd:
            errors.append(error(lines, tbd["line"], f'"{label(clause)}" clause is still TBD.'))


def resolve_and(clauses, lines, errors):
    i = 0
    while i < len(clauses):
        clause = clauses[i]
        if clause["keyword"] == "and":
            above = clauses[i - 1] if i > 0 else None
            if above is None or above["keyword"] not in STACKS:
                errors.append(error(lines, line_of(clause), '"And" must follow a "Given", "When", "Then" or "Source".'))
                del clauses[i]
                continue
            clause["keyword"] = above["keyword"]
        i += 1


def check_cardinality(clauses, names, lines, errors):
    for name in names:
        found = [clause for clause in clauses if clause["keyword"] == name]
        for extra in found[1:]:
            errors.append(error(lines, line_of(extra), f'Only one "{LABEL[name]}" clause is allowed.'))


def check_exit_pairs(merged, lines, errors):
    for i, clause in enumerate(merged):
        line = line_of(clause)
        if clause["keyword"] in COMPLEMENTED and (i + 1 >= len(merged) or merged[i + 1]["keyword"] != "taking"):
            errors.append(error(lines, line, f'"{label(clause)}" must be followed by a "Taking".'))
        if clause["keyword"] == "taking" and (i == 0 or merged[i - 1]["keyword"] not in COMPLEMENTED):
            errors.append(error(lines, line, '"Taking" must follow an "Until" or an "Or Until".'))


def check_order(clauses, lines, errors):
    def name_of(clause):
        return SYNONYM.get(clause["keyword"], clause["keyword"])

    def set_of(clause):
        return next((i for i, keywords in enumerate(SETS) if name_of(clause) in keywords), -1)

    def rank_of(clause):
        return RANK.get(name_of(clause), -1)

    current = -1
    opener = None
    highest = -1

    for clause in clauses:
        mine = set_of(clause)
        if mine == -1:
            continue

        if mine < current:
            errors.append(error(lines, line_of(clause), f'"{label(clause)}" must come before "{label(opener)}".'))
            continue
        if mine > current:
            current = mine
            opener = clause
            highest = -1

        rank = rank_of(clause)
        if rank == -1:
            continue
        if rank < highest:
            earlier = next(other for other in clauses if set_of(other) == mine and rank_of(other) == highest)
            errors.append(error(lines, line_of(clause), f'"{label(clause)}" must come before "{label(earlier)}".'))
        else:
            highest = rank


def check_alternates(clauses, lines, errors):
    for second, first in SYNONYM.items():
        alternate = next((i for i, clause in enumerate(clauses) if clause["keyword"] == second), -1)
        if alternate == -1:
            continue
        base = next((i for i, clause in enumerate(clauses) if clause["keyword"] == first), -1)
        if base != -1 and base < alternate:
            continue
        errors.append(error(lines, line_of(clauses[alternate]), f'"{LABEL[second]}" must come after "{LABEL[first]}".'))


def collect_hints(clauses, hints):
    for clause in clauses:
        for entry in clause["predicate"][1:]:
            if entry["opens_with_keyword"]:
                hints.append({
                    "line": entry["line"],
                    "text": entry["text"],
                    "message": f'Read as continuation text of "{label(clause)}", not as a clause, '
                               f'because it is indented past it.',
                })
