import { describe, expect, test } from "vitest";
import charset from "../api/_fonts/charset.txt?raw";
import { decodeOgQuery, encodeOgQuery, type OgParams, ogImageFor, shareHtml, shareLinkFor } from "../src/share/og";
import { ogCharset, ogStrings } from "../src/share/ogText";
import { composeTitle } from "../src/share/title";

const params: OgParams = {
  login: "octo-cat",
  lang: "zh",
  title: { rookie: false, modifier: "breadth", category: "ai-image" },
  scores: { maker: 15, gem: 44, focus: null, breadth: 88, activity: 100 },
};

describe("share link query", () => {
  test("round-trips through the URL", () => {
    const q = new URLSearchParams(encodeOgQuery(params));
    expect(q.get("s")).toBe("15,44,-,88,100");
    expect(decodeOgQuery("octo-cat", q)).toEqual(params);
    const rookie: OgParams = { ...params, title: { rookie: true } };
    expect(decodeOgQuery("octo-cat", new URLSearchParams(encodeOgQuery(rookie)))).toEqual(rookie);
  });

  test.each([
    ["bad login", "-octo", "m=breadth&c=ai-image&s=1,2,3,4,5"],
    ["unknown modifier", "octo", "m=hacker&c=ai-image&s=1,2,3,4,5"],
    ["unknown category", "octo", "m=breadth&c=<script>&s=1,2,3,4,5"],
    ["score over 100", "octo", "m=breadth&c=ai-image&s=1,2,3,4,500"],
    ["too few scores", "octo", "m=breadth&c=ai-image&s=1,2,3"],
    ["text instead of a score", "octo", "m=breadth&c=ai-image&s=1,2,3,4,hi"],
  ])("rejects %s, so nobody can make the site render arbitrary text", (_, login, q) => {
    expect(decodeOgQuery(login, new URLSearchParams(q))).toBeNull();
  });

  test("builds the share and image links", () => {
    expect(shareLinkFor("https://x.app", params)).toBe("https://x.app/s/octo-cat?m=breadth&c=ai-image&s=15%2C44%2C-%2C88%2C100&l=zh");
    expect(ogImageFor("https://x.app", params)).toBe("https://x.app/api/og?u=octo-cat&m=breadth&c=ai-image&s=15%2C44%2C-%2C88%2C100&l=zh");
  });
});

describe("shareHtml", () => {
  const html = shareHtml("https://x.app", params);

  test("has the per-account preview tags and sends people on to the map", () => {
    expect(html).toContain(`<meta property="og:title" content="@octo-cat 的 GitHub 星座：雜食系煉圖師">`);
    expect(html).toContain(`<meta name="twitter:card" content="summary_large_image">`);
    expect(html).toContain(`content="https://x.app/api/og?u=octo-cat&amp;m=breadth`);
    expect(html).toContain(`<meta http-equiv="refresh" content="0; url=https://x.app/?u=octo-cat">`);
    expect(html).toContain("收藏廣度 88");
  });

  test("never contains a script, inline or not", () => {
    expect(html).not.toMatch(/<script/i);
  });
});

describe("preview font subset", () => {
  test("covers every character the preview image can draw", () => {
    const missing = [...new Set(ogStrings().join(""))].filter((c) => !charset.includes(c));
    // if this fails: regenerate api/_fonts/charset.txt and rerun scripts/build-og-fonts.py
    expect(missing).toEqual([]);
    expect([...ogCharset()].every((c) => charset.includes(c))).toBe(true);
  });

  test("titles read the same as in the app", () => {
    expect(composeTitle({ rookie: false, modifier: "gem", category: "devtools" }, "en")).toBe("Treasure-hunting Tool Geek");
    expect(composeTitle({ rookie: true }, "zh")).toBe("新手觀星者");
  });
});
