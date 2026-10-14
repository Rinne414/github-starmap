// "Star map trivia": small surprises picked from the data (brightest own repo,
// first star, the most obscure star) for the profile panel and the share card.

import type { Analysis, Item } from "../analysis";

export type FactKind = "brightest" | "firstStar" | "hiddenGem" | "topLanguage";

export interface Fact {
  kind: FactKind;
  /** Repo full name, or the language for topLanguage. */
  label: string;
  /** Star count, year, or number of repos, depending on the kind. */
  value: number;
  /** Graph node to fly to when the fact is clicked. */
  nodeId?: string;
}

const MAX_FACTS = 3;

function maxBy<T>(items: readonly T[], score: (x: T) => number): T | undefined {
  let best: T | undefined;
  for (const x of items) if (best === undefined || score(x) > score(best)) best = x;
  return best;
}

function brightest(a: Analysis): Fact | null {
  const top = maxBy(a.own, (i) => i.repo.stars);
  // it is the account's own repo, so the owner part would only repeat the login
  return top && top.repo.stars > 0 ? { kind: "brightest", label: top.repo.name, value: top.repo.stars, nodeId: top.id } : null;
}

/** Only meaningful when we read every star: GitHub returns the newest first. */
function firstStar(a: Analysis): Fact | null {
  if (a.starsTruncated) return null;
  const dated = a.stars.filter((s): s is Item & { starredAt: string } => s.starredAt !== null);
  const first = maxBy(dated, (s) => -Date.parse(s.starredAt));
  return first ? { kind: "firstStar", label: first.repo.fullName, value: new Date(first.starredAt).getFullYear(), nodeId: first.id } : null;
}

function hiddenGem(a: Analysis): Fact | null {
  // ties go to the earliest star, so the pick is stable between reloads
  const gem = maxBy([...a.stars].reverse(), (s) => -s.repo.stars);
  return gem ? { kind: "hiddenGem", label: gem.repo.fullName, value: gem.repo.stars, nodeId: gem.id } : null;
}

function topLanguage(a: Analysis): Fact | null {
  const counts = new Map<string, number>();
  for (const i of a.own) if (i.repo.language) counts.set(i.repo.language, (counts.get(i.repo.language) ?? 0) + 1);
  const top = maxBy([...counts], ([, n]) => n);
  return top ? { kind: "topLanguage", label: top[0], value: top[1] } : null;
}

export function pickFacts(a: Analysis): Fact[] {
  return [brightest(a), firstStar(a), hiddenGem(a), topLanguage(a)].filter((f): f is Fact => f !== null).slice(0, MAX_FACTS);
}
