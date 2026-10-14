import type { Analysis, Item } from "../src/analysis";
import type { RepoInfo } from "../src/github/types";

export function repo(name: string, patch: Partial<RepoInfo> = {}): RepoInfo {
  return {
    fullName: `someone/${name}`,
    name,
    owner: "someone",
    url: `https://github.com/someone/${name}`,
    description: null,
    topics: [],
    language: null,
    stars: 0,
    fork: false,
    pushedAt: null,
    ...patch,
  };
}

export function item(kind: "repo" | "star", subjects: string[], category: string, patch: Partial<Omit<Item, "repo">> & { repo?: Partial<RepoInfo> } = {}): Item {
  const r = repo(`${kind}-${subjects.join("-") || "none"}-${Math.random().toString(36).slice(2, 7)}`, patch.repo);
  return { id: `${kind}:${r.fullName}`, kind, starredAt: null, ...patch, repo: r, subjects, category };
}

export function analysis(own: Item[], stars: Item[], forks: Item[] = []): Analysis {
  return {
    user: { login: "someone", name: null, avatarUrl: "", url: "", publicRepos: own.length },
    own,
    forks,
    stars,
    starsTruncated: false,
  };
}
