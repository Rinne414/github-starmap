// 3D force graph, ported from an earlier standalone graph page. The tuned
// values (label sizes, overview dolly, panel width, cooldown) come from there.

import ForceGraph3D, { type ForceGraph3DInstance } from "3d-force-graph";
import SpriteText from "three-spritetext";
import type { Object3D } from "three";
import { endId, type GLink, type GNode, type GraphModel, type Group, GROUP_ORDER } from "./buildGraph";
import { GROUP_STYLE } from "./style";


const BACKGROUND = "#0a0d12";
const DIM_ALPHA = 0.1;
/** zoomToFit frames the 3D depth too, so the overview ends up small; move in after it. */
const OVERVIEW_DOLLY = 0.7;
/** Small graphs already fill the frame; the dolly only helps once the map is crowded. */
const DOLLY_MIN_NODES = 60;
/** px the detail panel covers on wide screens. */
const PANEL_SPACE = 412;
const WIDE_MIN = 760;
/** Without a time cap the layout keeps drifting for a long time on slow machines. */
const COOLDOWN_MS = 5000;
/** One full turn around the map in about 45 seconds during the replay. */
const ORBIT_RAD_PER_MS = (Math.PI * 2) / 45000;

type Graph = ForceGraph3DInstance<GNode, GLink>;

export interface GraphViewOptions {
  container: HTMLElement;
  model: GraphModel;
  label: (n: GNode) => string;
  tooltip: (n: GNode) => string;
  onNodeClick: (n: GNode) => void;
  onBackgroundClick: () => void;
  /** Called once, after the first layout settles and the overview is framed. */
  onFirstLayout: () => void;
}

function rgba(hex: string, alpha: number): string {
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}, ${alpha})`;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

const isWide = (): boolean => innerWidth > WIDE_MIN;

export class GraphView {
  private readonly graph: Graph;
  private visible = new Set<Group>(GROUP_ORDER);
  private selected: string | null = null;
  private highlight = new Set<string>();
  private fitted = false;
  private visibleCount = 0;
  private destroyed = false;
  private firstLayoutDone = false;
  /** During the replay only these nodes are drawn; null means everything. */
  private revealed: Set<string> | null = null;
  private orbitFrame = 0;

  constructor(private readonly opts: GraphViewOptions) {
    this.graph = (new ForceGraph3D(opts.container) as unknown as Graph)
      .backgroundColor(BACKGROUND)
      .showNavInfo(false)
      .nodeId("id")
      .nodeVal((n) => GROUP_STYLE[n.group].size)
      .nodeColor((n) => rgba(GROUP_STYLE[n.group].color, this.isLit(n.id) ? 0.95 : DIM_ALPHA))
      .nodeOpacity(1)
      .nodeResolution(12)
      .nodeLabel((n) => escapeHtml(opts.tooltip(n)).replace(/\n/g, "<br>"))
      .nodeVisibility((n) => this.isRevealed(n.id))
      .linkVisibility((l) => this.isRevealed(endId(l.source)) && this.isRevealed(endId(l.target)))
      .nodeThreeObjectExtend(true)
      .linkColor((l) => this.linkColor(l))
      .linkWidth((l) => (this.isLinkLit(l) ? 0.6 : 0))
      .linkOpacity(1)
      .onNodeClick((n) => opts.onNodeClick(n))
      .onBackgroundClick(() => opts.onBackgroundClick())
      .cooldownTicks(220)
      .cooldownTime(COOLDOWN_MS)
      .onEngineStop(() => this.onEngineStop());

    this.graph.d3Force("charge")?.strength(-55);
    this.graph.d3Force("link")?.distance((l: GLink) => {
      const groups = [opts.model.byId.get(endId(l.source))!.group, opts.model.byId.get(endId(l.target))!.group];
      return groups.includes("category") ? 70 : groups.includes("star") ? 28 : 40;
    });
    this.refresh();
    this.applyVisibility();
  }

  get selectedId(): string | null {
    return this.selected;
  }

  isVisible(group: Group): boolean {
    return this.visible.has(group);
  }

  toggleGroup(group: Group): void {
    if (this.visible.has(group)) this.visible.delete(group);
    else this.visible.add(group);
    this.applyVisibility();
    if (!this.selected) this.overview();
  }

  /** Highlights a node and its neighbours, then flies to it. */
  select(id: string): void {
    const node = this.opts.model.byId.get(id);
    if (!node) return;
    if (!this.visible.has(node.group)) {
      this.visible.add(node.group);
      this.applyVisibility();
    }
    this.selected = id;
    this.highlight = new Set([id, ...this.opts.model.neighbors.get(id)!]);
    this.refresh();
    this.flyTo(node);
  }

  clearSelection(): void {
    this.selected = null;
    this.highlight = new Set();
    this.refresh();
  }

  /** Shrinks the canvas so the focus is not hidden behind the side panel. */
  fitCanvas(panelOpen: boolean): void {
    const width = panelOpen && isWide() ? innerWidth - PANEL_SPACE : innerWidth;
    const height = panelOpen && !isWide() ? Math.round(innerHeight * 0.45) - 16 : innerHeight;
    this.graph.width(width).height(height);
  }

  overview(): void {
    this.graph.zoomToFit(700, 20);
    setTimeout(() => {
      if (this.destroyed || this.selected || this.visibleCount < DOLLY_MIN_NODES) return;
      const c = this.graph.cameraPosition();
      this.graph.cameraPosition({ x: c.x * OVERVIEW_DOLLY, y: c.y * OVERVIEW_DOLLY, z: c.z * OVERVIEW_DOLLY }, undefined, 600);
    }, 750);
  }

  /** Labels are cached per node, so a new accessor function is needed to redraw them. */
  refresh(): void {
    this.graph
      .nodeColor(this.graph.nodeColor())
      .linkColor(this.graph.linkColor())
      .linkWidth(this.graph.linkWidth())
      // returning null keeps the default sphere without a label
      .nodeThreeObject(((n: GNode) => this.labelFor(n)) as unknown as (n: GNode) => Object3D);
  }

  /** Limits drawing to the given nodes (replay), or shows everything again with null. */
  setRevealed(ids: Set<string> | null): void {
    this.revealed = ids;
    this.graph.nodeVisibility(this.graph.nodeVisibility()).linkVisibility(this.graph.linkVisibility());
  }

  /** Slowly circles the camera around the centre of the map. */
  startOrbit(): void {
    this.stopOrbit();
    const c = this.graph.cameraPosition();
    const radius = Math.hypot(c.x, c.z) || 1;
    const startAngle = Math.atan2(c.z, c.x);
    const start = performance.now();
    const step = (now: number): void => {
      if (this.destroyed) return;
      const angle = startAngle + (now - start) * ORBIT_RAD_PER_MS;
      this.graph.cameraPosition({ x: radius * Math.cos(angle), y: c.y, z: radius * Math.sin(angle) }, { x: 0, y: 0, z: 0 });
      this.orbitFrame = requestAnimationFrame(step);
    };
    this.orbitFrame = requestAnimationFrame(step);
  }

  stopOrbit(): void {
    cancelAnimationFrame(this.orbitFrame);
    this.orbitFrame = 0;
  }

  destroy(): void {
    this.stopOrbit();
    this.destroyed = true;
    this.graph._destructor();
    this.opts.container.replaceChildren();
  }

  private isRevealed(id: string): boolean {
    return this.revealed === null || this.revealed.has(id);
  }

  private isLit(id: string): boolean {
    return !this.selected || this.highlight.has(id);
  }

  private isLinkLit(l: GLink): boolean {
    return this.selected !== null && (endId(l.source) === this.selected || endId(l.target) === this.selected);
  }

  private linkColor(l: GLink): string {
    if (this.isLinkLit(l)) return "rgba(255, 255, 255, 0.55)";
    return this.selected ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.13)";
  }

  private labelFor(n: GNode): SpriteText | null {
    // star labels only appear around the selected node, or the map turns into noise
    if (n.group === "star" && !(this.selected && this.highlight.has(n.id))) return null;
    const sprite = new SpriteText(this.opts.label(n));
    sprite.material.depthWrite = false;
    sprite.color = this.isLit(n.id) ? "rgba(231, 236, 243, 0.92)" : "rgba(231, 236, 243, 0.12)";
    sprite.textHeight = GROUP_STYLE[n.group].text;
    sprite.center.y = -0.9;
    return sprite;
  }

  private applyVisibility(): void {
    const nodes = this.opts.model.nodes.filter((n) => this.visible.has(n.group));
    const ids = new Set(nodes.map((n) => n.id));
    const links = this.opts.model.links.filter((l) => ids.has(endId(l.source)) && ids.has(endId(l.target)));
    this.visibleCount = nodes.length;
    this.graph.graphData({ nodes, links });
    if (this.selected && !ids.has(this.selected)) this.opts.onBackgroundClick();
    this.fitted = false;
  }

  private onEngineStop(): void {
    if (this.fitted) return;
    this.fitted = true;
    const selected = this.selected ? this.opts.model.byId.get(this.selected) : undefined;
    if (selected) this.flyTo(selected);
    else this.overview();
    if (!this.firstLayoutDone) {
      this.firstLayoutDone = true;
      this.opts.onFirstLayout();
    }
  }

  private flyTo(node: GNode): void {
    if (node.x === undefined || node.y === undefined || node.z === undefined) return;
    const distance = node.group === "category" ? 480 : node.group === "subject" ? 320 : 220;
    const r = Math.hypot(node.x, node.y, node.z) || 1;
    const k = 1 + distance / r;
    this.graph.cameraPosition({ x: node.x * k, y: node.y * k, z: node.z * k }, { x: node.x, y: node.y, z: node.z }, 1100);
  }
}
