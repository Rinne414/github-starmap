import { describe, expect, test } from "vitest";
import { classify } from "../src/classify/classifier";
import { CATEGORIES, SUBJECTS } from "../src/classify/taxonomy";
import gold from "./fixtures/stars-gold.json";

declare const process: { env: Record<string, string | undefined> };

interface GoldItem {
  full_name: string;
  description: string | null;
  topics: string[];
  language: string | null;
  gold: { category: string; subjects: string[] };
}

const categoryKey = new Map(CATEGORIES.map((c) => [c.label.zh, c.key]));

/**
 * Subjects added after the gold labels were made (for general developers).
 * The labeller could not pick them, so they are left out of the precision figure.
 */
const NEW_CATEGORIES = new Set(["backend", "devops", "data-ml", "mobile-game", "devtools"]);
const NEW_SUBJECTS = new Set(["awesome", "coding-practice", "frontend-framework", "sites", "browser-extension", "translation"]);
const isLegacySubject = (key: string): boolean =>
  !NEW_SUBJECTS.has(key) && !NEW_CATEGORIES.has(SUBJECTS.find((s) => s.key === key)!.category);
const subjectKey = new Map(SUBJECTS.map((s) => [s.label.zh, s.key]));

function evaluate(items: GoldItem[]) {
  let categoryHits = 0;
  let subjectItems = 0;
  let subjectHits = 0;
  let predicted = 0;
  let predictedCorrect = 0;
  const misses: string[] = [];
  for (const item of items) {
    const name = item.full_name.split("/")[1];
    const result = classify({ ...item, name });
    const goldCategory = categoryKey.get(item.gold.category);
    const goldSubjects = new Set(item.gold.subjects.map((s) => subjectKey.get(s)));
    const categoryOk = result.category === goldCategory;
    if (categoryOk) categoryHits += 1;
    const legacy = result.subjects.filter(isLegacySubject);
    predicted += legacy.length;
    predictedCorrect += legacy.filter((s) => goldSubjects.has(s)).length;
    const subjectOk = goldSubjects.size === 0 || result.subjects.some((s) => goldSubjects.has(s));
    if (goldSubjects.size > 0) {
      subjectItems += 1;
      if (subjectOk) subjectHits += 1;
    }
    if (!categoryOk || !subjectOk) {
      misses.push(`${item.full_name}: ${goldCategory}/[${[...goldSubjects]}] -> ${result.category}/[${result.subjects}]`);
    }
  }
  return {
    categoryAccuracy: categoryHits / items.length,
    subjectHitRate: subjectHits / subjectItems,
    subjectPrecision: predicted ? predictedCorrect / predicted : 0,
    misses,
  };
}

describe("rule classifier against 257 hand-labelled stars", () => {
  const items = gold as GoldItem[];

  test("every gold label exists in the taxonomy", () => {
    for (const item of items) {
      expect(categoryKey.has(item.gold.category), item.gold.category).toBe(true);
      for (const s of item.gold.subjects) expect(subjectKey.has(s), s).toBe(true);
    }
  });

  test("hit rates stay above the tuned baseline", () => {
    const r = evaluate(items);
    if (process.env.SHOW_MISSES) console.info(r.misses.join("\n"));
    console.info(
      `category accuracy ${(r.categoryAccuracy * 100).toFixed(1)}% | ` +
        `subject hit ${(r.subjectHitRate * 100).toFixed(1)}% | ` +
        `subject precision ${(r.subjectPrecision * 100).toFixed(1)}% | misses ${r.misses.length}`,
    );
    // 2026-10-14 (AI-heavy keywords only): 84.4% / 94.3% / 70.6%.
    // 2026-10-15 after widening the taxonomy for general developers (see corpus.test.ts):
    // 82.9% / 94.3% / 75.3% (precision now counts original subjects only).
    expect(r.categoryAccuracy).toBeGreaterThanOrEqual(0.82);
    expect(r.subjectHitRate).toBeGreaterThanOrEqual(0.94);
    expect(r.subjectPrecision).toBeGreaterThanOrEqual(0.68);
  });
});
