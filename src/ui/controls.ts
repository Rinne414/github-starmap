// Left panel: search box and the legend that shows or hides node groups.

import type { GNode, GraphModel, Group } from "../graph/buildGraph";
import { GROUP_ORDER } from "../graph/buildGraph";
import { formatNumber, t } from "../i18n/i18n";
import type { StringKey } from "../i18n/strings";
import { itemRow, type DetailContext } from "./detail";
import { byId, dot, el } from "./dom";

const MAX_RESULTS = 12;

export function searchNodes(model: GraphModel, label: (n: GNode) => string, query: string): GNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return model.nodes
    .map((n) => {
      const name = label(n).toLowerCase();
      const full = n.item?.repo.fullName.toLowerCase() ?? "";
      const desc = n.item?.repo.description?.toLowerCase() ?? "";
      const score = name === q ? 4 : name.startsWith(q) ? 3 : name.includes(q) || full.includes(q) ? 2 : desc.includes(q) ? 1 : 0;
      return { n, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || GROUP_ORDER.indexOf(a.n.group) - GROUP_ORDER.indexOf(b.n.group))
    .slice(0, MAX_RESULTS)
    .map((r) => r.n);
}

export function bindSearch(ctx: DetailContext): { clear: () => void } {
  const input = byId<HTMLInputElement>("search");
  const results = byId<HTMLUListElement>("results");
  const clear = (): void => {
    input.value = "";
    results.replaceChildren();
  };
  const pickAndClear: DetailContext = { ...ctx, onSelect: (id) => (clear(), ctx.onSelect(id)) };
  input.addEventListener("input", () => {
    results.replaceChildren(
      ...searchNodes(ctx.model, ctx.label, input.value).map((n) => {
        const li = el("li");
        li.append(itemRow(n, pickAndClear));
        return li;
      }),
    );
  });
  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    const first = searchNodes(ctx.model, ctx.label, input.value)[0];
    if (first) pickAndClear.onSelect(first.id);
  });
  return { clear };
}

export function renderLegend(model: GraphModel, isVisible: (g: Group) => boolean, onToggle: (g: Group) => void): void {
  const counts = new Map<Group, number>();
  model.nodes.forEach((n) => counts.set(n.group, (counts.get(n.group) ?? 0) + 1));
  byId("legend").replaceChildren(
    ...GROUP_ORDER.filter((g) => counts.get(g)).map((group) => {
      const on = isVisible(group);
      const chip = el("button", `chip${on ? "" : " off"}`);
      chip.type = "button";
      chip.dataset.group = group;
      chip.setAttribute("aria-pressed", String(on));
      chip.title = t("controls.legendHint");
      chip.append(dot(group), el("span", "", `${t(`group.${group}` as StringKey)} ${formatNumber(counts.get(group)!)}`));
      chip.addEventListener("click", () => onToggle(group));
      return chip;
    }),
  );
}
