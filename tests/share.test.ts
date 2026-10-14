import { describe, expect, test } from "vitest";
import type { ScoreKey } from "../src/score/score";
import { shareLinks, shareText } from "../src/share/links";

const labels: Record<ScoreKey, string> = { maker: "動手率", gem: "挖寶指數", focus: "專注度", breadth: "收藏廣度", activity: "近期活躍度" };
const scores = { maker: 15, gem: 44, focus: null, breadth: 88, activity: 100 };

describe("shareText", () => {
  test("leads with the title and the two best scores, then invites the reader", () => {
    const text = shareText({ title: "雜食系煉圖師", scores, scoreLabel: (k) => labels[k], lang: "zh" });
    expect(text).toBe("我在 GitHub 星圖是「雜食系煉圖師」★ 近期活躍度 100・收藏廣度 88。看看你的 GitHub 是什麼星座 →");
  });

  test("English version skips missing scores", () => {
    const text = shareText({ title: "Omnivorous Image Alchemist", scores: { ...scores, activity: null }, scoreLabel: (k) => k, lang: "en" });
    expect(text).toBe(`GitHub Starmap says I'm a "Omnivorous Image Alchemist" ★ breadth 88 · gem 44. What's your GitHub constellation? →`);
  });
});

describe("shareLinks", () => {
  const url = "https://github-starmap.vercel.app/?u=octo cat";
  const links = shareLinks(url, "hi & bye");

  test("encodes the link and the text for every network", () => {
    expect(links.x).toBe("https://x.com/intent/post?text=hi%20%26%20bye&url=https%3A%2F%2Fgithub-starmap.vercel.app%2F%3Fu%3Docto%20cat");
    expect(links.facebook).toContain("sharer.php?u=https%3A%2F%2Fgithub-starmap.vercel.app");
    expect(links.line).toContain("lineit/share?url=https%3A%2F%2F");
    // Threads has no url parameter, so the link goes inside the text
    expect(decodeURIComponent(links.threads.split("text=")[1])).toBe(`hi & bye ${url}`);
  });
});
