// Unauthenticated GitHub REST calls (60 requests per hour per visitor IP).

import type { Profile, RepoInfo, StarInfo, UserInfo } from "./types";

const API = "https://api.github.com";
const PER_PAGE = 100;
/** 10 pages x 100: the star cap agreed for the site; repos use the same cap. */
const MAX_PAGES = 10;

export type GithubErrorKind = "not-found" | "rate-limit" | "forbidden" | "network" | "http";

export class GithubError extends Error {
  constructor(
    readonly kind: GithubErrorKind,
    readonly status?: number,
    /** When the rate limit resets, if GitHub told us. */
    readonly resetAt?: Date,
  ) {
    super(`GitHub request failed: ${kind}${status ? ` (${status})` : ""}`);
    this.name = "GithubError";
  }
}

export interface Progress {
  repoPages: number;
  starPages: number;
}

export interface FetchOptions {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
  onProgress?: (progress: Progress) => void;
  now?: () => Date;
}

interface RawRepo {
  full_name: string;
  name: string;
  owner: { login: string };
  html_url: string;
  description: string | null;
  topics?: string[];
  language: string | null;
  stargazers_count: number;
  fork: boolean;
  pushed_at: string | null;
  created_at?: string | null;
}

async function bodyMentionsRateLimit(res: Response): Promise<boolean> {
  try {
    const body = (await res.json()) as { message?: unknown };
    return typeof body.message === "string" && /rate limit/i.test(body.message);
  } catch {
    return false;
  }
}

async function rateLimitError(res: Response, now: Date): Promise<GithubError | null> {
  const remaining = res.headers.get("x-ratelimit-remaining");
  const reset = res.headers.get("x-ratelimit-reset");
  if (remaining === "0") {
    return new GithubError("rate-limit", res.status, reset ? new Date(Number(reset) * 1000) : undefined);
  }
  const retryAfter = res.headers.get("retry-after");
  if (retryAfter) return new GithubError("rate-limit", res.status, new Date(now.getTime() + Number(retryAfter) * 1000));
  // headers can be hidden from cross-origin code; GitHub's message still says so
  if (res.status === 429 || (await bodyMentionsRateLimit(res))) return new GithubError("rate-limit", res.status);
  return null;
}

async function request<T>(path: string, accept: string, opts: FetchOptions): Promise<T> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  let res: Response;
  try {
    res = await fetchImpl(`${API}${path}`, {
      headers: { Accept: accept, "X-GitHub-Api-Version": "2022-11-28" },
      signal: opts.signal,
    });
  } catch {
    throw new GithubError("network");
  }
  if (res.ok) return (await res.json()) as T;
  if (res.status === 404) throw new GithubError("not-found", 404);
  if (res.status === 403 || res.status === 429) {
    throw (await rateLimitError(res, opts.now?.() ?? new Date())) ?? new GithubError("forbidden", res.status);
  }
  throw new GithubError("http", res.status);
}

function toRepo(raw: RawRepo): RepoInfo {
  return {
    fullName: raw.full_name,
    name: raw.name,
    owner: raw.owner.login,
    url: raw.html_url,
    description: raw.description,
    topics: raw.topics ?? [],
    language: raw.language,
    stars: raw.stargazers_count,
    fork: raw.fork,
    pushedAt: raw.pushed_at,
    createdAt: raw.created_at ?? null,
  };
}

/** Reads pages until a short page or the cap; reports whether the cap cut it off. */
async function paginate<T>(
  pathFor: (page: number) => string,
  accept: string,
  opts: FetchOptions,
  onPage: (page: number) => void,
): Promise<{ items: T[]; truncated: boolean }> {
  const items: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const batch = await request<T[]>(pathFor(page), accept, opts);
    items.push(...batch);
    onPage(page);
    if (batch.length < PER_PAGE) return { items, truncated: false };
  }
  return { items, truncated: true };
}

export async function fetchProfile(login: string, opts: FetchOptions = {}): Promise<Profile> {
  const u = encodeURIComponent(login);
  const rawUser = await request<{ login: string; name: string | null; avatar_url: string; html_url: string; public_repos: number }>(
    `/users/${u}`,
    "application/vnd.github+json",
    opts,
  );
  const user: UserInfo = {
    login: rawUser.login,
    name: rawUser.name,
    avatarUrl: rawUser.avatar_url,
    url: rawUser.html_url,
    publicRepos: rawUser.public_repos,
  };

  const progress: Progress = { repoPages: 0, starPages: 0 };
  const report = (patch: Partial<Progress>): void => {
    Object.assign(progress, patch);
    opts.onProgress?.({ ...progress });
  };

  // if one list fails, stop the other so it does not burn the 60-per-hour budget
  const controller = new AbortController();
  const listOpts: FetchOptions = { ...opts, signal: controller.signal };
  const lists = Promise.all([
    paginate<RawRepo>(
      (page) => `/users/${u}/repos?type=owner&sort=pushed&per_page=${PER_PAGE}&page=${page}`,
      "application/vnd.github+json",
      listOpts,
      (page) => report({ repoPages: page }),
    ),
    paginate<{ starred_at: string; repo: RawRepo }>(
      (page) => `/users/${u}/starred?per_page=${PER_PAGE}&page=${page}`,
      "application/vnd.github.star+json",
      listOpts,
      (page) => report({ starPages: page }),
    ),
  ]);
  const [repos, stars] = await lists.catch((error: unknown) => {
    controller.abort();
    throw error;
  });

  return {
    user,
    repos: repos.items.map(toRepo),
    stars: stars.items.map((s): StarInfo => ({ ...toRepo(s.repo), starredAt: s.starred_at ?? null })),
    starsTruncated: stars.truncated,
    fetchedAt: (opts.now?.() ?? new Date()).toISOString(),
  };
}
