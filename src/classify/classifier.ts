import { CATEGORY_KEYWORDS, type KeywordEntry, LANGUAGE_FALLBACK, STACK_TOPICS, SUBJECT_KEYWORDS } from "./keywords";
import { CATEGORY_ORDER, OTHER, SUBJECTS } from "./taxonomy";

export interface Classifiable {
  name: string;
  description: string | null;
  topics: readonly string[];
  language: string | null;
  /** Lets the classifier spot profile README repos (owner/owner, owner/.github). */
  owner?: string;
}

export interface Classification {
  /** 0-3 subject keys, best first. */
  subjects: string[];
  category: string;
  /** True when only the main language decided the category. */
  guessed: boolean;
}

/** How much a keyword hit counts, by where it was found. */
const FIELD_WEIGHT = { topics: 3, name: 2, description: 1, language: 1 } as const;
const MAX_SUBJECTS = 3;
/** A subject must reach this score, and this share of the best one, to be listed. */
const MIN_SCORE = 1;
const SECONDARY_RATIO = 0.6;
/** Category-only keywords are weaker evidence than a subject hit. */
const CATEGORY_KEYWORD_FACTOR = 0.6;
/** Share of a category's second and later subjects added to its score. */
const SECONDARY_PULL = 0.25;
/** Below this the item has no real signal and goes to 其他. */
const MIN_CATEGORY_SCORE = 0.25;

const CJK = /[㐀-鿿]/;

type Matcher = (text: string) => boolean;

interface CompiledEntry {
  matchers: Matcher[];
  languages: Set<string>;
  weight: number;
  pull: number;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compileTerm(term: string): Matcher {
  const t = normalize(term);
  if (CJK.test(t)) return (text) => text.includes(t);
  const re = new RegExp(`(?<![a-z0-9])${escapeRegExp(t)}(?![a-z0-9])`);
  return (text) => re.test(text);
}

function compile(entry: KeywordEntry): CompiledEntry {
  return {
    matchers: entry.terms.map(compileTerm),
    languages: new Set(entry.languages ?? []),
    weight: entry.weight ?? 1,
    pull: entry.pull ?? 1,
  };
}

const SUBJECT_MATCHERS = new Map(SUBJECTS.map((s) => [s.key, compile(SUBJECT_KEYWORDS[s.key] ?? { terms: [] })]));
const CATEGORY_MATCHERS = new Map(Object.entries(CATEGORY_KEYWORDS).map(([k, e]) => [k, compile(e)]));
const SUBJECT_PARENT = new Map(SUBJECTS.map((s) => [s.key, s.category]));
const SUBJECT_ORDER = new Map(SUBJECTS.map((s, i) => [s.key, i]));

export function normalize(text: string): string {
  return text.toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

function splitCamel(text: string): string {
  return text.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
}

interface Fields {
  topics: string;
  name: string;
  description: string;
  language: string;
}

const isProfileRepo = (item: Classifiable): boolean =>
  item.name === ".github" || (item.owner !== undefined && item.name.toLowerCase() === item.owner.toLowerCase());

function toFields(item: Classifiable): Fields {
  const topics = item.topics.filter((t) => !STACK_TOPICS.has(t.toLowerCase()));
  const profile = isProfileRepo(item) ? " | github profile" : "";
  return {
    topics: topics.map(normalize).join(" | "),
    name: `${normalize(item.name)} | ${normalize(splitCamel(item.name))}${profile}`,
    description: normalize(item.description ?? ""),
    language: item.language ?? "",
  };
}

function scoreEntry(entry: CompiledEntry, fields: Fields): number {
  const hit = (text: string): boolean => text !== "" && entry.matchers.some((m) => m(text));
  let score = 0;
  if (hit(fields.topics)) score += FIELD_WEIGHT.topics;
  if (hit(fields.name)) score += FIELD_WEIGHT.name;
  if (hit(fields.description)) score += FIELD_WEIGHT.description;
  if (entry.languages.has(fields.language)) score += FIELD_WEIGHT.language;
  return score * entry.weight;
}

interface Scored {
  key: string;
  score: number;
}

function rankSubjects(fields: Fields): Scored[] {
  return [...SUBJECT_MATCHERS]
    .map(([key, entry]) => ({ key, score: scoreEntry(entry, fields) }))
    .filter((s) => s.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score || SUBJECT_ORDER.get(a.key)! - SUBJECT_ORDER.get(b.key)!);
}

function categoryTotals(ranked: Scored[], fields: Fields): Map<string, number> {
  const totals = new Map<string, number>();
  // the best subject of each category counts fully, the rest only as a tiebreaker;
  // domain-tag subjects (Codex, Danbooru...) pull their category less than functional ones
  const seen = new Set<string>();
  for (const s of ranked) {
    const category = SUBJECT_PARENT.get(s.key)!;
    const pulled = s.score * SUBJECT_MATCHERS.get(s.key)!.pull;
    totals.set(category, (totals.get(category) ?? 0) + (seen.has(category) ? pulled * SECONDARY_PULL : pulled));
    seen.add(category);
  }
  // category-only keywords are a fallback, not a bonus on top of subject hits
  for (const [category, entry] of CATEGORY_MATCHERS) {
    const score = scoreEntry(entry, fields) * CATEGORY_KEYWORD_FACTOR;
    totals.set(category, Math.max(totals.get(category) ?? 0, score));
  }
  return totals;
}

function pickCategory(totals: Map<string, number>): string {
  let best = OTHER;
  let bestScore = MIN_CATEGORY_SCORE;
  for (const [category, score] of totals) {
    const better = score > bestScore || (score === bestScore && CATEGORY_ORDER.get(category)! < CATEGORY_ORDER.get(best)!);
    if (better) [best, bestScore] = [category, score];
  }
  return best;
}

export function classify(item: Classifiable): Classification {
  const fields = toFields(item);
  const ranked = rankSubjects(fields);
  const top = ranked[0]?.score ?? 0;
  const subjects = ranked
    .filter((s) => s.score >= top * SECONDARY_RATIO)
    .slice(0, MAX_SUBJECTS)
    .map((s) => s.key);
  const category = pickCategory(categoryTotals(ranked, fields));
  const fallback = category === OTHER && subjects.length === 0 ? LANGUAGE_FALLBACK[item.language ?? ""] : undefined;
  return { subjects, category: fallback ?? category, guessed: fallback !== undefined };
}

/** Scores behind a classification, for tests and keyword tuning. */
export function explain(item: Classifiable): { subjects: Scored[]; categories: [string, number][] } {
  const fields = toFields(item);
  const ranked = rankSubjects(fields);
  return { subjects: ranked, categories: [...categoryTotals(ranked, fields)].sort((a, b) => b[1] - a[1]) };
}
