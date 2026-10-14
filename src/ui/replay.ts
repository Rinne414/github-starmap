// Replay button and the big date overlay; drives GraphView through the plan.

import type { GraphModel } from "../graph/buildGraph";
import { planReplay, type ReplayRunner, type ReplayStep, runReplay } from "../graph/replay";
import type { GraphView } from "../graph/view";
import { formatNumber, getLang, t } from "../i18n/i18n";
import { byId } from "./dom";

/** Let the overview camera move settle before the sky goes dark. */
const START_DELAY_MS = 1400;
/** Keep the finished map orbiting with the closing line for a moment. */
const FINAL_HOLD_MS = 3000;
/** Visibility updates touch every node; a few per second look smooth enough. */
const UPDATE_EVERY_MS = 90;

export interface ReplayController {
  readonly running: boolean;
  start: () => void;
  stop: () => void;
  refreshText: () => void;
}

function dateText(iso: string | null): string {
  if (!iso) return t("replay.longAgo");
  return new Date(iso).toLocaleDateString(getLang() === "zh" ? "zh-TW" : "en-US", { year: "numeric", month: "long" });
}

export function createReplay(view: GraphView, model: GraphModel, beforeStart: () => void): ReplayController {
  const button = byId<HTMLButtonElement>("replay");
  const overlay = byId("replay-overlay");
  const date = byId("replay-date");
  const count = byId("replay-count");
  let runner: ReplayRunner | null = null;
  const timers: number[] = [];
  let running = false;
  let lastUpdate = 0;

  const show = (step: ReplayStep | null, final = false): void => {
    overlay.hidden = false;
    overlay.classList.toggle("final", final);
    date.textContent = final ? t("replay.done") : step ? dateText(step.date) : "";
    count.textContent = step ? t("replay.count", { stars: formatNumber(step.stars), repos: formatNumber(step.repos) }) : "";
  };

  const refreshText = (): void => {
    button.textContent = running ? t("replay.stop") : t("replay.start");
    button.setAttribute("aria-pressed", String(running));
  };

  const stop = (): void => {
    timers.splice(0).forEach((id) => clearTimeout(id));
    runner?.stop();
    runner = null;
    view.stopOrbit();
    view.setRevealed(null);
    overlay.hidden = true;
    running = false;
    refreshText();
  };

  const finish = (last: ReplayStep | undefined): void => {
    runner = null;
    view.setRevealed(null);
    show(last ?? null, true);
    timers.push(window.setTimeout(stop, FINAL_HOLD_MS));
  };

  const start = (): void => {
    if (running) return;
    const steps = planReplay(model);
    if (!steps.length) return;
    beforeStart();
    running = true;
    refreshText();
    view.setRevealed(new Set());
    show(null);
    timers.push(
      window.setTimeout(() => {
        view.startOrbit();
        runner = runReplay(
          steps,
          (revealed, step) => {
            const now = performance.now();
            if (step) show(step);
            if (now - lastUpdate < UPDATE_EVERY_MS && step !== steps.at(-1)) return;
            lastUpdate = now;
            view.setRevealed(revealed);
          },
          () => finish(steps.at(-1)),
        );
      }, START_DELAY_MS),
    );
  };

  button.hidden = false;
  refreshText();
  return {
    get running() {
      return running;
    },
    start,
    stop,
    refreshText,
  };
}
