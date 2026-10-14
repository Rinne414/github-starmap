// The link preview layout (1200x630): avatar, login, fun title and a call to
// action on the left; planisphere rings and the real score radar on the right.
// The background stars are decoration seeded by the login, not the real map.

import { SCORE_KEYS } from "../score/score";
import type { OgParams } from "./og";
import { composeTitle, STRINGS } from "./title";

export const OG_W = 1200;
export const OG_H = 630;
const RADAR = { cx: 905, cy: 300, r: 168 };
export const OG_FONT = "Noto Sans TC";

export interface El {
  type: string;
  key: null;
  props: Record<string, unknown>;
}
type Child = El | string | null;

/** Plain element objects; satori reads type/props the same way as React elements. */
function h(type: string, props: Record<string, unknown>, ...children: Child[]): El {
  const kids = children.filter((c) => c !== null);
  return { type, key: null, props: { ...props, children: kids.length === 1 ? kids[0] : kids } };
}

function seeded(text: string): () => number {
  let s = [...text].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const point = (i: number, k: number) => {
  const a = -Math.PI / 2 + (i / SCORE_KEYS.length) * Math.PI * 2;
  return { x: RADAR.cx + Math.cos(a) * RADAR.r * k, y: RADAR.cy + Math.sin(a) * RADAR.r * k };
};

/** Decorative sky (seeded by the login), planisphere rings and the real score radar. */
function skySvg(p: OgParams): El {
  const rand = seeded(p.login);
  const stars = Array.from({ length: 110 }, () =>
    h("circle", { cx: (rand() * OG_W).toFixed(1), cy: (rand() * OG_H).toFixed(1), r: (rand() * 1.4 + 0.3).toFixed(2), fill: `rgba(200,215,255,${(0.15 + rand() * 0.5).toFixed(2)})` }),
  );
  const ring = (k: number, alpha: number) => h("circle", { cx: RADAR.cx, cy: RADAR.cy, r: RADAR.r * k, fill: "none", stroke: `rgba(255,255,255,${alpha})`, "stroke-width": 1 });
  const pentagon = (k: number) => SCORE_KEYS.map((_, i) => point(i, k)).map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" ");
  const values = SCORE_KEYS.map((key, i) => point(i, Math.max(0.05, (p.scores[key] ?? 0) / 100)));
  return h(
    "svg",
    { width: OG_W, height: OG_H, viewBox: `0 0 ${OG_W} ${OG_H}`, style: { position: "absolute", left: 0, top: 0 } },
    ...stars,
    ring(1.45, 0.1),
    ring(1.18, 0.06),
    ...[0.33, 0.66, 1].map((k) => h("polygon", { points: pentagon(k), fill: "none", stroke: "rgba(255,255,255,0.12)", "stroke-width": 1 })),
    h("polygon", { points: values.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(" "), fill: "rgba(245,185,66,0.32)", stroke: "#ffe2a3", "stroke-width": 3 }),
    ...values.map((q) => h("circle", { cx: q.x.toFixed(1), cy: q.y.toFixed(1), r: 5, fill: "#ffe2a3" })),
  );
}

function radarLabels(p: OgParams): El[] {
  const table = STRINGS[p.lang];
  return SCORE_KEYS.map((key, i) => {
    const q = point(i, 1.3);
    const value = p.scores[key];
    return h(
      "div",
      { style: { position: "absolute", left: q.x - 90, top: q.y - 26, width: 180, display: "flex", flexDirection: "column", alignItems: "center" } },
      h("div", { style: { fontSize: 18, color: "#cfd6e0" } }, table[`score.${key}`]),
      h("div", { style: { fontSize: 26, fontWeight: 800, color: "#ffe2a3" } }, value === null ? "—" : String(value)),
    );
  });
}

function textColumn(p: OgParams, photo: string | null): El {
  const table = STRINGS[p.lang];
  const title = composeTitle(p.title, p.lang);
  const size = title.length <= 7 ? 76 : title.length <= 10 ? 64 : title.length <= 22 ? 52 : 44;
  return h(
    "div",
    { style: { position: "absolute", left: 72, top: 64, width: 600, height: 520, display: "flex", flexDirection: "column" } },
    h(
      "div",
      { style: { display: "flex", alignItems: "center" } },
      photo ? h("img", { src: photo, width: 92, height: 92, style: { borderRadius: 46, marginRight: 22, border: "2px solid rgba(255,255,255,0.18)" } }) : null,
      h(
        "div",
        { style: { display: "flex", flexDirection: "column" } },
        h("div", { style: { fontSize: 40, fontWeight: 800, color: "#e7ecf3" } }, `@${p.login}`),
        h("div", { style: { fontSize: 22, color: "#8b97a8" } }, table["app.title"]),
      ),
    ),
    h("div", { style: { marginTop: 54, fontSize: 24, color: "#8b97a8" } }, table["png.constellation"]),
    h("div", { style: { marginTop: 6, fontSize: size, fontWeight: 800, lineHeight: 1.15, color: "#ffd27a", textShadow: "0 0 28px rgba(245,185,66,0.45)" } }, title),
    h(
      "div",
      {
        style: {
          marginTop: "auto", alignSelf: "flex-start", display: "flex", padding: "12px 24px", borderRadius: 999, fontSize: 24, fontWeight: 800,
          color: "#1a1205", backgroundImage: "linear-gradient(135deg, #f5b942, #ffd479 55%, #e9b6ff)",
        },
      },
      table["og.cta"],
    ),
    h("div", { style: { marginTop: 18, fontSize: 18, color: "#8b97a8" } }, `${table["png.disclaimer"]} · github-starmap.vercel.app`),
  );
}


export function ogCard(params: OgParams, photo: string | null): El {
  return h(
    "div",
    {
      style: {
        width: OG_W, height: OG_H, display: "flex", position: "relative", fontFamily: OG_FONT, backgroundColor: "#05070c",
        backgroundImage: "radial-gradient(circle at 78% 45%, rgba(192,132,252,0.30), rgba(5,7,12,0) 45%), radial-gradient(circle at 8% 100%, rgba(79,209,165,0.16), rgba(5,7,12,0) 40%)",
      },
    },
    skySvg(params),
    ...radarLabels(params),
    textColumn(params, photo),
  );
}
