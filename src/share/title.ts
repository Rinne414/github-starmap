// The fun title as text, without the browser i18n runtime, so the share
// preview function can build it too.

import { CATEGORY_BY_KEY, OTHER } from "../classify/taxonomy";
import { en, type StringKey, zh } from "../i18n/strings";
import type { ScoreResult } from "../score/score";

export type ShareLang = "zh" | "en";

export const STRINGS: Record<ShareLang, Record<StringKey, string>> = { zh, en };

export function composeTitle(title: ScoreResult["title"], lang: ShareLang): string {
  const table = STRINGS[lang];
  if (title.rookie) return table["title.rookie"];
  const category = CATEGORY_BY_KEY.get(title.category) ?? CATEGORY_BY_KEY.get(OTHER)!;
  return table["title.join"]
    .replace("{modifier}", table[`title.${title.modifier}` as StringKey])
    .replace("{noun}", category.noun[lang]);
}
