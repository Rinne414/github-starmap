import { describe, expect, test } from "vitest";
import { SUBJECT_KEYWORDS } from "../src/classify/keywords";
import { CATEGORIES, CATEGORY_BY_KEY, SUBJECTS } from "../src/classify/taxonomy";
import { en, zh } from "../src/i18n/strings";

describe("translations", () => {
  test("both languages define the same keys, all non-empty", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort());
    for (const table of [zh, en]) for (const value of Object.values(table)) expect(value.trim()).not.toBe("");
  });

  test("placeholders match between languages", () => {
    const vars = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const key of Object.keys(zh) as (keyof typeof zh)[]) expect(vars(en[key]), key).toEqual(vars(zh[key]));
  });

  test("every category and subject has both names, and every category a title noun", () => {
    for (const c of CATEGORIES) {
      expect(c.label.zh && c.label.en && c.noun.zh && c.noun.en, c.key).toBeTruthy();
    }
    for (const s of SUBJECTS) {
      expect(s.label.zh && s.label.en, s.key).toBeTruthy();
      expect(CATEGORY_BY_KEY.has(s.category), s.key).toBe(true);
    }
  });

  test("every subject has keywords and keys are unique", () => {
    expect(new Set(SUBJECTS.map((s) => s.key)).size).toBe(SUBJECTS.length);
    for (const s of SUBJECTS) expect(SUBJECT_KEYWORDS[s.key]?.terms.length, s.key).toBeGreaterThan(0);
    expect(Object.keys(SUBJECT_KEYWORDS).sort()).toEqual(SUBJECTS.map((s) => s.key).sort());
  });
});
