import type { Label } from "../classify/taxonomy";
import { CATEGORY_BY_KEY, SUBJECT_BY_KEY } from "../classify/taxonomy";
import { en, type StringKey, zh } from "./strings";

export type Lang = "zh" | "en";

const STORAGE_KEY = "starmap:lang";
const TABLES: Record<Lang, Record<StringKey, string>> = { zh, en };

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "zh" || saved === "en") return saved;
  } catch {
    // storage blocked: fall back to the browser language
  }
  const langs = typeof navigator === "undefined" ? [] : navigator.languages ?? [navigator.language];
  return langs.some((l) => l?.toLowerCase().startsWith("zh")) ? "zh" : "en";
}

let current: Lang = initialLang();
const listeners = new Set<() => void>();

export const getLang = (): Lang => current;

export function setLang(lang: Lang): void {
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // remembering the choice is a convenience only
  }
  document.documentElement.lang = lang === "zh" ? "zh-Hant" : "en";
  listeners.forEach((fn) => fn());
}

export function onLangChange(fn: () => void): void {
  listeners.add(fn);
}

export function t(key: StringKey, vars: Record<string, string | number> = {}): string {
  return TABLES[current][key].replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}

export const pick = (label: Label): string => label[current];

export const categoryName = (key: string): string => {
  const c = CATEGORY_BY_KEY.get(key);
  return c ? pick(c.label) : key;
};

export const subjectName = (key: string): string => {
  const s = SUBJECT_BY_KEY.get(key);
  return s ? pick(s.label) : key;
};

export function formatNumber(n: number): string {
  return n.toLocaleString(current === "zh" ? "zh-TW" : "en-US");
}
