// Per-account link previews. A share link carries the title and scores in its
// query (/s/<login>?m=&c=&s=&l=), so the preview function never calls GitHub.
// Only known keys and 0-100 numbers are accepted, so nobody can make the site
// render arbitrary text.

import { CATEGORY_BY_KEY } from "../classify/taxonomy";
import { SCORE_KEYS, type ScoreKey, type ScoreResult, type TitleModifier } from "../score/score";
import { composeTitle, type ShareLang, STRINGS } from "./title";

export const LOGIN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;
const MODIFIERS: readonly (TitleModifier | "rookie")[] = [...SCORE_KEYS, "laid-back", "rookie"];

export interface OgParams {
  login: string;
  lang: ShareLang;
  title: ScoreResult["title"];
  scores: Record<ScoreKey, number | null>;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function encodeOgQuery(p: OgParams): string {
  const q = new URLSearchParams({
    m: p.title.rookie ? "rookie" : p.title.modifier,
    c: p.title.rookie ? "" : p.title.category,
    s: SCORE_KEYS.map((k) => p.scores[k] ?? "-").join(","),
    l: p.lang,
  });
  if (p.title.rookie) q.delete("c");
  return q.toString();
}

function parseScores(raw: string | null): Record<ScoreKey, number | null> | null {
  const parts = (raw ?? "").split(",");
  if (parts.length !== SCORE_KEYS.length) return null;
  const values = parts.map((v) => (v === "-" ? null : /^\d{1,3}$/.test(v) && Number(v) <= 100 ? Number(v) : NaN));
  if (values.some((v) => Number.isNaN(v))) return null;
  return Object.fromEntries(SCORE_KEYS.map((k, i) => [k, values[i]])) as Record<ScoreKey, number | null>;
}

export function decodeOgQuery(login: string | null, q: URLSearchParams): OgParams | null {
  if (!login || !LOGIN.test(login)) return null;
  const modifier = q.get("m") as TitleModifier | "rookie" | null;
  if (!modifier || !MODIFIERS.includes(modifier)) return null;
  const scores = parseScores(q.get("s"));
  if (!scores) return null;
  const lang: ShareLang = q.get("l") === "en" ? "en" : "zh";
  if (modifier === "rookie") return { login, lang, title: { rookie: true }, scores };
  const category = q.get("c") ?? "";
  if (!CATEGORY_BY_KEY.has(category)) return null;
  return { login, lang, title: { rookie: false, modifier, category }, scores };
}

export const shareLinkFor = (origin: string, p: OgParams): string => `${origin}/s/${encodeURIComponent(p.login)}?${encodeOgQuery(p)}`;
export const ogImageFor = (origin: string, p: OgParams): string => `${origin}/api/og?u=${encodeURIComponent(p.login)}&${encodeOgQuery(p)}`;
export const mapLinkFor = (origin: string, login: string): string => `${origin}/?u=${encodeURIComponent(login)}`;

export function scoreSummary(p: OgParams): string {
  const table = STRINGS[p.lang];
  return SCORE_KEYS.map((k) => `${table[`score.${k}`]} ${p.scores[k] ?? "—"}`).join(" · ");
}

/** The page crawlers read for a share link; people are sent on to the map. */
export function shareHtml(origin: string, p: OgParams): string {
  const table = STRINGS[p.lang];
  const title = composeTitle(p.title, p.lang);
  const pageTitle = table["og.title"].replace("{login}", p.login).replace("{title}", title);
  const description = `${scoreSummary(p)}. ${table["og.description"]}`;
  const target = mapLinkFor(origin, p.login);
  const e = escapeHtml;
  return `<!doctype html>
<html lang="${p.lang === "zh" ? "zh-Hant" : "en"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(pageTitle)}</title>
<meta name="description" content="${e(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${e(table["app.title"])}">
<meta property="og:title" content="${e(pageTitle)}">
<meta property="og:description" content="${e(description)}">
<meta property="og:url" content="${e(shareLinkFor(origin, p))}">
<meta property="og:image" content="${e(ogImageFor(origin, p))}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${e(pageTitle)}">
<meta name="twitter:description" content="${e(description)}">
<meta name="twitter:image" content="${e(ogImageFor(origin, p))}">
<meta http-equiv="refresh" content="0; url=${e(target)}">
<link rel="canonical" href="${e(shareLinkFor(origin, p))}">
</head>
<body style="background:#0a0d12;color:#e7ecf3;font-family:system-ui,sans-serif">
<p><a href="${e(target)}" style="color:#f5b942">${e(pageTitle)}</a></p>
</body>
</html>
`;
}
