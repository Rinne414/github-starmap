import { describe, expect, test } from "vitest";
import { pickFacts } from "../src/score/facts";
import { analysis, item } from "./helpers";

describe("pickFacts", () => {
  const own = [
    item("repo", [], "devtools", { repo: { fullName: "me/small", stars: 3, language: "Rust" } }),
    item("repo", [], "devtools", { repo: { fullName: "me/big", name: "big", stars: 420, language: "Rust" } }),
    item("repo", [], "frontend", { repo: { fullName: "me/site", stars: 0, language: "HTML" } }),
  ];
  const stars = [
    item("star", [], "llm", { starredAt: "2026-01-02T00:00:00Z", repo: { fullName: "a/newest", stars: 9000 } }),
    item("star", [], "llm", { starredAt: "2019-05-06T00:00:00Z", repo: { fullName: "b/oldest", stars: 50 } }),
    item("star", [], "llm", { starredAt: "2021-01-01T00:00:00Z", repo: { fullName: "c/obscure", stars: 2 } }),
  ];

  test("brightest own repo, first star with its year, most obscure star", () => {
    const facts = pickFacts(analysis(own, stars));
    expect(facts.map((f) => [f.kind, f.label, f.value])).toEqual([
      ["brightest", "big", 420],
      ["firstStar", "b/oldest", 2019],
      ["hiddenGem", "c/obscure", 2],
    ]);
    expect(facts[0].nodeId).toBe(own[1].id);
  });

  test("skips the first star when only the newest 1,000 were read, and fills in the top language", () => {
    const a = { ...analysis(own, stars), starsTruncated: true };
    expect(pickFacts(a).map((f) => [f.kind, f.label, f.value])).toEqual([
      ["brightest", "big", 420],
      ["hiddenGem", "c/obscure", 2],
      ["topLanguage", "Rust", 2],
    ]);
  });

  test("leaves out facts with no data", () => {
    const noStarsOwn = [item("repo", [], "other", { repo: { stars: 0, language: null } })];
    expect(pickFacts(analysis(noStarsOwn, []))).toEqual([]);
  });
});
