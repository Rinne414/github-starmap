// A flat "star chart" of one account for the share card: every category is a
// constellation, own repos are bright stars, stars are faint ones. The layout is
// deterministic (seeded by repo names), so the same account always gets the same sky.

import { allItems, type Analysis, type Item } from "../../analysis";
import { OTHER } from "../../classify/taxonomy";

export type StarKind = "own" | "fork" | "star";

export interface ChartStar {
  x: number;
  y: number;
  r: number;
  kind: StarKind;
}

export interface Constellation {
  category: string;
  x: number;
  y: number;
  /** Radius of the cluster; labels go just above it. */
  spread: number;
  count: number;
  /** Stick-figure line through the brightest members. */
  path: { x: number; y: number }[];
}

export interface ChartLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
}

export interface StarChart {
  stars: ChartStar[];
  constellations: Constellation[];
  lines: ChartLine[];
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const FIELD = 0.86; // share of the chart radius used by cluster centres
const PATH_STARS = 6;

/** FNV-1a, for stable per-repo randomness. */
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return h >>> 0;
}

/** mulberry32 */
export function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = Math.imul(s ^ (s >>> 15), 1 | s);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

const brightness = (i: Item): number => (i.kind === "repo" && !i.repo.fork ? 1e9 : 0) + i.repo.stars;

function starRadius(i: Item): number {
  const log = Math.log10(i.repo.stars + 1);
  if (i.kind === "star") return Math.min(2.6, 0.8 + 0.42 * log);
  if (i.repo.fork) return 1.9;
  return Math.min(6.5, 2.6 + 1.1 * log);
}

function groupByCategory(items: Item[]): [string, Item[]][] {
  const groups = new Map<string, Item[]>();
  for (const i of items) groups.set(i.category, [...(groups.get(i.category) ?? []), i]);
  // biggest constellation in the middle, 其他 always last (outermost)
  return [...groups].sort(([ka, a], [kb, b]) => Number(ka === OTHER) - Number(kb === OTHER) || b.length - a.length || ka.localeCompare(kb));
}

function placeItems(group: Item[], cx: number, cy: number, spread: number, out: StarChart): { x: number; y: number; item: Item }[] {
  const placed = group.map((item) => {
    const rand = seeded(hash(item.id));
    const angle = rand() * Math.PI * 2;
    const dist = spread * Math.sqrt(rand()) * (item.kind === "star" ? 1 : 0.75);
    return { x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist, item };
  });
  for (const p of placed) {
    out.stars.push({ x: p.x, y: p.y, r: starRadius(p.item), kind: p.item.kind === "star" ? "star" : p.item.repo.fork ? "fork" : "own" });
    out.lines.push({ x1: cx, y1: cy, x2: p.x, y2: p.y, alpha: p.item.kind === "star" ? 0.035 : 0.09 });
  }
  return placed;
}

/** Brightest members, joined in angular order around the cluster centre. */
function stickFigure(placed: { x: number; y: number; item: Item }[], cx: number, cy: number): { x: number; y: number }[] {
  return [...placed]
    .sort((a, b) => brightness(b.item) - brightness(a.item))
    .slice(0, PATH_STARS)
    .sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx))
    .map(({ x, y }) => ({ x, y }));
}

export function layoutStarChart(a: Analysis, cx: number, cy: number, radius: number): StarChart {
  const out: StarChart = { stars: [], constellations: [], lines: [] };
  const groups = groupByCategory(allItems(a));
  const maxCount = Math.max(1, ...groups.map(([, g]) => g.length));
  const rotation = (hash(a.user.login) % 360) * (Math.PI / 180);

  groups.forEach(([category, group], rank) => {
    const r = groups.length === 1 ? 0 : radius * FIELD * Math.sqrt((rank + 0.35) / groups.length);
    const angle = rotation + rank * GOLDEN_ANGLE;
    const cx2 = cx + Math.cos(angle) * r;
    const cy2 = cy + Math.sin(angle) * r;
    const spread = radius * (0.06 + 0.16 * Math.sqrt(group.length / maxCount));
    const placed = placeItems(group, cx2, cy2, spread, out);
    out.constellations.push({ category, x: cx2, y: cy2, spread, count: group.length, path: stickFigure(placed, cx2, cy2) });
  });

  // faint bridges between neighbouring constellations make it read as one sky
  out.constellations.forEach((c, i) => {
    const nearest = out.constellations
      .slice(0, i)
      .reduce<Constellation | null>((best, o) => (!best || Math.hypot(o.x - c.x, o.y - c.y) < Math.hypot(best.x - c.x, best.y - c.y) ? o : best), null);
    if (nearest) out.lines.push({ x1: c.x, y1: c.y, x2: nearest.x, y2: nearest.y, alpha: 0.12 });
  });
  return out;
}
