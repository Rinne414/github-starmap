// "Your constellation poster" dialog: shows the poster first, then offers every
// way out of the page (native share, image file, clipboard, social intents).

import type { Analysis } from "../analysis";
import { getLang, t } from "../i18n/i18n";
import type { StringKey } from "../i18n/strings";
import type { ScoreResult } from "../score/score";
import { shareLinks, shareText } from "../share/links";
import { el, externalLink } from "./dom";
import { renderCardBlob, saveBlob } from "./png";
import { scoreLabel, titleText } from "./profile";

const FEEDBACK_MS = 1600;
/** One render per account and language; reopening the dialog is instant. */
const posters = new Map<string, Promise<Blob>>();

export interface ShareContext {
  analysis: Analysis;
  result: ScoreResult;
  /** The map link printed on the poster (short, ?u=login). */
  url: string;
  /** The link people share: /s/<login>?... gets a per-account preview card. */
  shareLink: string;
}

function flash(button: HTMLButtonElement, key: StringKey): void {
  const original = button.textContent;
  button.textContent = t(key);
  setTimeout(() => (button.textContent = original), FEEDBACK_MS);
}

interface ActionOptions {
  primary?: boolean;
  /** Disabled until the poster image is ready. */
  needsPoster?: boolean;
}

function action(label: StringKey, onClick: (button: HTMLButtonElement) => Promise<void> | void, opts: ActionOptions = {}): HTMLButtonElement {
  const button = el("button", opts.primary ? "btn cta" : "btn", t(label));
  button.type = "button";
  button.disabled = opts.needsPoster ?? true;
  button.dataset.needsPoster = String(opts.needsPoster ?? true);
  button.addEventListener("click", () => {
    Promise.resolve(onClick(button)).catch((error: unknown) => {
      // closing the native share sheet is not a failure
      if (!(error instanceof DOMException && error.name === "AbortError")) flash(button, "share.failed");
    });
  });
  return button;
}

function poster(ctx: ShareContext): Promise<Blob> {
  const key = `${ctx.analysis.user.login}:${getLang()}`;
  if (!posters.has(key)) {
    const pending = renderCardBlob(ctx.analysis, ctx.result, ctx.url);
    pending.catch(() => posters.delete(key));
    posters.set(key, pending);
  }
  return posters.get(key)!;
}

function networkRow(ctx: ShareContext, text: string): HTMLElement {
  const links = shareLinks(ctx.shareLink, text);
  const row = el("div", "share-networks");
  row.append(el("span", "share-on", t("share.on")));
  for (const [name, href] of [["X", links.x], ["Threads", links.threads], ["Facebook", links.facebook], ["LINE", links.line]] as const) {
    const a = externalLink(href, name, "chip share-network");
    a.dataset.network = name.toLowerCase();
    row.append(a);
  }
  return row;
}

function actions(ctx: ShareContext, text: string, blob: Promise<Blob>): HTMLButtonElement[] {
  const filename = `starmap-${ctx.analysis.user.login}.png`;
  const fullText = `${text} ${ctx.shareLink}`;
  const list: HTMLButtonElement[] = [];
  const canShareFiles = typeof navigator.canShare === "function" && navigator.canShare({ files: [new File([""], filename, { type: "image/png" })] });
  if (canShareFiles) {
    list.push(
      action("share.native", async () => {
        const file = new File([await blob], filename, { type: "image/png" });
        await navigator.share({ files: [file], text: fullText });
      }, { primary: true }),
    );
  }
  list.push(
    action("share.download", async (button) => {
      saveBlob(await blob, filename);
      flash(button, "share.saved");
    }, { primary: !canShareFiles }),
  );
  if (typeof ClipboardItem !== "undefined" && typeof navigator.clipboard?.write === "function") {
    list.push(
      action("share.copyImage", async (button) => {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        flash(button, "share.copied");
      }),
    );
  }
  list.push(
    action("share.copyText", async (button) => {
      await navigator.clipboard.writeText(fullText);
      flash(button, "share.copied");
    }, { needsPoster: false }),
  );
  return list;
}

function dialogElement(): HTMLDialogElement {
  const existing = document.getElementById("share-dialog");
  if (existing instanceof HTMLDialogElement) return existing;
  const dialog = el("dialog", "share-dialog");
  dialog.id = "share-dialog";
  // a click on the backdrop lands on the dialog itself
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  document.body.append(dialog);
  return dialog;
}

export function openShareDialog(ctx: ShareContext): void {
  const dialog = dialogElement();
  const text = shareText({ title: titleText(ctx.result), scores: ctx.result.scores, scoreLabel, lang: getLang() });
  const blob = poster(ctx);

  const close = el("button", "close", "×");
  close.type = "button";
  close.setAttribute("aria-label", t("detail.close"));
  close.addEventListener("click", () => dialog.close());
  const head = el("div", "share-head");
  head.append(el("h2", "", t("share.title")), close);

  const figure = el("figure", "share-preview");
  const loading = el("div", "share-loading", t("share.rendering"));
  const img = el("img");
  img.alt = t("share.title");
  img.hidden = true;
  figure.append(loading, img);

  const buttons = actions(ctx, text, blob);
  const primary = el("div", "share-actions");
  primary.append(...buttons);
  const hint = matchMedia("(pointer: coarse)").matches ? t("share.hintTouch") : t("share.hintMouse");
  const side = el("div", "share-side");
  side.append(el("p", "share-text", `${text} ${ctx.shareLink}`), primary, networkRow(ctx, text), el("p", "share-hint", hint));

  const body = el("div", "share-body");
  body.append(figure, side);
  dialog.replaceChildren(head, body);
  if (!dialog.open) dialog.showModal();

  blob
    .then((b) => {
      img.src = URL.createObjectURL(b);
      img.hidden = false;
      loading.remove();
      buttons.forEach((button) => (button.disabled = false));
    })
    .catch(() => {
      loading.textContent = t("share.failed");
    });
}

export const isShareDialogOpen = (): boolean => (document.getElementById("share-dialog") as HTMLDialogElement | null)?.open ?? false;
