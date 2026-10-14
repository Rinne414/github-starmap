// Five scores as a pentagon radar: with five axes the filled shape reads as a star.

import { SCORE_KEYS, type ScoreKey } from "../../score/score";
import { FONT } from "./sky";

export function drawRadar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  scores: Record<ScoreKey, number | null>,
  label: (key: ScoreKey) => string,
): void {
  const point = (i: number, k: number) => {
    const a = -Math.PI / 2 + (i / SCORE_KEYS.length) * Math.PI * 2;
    return { x: cx + Math.cos(a) * r * k, y: cy + Math.sin(a) * r * k };
  };
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  for (const k of [0.25, 0.5, 0.75, 1]) {
    ctx.beginPath();
    SCORE_KEYS.forEach((_, i) => {
      const p = point(i, k);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.stroke();
  }
  SCORE_KEYS.forEach((_, i) => {
    const p = point(i, 1);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  });

  const values = SCORE_KEYS.map((key, i) => point(i, Math.max(0.04, (scores[key] ?? 0) / 100)));
  const fill = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  fill.addColorStop(0, "rgba(192,132,252,0.55)");
  fill.addColorStop(1, "rgba(245,185,66,0.55)");
  ctx.fillStyle = fill;
  ctx.strokeStyle = "rgba(255,226,163,0.95)";
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(245,185,66,0.6)";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  values.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  SCORE_KEYS.forEach((key, i) => {
    const p = point(i, 1.32);
    const value = scores[key];
    ctx.textAlign = p.x < cx - 4 ? "right" : p.x > cx + 4 ? "left" : "center";
    ctx.fillStyle = "rgba(207,214,224,0.95)";
    ctx.font = `500 17px ${FONT}`;
    ctx.fillText(label(key), p.x, p.y - 2);
    ctx.fillStyle = "#ffe2a3";
    ctx.font = `700 22px ${FONT}`;
    ctx.fillText(value === null ? "—" : String(value), p.x, p.y + 22);
  });
  ctx.restore();
}
