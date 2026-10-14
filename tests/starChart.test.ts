import { describe, expect, test } from "vitest";
import { layoutStarChart } from "../src/ui/card/starChart";
import { analysis, item } from "./helpers";

function sample() {
  const own = Array.from({ length: 6 }, (_, i) => item("repo", ["comfyui"], "ai-image", { repo: { fullName: `me/r${i}`, stars: i * 10 } }));
  const stars = [
    ...Array.from({ length: 30 }, (_, i) => item("star", ["mcp"], "coding-agent", { repo: { fullName: `x/s${i}`, stars: i } })),
    ...Array.from({ length: 5 }, (_, i) => item("star", [], "other", { repo: { fullName: `y/o${i}` } })),
  ];
  return analysis(own, stars);
}

describe("layoutStarChart", () => {
  test("places every repo and star inside the chart circle", () => {
    const chart = layoutStarChart(sample(), 500, 400, 300);
    expect(chart.stars).toHaveLength(41);
    for (const s of chart.stars) expect(Math.hypot(s.x - 500, s.y - 400)).toBeLessThanOrEqual(300 * 1.05);
  });

  test("one constellation per category, biggest first and 其他 last", () => {
    const chart = layoutStarChart(sample(), 0, 0, 100);
    expect(chart.constellations.map((c) => c.category)).toEqual(["coding-agent", "ai-image", "other"]);
    expect(chart.constellations[0].path.length).toBeLessThanOrEqual(6);
  });

  test("is deterministic for the same account", () => {
    expect(layoutStarChart(sample(), 0, 0, 100)).toEqual(layoutStarChart(sample(), 0, 0, 100));
  });

  test("own repos shine brighter than stars", () => {
    const chart = layoutStarChart(sample(), 0, 0, 100);
    const own = chart.stars.filter((s) => s.kind === "own").map((s) => s.r);
    const starred = chart.stars.filter((s) => s.kind === "star").map((s) => s.r);
    expect(Math.min(...own)).toBeGreaterThan(Math.max(...starred));
  });
});
