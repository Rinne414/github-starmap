// Share text and intent links. The text leads with the fun title and the two
// best scores, then asks the reader for theirs, so every share invites a new map.

import type { ScoreKey } from "../score/score";

export interface ShareInput {
  title: string;
  scores: Record<ScoreKey, number | null>;
  scoreLabel: (key: ScoreKey) => string;
  lang: "zh" | "en";
}

export interface ShareLinks {
  x: string;
  threads: string;
  facebook: string;
  line: string;
}

const HIGHLIGHTS = 2;

function highlights(input: ShareInput): string {
  return (Object.entries(input.scores) as [ScoreKey, number | null][])
    .filter((e): e is [ScoreKey, number] => e[1] !== null)
    .sort((a, b) => b[1] - a[1])
    .slice(0, HIGHLIGHTS)
    .map(([key, value]) => `${input.scoreLabel(key)} ${value}`)
    .join(input.lang === "zh" ? "・" : " · ");
}

export function shareText(input: ShareInput): string {
  const best = highlights(input);
  if (input.lang === "zh") {
    return `我在 GitHub 星圖是「${input.title}」★ ${best}。看看你的 GitHub 是什麼星座 →`;
  }
  return `GitHub Starmap says I'm a "${input.title}" ★ ${best}. What's your GitHub constellation? →`;
}

export function shareLinks(url: string, text: string): ShareLinks {
  const u = encodeURIComponent(url);
  const both = encodeURIComponent(`${text} ${url}`);
  return {
    x: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${u}`,
    threads: `https://www.threads.net/intent/post?text=${both}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    line: `https://social-plugins.line.me/lineit/share?url=${u}&text=${encodeURIComponent(text)}`,
  };
}
