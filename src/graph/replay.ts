// "Time-lapse replay": the map starts dark and every repo and star lights up in
// the order it was created or starred. Steps are paced by rank, not real time,
// so a quiet year does not stall the animation.

import type { GraphModel } from "./buildGraph";

export interface ReplayStep {
  /** Milliseconds after the start. */
  at: number;
  /** Node ids that light up at this step (the item plus hubs seen for the first time). */
  reveal: string[];
  /** ISO date of the item, or null when unknown (shown as "long ago"). */
  date: string | null;
  stars: number;
  repos: number;
}

const MS_PER_ITEM = 250;
export const MIN_DURATION_MS = 6000;
export const MAX_DURATION_MS = 16000;

export function replayDuration(items: number): number {
  return Math.min(MAX_DURATION_MS, Math.max(MIN_DURATION_MS, items * MS_PER_ITEM));
}

export function planReplay(model: GraphModel): ReplayStep[] {
  const dated = model.nodes
    .filter((n) => n.item)
    .map((n) => ({ node: n, date: n.item!.kind === "star" ? n.item!.starredAt : (n.item!.repo.createdAt ?? null) }))
    // undated items first ("long ago"), then oldest to newest; ids break ties so the order is stable
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? "") || a.node.id.localeCompare(b.node.id));
  const duration = replayDuration(dated.length);
  const seen = new Set<string>();
  let stars = 0;
  let repos = 0;
  return dated.map(({ node, date }, i) => {
    const reveal = [node.id, ...model.neighbors.get(node.id)!].filter((id) => !seen.has(id));
    reveal.forEach((id) => seen.add(id));
    if (node.item!.kind === "star") stars += 1;
    else repos += 1;
    return { at: Math.round(((i + 1) / dated.length) * duration), reveal, date, stars, repos };
  });
}

export interface ReplayRunner {
  stop: () => void;
}

/** Plays the steps on animation frames; apply() gets the ids lit so far. */
export function runReplay(
  steps: ReplayStep[],
  apply: (revealed: Set<string>, step: ReplayStep | null) => void,
  done: () => void,
  now: () => number = () => performance.now(),
): ReplayRunner {
  const revealed = new Set<string>();
  const start = now();
  let index = 0;
  let frame = 0;
  let stopped = false;
  apply(revealed, null);
  const tick = (): void => {
    if (stopped) return;
    const elapsed = now() - start;
    let last: ReplayStep | null = null;
    while (index < steps.length && steps[index].at <= elapsed) {
      steps[index].reveal.forEach((id) => revealed.add(id));
      last = steps[index];
      index += 1;
    }
    if (last) apply(revealed, last);
    if (index >= steps.length) {
      stopped = true;
      done();
      return;
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return {
    stop: () => {
      stopped = true;
      cancelAnimationFrame(frame);
    },
  };
}
