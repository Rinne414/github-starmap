// One-hour localStorage cache per account. Storage can be missing, full or
// blocked (private windows, previews), so every access is best-effort.

import type { Profile } from "./types";

const PREFIX = "starmap:v1:";
export const CACHE_TTL_MS = 60 * 60 * 1000;

interface Entry {
  savedAt: number;
  profile: Profile;
}

const keyFor = (login: string): string => PREFIX + login.toLowerCase();

export function readCache(login: string, now: number = Date.now()): Profile | null {
  try {
    const raw = localStorage.getItem(keyFor(login));
    if (!raw) return null;
    const entry = JSON.parse(raw) as Partial<Entry>;
    const valid =
      typeof entry.savedAt === "number" &&
      typeof entry.profile?.user?.login === "string" &&
      Array.isArray(entry.profile.repos) &&
      Array.isArray(entry.profile.stars);
    if (!valid || now - entry.savedAt! > CACHE_TTL_MS) {
      localStorage.removeItem(keyFor(login));
      return null;
    }
    return entry.profile!;
  } catch {
    return null;
  }
}

export function writeCache(profile: Profile, now: number = Date.now()): void {
  const entry: Entry = { savedAt: now, profile };
  try {
    localStorage.setItem(keyFor(profile.user.login), JSON.stringify(entry));
  } catch {
    // quota exceeded or storage blocked: the page works without the cache
  }
}
