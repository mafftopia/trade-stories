// The reversed story: the merged primary with the clauses under Reversed laid
// over it, keyword for keyword, and its reversible tokens flipped. Defaults
// reach it only through the primary; nothing here reads defaults.trade.

import { CANONICAL_ORDER, COMPLEMENT, SYNONYM, said } from "./defaults.js";

export const REVERSIBLE = {
  buy: "sell", sell: "buy", above: "below", below: "above"
};

const TOKEN = /\[(buy|sell|above|below)\]/i;

export function hasReversible(clauses) {
  return clauses.some((c) => c.predicate.some((p) => TOKEN.test(p.text)));
}

// The word is swapped and keeps its case shape; the brackets stay, so a reader
// can see what was flipped.
export function flip(text) {
  return text.replace(new RegExp(TOKEN.source, "gi"), (m, word) => {
    const to = REVERSIBLE[word.toLowerCase()];
    const shaped =
      word === word.toUpperCase() ? to.toUpperCase()
      : word[0] === word[0].toUpperCase() ? to[0].toUpperCase() + to.slice(1)
      : to;
    return "[" + shaped + "]";
  });
}

// A complement pair replaces as one, so Taking and Or Until belong to Until's
// group; every other alternate belongs to the keyword it stands in for.
const groupOf = (keyword) =>
  keyword === COMPLEMENT ? "until" : SYNONYM[keyword] || keyword;

// The section supplies whole groups: a Given stack replaces the Given stack, one
// pair replaces every pair. What it does not supply is the primary's, flipped.
// A supplied clause goes where the canonical order puts its group, which keeps
// a pair together and the section's own order within a group. Notes is shared,
// so the primary handed in is its Rules alone.
export function reverse(primary, section) {
  const supplied = section.filter(said);
  const replaced = new Set(supplied.map((c) => groupOf(c.keyword)));
  const rank = (c) => CANONICAL_ORDER.indexOf(groupOf(c.keyword));

  const out = primary
    .filter((c) => !replaced.has(groupOf(c.keyword)))
    .map((c) => ({
      ...c,
      predicate: c.predicate.map((p) => ({ ...p, text: flip(p.text) }))
    }));

  for (const c of supplied) {
    const at = out.findIndex((o) => rank(o) > rank(c));
    const clause = { ...c, source: "story" };
    if (at === -1) out.push(clause);
    else out.splice(at, 0, clause);
  }

  return out;
}
