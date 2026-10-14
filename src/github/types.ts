export interface RepoInfo {
  fullName: string;
  name: string;
  owner: string;
  url: string;
  description: string | null;
  topics: string[];
  language: string | null;
  stars: number;
  fork: boolean;
  pushedAt: string | null;
}

export interface StarInfo extends RepoInfo {
  starredAt: string | null;
}

export interface UserInfo {
  login: string;
  name: string | null;
  avatarUrl: string;
  url: string;
  publicRepos: number;
}

export interface Profile {
  user: UserInfo;
  repos: RepoInfo[];
  stars: StarInfo[];
  /** True when the account has more stars than the 1,000 we read. */
  starsTruncated: boolean;
  fetchedAt: string;
}
