"""Runs trade-stories' DSL test cases, dsl/tests/cases.json, against the Python copy of the checks, as dsl/tests/run.js does.

The copy builds no working copy, so a case's workingContains, workingExcludes and rendersBackToItself are not checked.
"""

import json
import sys
from pathlib import Path

PACKAGE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PACKAGE))

from dsl.verify import verify

CASES = PACKAGE.parents[2] / "dsl" / "tests" / "cases.json"


def load():
    return json.loads(CASES.read_text(encoding="utf-8"))


def outcome(case):
    """Whether the case passes, and the error messages it got."""
    result = verify(case["story"], case.get("defaults"))
    errors, hints, merged = result["errors"], result["hints"], result["merged"]
    messages = " | ".join(fault["message"] for fault in errors)
    hint_text = " | ".join(hint["message"] for hint in hints)

    if case["expect"] == "ok":
        ok = not errors
    else:
        ok = bool(errors) and (not case.get("contains") or case["contains"] in messages)
    if ok and case.get("hintContains"):
        ok = case["hintContains"] in hint_text
    if ok and case.get("hintLine"):
        ok = any(hint["line"] == case["hintLine"] for hint in hints)
    if ok and "errorCount" in case:
        ok = len(errors) == case["errorCount"]
    if ok and case.get("mergedHas"):
        ok = all(
            any(
                clause["keyword"] == want["keyword"]
                and "\n".join(entry["text"] for entry in clause["predicate"]) == want["predicate"]
                and ("source" not in want or clause["source"] == want["source"])
                for clause in merged
            )
            for want in case["mergedHas"]
        )
    return ok, messages


def test_cases():
    assert [case["name"] for case in load() if not outcome(case)[0]] == []


def main():
    cases = load()
    failed = 0
    for case in cases:
        ok, messages = outcome(case)
        print(f"{'ok  ' if ok else 'FAIL'}  {case['name']}" + ("" if ok else f"   -> {messages or 'no errors'}"))
        failed += not ok
    print(f"\n{len(cases) - failed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
