// Fun scores (0-100) and the combined title. Just for fun, not a real rating;
// the formulas are shown on the page (see i18n "formula.*").

import type { Analysis } from "../analysis";
import { CATEGORY_ORDER, OTHER, SUBJECTS } from "../classify/taxonomy";
import { countSubjects } from "./insights";

export type ScoreKey = "maker" | "gem" | "focus" | "breadth" | "activity";

/** Also the tie-break order when picking the title modifier. */
export const SCORE_KEYS: readonly ScoreKey[] = ["maker", "gem", "focus", "breadth", "activity"];

export const TOTAL_SUBJECTS = SUBJECTS.length;
const HIDDEN_GEM_STARS = 1000;
const RECENT_DAYS = 90;
const RECENT_PUSH_TARGET = 5;
const RECENT_STAR_TARGET = 30;
const PUSH_POINTS = 60;
const STAR_POINTS = 40;
const MIN_FOCUS_ITEMS = 5;
const ROOKIE_ITEMS = 10;
const LAID_BACK_BELOW = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface ScoreFacts {
  starredSubjects: number;
  sharedSubjects: number;
  classifiedItems: number;
  topCategory: string | null;
  topCategoryItems: number;
  stars: number;
  gemStars: number;
  recentPushes: number;
  recentStars: number;
}

export type TitleModifier = ScoreKey | "laid-back";

export interface ScoreResult {
  /** null means "not enough data" and is shown as a dash. */
  scores: Record<ScoreKey, number | null>;
  facts: ScoreFacts;
  /** Rookie titles replace the modifier + noun combination. */
  title: { rookie: true } | { rookie: false; modifier: TitleModifier; category: string };
}

const pct = (part: number, whole: number): number => Math.round((100 * part) / whole);
const isRecent = (iso: string | null, now: Date): boolean =>
  iso !== null && now.getTime() - new Date(iso).getTime() <= RECENT_DAYS * DAY_MS;

function topCategory(a: Analysis): { key: string | null; count: number; total: number } {
  const counts = new Map<string, number>();
  for (const item of [...a.own, ...a.stars]) {
    if (item.category !== OTHER) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }
  let key: string | null = null;
  let count = 0;
  for (const [k, n] of counts) {
    if (n > count || (n === count && key !== null && CATEGORY_ORDER.get(k)! < CATEGORY_ORDER.get(key)!)) [key, count] = [k, n];
  }
  const total = [...counts.values()].reduce((sum, n) => sum + n, 0);
  return { key, count, total };
}

export function collectFacts(a: Analysis, now: Date): ScoreFacts {
  const starredSubjects = new Set(countSubjects(a.stars).keys());
  const ownSubjects = new Set(countSubjects(a.own).keys());
  const top = topCategory(a);
  return {
    starredSubjects: starredSubjects.size,
    sharedSubjects: [...starredSubjects].filter((s) => ownSubjects.has(s)).length,
    classifiedItems: top.total,
    topCategory: top.key,
    topCategoryItems: top.count,
    stars: a.stars.length,
    gemStars: a.stars.filter((s) => s.repo.stars < HIDDEN_GEM_STARS).length,
    recentPushes: a.own.filter((r) => isRecent(r.repo.pushedAt, now)).length,
    recentStars: a.stars.filter((s) => isRecent(s.starredAt, now)).length,
  };
}

export function scoresFromFacts(f: ScoreFacts): Record<ScoreKey, number | null> {
  const activity =
    PUSH_POINTS * Math.min(1, f.recentPushes / RECENT_PUSH_TARGET) + STAR_POINTS * Math.min(1, f.recentStars / RECENT_STAR_TARGET);
  return {
    maker: f.starredSubjects ? pct(f.sharedSubjects, f.starredSubjects) : null,
    gem: f.stars ? pct(f.gemStars, f.stars) : null,
    focus: f.classifiedItems >= MIN_FOCUS_ITEMS ? pct(f.topCategoryItems, f.classifiedItems) : null,
    breadth: f.starredSubjects ? pct(f.starredSubjects, TOTAL_SUBJECTS) : null,
    activity: Math.round(activity),
  };
}

export function pickModifier(scores: Record<ScoreKey, number | null>): TitleModifier {
  let best: ScoreKey | null = null;
  for (const key of SCORE_KEYS) {
    const value = scores[key];
    if (value !== null && (best === null || value > scores[best]!)) best = key;
  }
  return best === null || scores[best]! < LAID_BACK_BELOW ? "laid-back" : best;
}

export function computeScores(a: Analysis, now: Date = new Date()): ScoreResult {
  const facts = collectFacts(a, now);
  const scores = scoresFromFacts(facts);
  const rookie = a.own.length + a.stars.length < ROOKIE_ITEMS;
  return {
    scores,
    facts,
    title: rookie ? { rookie: true } : { rookie: false, modifier: pickModifier(scores), category: facts.topCategory ?? OTHER },
  };
}
