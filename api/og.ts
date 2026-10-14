// GET /api/og?u=<login>&m=&c=&s=&l= -> 1200x630 link preview for one account.
// Everything comes from the validated query; GitHub is only asked for the avatar.

import { ImageResponse } from "@vercel/og";
import { decodeOgQuery } from "../src/share/og";
import { OG_FONT, OG_H, OG_W, ogCard } from "../src/share/ogCard";

export const config = { runtime: "edge" };

const AVATAR_TIMEOUT_MS = 2000;
const AVATAR_MAX_BYTES = 300_000;
const AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/gif"]);
const CACHE_LONG = "public, max-age=86400, s-maxage=31536000, immutable";
/** A card drawn without the avatar (GitHub hiccup) should not stick for a year. */
const CACHE_SHORT = "public, max-age=300, s-maxage=300";

let fontsPromise: Promise<[ArrayBuffer, ArrayBuffer]> | null = null;

function loadFonts(): Promise<[ArrayBuffer, ArrayBuffer]> {
  fontsPromise ??= Promise.all([
    fetch(new URL("./_fonts/NotoSansTC-Medium.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
    fetch(new URL("./_fonts/NotoSansTC-ExtraBold.ttf", import.meta.url)).then((r) => r.arrayBuffer()),
  ]).catch((error: unknown) => {
    fontsPromise = null; // let the next request retry instead of failing forever
    throw error;
  });
  return fontsPromise;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

type Avatar = { kind: "ok"; dataUrl: string } | { kind: "missing" } | { kind: "unavailable" };

async function avatar(login: string): Promise<Avatar> {
  try {
    const res = await fetch(`https://github.com/${encodeURIComponent(login)}.png?size=192`, { signal: AbortSignal.timeout(AVATAR_TIMEOUT_MS) });
    if (res.status === 404) return { kind: "missing" };
    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    if (!res.ok || !AVATAR_TYPES.has(type) || Number(res.headers.get("content-length") ?? 0) > AVATAR_MAX_BYTES) return { kind: "unavailable" };
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length > AVATAR_MAX_BYTES) return { kind: "unavailable" };
    return { kind: "ok", dataUrl: `data:${type};base64,${toBase64(bytes)}` };
  } catch {
    return { kind: "unavailable" }; // the card still works without the avatar
  }
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const params = decodeOgQuery(url.searchParams.get("u"), url.searchParams);
  const generic = Response.redirect(new URL("/og.jpg", url.origin), 302);
  if (!params) return generic;
  const [[medium, bold], photo] = await Promise.all([loadFonts(), avatar(params.login)]);
  // no such account: do not spend a render on it
  if (photo.kind === "missing") return generic;
  return new ImageResponse(ogCard(params, photo.kind === "ok" ? photo.dataUrl : null) as never, {
    width: OG_W,
    height: OG_H,
    fonts: [
      { name: OG_FONT, data: medium, weight: 500, style: "normal" },
      { name: OG_FONT, data: bold, weight: 800, style: "normal" },
    ],
    // lower-case key on purpose: it replaces @vercel/og's default instead of adding a second value
    headers: { "cache-control": photo.kind === "ok" ? CACHE_LONG : CACHE_SHORT },
  });
}
