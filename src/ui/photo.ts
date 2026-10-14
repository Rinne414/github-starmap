// Photo mode: hides every panel so the 3D map can be screenshotted or screen
// recorded, and keeps a small watermark with the link so the picture leads back here.

import { t } from "../i18n/i18n";
import { byId, el } from "./dom";

const TOAST_MS = 2600;

export interface PhotoMode {
  readonly active: boolean;
  enter: (login: string, url: string) => void;
  exit: () => void;
}

export function createPhotoMode(onEnter: () => void, onExit: () => void): PhotoMode {
  const watermark = byId("watermark");
  const exitButton = byId<HTMLButtonElement>("photo-exit");
  const toast = byId("photo-toast");
  let active = false;
  let toastTimer = 0;

  const exit = (): void => {
    if (!active) return;
    active = false;
    document.body.classList.remove("photo-mode");
    watermark.hidden = true;
    exitButton.hidden = true;
    toast.hidden = true;
    clearTimeout(toastTimer);
    onExit();
  };

  const enter = (login: string, url: string): void => {
    onEnter();
    active = true;
    document.body.classList.add("photo-mode");
    watermark.replaceChildren(
      el("span", "wm-brand", t("app.title")),
      el("span", "wm-user", `@${login}`),
      el("span", "wm-url", url.replace(/^https?:\/\//, "")),
    );
    watermark.hidden = false;
    exitButton.hidden = false;
    exitButton.setAttribute("aria-label", t("photo.exit"));
    exitButton.title = t("photo.exit");
    toast.textContent = t("photo.toast");
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => (toast.hidden = true), TOAST_MS);
  };

  exitButton.addEventListener("click", exit);
  return {
    get active() {
      return active;
    },
    enter,
    exit,
  };
}
