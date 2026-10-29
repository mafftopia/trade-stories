"""A Python copy of trade-stories' dsl/grammar.peggy: a story as a list of clauses, each a keyword and a predicate, and its Notes."""

import re

KEYWORDS = [
    "story", "trading", "source", "sources", "given", "when", "and",
    "except", "then", "with", "until", "or until", "taking", "sl",
    "unless", "or unless", "or except", "reversed", "reversal",
]

KEYWORD_INDENT = 10

CLAUSE = re.compile(
    r"(story|trading|sources|source|given|when|and|except|or +except|then|with"
    r"|until|or +until|taking|sl|unless|or +unless|reversed:?|reversal:?)(?: +|$)",
    re.IGNORECASE,
)
NOTES = re.compile(r"(notes:|notes)(?:(?<=:) *| +|$)", re.IGNORECASE)
OPENS_WITH_KEYWORD = re.compile(
    r"^(?:" + "|".join(keyword.replace(" ", r"\s+") for keyword in KEYWORDS) + r")\b",
    re.IGNORECASE | re.ASCII,
)


class ParseError(Exception):
    """A line that is neither a clause, a continuation, a comment, a blank line nor Notes."""

    def __init__(self, line):
        super().__init__(f"line {line} is not part of a story")
        self.line = line


def text_line(text, line):
    return {"text": text, "line": line, "opens_with_keyword": OPENS_WITH_KEYWORD.match(text) is not None}


def keyword_name(written):
    name = re.sub(" +", " ", written.lower()).rstrip(":")
    if name == "sources":
        return "source"
    if name == "reversal":
        return "reversed"
    return name


def parse(text):
    """The clauses and Notes of `text`, which ends with a newline. Raises ParseError at the first line that fits no rule."""
    clauses = []
    current = None
    start = 0
    for number, written in enumerate(text.split("\n")[:-1], 1):
        line = written[:-1] if written.endswith("\r") else written
        indent = len(line) - len(line.lstrip(" "))
        content = line[indent:]
        if content == "" or content.startswith("#"):
            pass
        elif indent > KEYWORD_INDENT:
            if current is None:
                raise ParseError(number)
            current["predicate"].append(text_line(content.strip(), number))
        else:
            clause = CLAUSE.match(content)
            notes = None if clause else NOTES.match(content)
            if clause:
                current = {
                    "keyword": keyword_name(clause.group(1)),
                    "raw": clause.group(1),
                    "column": indent,
                    "predicate": [text_line(content[clause.end():].strip(), number)],
                }
                clauses.append(current)
            elif notes:
                rest = text[start + indent + notes.end():]
                return {
                    "clauses": clauses,
                    "notes": {
                        "column": indent,
                        "raw": notes.group(1),
                        "predicate": [text_line(rest[1:] if rest.startswith("\n") else rest, number)],
                    },
                }
            else:
                raise ParseError(number)
        start += len(written) + 1
    return {"clauses": clauses, "notes": None}
