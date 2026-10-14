// Route-level fake of the GitHub REST API, so E2E runs never spend real quota.
// Stars come from the public gold fixture; own repos are made up.

import type { Page, Route } from "@playwright/test";
import gold from "../tests/fixtures/stars-gold.json" with { type: "json" };

export const DEMO = "stardemo";
const DAY_MS = 86_400_000;

interface GoldItem {
  full_name: string;
  description: string | null;
  topics: string[];
  language: string | null;
  stargazers_count: number;
}

const rawRepo = (fullName: string, patch: Record<string, unknown>) => {
  const [owner, name] = fullName.split("/");
  return {
    full_name: fullName,
    name,
    owner: { login: owner },
    html_url: `https://github.com/${fullName}`,
    description: null,
    topics: [],
    language: null,
    stargazers_count: 0,
    fork: false,
    pushed_at: null,
    ...patch,
  };
};

function ownRepos(now: number) {
  const recent = (days: number) => new Date(now - days * DAY_MS).toISOString();
  return [
    ["comfy-anima-nodes", "ComfyUI custom nodes for Anima sampling", ["comfyui", "anima"], "Python", 2],
    ["nai-prompt-cards", "Prompt card manager for NovelAI tags", ["novelai", "prompt"], "TypeScript", 8],
    ["claude-code-statusline", "A tiny statusline for Claude Code", ["claude-code", "terminal"], "TypeScript", 20],
    ["lora-dataset-cleaner", "Clean and caption LoRA training datasets", ["dataset", "lora"], "Python", 40],
    ["qq-chat-summary", "Summarise QQ chat history with an LLM", ["qq", "chat-history"], "Python", 200],
    ["tts-reader", "Read web pages aloud with local TTS", ["tts"], "Rust", 400],
    ["my-blog", "Personal site", [], "HTML", 30],
  ]
    .map(([name, description, topics, language, days]) =>
      rawRepo(`${DEMO}/${name}`, { description, topics, language, stargazers_count: 3, pushed_at: recent(days as number), created_at: recent((days as number) * 4 + 30) }),
    )
    .concat([rawRepo(`${DEMO}/forked-yt-dlp`, { description: "fork of a downloader", fork: true, topics: [], pushed_at: recent(1) })]);
}

function stars(now: number) {
  return (gold as GoldItem[]).map((g, i) => ({
    starred_at: new Date(now - i * 3 * DAY_MS).toISOString(),
    repo: rawRepo(g.full_name, {
      description: g.description,
      topics: g.topics,
      language: g.language,
      stargazers_count: g.stargazers_count,
      pushed_at: new Date(now - i * DAY_MS).toISOString(),
    }),
  }));
}

// avatars must allow CORS so the PNG export can draw them
const AVATAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#2b3a55"/><circle cx="32" cy="26" r="12" fill="#f5b942"/><rect x="14" y="42" width="36" height="16" rx="8" fill="#c084fc"/></svg>`;

const EXPOSED = "ETag, Link, Location, Retry-After, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Used, X-RateLimit-Resource, X-RateLimit-Reset";

export interface MockLog {
  apiCalls: string[];
}

export async function mockGithub(page: Page, now = Date.now()): Promise<MockLog> {
  const log: MockLog = { apiCalls: [] };
  const own = ownRepos(now);
  const starred = stars(now);
  const page100 = <T>(items: T[], url: URL): T[] => {
    const n = Number(url.searchParams.get("page") ?? 1);
    return items.slice((n - 1) * 100, n * 100);
  };
  const json = (route: Route, body: unknown, status = 200, headers: Record<string, string> = {}) =>
    route.fulfill({
      status,
      contentType: "application/json",
      // same CORS headers api.github.com sends, so rate-limit headers are readable
      headers: { "access-control-allow-origin": "*", "access-control-expose-headers": EXPOSED, ...headers },
      body: JSON.stringify(body),
    });

  await page.route("https://api.github.com/**", (route) => {
    const url = new URL(route.request().url());
    log.apiCalls.push(url.pathname + url.search);
    const path = url.pathname;
    if (path === `/users/${DEMO}`) {
      return json(route, { login: DEMO, name: "Star Demo", avatar_url: "https://avatars.githubusercontent.com/u/1?v=4", html_url: `https://github.com/${DEMO}`, public_repos: own.length });
    }
    if (path === `/users/${DEMO}/repos`) return json(route, page100(own, url));
    if (path === `/users/${DEMO}/starred`) return json(route, page100(starred, url));
    if (path === "/users/limited") {
      return json(route, { message: "API rate limit exceeded" }, 403, {
        "x-ratelimit-remaining": "0",
        "x-ratelimit-reset": String(Math.floor((now + 25 * 60_000) / 1000)),
      });
    }
    return json(route, { message: "Not Found" }, 404);
  });
  await page.route("https://avatars.githubusercontent.com/**", (route) =>
    route.fulfill({ status: 200, contentType: "image/svg+xml", headers: { "access-control-allow-origin": "*" }, body: AVATAR }),
  );
  return log;
}
