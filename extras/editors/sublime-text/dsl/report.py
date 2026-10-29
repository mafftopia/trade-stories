"""A Python copy of trade-stories' extras/editors/verify-report.js: each finding on a story as a line an editor can jump from."""

import os

from .verify import verify


def report(path, story, defaults_text):
    """Each error and hint in `story`, the text of the file at `path`, as `path:line: error: message`."""
    if os.path.basename(os.path.dirname(path)) == ".settings":
        return [f"{path} is a settings file, not a story."]

    result = verify(story, defaults_text)
    lines = [f"{path}:{fault['line'] or 1}: error: {fault['message']}" for fault in result["errors"]]
    lines += [f"{path}:{hint['line'] or 1}: warning: {hint['message']}" for hint in result["hints"]]
    return lines or [f"{path}: no errors"]
