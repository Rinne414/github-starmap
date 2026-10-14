// Every piece of text the link preview image can show. The preview function
// ships a font subset built from exactly these characters (api/_fonts), and a
// test fails if a string here uses a character the subset lacks.

import { CATEGORIES } from "../classify/taxonomy";
import type { StringKey } from "../i18n/strings";
import { SCORE_KEYS } from "../score/score";
import { composeTitle, type ShareLang, STRINGS } from "./title";

export const OG_LABEL_KEYS: readonly StringKey[] = [
  "app.title",
  "png.constellation",
  "png.disclaimer",
  "og.cta",
  ...SCORE_KEYS.map((k) => `score.${k}` as StringKey),
];

/** Symbols and digits drawn around the text (scores, dashes, the star mark). */
export const OG_EXTRA = " 0123456789★—·→@";

export function allTitles(lang: ShareLang): string[] {
  const modifiers = [...SCORE_KEYS, "laid-back"] as const;
  return [
    composeTitle({ rookie: true }, lang),
    ...modifiers.flatMap((modifier) => CATEGORIES.map((c) => composeTitle({ rookie: false, modifier, category: c.key }, lang))),
  ];
}

export function ogStrings(): string[] {
  return (["zh", "en"] as const).flatMap((lang) => [...OG_LABEL_KEYS.map((k) => STRINGS[lang][k]), ...allTitles(lang)]);
}

/** Printable ASCII covers logins and the English UI. */
export function ogCharset(): string {
  const ascii = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join("");
  return [...new Set([...ascii, ...OG_EXTRA, ...ogStrings().join("")])].sort().join("");
}
