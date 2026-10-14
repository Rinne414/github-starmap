import { expect, type Page, test } from "@playwright/test";
import { DEMO, mockGithub } from "./mockGithub";

const SHOTS = "e2e/screenshots";
let step = 0;
const shot = async (page: Page, name: string): Promise<void> => {
  step += 1;
  await page.screenshot({ path: `${SHOTS}/${String(step).padStart(2, "0")}-${name}.png` });
};

/** The graph sets data-graph="ready" once the first layout settles (5-7 s on software WebGL). */
const waitForGraph = (page: Page) => expect(page.locator("body")).toHaveAttribute("data-graph", "ready", { timeout: 60_000 });

test.use({ locale: "zh-TW", permissions: ["clipboard-read", "clipboard-write"] });

test("full flow: landing, load, explore, share, switch language", async ({ page }) => {
  const log = await mockGithub(page);
  await page.goto("/");
  await expect(page.locator("#landing-title")).toHaveText("GitHub 星圖");
  await shot(page, "landing-zh");

  await page.fill("#lookup", "not a valid name!");
  await page.click("#lookup-go");
  await expect(page.locator("#status")).toContainText("看不懂");
  await shot(page, "invalid-input");

  await page.fill("#lookup", `https://github.com/${DEMO}`);
  await page.click("#lookup-go");
  await expect(page).toHaveURL(new RegExp(`\\?u=${DEMO}`));
  await expect(page.locator("#score-card")).toBeVisible();
  await waitForGraph(page);
  await page.waitForTimeout(1500); // overview camera animation
  await shot(page, "loaded-profile");

  // 1 user call + 1 repo page + 3 star pages (257 stars)
  expect(log.apiCalls).toHaveLength(5);
  expect(log.apiCalls.some((c) => c.includes("/starred?per_page=100&page=3"))).toBe(true);
  await expect(page.locator("#fun-title")).not.toBeEmpty();
  await expect(page.locator(".score")).toHaveCount(5);
  await expect(page.locator("#counts")).toContainText("專案 7");
  await expect(page.locator("#counts")).toContainText("fork 1");

  await page.locator(".formulas summary").click();
  await expect(page.locator(".formulas dd").first()).toBeVisible();
  await shot(page, "formulas");

  await page.locator(".subject-chip").first().click();
  await expect(page.locator("#detail .kind")).toContainText("主題");
  await expect(page).toHaveURL(/#subject%3A/);
  await page.waitForTimeout(1500);
  await shot(page, "subject-detail");

  await page.fill("#search", "comfy");
  await expect(page.locator("#results .item").first()).toBeVisible();
  await shot(page, "search");
  await page.locator("#results .item").first().click();
  await expect(page.locator("#results .item")).toHaveCount(0);
  await page.waitForTimeout(1500);
  await shot(page, "search-selected");

  await page.locator('#legend [data-group="star"]').click();
  await expect(page.locator('#legend [data-group="star"]')).toHaveAttribute("aria-pressed", "false");
  await page.keyboard.press("Escape");
  await expect(page.locator("#detail")).not.toHaveClass(/open/);
  await page.waitForTimeout(2000);
  await shot(page, "stars-hidden-overview");
  await page.locator('#legend [data-group="star"]').click();

  // typed in by the user, so no visitor invite
  await expect(page.locator("#visitor")).toBeHidden();
  await expect(page.locator("#another")).toHaveText("換一個帳號");

  await page.click("#open-card");
  await page.click("#open-share");
  const dialog = page.locator("#share-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".share-preview img")).toBeVisible({ timeout: 20_000 });
  expect(await dialog.locator(".share-preview img").evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1080);
  await expect(dialog.locator(".share-text")).toContainText("看看你的 GitHub 是什麼星座");
  await expect(dialog.locator('[data-network="x"]')).toHaveAttribute("href", /x\.com\/intent\/post\?text=.*%2Fs%2Fstardemo%3Fm%3D/);
  await shot(page, "share-dialog");

  await dialog.getByRole("button", { name: "複製文案＋連結" }).click();
  await expect(dialog.getByRole("button", { name: "已複製" })).toBeVisible();
  // the shared link carries the title and scores so its preview card can show them
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/\/s\/stardemo\?m=activity&c=ai-image&s=\d+(%2C\d+){4}&l=zh/);

  const downloadPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "下載圖片" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(`starmap-${DEMO}.png`);
  await download.saveAs(`${SHOTS}/${String(++step).padStart(2, "0")}-score-card-export.png`);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page.locator("#detail")).toHaveClass(/open/); // Esc closed only the dialog

  await page.click("#lang-toggle");
  await expect(page.locator("#open-card")).toHaveText("Score card");
  await expect(page.locator(".card-heading")).toHaveText("Fun scores");
  await page.waitForTimeout(500);
  await shot(page, "english");
});

test("time-lapse replay lights the stars up in order, then shows everything again", async ({ page }) => {
  await mockGithub(page);
  await page.goto(`/?u=${DEMO}`);
  await waitForGraph(page);
  const button = page.locator("#replay");
  await expect(button).toHaveText("▶ 時光回放");
  await button.click();
  await expect(button).toHaveText("■ 停止回放");
  await expect(page.locator("#detail")).not.toHaveClass(/open/);
  await expect(page.locator("#replay-count")).toContainText("★", { timeout: 10_000 });
  await page.waitForTimeout(6000);
  await expect(page.locator("#replay-date")).toHaveText(/\d{4}/);
  await shot(page, "replay-midway");
  await expect(page.locator("#replay-date")).toHaveText("這就是你的星圖", { timeout: 30_000 });
  await expect(page.locator("#replay-share")).toBeVisible();
  await shot(page, "replay-final");
  await page.click("#replay-share");
  await expect(page.locator("#share-dialog")).toBeVisible();
  await expect(page.locator("#replay-overlay")).toBeHidden();
  await expect(button).toHaveText("▶ 時光回放");
  await page.keyboard.press("Escape");

  // Esc stops a replay early and brings every node back
  await button.click();
  await expect(button).toHaveText("■ 停止回放");
  await page.keyboard.press("Escape");
  await expect(button).toHaveText("▶ 時光回放");
  await expect(page.locator("#replay-overlay")).toBeHidden();
});

test("a visitor from a shared link is invited to make their own map", async ({ page }) => {
  await mockGithub(page);
  await page.goto(`/?u=${DEMO}`);
  await expect(page.locator("#visitor")).toBeVisible();
  await expect(page.locator("#visitor-text")).toHaveText("這是 @stardemo 的星圖。你的會是什麼星座？");
  await expect(page.locator("#another")).toHaveText("★ 生成我的星圖");
  await waitForGraph(page);
  await page.waitForTimeout(1500);
  await shot(page, "visitor-invite");
  await page.click("#visitor-cta");
  await expect(page.locator("#landing")).toBeVisible();
  await expect(page.locator("#lookup")).toBeFocused();
});

test("photo mode hides the panels and keeps a watermark with the link", async ({ page }) => {
  await mockGithub(page);
  await page.goto(`/?u=${DEMO}`);
  await waitForGraph(page);
  await page.click("#photo");
  await expect(page.locator("#controls")).toBeHidden();
  await expect(page.locator("#detail")).toBeHidden();
  await expect(page.locator("#watermark")).toContainText("@stardemo");
  await expect(page.locator("#watermark")).toContainText("?u=stardemo");
  await expect(page.locator("#photo-toast")).toBeHidden({ timeout: 6000 });
  await page.waitForTimeout(1500);
  await shot(page, "photo-mode");
  await page.keyboard.press("Escape");
  await expect(page.locator("#controls")).toBeVisible();
  await expect(page.locator("#watermark")).toBeHidden();
});

test("reload uses the one-hour cache and the share link opens the same view", async ({ page }) => {
  const log = await mockGithub(page);
  await page.goto(`/?u=${DEMO}`);
  await expect(page.locator("#score-card")).toBeVisible();
  const first = log.apiCalls.length;
  expect(first).toBe(5);
  await page.reload();
  await expect(page.locator("#score-card")).toBeVisible();
  expect(log.apiCalls.length).toBe(first);
});

test("hash in a shared link selects that node", async ({ page }) => {
  await mockGithub(page);
  await page.goto(`/?u=${DEMO}#subject%3Acomfyui`);
  await waitForGraph(page);
  await expect(page.locator("#detail h2")).toHaveText("ComfyUI 節點", { timeout: 10_000 });
  await page.waitForTimeout(1500);
  await shot(page, "hash-selection");
});

test("errors: unknown account and exhausted rate limit", async ({ page }) => {
  await mockGithub(page);
  await page.goto("/?u=ghost");
  await expect(page.locator("#status")).toContainText("找不到 GitHub 帳號「ghost」");
  await expect(page.locator("#status button")).toHaveText("再試一次");
  await shot(page, "error-not-found");

  await page.goto("/?u=limited");
  await expect(page.locator("#status")).toContainText("查詢額度用完了");
  await expect(page.locator("#status")).toContainText("分鐘");
  await shot(page, "error-rate-limit");
});

test("network failure shows a clear message", async ({ page }) => {
  await page.route("https://api.github.com/**", (route) => route.abort("internetdisconnected"));
  await page.goto("/?u=someone");
  await expect(page.locator("#status")).toContainText("連不上 GitHub");
  await shot(page, "error-network");
});

test("without WebGL the score card and node details still work", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type.startsWith("webgl")) return null;
      return (original as (...args: unknown[]) => RenderingContext | null).call(this, type, ...rest);
    } as typeof original;
  });
  await mockGithub(page);
  await page.goto(`/?u=${DEMO}`);
  await expect(page.locator("#score-card")).toBeVisible();
  await expect(page.locator("#hint")).toContainText("WebGL");
  await page.locator(".subject-chip").first().click();
  await expect(page.locator("#detail .kind")).toContainText("主題");
  await shot(page, "no-webgl-detail");
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, locale: "en-US" });

  test("layout on a phone, English by browser language", async ({ page }) => {
    await mockGithub(page);
    await page.goto("/");
    await expect(page.locator("#landing-title")).toHaveText("GitHub Starmap");
    await shot(page, "phone-landing-en");
    await page.goto(`/?u=${DEMO}`);
    await waitForGraph(page);
    await page.waitForTimeout(1500);
    await shot(page, "phone-loaded");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);
  });
});
