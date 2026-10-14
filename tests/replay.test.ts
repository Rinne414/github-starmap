import { describe, expect, test, vi } from "vitest";
import { buildGraph } from "../src/graph/buildGraph";
import { MAX_DURATION_MS, MIN_DURATION_MS, planReplay, replayDuration, runReplay } from "../src/graph/replay";
import { analysis, item } from "./helpers";

function model() {
  const own = [item("repo", ["comfyui"], "ai-image", { repo: { fullName: "me/new", createdAt: "2024-01-01T00:00:00Z" } })];
  const stars = [
    item("star", ["mcp"], "coding-agent", { starredAt: "2023-05-01T00:00:00Z", repo: { fullName: "x/b" } }),
    item("star", ["comfyui"], "ai-image", { starredAt: "2019-02-01T00:00:00Z", repo: { fullName: "x/a" } }),
  ];
  const old = item("repo", [], "other", { repo: { fullName: "me/old", createdAt: null } });
  return buildGraph(analysis([...own, old], stars));
}

describe("planReplay", () => {
  test("lights items oldest first, undated ones at the very start", () => {
    const steps = planReplay(model());
    expect(steps.map((s) => s.reveal[0])).toEqual(["repo:me/old", "star:x/a", "star:x/b", "repo:me/new"]);
    expect(steps[0].date).toBeNull();
    expect(steps.map((s) => s.date?.slice(0, 4) ?? null)).toEqual([null, "2019", "2023", "2024"]);
  });

  test("hubs appear with the first item that links to them, and only once", () => {
    const steps = planReplay(model());
    const all = steps.flatMap((s) => s.reveal);
    expect(new Set(all).size).toBe(all.length);
    expect(steps[1].reveal).toEqual(expect.arrayContaining(["subject:comfyui", "category:ai-image"]));
    expect(steps[3].reveal).not.toContain("subject:comfyui");
  });

  test("timing is increasing, ends at the duration, counters accumulate", () => {
    const steps = planReplay(model());
    const ats = steps.map((s) => s.at);
    expect([...ats].sort((a, b) => a - b)).toEqual(ats);
    expect(ats.at(-1)).toBe(replayDuration(4));
    expect(steps.at(-1)).toMatchObject({ stars: 2, repos: 2 });
  });

  test("duration scales with the account but stays within bounds", () => {
    expect(replayDuration(3)).toBe(MIN_DURATION_MS);
    expect(replayDuration(5000)).toBe(MAX_DURATION_MS);
  });
});

describe("runReplay", () => {
  test("applies steps as time passes and reports when done", () => {
    let clock = 0;
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => frames.push(cb));
    vi.stubGlobal("cancelAnimationFrame", () => {});
    const steps = planReplay(model());
    const seen: number[] = [];
    const done = vi.fn();
    runReplay(steps, (revealed) => seen.push(revealed.size), done, () => clock);
    expect(seen).toEqual([0]);
    clock = steps[1].at;
    frames.shift()!(0);
    expect(seen.at(-1)).toBeGreaterThan(0);
    clock = steps.at(-1)!.at;
    frames.shift()!(0);
    expect(done).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });
});
