// The share poster: a portrait "personal constellation" poster (1080x1350) with
// the account's star chart, its fun title, a five-point score radar and trivia.

import type { Analysis } from "../analysis";
import { formatNumber, t } from "../i18n/i18n";
import type { StringKey } from "../i18n/strings";
import { type Fact, pickFacts } from "../score/facts";
import type { ScoreResult } from "../score/score";
import { drawRadar } from "./card/radar";
import { drawBackdrop, drawChart, drawConstellationNames, drawPlanisphere, FONT } from "./card/sky";
import { layoutStarChart } from "./card/starChart";
import { scoreLabel, titleText } from "./profile";

const W = 1080;
const H = 1350;
const PAD = 56;
const SKY = { cx: W / 2, cy: 470, r: 372 };
const AVATAR_TIMEOUT_MS = 3000;
const C = { text: "#e7ecf3", body: "#cfd6e0", muted: "#8b97a8", gold: "#ffd27a", own: "#ffd680", star: "#bed6ff" };

function loadAvatar(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timer = setTimeout(() => resolve(null), AVATAR_TIMEOUT_MS);
    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    img.src = `${url}${url.includes("?") ? "&" : "?"}s=192`;
  });
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut}…`;
}

function drawHeader(ctx: CanvasRenderingContext2D, a: Analysis, avatar: HTMLImageElement | null): void {
  const size = 72;
  const textX = avatar ? PAD + size + 18 : PAD;
  if (avatar) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(PAD + size / 2, 48 + size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, PAD, 48, size, size);
    ctx.restore();
  }
  ctx.textAlign = "left";
  ctx.fillStyle = C.text;
  ctx.font = `700 34px ${FONT}`;
  ctx.fillText(fit(ctx, `@${a.user.login}`, 520), textX, 86);
  if (a.user.name) {
    ctx.fillStyle = C.muted;
    ctx.font = `400 19px ${FONT}`;
    ctx.fillText(fit(ctx, a.user.name, 520), textX, 114);
  }
  ctx.textAlign = "right";
  ctx.fillStyle = C.body;
  ctx.font = `700 22px ${FONT}`;
  ctx.fillText(t("app.title"), W - PAD, 80);
  ctx.fillStyle = C.muted;
  ctx.font = `500 14px ${FONT}`;
  ctx.fillText("S T A R M A P", W - PAD, 104);
  ctx.textAlign = "left";
}

function drawTitle(ctx: CanvasRenderingContext2D, r: ScoreResult): void {
  // fade the sky out under the text
  const fade = ctx.createLinearGradient(0, 780, 0, 900);
  fade.addColorStop(0, "rgba(5,7,12,0)");
  fade.addColorStop(1, "rgba(5,7,12,1)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, 780, W, H - 780);
  ctx.fillStyle = C.muted;
  ctx.font = `500 18px ${FONT}`;
  ctx.fillText(t("png.constellation"), PAD, 890);
  const title = titleText(r);
  let size = 64;
  ctx.font = `800 ${size}px ${FONT}`;
  while (size > 36 && ctx.measureText(title).width > W - PAD * 2) {
    size -= 2;
    ctx.font = `800 ${size}px ${FONT}`;
  }
  const g = ctx.createLinearGradient(PAD, 0, PAD + ctx.measureText(title).width, 0);
  g.addColorStop(0, "#f5b942");
  g.addColorStop(0.55, "#ffe2a3");
  g.addColorStop(1, "#c084fc");
  ctx.fillStyle = g;
  ctx.shadowColor = "rgba(245,185,66,0.35)";
  ctx.shadowBlur = 24;
  ctx.fillText(title, PAD, 958);
  ctx.shadowBlur = 0;
}

function factValue(f: Fact): string {
  if (f.kind === "firstStar") return t("trivia.year", { year: f.value });
  if (f.kind === "topLanguage") return t("trivia.repos", { n: formatNumber(f.value) });
  return t("trivia.stars", { n: formatNumber(f.value) });
}

function drawTrivia(ctx: CanvasRenderingContext2D, facts: Fact[]): void {
  const x = 540;
  const right = W - PAD;
  ctx.fillStyle = C.body;
  ctx.font = `700 20px ${FONT}`;
  ctx.fillText(t("trivia.heading"), x, 1022);
  facts.forEach((f, i) => {
    const y = 1070 + i * 72;
    ctx.fillStyle = C.muted;
    ctx.font = `500 16px ${FONT}`;
    ctx.fillText(t(`trivia.${f.kind}` as StringKey), x, y);
    const value = factValue(f);
    ctx.font = `700 22px ${FONT}`;
    const valueWidth = ctx.measureText(value).width;
    ctx.textAlign = "right";
    ctx.fillStyle = C.gold;
    ctx.fillText(value, right, y + 30);
    ctx.textAlign = "left";
    ctx.fillStyle = C.text;
    ctx.font = `600 22px ${FONT}`;
    ctx.fillText(fit(ctx, f.label, right - x - valueWidth - 16), x, y + 30);
  });
}

function drawFooter(ctx: CanvasRenderingContext2D, shareUrl: string): void {
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.beginPath();
  ctx.moveTo(PAD, 1262);
  ctx.lineTo(W - PAD, 1262);
  ctx.stroke();
  ctx.font = `400 17px ${FONT}`;
  ctx.fillStyle = C.muted;
  ctx.fillText(t("png.disclaimer"), PAD, 1300);
  ctx.fillText(shareUrl.replace(/^https?:\/\//, ""), PAD, 1326);
  // legend
  ctx.textAlign = "right";
  let x = W - PAD;
  for (const [label, color] of [
    [t("png.legendStar"), C.star],
    [t("png.legendOwn"), C.own],
  ] as const) {
    ctx.fillStyle = C.body;
    ctx.fillText(label, x, 1313);
    x -= ctx.measureText(label).width + 12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, 1307, 5, 0, Math.PI * 2);
    ctx.fill();
    x -= 28;
  }
  ctx.textAlign = "left";
}

export async function renderCardCanvas(a: Analysis, r: ScoreResult, shareUrl: string): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available");
  await document.fonts?.ready;
  const avatar = await loadAvatar(a.user.avatarUrl);
  const chart = layoutStarChart(a, SKY.cx, SKY.cy, SKY.r * 0.98);
  drawBackdrop(ctx, W, H, chart, SKY);
  drawPlanisphere(ctx, SKY);
  drawChart(ctx, chart);
  drawConstellationNames(ctx, chart);
  drawHeader(ctx, a, avatar);
  drawTitle(ctx, r);
  drawRadar(ctx, 250, 1132, 86, r.scores, scoreLabel);
  drawTrivia(ctx, pickFacts(a));
  drawFooter(ctx, shareUrl);
  return canvas;
}

export async function renderCardBlob(a: Analysis, r: ScoreResult, shareUrl: string): Promise<Blob> {
  const canvas = await renderCardCanvas(a, r, shareUrl);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("PNG export failed");
  return blob;
}

export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
