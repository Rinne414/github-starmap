// Draws the score card onto a canvas and downloads it as a PNG.

import type { Analysis } from "../analysis";
import { t } from "../i18n/i18n";
import { SCORE_KEYS, type ScoreResult } from "../score/score";
import { scoreFact, scoreLabel, titleText } from "./profile";

const W = 1200;
const H = 630;
const PAD = 72;
const FONT = '"Noto Sans TC", "Microsoft JhengHei", "PingFang TC", system-ui, sans-serif';
const AVATAR_TIMEOUT_MS = 3000;
const COLORS = { bg: "#0a0d12", text: "#e7ecf3", muted: "#8b97a8", track: "rgba(255,255,255,0.08)", accent: "#f5b942", purple: "#c084fc" };

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

function drawBackground(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.85, H * 0.1, 10, W * 0.85, H * 0.1, W * 0.7);
  glow.addColorStop(0, "rgba(192,132,252,0.22)");
  glow.addColorStop(1, "rgba(192,132,252,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  // fixed pseudo-random star field, so every export looks the same
  let seed = 7;
  const rand = (): number => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 140; i += 1) {
    ctx.fillStyle = `rgba(160,190,255,${0.15 + rand() * 0.5})`;
    ctx.beginPath();
    ctx.arc(rand() * W, rand() * H, rand() * 1.6 + 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHeader(ctx: CanvasRenderingContext2D, a: Analysis, r: ScoreResult, avatar: HTMLImageElement | null): void {
  const size = 88;
  const textX = avatar ? PAD + size + 24 : PAD;
  if (avatar) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(PAD + size / 2, PAD + size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(avatar, PAD, PAD, size, size);
    ctx.restore();
  }
  ctx.fillStyle = COLORS.text;
  ctx.font = `600 34px ${FONT}`;
  ctx.fillText(`@${a.user.login}`, textX, PAD + 40);
  ctx.fillStyle = COLORS.muted;
  ctx.font = `400 22px ${FONT}`;
  ctx.fillText(`${t("app.title")} · ${t("card.heading")}`, textX, PAD + 76);
  ctx.fillStyle = COLORS.accent;
  ctx.font = `700 54px ${FONT}`;
  ctx.fillText(titleText(r), PAD, PAD + 170, W - PAD * 2);
}

function drawScores(ctx: CanvasRenderingContext2D, r: ScoreResult): void {
  const top = PAD + 225;
  const rowH = 56;
  const barX = PAD + 230;
  const barW = W - PAD * 2 - 230 - 90;
  SCORE_KEYS.forEach((key, i) => {
    const y = top + i * rowH;
    const value = r.scores[key];
    ctx.fillStyle = COLORS.text;
    ctx.font = `500 24px ${FONT}`;
    ctx.fillText(scoreLabel(key), PAD, y + 10);
    ctx.fillStyle = COLORS.muted;
    ctx.font = `400 15px ${FONT}`;
    ctx.fillText(value === null ? "—" : scoreFact(key, r), PAD, y + 32, 220);
    ctx.fillStyle = COLORS.track;
    ctx.fillRect(barX, y - 4, barW, 12);
    const fill = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    fill.addColorStop(0, COLORS.purple);
    fill.addColorStop(1, COLORS.accent);
    ctx.fillStyle = fill;
    ctx.fillRect(barX, y - 4, (barW * (value ?? 0)) / 100, 12);
    ctx.fillStyle = COLORS.text;
    ctx.font = `700 28px ${FONT}`;
    ctx.textAlign = "right";
    ctx.fillText(value === null ? "—" : String(value), W - PAD, y + 10);
    ctx.textAlign = "left";
  });
}

function drawFooter(ctx: CanvasRenderingContext2D, shareUrl: string): void {
  ctx.fillStyle = COLORS.muted;
  ctx.font = `400 18px ${FONT}`;
  ctx.fillText(t("png.footer"), PAD, H - 36);
  ctx.textAlign = "right";
  ctx.fillText(shareUrl.replace(/^https?:\/\//, ""), W - PAD, H - 36);
  ctx.textAlign = "left";
}

export async function renderCardCanvas(a: Analysis, r: ScoreResult, shareUrl: string): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available");
  await document.fonts?.ready;
  drawBackground(ctx);
  drawHeader(ctx, a, r, await loadAvatar(a.user.avatarUrl));
  drawScores(ctx, r);
  drawFooter(ctx, shareUrl);
  return canvas;
}

export async function downloadCard(a: Analysis, r: ScoreResult, shareUrl: string): Promise<void> {
  const canvas = await renderCardCanvas(a, r, shareUrl);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("PNG export failed");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `starmap-${a.user.login}.png`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
