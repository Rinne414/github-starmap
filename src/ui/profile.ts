// The profile view of the side panel: fun score card, formulas and insights.

import type { Analysis } from "../analysis";
import { CATEGORY_BY_KEY, OTHER } from "../classify/taxonomy";
import { categoryName, formatNumber, pick, subjectName, t } from "../i18n/i18n";
import type { StringKey } from "../i18n/strings";
import { buildInsights, type SubjectCount } from "../score/insights";
import { SCORE_KEYS, type ScoreKey, type ScoreResult, TOTAL_SUBJECTS } from "../score/score";
import { el } from "./dom";

export interface ProfileActions {
  onSubject: (subjectKey: string) => void;
  onDownload: () => void;
  onShare: (button: HTMLButtonElement) => void;
}

export function titleText(result: ScoreResult): string {
  if (result.title.rookie) return t("title.rookie");
  const noun = pick((CATEGORY_BY_KEY.get(result.title.category) ?? CATEGORY_BY_KEY.get(OTHER)!).noun);
  return t("title.join", { modifier: t(`title.${result.title.modifier}` as StringKey), noun });
}

export function scoreFact(key: ScoreKey, r: ScoreResult): string {
  const f = r.facts;
  switch (key) {
    case "maker":
      return t("fact.maker", { shared: f.sharedSubjects, total: f.starredSubjects });
    case "gem":
      return t("fact.gem", { gem: formatNumber(f.gemStars), stars: formatNumber(f.stars) });
    case "focus":
      return t("fact.focus", {
        category: f.topCategory ? categoryName(f.topCategory) : "—",
        count: f.topCategoryItems,
        total: f.classifiedItems,
      });
    case "breadth":
      return t("fact.breadth", { count: f.starredSubjects, total: TOTAL_SUBJECTS });
    case "activity":
      return t("fact.activity", { pushes: f.recentPushes, stars: f.recentStars });
  }
}

export const scoreLabel = (key: ScoreKey): string => t(`score.${key}` as StringKey);

function scoreRow(key: ScoreKey, r: ScoreResult): HTMLElement {
  const value = r.scores[key];
  const row = el("div", "score");
  row.dataset.score = key;
  const head = el("div", "score-head");
  head.append(el("span", "score-name", scoreLabel(key)), el("span", "score-value", value === null ? "—" : String(value)));
  const bar = el("div", "bar");
  bar.setAttribute("role", "presentation");
  const fill = el("div", "fill");
  fill.style.width = `${value ?? 0}%`;
  bar.append(fill);
  row.append(head, bar, el("div", "score-fact", value === null ? "—" : scoreFact(key, r)));
  return row;
}

function formulas(): HTMLElement {
  const box = el("details", "formulas");
  box.append(el("summary", "", t("card.formulas")));
  const list = el("dl");
  for (const key of SCORE_KEYS) {
    list.append(el("dt", "", scoreLabel(key)), el("dd", "", t(`formula.${key}` as StringKey, { total: TOTAL_SUBJECTS })));
  }
  box.append(list, el("p", "note", t("card.dash")));
  return box;
}

function scoreCard(a: Analysis, r: ScoreResult, actions: ProfileActions): HTMLElement {
  const card = el("section", "card");
  card.id = "score-card";
  const who = el("div", "who");
  const avatar = el("img", "avatar");
  avatar.src = a.user.avatarUrl;
  avatar.alt = "";
  avatar.width = 44;
  avatar.height = 44;
  const names = el("div");
  names.append(el("div", "login", `@${a.user.login}`), el("div", "card-heading", t("card.heading")));
  who.append(avatar, names);
  const title = el("div", "title", titleText(r));
  title.id = "fun-title";
  const scores = el("div", "scores");
  SCORE_KEYS.forEach((key) => scores.append(scoreRow(key, r)));
  const buttons = el("div", "actions");
  const download = el("button", "btn", t("card.download"));
  download.type = "button";
  download.id = "download-png";
  download.addEventListener("click", actions.onDownload);
  const share = el("button", "btn", t("card.share"));
  share.type = "button";
  share.addEventListener("click", () => actions.onShare(share));
  buttons.append(download, share);
  card.append(who, title, scores, el("p", "disclaimer", t("card.disclaimer")), buttons, formulas());
  return card;
}

function insightList(titleKey: StringKey, rows: SubjectCount[], actions: ProfileActions): HTMLElement {
  const box = el("section", "section insight");
  box.append(el("h3", "", t(titleKey)));
  if (!rows.length) {
    box.append(el("div", "empty", t("insight.empty")));
    return box;
  }
  const list = el("div", "subject-chips");
  for (const r of rows) {
    const chip = el("button", "chip subject-chip");
    chip.type = "button";
    chip.title = t("insight.count", { own: r.own, starred: r.starred });
    chip.append(el("span", "", subjectName(r.subject)), el("span", "count", titleKey === "insight.both" ? `${r.own} · ${r.starred}` : String(r.starred)));
    chip.addEventListener("click", () => actions.onSubject(r.subject));
    list.append(chip);
  }
  box.append(list);
  return box;
}

export function renderProfile(a: Analysis, r: ScoreResult, actions: ProfileActions): HTMLElement[] {
  const insights = buildInsights(a);
  return [
    scoreCard(a, r, actions),
    insightList("insight.topStarred", insights.topStarred, actions),
    insightList("insight.both", insights.both, actions),
    insightList("insight.onlyStarred", insights.onlyStarred, actions),
  ];
}
