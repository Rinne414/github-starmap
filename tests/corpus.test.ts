import { describe, expect, test } from "vitest";
import { classify } from "../src/classify/classifier";
import { OTHER } from "../src/classify/taxonomy";
import corpus from "./fixtures/corpus-sample.json";

// Public repos and stars of 15 well-known developers (web, Rust, Go, PHP, data
// science, ML, 3D...), deduplicated and sampled. Unlabelled: it guards against
// the "everything lands in 其他" failure seen with non-AI accounts.
interface CorpusItem {
  full_name: string;
  description: string | null;
  topics: string[];
  language: string | null;
  own: boolean;
}

function rates(items: CorpusItem[]) {
  const results = items.map((i) => {
    const [owner, name] = i.full_name.split("/");
    return classify({ ...i, name, owner });
  });
  const other = results.filter((r) => r.category === OTHER).length;
  const withSubject = results.filter((r) => r.subjects.length > 0).length;
  return { other: other / items.length, withSubject: withSubject / items.length };
}

describe("rule classifier on a general developer corpus", () => {
  const items = corpus as CorpusItem[];
  const own = rates(items.filter((i) => i.own));
  const stars = rates(items.filter((i) => !i.own));

  test("few repos fall through to 其他, and most get a subject", () => {
    console.info(
      `own: other ${(own.other * 100).toFixed(1)}%, with subject ${(own.withSubject * 100).toFixed(1)}% | ` +
        `stars: other ${(stars.other * 100).toFixed(1)}%, with subject ${(stars.withSubject * 100).toFixed(1)}%`,
    );
    // tuned on 2026-10-15: own 5.6% / 67.7%, stars 1.7% / 81.3% (on the full 16-account corpus the old rules left 57% of own repos and 42% of stars in 其他)
    expect(own.other).toBeLessThanOrEqual(0.07);
    expect(stars.other).toBeLessThanOrEqual(0.03);
    expect(own.withSubject).toBeGreaterThanOrEqual(0.65);
    expect(stars.withSubject).toBeGreaterThanOrEqual(0.78);
  });
});
