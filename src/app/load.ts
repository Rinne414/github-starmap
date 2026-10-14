import { fetchProfile, GithubError, type Progress } from "../github/api";
import { readCache, writeCache } from "../github/cache";
import type { Profile } from "../github/types";
import { getLang, t } from "../i18n/i18n";

export async function loadProfile(login: string, onProgress: (p: Progress) => void): Promise<Profile> {
  const cached = readCache(login);
  if (cached) return cached;
  const profile = await fetchProfile(login, { onProgress });
  writeCache(profile);
  return profile;
}

function untilText(resetAt: Date, now: Date): string {
  const minutes = Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 60000));
  const clock = resetAt.toLocaleTimeString(getLang() === "zh" ? "zh-TW" : "en-US", { hour: "2-digit", minute: "2-digit" });
  return getLang() === "zh" ? `${minutes} 分鐘（${clock}）` : `${minutes} min (${clock})`;
}

export function errorMessage(error: unknown, login: string, now: Date = new Date()): string {
  if (!(error instanceof GithubError)) return t("error.network");
  switch (error.kind) {
    case "not-found":
      return t("error.notFound", { login });
    case "rate-limit":
      return error.resetAt ? t("error.rateLimit", { time: untilText(error.resetAt, now) }) : t("error.rateLimitNoTime");
    case "forbidden":
      return t("error.forbidden");
    case "network":
      return t("error.network");
    case "http":
      return t("error.http", { status: error.status ?? "?" });
  }
}
