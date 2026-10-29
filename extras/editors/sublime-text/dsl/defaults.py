"""A Python copy of trade-stories' dsl/src/defaults.js: reading defaults.trade and merging its clauses into a story."""

import re

from .parser import ParseError, parse

CANONICAL_ORDER = [
    "story", "trading", "source", "given", "when", "except", "or except", "then",
    "with", "sl", "until", "taking", "or until", "unless", "or unless", "notes",
]

COMPLEMENTED = ["until", "or until"]
COMPLEMENT = "taking"

SYNONYM = {"or except": "except", "or until": "until", "or unless": "unless"}

STACKS = ["given", "when", "then", "source"]

REPEATABLE = [COMPLEMENT, *COMPLEMENTED, *SYNONYM]


def base_of(keyword):
    return SYNONYM.get(keyword, keyword)


def canonical_rank(keyword):
    return CANONICAL_ORDER.index(keyword) if keyword in CANONICAL_ORDER else -1


def said(clause):
    return any(entry["text"] != "" for entry in clause["predicate"])


def parse_defaults(source):
    """The defaults in defaults.trade's text, a run of stacked clauses to one default, and the faults found reading it."""
    defaults = []
    errors = []
    lines = re.split(r"\r?\n", source)

    def at(number, message):
        return {"line": number, "text": lines[number - 1] if number else None, "message": message}

    try:
        parsed = parse(source if source.endswith("\n") else source + "\n")
    except ParseError as e:
        words = lines[e.line - 1].split()
        errors.append(at(e.line, f'"{words[0]}" is not a clause keyword.' if words else "Not a clause keyword."))
        return defaults, errors

    clauses = list(parsed["clauses"])
    i = 0
    while i < len(clauses):
        clause = clauses[i]
        if clause["keyword"] == "and":
            above = clauses[i - 1] if i > 0 else None
            if above is None or above["keyword"] not in STACKS:
                errors.append(at(clause["predicate"][0]["line"], '"And" must follow a "Given", "When", "Then" or "Source".'))
                del clauses[i]
                continue
            clauses[i] = {**clause, "keyword": above["keyword"]}
        i += 1

    for clause in clauses:
        keyword = clause["keyword"]
        line = clause["predicate"][0]["line"]
        predicate = [entry["text"] for entry in clause["predicate"]]
        last = defaults[-1] if defaults else None

        if keyword == "reversed":
            errors.append(at(line, '"Reversed" has no place in defaults.trade.'))
            continue
        if "".join(predicate).strip() == "":
            errors.append(at(line, f'"{keyword}" default has no value.'))
            continue
        if last and last["keyword"] == keyword and keyword in STACKS:
            last["clauses"].append(predicate)
            continue
        if keyword not in REPEATABLE and any(default["keyword"] == keyword for default in defaults):
            errors.append(at(line, f'"{keyword}" already has a default.'))
            continue
        defaults.append({"keyword": keyword, "line": line, "clauses": [predicate]})

    notes = parsed["notes"]
    if notes:
        predicate = [entry["text"] for entry in notes["predicate"]]
        if "".join(predicate).strip() != "":
            defaults.append({"keyword": "notes", "line": notes["predicate"][0]["line"], "clauses": [predicate]})

    return defaults, errors


def merge_defaults(clauses, defaults):
    """The story's own clauses with text, and each default placed where the story leaves its keyword unused or empty."""
    supplied = {clause["keyword"] for clause in clauses if said(clause)}
    merged = [{**clause, "source": "story"} for clause in clauses if said(clause)]
    units = grouped(defaults)

    closed = any(
        clause["keyword"] in COMPLEMENTED and i + 1 < len(merged) and merged[i + 1]["keyword"] == COMPLEMENT
        for i, clause in enumerate(merged)
    )
    pair = next((unit for unit in units if unit["pair"] and not alternate(unit)), None)

    for unit in units:
        if unit["keyword"] == "notes":
            continue
        if unit["keyword"] == COMPLEMENT and not unit["pair"]:
            continue
        if alternate(unit):
            join_stack(merged, unit)
            continue
        if unit["pair"] and (closed or unit is not pair):
            continue
        if unit["keyword"] in supplied:
            continue
        place(merged, unit)

    solitary = next((unit for unit in units if unit["keyword"] == COMPLEMENT and not unit["pair"]), None)
    if solitary:
        for i in range(len(merged) - 1, -1, -1):
            if merged[i]["keyword"] not in COMPLEMENTED:
                continue
            if i + 1 < len(merged) and merged[i + 1]["keyword"] == COMPLEMENT:
                continue
            merged[i + 1:i + 1] = clauses_of(solitary)

    notes = next((unit for unit in units if unit["keyword"] == "notes"), None)
    if notes:
        add_notes(merged, notes)

    return merged


def alternate(unit):
    return unit["keyword"] in SYNONYM


def grouped(defaults):
    units = []
    i = 0
    while i < len(defaults):
        default = defaults[i]
        following = defaults[i + 1] if i + 1 < len(defaults) else None
        if default["keyword"] in COMPLEMENTED and following and following["keyword"] == COMPLEMENT:
            units.append({**default, "pair": following})
            i += 2
            continue
        units.append({**default, "pair": None})
        i += 1
    return units


def clauses_of(unit):
    out = [default_clause(unit["keyword"], predicate) for predicate in unit["clauses"]]
    if unit["pair"]:
        out += [default_clause(unit["pair"]["keyword"], predicate) for predicate in unit["pair"]["clauses"]]
    return out


def place(merged, unit):
    rank = canonical_rank(unit["keyword"])
    at = next((i for i, clause in enumerate(merged) if canonical_rank(clause["keyword"]) > rank), -1)
    if at == -1:
        merged.extend(clauses_of(unit))
    else:
        merged[at:at] = clauses_of(unit)


def join_stack(merged, unit):
    base = base_of(unit["keyword"])
    last = max((i for i, clause in enumerate(merged) if base_of(clause["keyword"]) == base), default=-1)
    if last == -1:
        place(merged, unit)
        return
    if last + 1 < len(merged) and merged[last + 1]["keyword"] == COMPLEMENT:
        last += 1
    merged[last + 1:last + 1] = clauses_of(unit)


def add_notes(merged, unit):
    texts = [text for predicate in unit["clauses"] for text in predicate]
    own = next((clause for clause in merged if clause["keyword"] == "notes"), None)
    if own is None:
        merged.append(default_clause("notes", texts))
        return

    kept = list(own["predicate"])
    while kept and kept[-1]["text"].strip() == "":
        kept.pop()
    if kept:
        kept[-1] = {**kept[-1], "text": kept[-1]["text"].rstrip()}
    own["predicate"] = kept + [{"text": text, "line": None, "opens_with_keyword": False} for text in texts]


def default_clause(keyword, predicate):
    return {
        "keyword": keyword,
        "raw": keyword,
        "column": None,
        "predicate": [{"text": text, "line": None, "opens_with_keyword": False} for text in predicate],
        "source": "defaults",
    }
