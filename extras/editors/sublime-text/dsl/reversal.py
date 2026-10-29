"""A Python copy of trade-stories' dsl/src/reversal.js: the reversed story, with its reversible tokens flipped."""

import re

from .defaults import COMPLEMENT, SYNONYM, canonical_rank, said

REVERSIBLE = {"buy": "sell", "sell": "buy", "above": "below", "below": "above"}

TOKEN = re.compile(r"\[(buy|sell|above|below)\]", re.IGNORECASE)


def has_reversible(clauses):
    return any(TOKEN.search(entry["text"]) for clause in clauses for entry in clause["predicate"])


def flip(text):
    def swapped(match):
        word = match.group(1)
        to = REVERSIBLE[word.lower()]
        if word == word.upper():
            return f"[{to.upper()}]"
        if word[0] == word[0].upper():
            return f"[{to[0].upper()}{to[1:]}]"
        return f"[{to}]"

    return TOKEN.sub(swapped, text)


def group_of(keyword):
    return "until" if keyword == COMPLEMENT else SYNONYM.get(keyword, keyword)


def reverse(primary, section):
    """The primary's clauses flipped, with each group the section supplies in place of the primary's own."""
    supplied = [clause for clause in section if said(clause)]
    replaced = {group_of(clause["keyword"]) for clause in supplied}

    def rank(clause):
        return canonical_rank(group_of(clause["keyword"]))

    out = [
        {**clause, "predicate": [{**entry, "text": flip(entry["text"])} for entry in clause["predicate"]]}
        for clause in primary
        if group_of(clause["keyword"]) not in replaced
    ]
    for clause in supplied:
        at = next((i for i, other in enumerate(out) if rank(other) > rank(clause)), -1)
        placed = {**clause, "source": "story"}
        if at == -1:
            out.append(placed)
        else:
            out.insert(at, placed)
    return out
