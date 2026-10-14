import { describe, expect, test } from "vitest";
import { buildInsights } from "../src/score/insights";
import { computeScores, pickModifier, scoresFromFacts, type ScoreFacts, TOTAL_SUBJECTS } from "../src/score/score";
import { analysis, item } from "./helpers";

const NOW = new Date("2026-10-14T00:00:00Z");
const daysAgo = (n: number): string => new Date(NOW.getTime() - n * 86_400_000).toISOString();

const facts = (patch: Partial<ScoreFacts>): ScoreFacts => ({
  starredSubjects: 0,
  sharedSubjects: 0,
  classifiedItems: 0,
  topCategory: null,
  topCategoryItems: 0,
  stars: 0,
  gemStars: 0,
  recentPushes: 0,
  recentStars: 0,
  ...patch,
});

describe("scoresFromFacts", () => {
  test("applies each published formula", () => {
    const s = scoresFromFacts(
      facts({ starredSubjects: 20, sharedSubjects: 5, classifiedItems: 40, topCategoryItems: 10, stars: 50, gemStars: 20, recentPushes: 2, recentStars: 15 }),
    );
    expect(s.maker).toBe(25);
    expect(s.breadth).toBe(Math.round((100 * 20) / TOTAL_SUBJECTS));
    expect(s.focus).toBe(25);
    expect(s.gem).toBe(40);
    // 60 * 2/5 + 40 * 15/30 = 24 + 20
    expect(s.activity).toBe(44);
  });

  test("caps activity at 100", () => {
    expect(scoresFromFacts(facts({ recentPushes: 50, recentStars: 500 })).activity).toBe(100);
  });

  test("returns null (shown as a dash) when data is missing", () => {
    const s = scoresFromFacts(facts({ classifiedItems: 4, topCategoryItems: 4 }));
    expect(s.maker).toBeNull();
    expect(s.breadth).toBeNull();
    expect(s.gem).toBeNull();
    expect(s.focus).toBeNull();
    expect(s.activity).toBe(0);
  });
});

describe("pickModifier", () => {
  test("uses the highest score", () => {
    expect(pickModifier({ maker: 10, gem: 20, focus: 30, breadth: 90, activity: 50 })).toBe("breadth");
  });

  test("breaks ties in the order maker > gem > focus > breadth > activity", () => {
    expect(pickModifier({ maker: 70, gem: 70, focus: 70, breadth: 70, activity: 70 })).toBe("maker");
    expect(pickModifier({ maker: 10, gem: 80, focus: 20, breadth: 80, activity: 80 })).toBe("gem");
  });

  test("ignores missing scores and falls back to laid-back below 30", () => {
    expect(pickModifier({ maker: null, gem: null, focus: 29, breadth: null, activity: 12 })).toBe("laid-back");
    expect(pickModifier({ maker: null, gem: null, focus: null, breadth: null, activity: 0 })).toBe("laid-back");
  });
});

describe("computeScores", () => {
  test("gives the rookie title below 10 repos + stars", () => {
    const a = analysis([item("repo", ["tts"], "audio")], [item("star", ["tts"], "audio")]);
    expect(computeScores(a, NOW).title).toEqual({ rookie: true });
  });

  test("combines facts from own repos and stars", () => {
    const own = [
      item("repo", ["comfyui"], "ai-image", { repo: { pushedAt: daysAgo(3) } }),
      item("repo", ["tts"], "audio", { repo: { pushedAt: daysAgo(200) } }),
    ];
    const stars = [
      ...Array.from({ length: 6 }, (_, i) => item("star", ["comfyui"], "ai-image", { starredAt: daysAgo(i), repo: { stars: 50 } })),
      item("star", ["mcp"], "coding-agent", { starredAt: daysAgo(120), repo: { stars: 5000 } }),
      item("star", [], "other", { repo: { stars: 20000 } }),
    ];
    const r = computeScores(analysis(own, stars), NOW);
    expect(r.facts).toMatchObject({
      starredSubjects: 2,
      sharedSubjects: 1,
      classifiedItems: 9, // the "other" star is left out
      topCategory: "ai-image",
      topCategoryItems: 7,
      stars: 8,
      gemStars: 6,
      recentPushes: 1,
      recentStars: 6,
    });
    expect(r.scores.maker).toBe(50);
    expect(r.scores.gem).toBe(75);
    expect(r.scores.focus).toBe(78);
    expect(r.title).toEqual({ rookie: false, modifier: "focus", category: "ai-image" });
  });

  test("language-only guesses do not decide focus or the title", () => {
    const stars = [
      ...Array.from({ length: 8 }, () => item("star", [], "devtools", { guessed: true })),
      ...Array.from({ length: 3 }, () => item("star", ["tts"], "audio")),
    ];
    const r = computeScores(analysis([], stars), NOW);
    expect(r.facts.topCategory).toBe("audio");
    expect(r.facts.classifiedItems).toBe(3);
    expect(r.scores.focus).toBeNull(); // fewer than 5 items with real signals
  });

  test("forks never count", () => {
    const fork = item("repo", ["comfyui"], "ai-image", { repo: { fork: true, pushedAt: daysAgo(1) } });
    const stars = Array.from({ length: 10 }, () => item("star", ["comfyui"], "ai-image"));
    const r = computeScores(analysis([], stars, [fork]), NOW);
    expect(r.facts.sharedSubjects).toBe(0);
    expect(r.facts.recentPushes).toBe(0);
  });
});

describe("buildInsights", () => {
  test("splits subjects into both / only starred, ranked like overview.py", () => {
    const own = [item("repo", ["comfyui"], "ai-image"), item("repo", ["tts", "mcp"], "audio"), item("repo", ["tts"], "audio")];
    const stars = [
      ...Array.from({ length: 3 }, () => item("star", ["comfyui"], "ai-image")),
      item("star", ["tts"], "audio"),
      ...Array.from({ length: 4 }, () => item("star", ["danbooru"], "ai-image")),
      item("star", ["pixiv"], "ai-image"),
    ];
    const ins = buildInsights(analysis(own, stars));
    expect(ins.topStarred.map((r) => r.subject)).toEqual(["danbooru", "comfyui", "pixiv", "tts"]);
    // min(own, starred) first: comfyui 1/3 and tts 2/1 both have min 1; then by total
    expect(ins.both.map((r) => r.subject)).toEqual(["comfyui", "tts"]);
    expect(ins.onlyStarred.map((r) => [r.subject, r.starred])).toEqual([["danbooru", 4], ["pixiv", 1]]);
  });
});
