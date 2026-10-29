// The stories folder of the project in the working directory: the first of
// stories/, trader/stories/, then the shallowest stories/ folder below, searched
// level by level in name order and never inside a folder whose name starts
// with ".". With none, stories/, where a first story would go.
//
// The settings a story draws on are in .settings/ inside it, and the working
// copies go to .working/stories/ beside it.
//
//   node dsl/src/stories-folder.js
//
// prints the folder relative to the working directory.

import { readdirSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";

const NAME = "stories";

function isFolder(path) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function subfolders(path) {
  try {
    return readdirSync(path, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

export function storiesFolder(root = process.cwd()) {
  for (const candidate of [join(root, NAME), join(root, "trader", NAME)]) {
    if (isFolder(candidate)) return candidate;
  }
  let level = [root];
  while (level.length > 0) {
    const next = [];
    for (const folder of level) {
      for (const name of subfolders(folder)) {
        if (name === NAME) return join(folder, name);
        next.push(join(folder, name));
      }
    }
    level = next;
  }
  return join(root, NAME);
}

export function settingsFolder(stories) {
  return join(stories, ".settings");
}

export function workingFolder(stories) {
  return join(dirname(stories), ".working", NAME);
}

if (process.argv[1] && process.argv[1].endsWith("stories-folder.js")) {
  console.log(relative(process.cwd(), storiesFolder()).split(sep).join("/"));
}
