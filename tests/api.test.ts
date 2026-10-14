import { beforeEach, describe, expect, test } from "vitest";
import { fetchProfile, GithubError } from "../src/github/api";
import { CACHE_TTL_MS, readCache, writeCache } from "../src/github/cache";

const rawRepo = (name: string, owner = "octo") => ({
  full_name: `${owner}/${name}`,
  name,
  owner: { login: owner },
  html_url: `https://github.com/${owner}/${name}`,
  description: null,
  topics: ["mcp"],
  language: "TypeScript",
  stargazers_count: 3,
  fork: false,
  pushed_at: "2026-10-01T00:00:00Z",
});

const json = (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body), { status: 200, ...init });

function fakeGithub(starCount: number, repoCount = 2) {
  const calls: { url: string; accept: string | null }[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, accept: new Headers(init?.headers).get("accept") });
    const page = Number(new URL(url).searchParams.get("page") ?? 1);
    const slice = (total: number) => Math.max(0, Math.min(100, total - (page - 1) * 100));
    if (url.endsWith("/users/octo")) return json({ login: "octo", name: "Octo", avatar_url: "a", html_url: "h", public_repos: repoCount });
    if (url.includes("/repos?")) return json(Array.from({ length: slice(repoCount) }, (_, i) => rawRepo(`r${page}-${i}`)));
    if (url.includes("/starred?")) {
      return json(Array.from({ length: slice(starCount) }, (_, i) => ({ starred_at: "2026-10-02T00:00:00Z", repo: rawRepo(`s${page}-${i}`, "other") })));
    }
    return new Response("{}", { status: 404 });
  }) as typeof fetch;
  return { calls, fetchImpl };
}

describe("fetchProfile", () => {
  test("paginates and asks for starred_at", async () => {
    const { calls, fetchImpl } = fakeGithub(250);
    const p = await fetchProfile("octo", { fetchImpl });
    expect(p.repos).toHaveLength(2);
    expect(p.stars).toHaveLength(250);
    expect(p.stars[0].starredAt).toBe("2026-10-02T00:00:00Z");
    expect(p.starsTruncated).toBe(false);
    const starCalls = calls.filter((c) => c.url.includes("/starred"));
    expect(starCalls).toHaveLength(3);
    expect(starCalls.every((c) => c.accept === "application/vnd.github.star+json")).toBe(true);
    expect(calls.some((c) => c.url.includes("type=owner") && c.url.includes("per_page=100"))).toBe(true);
  });

  test("stops at 1,000 stars", async () => {
    const { calls, fetchImpl } = fakeGithub(1500);
    const p = await fetchProfile("octo", { fetchImpl });
    expect(p.stars).toHaveLength(1000);
    expect(p.starsTruncated).toBe(true);
    expect(calls.filter((c) => c.url.includes("/starred"))).toHaveLength(10);
  });

  test("stops paginating the other list when one fails", async () => {
    const calls: string[] = [];
    const fetchImpl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push(url);
      if (url.endsWith("/users/octo")) return json({ login: "octo", name: null, avatar_url: "a", html_url: "h", public_repos: 1 });
      if (url.includes("/repos?")) return new Response("{}", { status: 404 });
      await new Promise((r) => setTimeout(r, 5));
      if (init?.signal?.aborted) throw new DOMException("aborted", "AbortError");
      return json(Array.from({ length: 100 }, (_, i) => ({ starred_at: "x", repo: rawRepo(`s${i}`, "other") })));
    }) as typeof fetch;
    await expect(fetchProfile("octo", { fetchImpl })).rejects.toMatchObject({ kind: "not-found" });
    await new Promise((r) => setTimeout(r, 50));
    expect(calls.filter((c) => c.includes("/starred")).length).toBeLessThan(3);
  });

  test("maps 404 to not-found", async () => {
    const fetchImpl = (async () => new Response("{}", { status: 404 })) as typeof fetch;
    await expect(fetchProfile("nobody", { fetchImpl })).rejects.toMatchObject({ kind: "not-found" });
  });

  test("maps an exhausted rate limit to rate-limit with the reset time", async () => {
    const fetchImpl = (async () =>
      new Response("{}", { status: 403, headers: { "x-ratelimit-remaining": "0", "x-ratelimit-reset": "1791936000" } })) as typeof fetch;
    const error = await fetchProfile("octo", { fetchImpl }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GithubError);
    expect((error as GithubError).kind).toBe("rate-limit");
    expect((error as GithubError).resetAt?.getTime()).toBe(1791936000 * 1000);
  });

  test("recognises a rate limit from the message when headers are hidden", async () => {
    const fetchImpl = (async () => new Response(JSON.stringify({ message: "API rate limit exceeded for 1.2.3.4." }), { status: 403 })) as typeof fetch;
    await expect(fetchProfile("octo", { fetchImpl })).rejects.toMatchObject({ kind: "rate-limit" });
  });

  test("maps 429 and other 403s", async () => {
    const tooMany = (async () => new Response("{}", { status: 429 })) as typeof fetch;
    await expect(fetchProfile("octo", { fetchImpl: tooMany })).rejects.toMatchObject({ kind: "rate-limit" });
    const forbidden = (async () => new Response("{}", { status: 403, headers: { "x-ratelimit-remaining": "12" } })) as typeof fetch;
    await expect(fetchProfile("octo", { fetchImpl: forbidden })).rejects.toMatchObject({ kind: "forbidden" });
  });

  test("maps a thrown fetch to network", async () => {
    const fetchImpl = (async () => {
      throw new TypeError("Failed to fetch");
    }) as typeof fetch;
    await expect(fetchProfile("octo", { fetchImpl })).rejects.toMatchObject({ kind: "network" });
  });
});

describe("cache", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.assign(globalThis, {
      localStorage: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => void store.set(k, v),
        removeItem: (k: string) => void store.delete(k),
      },
    });
  });

  test("round-trips within an hour, case-insensitively, then expires", async () => {
    const { fetchImpl } = fakeGithub(5);
    const profile = await fetchProfile("octo", { fetchImpl });
    writeCache(profile, 1000);
    expect(readCache("OCTO", 1000 + CACHE_TTL_MS - 1)?.stars).toHaveLength(5);
    expect(readCache("octo", 1000 + CACHE_TTL_MS + 1)).toBeNull();
  });

  test("ignores a malformed entry", () => {
    localStorage.setItem("starmap:v1:octo", JSON.stringify({ savedAt: "soon", profile: { user: {} } }));
    expect(readCache("octo")).toBeNull();
  });

  test("works without storage", () => {
    Object.assign(globalThis, {
      localStorage: {
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => {
          throw new Error("blocked");
        },
      },
    });
    expect(readCache("octo")).toBeNull();
    expect(() => writeCache({ user: { login: "octo" } } as never)).not.toThrow();
  });
});
