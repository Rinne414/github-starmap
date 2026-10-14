import { classify } from "./classify/classifier";
import type { Profile, RepoInfo, UserInfo } from "./github/types";

export type ItemKind = "repo" | "star";

export interface Item {
  /** Graph node id: "repo:owner/name" or "star:owner/name". */
  id: string;
  kind: ItemKind;
  repo: RepoInfo;
  starredAt: string | null;
  subjects: string[];
  category: string;
  /** Category guessed from the main language only; left out of focus and the title. */
  guessed: boolean;
}

export interface Analysis {
  user: UserInfo;
  /** Own repos that are not forks: these count as "things you built". */
  own: Item[];
  /** Forks are drawn on the graph but left out of every score. */
  forks: Item[];
  /** Stars on other people's repos (starring your own repo counts as the repo). */
  stars: Item[];
  starsTruncated: boolean;
}

function toItem(kind: ItemKind, repo: RepoInfo, starredAt: string | null): Item {
  const { subjects, category, guessed } = classify(repo);
  return { id: `${kind}:${repo.fullName}`, kind, repo, starredAt, subjects, category, guessed };
}

export function analyze(profile: Profile): Analysis {
  const login = profile.user.login.toLowerCase();
  const repos = profile.repos.map((r) => toItem("repo", r, null));
  const ownNames = new Set(profile.repos.map((r) => r.fullName.toLowerCase()));
  const stars = profile.stars
    .filter((s) => s.owner.toLowerCase() !== login && !ownNames.has(s.fullName.toLowerCase()))
    .map((s) => toItem("star", s, s.starredAt));
  return {
    user: profile.user,
    own: repos.filter((i) => !i.repo.fork),
    forks: repos.filter((i) => i.repo.fork),
    stars,
    starsTruncated: profile.starsTruncated,
  };
}

export function allItems(a: Analysis): Item[] {
  return [...a.own, ...a.forks, ...a.stars];
}
