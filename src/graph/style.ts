import type { Group } from "./buildGraph";

interface GroupStyle {
  color: string;
  size: number;
  text: number;
}

/** Colours and sizes per node group; label sizes were tuned on the original page. */
export const GROUP_STYLE: Record<Group, GroupStyle> = {
  category: { color: "#c084fc", size: 36, text: 16 },
  subject: { color: "#4fd1a5", size: 12, text: 8 },
  project: { color: "#f5b942", size: 6, text: 4.5 },
  fork: { color: "#ff8a65", size: 4, text: 4 },
  star: { color: "#6ea8fe", size: 1.6, text: 3.4 },
};
