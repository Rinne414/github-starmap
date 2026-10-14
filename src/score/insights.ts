// Insight cards: what you star most, what you both build and star, and what
// you only star so far. Ranking follows overview.py's _subject_sections.

import type { Analysis, Item } from "../analysis";

export interface SubjectCount {
  subject: string;
  own: number;
  starred: number;
}

export interface Insights {
  topStarred: SubjectCount[];
  both: SubjectCount[];
  onlyStarred: SubjectCount[];
}

const TOP_STARRED = 8;
const TOP_BOTH = 15;
const TOP_ONLY_STARRED = 15;

export function countSubjects(items: readonly Item[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const s of item.subjects) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return counts;
}

export function buildInsights(a: Analysis): Insights {
  const own = countSubjects(a.own);
  const starred = countSubjects(a.stars);
  const row = (subject: string): SubjectCount => ({ subject, own: own.get(subject) ?? 0, starred: starred.get(subject) ?? 0 });
  const byName = (x: SubjectCount, y: SubjectCount): number => x.subject.localeCompare(y.subject);

  const starredRows = [...starred.keys()].map(row);
  return {
    topStarred: [...starredRows].sort((x, y) => y.starred - x.starred || byName(x, y)).slice(0, TOP_STARRED),
    both: starredRows
      .filter((r) => r.own > 0)
      .sort((x, y) => Math.min(y.own, y.starred) - Math.min(x.own, x.starred) || y.own + y.starred - (x.own + x.starred) || byName(x, y))
      .slice(0, TOP_BOTH),
    onlyStarred: starredRows
      .filter((r) => r.own === 0)
      .sort((x, y) => y.starred - x.starred || byName(x, y))
      .slice(0, TOP_ONLY_STARRED),
  };
}
