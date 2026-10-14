// The profile view of the side panel: fun score card, formulas and insights.

import type { Analysis } from "../analysis";
import { categoryName, formatNumber, getLang, subjectName, t } from "../i18n/i18n";
import type { StringKey } from "../i18n/strings";
import { type Fact, pickFacts } from "../score/facts";
import { buildInsights, type SubjectCount } from "../score/insights";
import { SCORE_KEYS, type ScoreKey, type ScoreResult, TOTAL_SUBJECTS } from "../score/score";
import { composeTitle } from "../share/title";
import { el } from "./dom";

export interface ProfileActions {
  onSubject: (subjectKey: string) => void;
  onNode: (nodeId: string) => void;
  onShare: () => void;
}

export const titleText = (result: ScoreResult): string => composeTitle(result.title, getLang());

function scoreFact(key: ScoreKey, r: ScoreResult): string {
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
  const share = el("button", "btn cta share-cta", t("share.cta"));
  share.type = "button";
  share.id = "open-share";
  share.append(el("small", "", t("share.ctaSub")));
  share.addEventListener("click", actions.onShare);
  card.append(who, title, scores, el("p", "disclaimer", t("card.disclaimer")), share, formulas());
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

function triviaValue(f: Fact): string {
  if (f.kind === "firstStar") return t("trivia.year", { year: f.value });
  if (f.kind === "topLanguage") return t("trivia.repos", { n: formatNumber(f.value) });
  return t("trivia.stars", { n: formatNumber(f.value) });
}

function trivia(a: Analysis, actions: ProfileActions): HTMLElement | null {
  const facts = pickFacts(a);
  if (!facts.length) return null;
  const box = el("section", "section trivia");
  box.append(el("h3", "", t("trivia.heading")));
  for (const f of facts) {
    const row = el(f.nodeId ? "button" : "div", "trivia-row");
    if (row instanceof HTMLButtonElement) {
      row.type = "button";
      row.addEventListener("click", () => actions.onNode(f.nodeId!));
    }
    const text = el("div", "trivia-text");
    text.append(el("div", "trivia-kind", t(`trivia.${f.kind}` as StringKey)), el("div", "trivia-label", f.label));
    row.append(text, el("div", "trivia-value", triviaValue(f)));
    box.append(row);
  }
  return box;
}

export function renderProfile(a: Analysis, r: ScoreResult, actions: ProfileActions): HTMLElement[] {
  const insights = buildInsights(a);
  return [
    scoreCard(a, r, actions),
    trivia(a, actions),
    insightList("insight.topStarred", insights.topStarred, actions),
    insightList("insight.both", insights.both, actions),
    insightList("insight.onlyStarred", insights.onlyStarred, actions),
  ].filter((x): x is HTMLElement => x !== null);
}
