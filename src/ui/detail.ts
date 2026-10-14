// Side panel content for a selected node: hubs list their repos and stars,
// repos and stars list their subjects and neighbours on the same subjects.

import type { GNode, GraphModel, Group } from "../graph/buildGraph";
import { GROUP_ORDER } from "../graph/buildGraph";
import { formatNumber, t } from "../i18n/i18n";
import { dot, el, externalLink } from "./dom";

export interface DetailContext {
  model: GraphModel;
  label: (n: GNode) => string;
  onSelect: (id: string) => void;
}

const GROUP_LABEL: Record<Group, Parameters<typeof t>[0]> = {
  category: "group.category",
  subject: "group.subject",
  project: "group.project",
  fork: "group.fork",
  star: "group.star",
};

const byStars = (a: GNode, b: GNode): number => (b.item?.repo.stars ?? 0) - (a.item?.repo.stars ?? 0);
const byPushed = (a: GNode, b: GNode): number => (b.item?.repo.pushedAt ?? "").localeCompare(a.item?.repo.pushedAt ?? "");
const day = (iso: string | null | undefined): string => (iso ? iso.slice(0, 10) : "");

export function itemRow(n: GNode, ctx: DetailContext): HTMLDivElement {
  const row = el("div", "item");
  row.tabIndex = 0;
  row.setAttribute("role", "button");
  const name = el("div", "name");
  name.append(dot(n.group), el("span", "label", ctx.label(n)));
  if (n.group === "star" && n.item) name.append(el("span", "extra", `★ ${formatNumber(n.item.repo.stars)}`));
  row.append(name);
  const desc = n.item?.repo.description;
  if (desc) row.append(el("div", "desc", desc));
  row.addEventListener("click", () => ctx.onSelect(n.id));
  row.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      ctx.onSelect(n.id);
    }
  });
  return row;
}

/** Same-subject lists on a repo or star can run to hundreds; show the top ones. */
const RELATED_LIMIT = 20;

function section(title: string, nodes: GNode[], ctx: DetailContext, limit = Infinity): HTMLElement | null {
  if (!nodes.length) return null;
  const box = el("section", "section");
  box.append(el("h3", "", `${title}（${formatNumber(nodes.length)}）`));
  nodes.slice(0, limit).forEach((n) => box.append(itemRow(n, ctx)));
  if (nodes.length > limit) box.append(el("div", "more", "…"));
  return box;
}

function linked(n: GNode, groups: Group[], ctx: DetailContext): GNode[] {
  return [...ctx.model.neighbors.get(n.id)!].map((id) => ctx.model.byId.get(id)!).filter((x) => groups.includes(x.group));
}

/** Repos and stars that share a subject with this item. */
function sameSubject(n: GNode, groups: Group[], ctx: DetailContext): GNode[] {
  const found = new Map<string, GNode>();
  for (const hub of linked(n, ["subject"], ctx)) {
    for (const x of linked(hub, groups, ctx)) if (x.id !== n.id) found.set(x.id, x);
  }
  return [...found.values()];
}

function metaLine(n: GNode): HTMLElement | null {
  const repo = n.item?.repo;
  if (!repo) return null;
  const parts = [
    repo.language,
    `★ ${formatNumber(repo.stars)}`,
    repo.fork ? t("detail.fork") : null,
    n.item?.guessed ? t("detail.guessed") : null,
    repo.pushedAt ? t("detail.updated", { date: day(repo.pushedAt) }) : null,
    n.item?.starredAt ? t("detail.starred", { date: day(n.item.starredAt) }) : null,
  ].filter((p): p is string => Boolean(p));
  const meta = el("div", "meta");
  parts.forEach((p) => meta.append(el("span", "", p)));
  return meta;
}

function hubChips(n: GNode, ctx: DetailContext): HTMLElement | null {
  const hubs = linked(n, ["category", "subject"], ctx).sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group));
  if (!hubs.length) return null;
  const box = el("div", "tags");
  for (const h of hubs) {
    const chip = el("button", "chip");
    chip.type = "button";
    chip.append(dot(h.group), el("span", "", ctx.label(h)));
    chip.addEventListener("click", () => ctx.onSelect(h.id));
    box.append(chip);
  }
  return box;
}

export function renderDetail(n: GNode, ctx: DetailContext): HTMLElement[] {
  const kind = el("div", "kind");
  kind.append(dot(n.group), el("span", "", t(GROUP_LABEL[n.group])));
  const parts: (HTMLElement | null)[] = [kind, el("h2", "", ctx.label(n))];
  const repo = n.item?.repo;
  if (repo) {
    if (repo.fullName !== ctx.label(n)) parts.push(el("div", "fullname", repo.fullName));
    parts.push(el("p", "summary", repo.description ?? t("detail.noDescription")), metaLine(n));
    const actions = el("div", "actions");
    actions.append(externalLink(repo.url, t("detail.github")));
    parts.push(
      actions,
      hubChips(n, ctx),
      section(t("detail.relatedProjects"), sameSubject(n, ["project", "fork"], ctx).sort(byPushed), ctx, RELATED_LIMIT),
      section(t("detail.relatedStars"), sameSubject(n, ["star"], ctx).sort(byStars), ctx, RELATED_LIMIT),
    );
  } else {
    parts.push(
      section(t("detail.myProjects"), linked(n, ["project", "fork"], ctx).sort(byPushed), ctx),
      section(t("detail.stars"), linked(n, ["star"], ctx).sort(byStars), ctx),
      n.group === "category" ? section(t("detail.subjects"), linked(n, ["subject"], ctx), ctx) : null,
      n.group === "subject" ? section(t("detail.parent"), linked(n, ["category"], ctx), ctx) : null,
    );
  }
  return parts.filter((p): p is HTMLElement => p !== null);
}
