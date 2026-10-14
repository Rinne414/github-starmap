// Nodes and links: each repo or star links to its category and subjects, and
// each subject links to its parent category (same shape as graph_page.py).

import { allItems, type Analysis, type Item } from "../analysis";
import { OTHER, SUBJECT_BY_KEY } from "../classify/taxonomy";

export type Group = "category" | "subject" | "project" | "fork" | "star";

export const GROUP_ORDER: readonly Group[] = ["category", "subject", "project", "fork", "star"];

export interface GNode {
  id: string;
  group: Group;
  /** Category or subject key for hub nodes. */
  key?: string;
  item?: Item;
  x?: number;
  y?: number;
  z?: number;
}

export interface GLink {
  source: string | GNode;
  target: string | GNode;
}

export interface GraphModel {
  nodes: GNode[];
  links: GLink[];
  byId: Map<string, GNode>;
  neighbors: Map<string, Set<string>>;
}

export const categoryId = (key: string): string => `category:${key}`;
export const subjectId = (key: string): string => `subject:${key}`;

const itemGroup = (item: Item): Group => (item.kind === "star" ? "star" : item.repo.fork ? "fork" : "project");

export function buildGraph(a: Analysis): GraphModel {
  const byId = new Map<string, GNode>();
  const pairs: [string, string][] = [];
  const hub = (group: "category" | "subject", key: string): string => {
    const id = group === "category" ? categoryId(key) : subjectId(key);
    if (!byId.has(id)) byId.set(id, { id, group, key });
    return id;
  };

  for (const item of allItems(a)) {
    byId.set(item.id, { id: item.id, group: itemGroup(item), item });
    pairs.push([item.id, hub("category", item.category)]);
    for (const s of item.subjects) {
      const sid = hub("subject", s);
      pairs.push([item.id, sid], [sid, hub("category", SUBJECT_BY_KEY.get(s)?.category ?? OTHER)]);
    }
  }

  const seen = new Set<string>();
  const links: GLink[] = [];
  const neighbors = new Map<string, Set<string>>([...byId.keys()].map((id) => [id, new Set<string>()]));
  for (const [x, y] of pairs) {
    const key = x < y ? `${x}\n${y}` : `${y}\n${x}`;
    if (x === y || seen.has(key)) continue;
    seen.add(key);
    links.push({ source: x, target: y });
    neighbors.get(x)!.add(y);
    neighbors.get(y)!.add(x);
  }
  return { nodes: [...byId.values()], links, byId, neighbors };
}

export const endId = (end: string | GNode): string => (typeof end === "object" ? end.id : end);
