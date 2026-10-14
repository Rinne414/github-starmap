// GET /s/<login>?m=&c=&s=&l= (rewritten to /api/share?login=<login>&...).
// Crawlers read the per-account preview tags; people are sent on to the map.

import { decodeOgQuery, mapLinkFor, shareHtml } from "../src/share/og";

export const config = { runtime: "edge" };

export default function handler(req: Request): Response {
  const url = new URL(req.url);
  const login = url.searchParams.get("login");
  const params = decodeOgQuery(login, url.searchParams);
  if (!params) {
    // a hand-edited or truncated link still lands somewhere useful
    const fallback = login && /^[a-z\d-]{1,39}$/i.test(login) ? mapLinkFor(url.origin, login) : `${url.origin}/`;
    return Response.redirect(fallback, 302);
  }
  return new Response(shareHtml(url.origin, params), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600, s-maxage=86400" },
  });
}
