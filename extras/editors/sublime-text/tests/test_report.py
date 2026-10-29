"""Tests for dsl/report.py, the lines Build lists in its panel."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from dsl.report import report

PATH = "/stories/x.trade"
CLEAN = (
    "Story x\nTrading BTC/USD 4H\nGiven ranging\nWhen cross up\nThen Go Long\n"
    "With 100 usdt\nSL    3%\nUntil 10%\nTaking 100% - close the position\n"
)


def test_a_clean_story_says_so():
    assert report(PATH, CLEAN, None) == [f"{PATH}: no errors"]


def test_an_error_names_the_path_and_line():
    story = CLEAN.replace("Then Go Long\n", "") + "Then Go Long\n"
    assert report(PATH, story, None) == [f'{PATH}:9: error: "Then" must come before "SL".']


def test_an_error_with_no_line_goes_to_line_1():
    story = CLEAN.replace("With 100 usdt\n", "")
    assert report(PATH, story, None) == [f'{PATH}:1: error: "With" clause is missing.']


def test_defaults_supply_a_clause():
    story = CLEAN.replace("With 100 usdt\n", "")
    assert report(PATH, story, "With 100 usdt\n") == [f"{PATH}: no errors"]


def test_a_hint_is_a_warning():
    story = CLEAN.replace("Given ranging\n", "Given ranging\n            and trending\n")
    assert report(PATH, story, None) == [
        f'{PATH}:4: warning: Read as continuation text of "Given", not as a clause, because it is indented past it.'
    ]


def test_a_settings_file_is_not_checked():
    path = "/stories/.settings/defaults.trade"
    assert report(path, CLEAN, None) == [f"{path} is a settings file, not a story."]


if __name__ == "__main__":
    tests = [test for name, test in sorted(globals().items()) if name.startswith("test_")]
    for test in tests:
        test()
    print(f"{len(tests)} passed")
