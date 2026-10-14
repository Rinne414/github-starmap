// Canvas drawing for the share card's star chart: night sky, planisphere rings,
// constellation lines, stars with glow and constellation names.

import { categoryName } from "../../i18n/i18n";
import { seeded, type StarChart } from "./starChart";

export const FONT = '"Noto Sans TC", "Microsoft JhengHei", "PingFang TC", system-ui, sans-serif';
const NEBULA_TINTS = ["192,132,252", "79,209,165", "110,168,254", "245,185,66", "244,114,182"];
const STAR_COLORS = { own: "255,214,128", fork: "255,160,120", star: "190,214,255" } as const;
const LABELLED = 8;

interface Circle {
  cx: number;
  cy: number;
  r: number;
}

export function drawBackdrop(ctx: CanvasRenderingContext2D, w: number, h: number, chart: StarChart, sky: Circle): void {
  ctx.fillStyle = "#05070c";
  ctx.fillRect(0, 0, w, h);
  // a nebula behind each of the biggest constellations
  chart.constellations.slice(0, NEBULA_TINTS.length).forEach((c, i) => {
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.spread * 3.2);
    g.addColorStop(0, `rgba(${NEBULA_TINTS[i]},0.20)`);
    g.addColorStop(1, `rgba(${NEBULA_TINTS[i]},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  const vignette = ctx.createRadialGradient(sky.cx, sky.cy, sky.r * 0.6, sky.cx, sky.cy, Math.max(w, h));
  vignette.addColorStop(0, "rgba(5,7,12,0)");
  vignette.addColorStop(1, "rgba(5,7,12,0.85)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
  // far-away background stars
  const rand = seeded(20261015);
  for (let i = 0; i < 320; i += 1) {
    ctx.fillStyle = `rgba(200,215,255,${0.08 + rand() * 0.35})`;
    ctx.beginPath();
    ctx.arc(rand() * w, rand() * h, rand() * 1.1 + 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Rings and tick marks like a planisphere. */
export function drawPlanisphere(ctx: CanvasRenderingContext2D, { cx, cy, r }: Circle): void {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1;
  for (const k of [1, 0.66, 0.33]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * k, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.setLineDash([2, 6]);
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.33, cy + Math.sin(a) * r * 0.33);
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  for (let i = 0; i < 72; i += 1) {
    const a = (i / 72) * Math.PI * 2;
    const len = i % 6 === 0 ? 10 : 4;
    ctx.strokeStyle = `rgba(255,255,255,${i % 6 === 0 ? 0.32 : 0.16})`;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    ctx.lineTo(cx + Math.cos(a) * (r + len), cy + Math.sin(a) * (r + len));
    ctx.stroke();
  }
  ctx.restore();
}

function glowStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, glow: number): void {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * glow);
  g.addColorStop(0, `rgba(${rgb},0.55)`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * glow, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(${rgb},1)`;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

export function drawChart(ctx: CanvasRenderingContext2D, chart: StarChart): void {
  ctx.save();
  ctx.lineWidth = 1;
  for (const l of chart.lines) {
    ctx.strokeStyle = `rgba(200,215,255,${l.alpha})`;
    ctx.beginPath();
    ctx.moveTo(l.x1, l.y1);
    ctx.lineTo(l.x2, l.y2);
    ctx.stroke();
  }
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = "rgba(255,226,163,0.55)";
  for (const c of chart.constellations) {
    if (c.path.length < 2) continue;
    ctx.beginPath();
    c.path.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
  }
  // faint stars first so the bright ones sit on top
  const order = { star: 0, fork: 1, own: 2 } as const;
  for (const s of [...chart.stars].sort((a, b) => order[a.kind] - order[b.kind])) {
    glowStar(ctx, s.x, s.y, s.r, STAR_COLORS[s.kind], s.kind === "star" ? 3 : 4.5);
  }
  ctx.restore();
}

/** Names of the biggest constellations, skipping any that would overlap. */
export function drawConstellationNames(ctx: CanvasRenderingContext2D, chart: StarChart): void {
  const taken: { x: number; y: number; w: number; h: number }[] = [];
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  for (const c of chart.constellations.slice(0, LABELLED)) {
    const size = c === chart.constellations[0] ? 24 : 18;
    ctx.font = `600 ${size}px ${FONT}`;
    const text = categoryName(c.category);
    const w = ctx.measureText(text).width + 12;
    const box = { x: c.x - w / 2, y: c.y - c.spread - size - 8, w, h: size + 8 };
    if (taken.some((t) => box.x < t.x + t.w && t.x < box.x + box.w && box.y < t.y + t.h && t.y < box.y + box.h)) continue;
    taken.push(box);
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "rgba(231,236,243,0.92)";
    ctx.fillText(text, c.x, c.y - c.spread - 8);
  }
  ctx.restore();
}
