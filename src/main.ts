import "./styles.css";
import { type Analysis, analyze } from "./analysis";
import { errorMessage, loadProfile } from "./app/load";
import { buildGraph, type GNode, type GraphModel, subjectId } from "./graph/buildGraph";
import type { GraphView } from "./graph/view";
import { parseGithubInput } from "./github/parse";
import { categoryName, formatNumber, getLang, onLangChange, setLang, subjectName, t } from "./i18n/i18n";
import { computeScores, type ScoreResult } from "./score/score";
import { bindSearch, renderLegend } from "./ui/controls";
import { type DetailContext, renderDetail } from "./ui/detail";
import { byId, el } from "./ui/dom";
import { downloadCard } from "./ui/png";
import { renderProfile } from "./ui/profile";

type ViewModule = typeof import("./graph/view");
/** three.js is most of the bundle, so the landing page loads without it. */
const loadViewModule = (): Promise<ViewModule> => import("./graph/view");

/** Same delay as the original page: let the overview camera move finish first. */
const HASH_SELECT_DELAY_MS = 950;

interface Session {
  analysis: Analysis;
  result: ScoreResult;
  model: GraphModel;
  view: GraphView | null;
  clearSearch: () => void;
  panel: "closed" | "profile" | "node";
  /** Kept here as well as in the view, so details still work without WebGL. */
  selectedId: string | null;
}

let session: Session | null = null;
let loadSeq = 0;

const landing = byId("landing");
const status = byId("status");
const panel = byId("detail");
const panelBody = byId("detail-body");

function nodeLabel(n: GNode): string {
  if (n.group === "category") return categoryName(n.key!);
  if (n.group === "subject") return subjectName(n.key!);
  return n.item!.repo.name;
}

function nodeTooltip(n: GNode): string {
  const repo = n.item?.repo;
  if (!repo) return nodeLabel(n);
  return [repo.fullName, repo.description].filter(Boolean).join("\n");
}

function safeDecode(text: string): string {
  try {
    return decodeURIComponent(text);
  } catch {
    return "";
  }
}

const shareUrl = (login: string): string => `${location.origin}${location.pathname}?u=${encodeURIComponent(login)}`;

function setUrl(login: string | null, hash = ""): void {
  const url = login ? `${location.pathname}?u=${encodeURIComponent(login)}${hash}` : location.pathname;
  history.replaceState(history.state, "", url);
}

// ---------------------------------------------------------------- static text

function applyStaticText(): void {
  document.title = `${t("app.title")} · ${getLang() === "zh" ? "GitHub Starmap" : "GitHub 星圖"}`;
  byId("landing-title").textContent = t("app.title");
  byId("tagline").textContent = t("app.tagline");
  byId<HTMLInputElement>("lookup").placeholder = t("app.placeholder");
  byId<HTMLInputElement>("lookup").setAttribute("aria-label", t("app.placeholder"));
  byId("lookup-go").textContent = t("app.go");
  byId("privacy").textContent = t("app.privacy");
  byId("rate-note").textContent = t("app.rateNote");
  byId("not-official").textContent = t("app.notOfficial");
  for (const id of ["lang-landing", "lang-toggle"]) {
    byId(id).textContent = t("controls.lang");
    byId(id).setAttribute("aria-label", t("controls.langLabel"));
  }
  byId<HTMLInputElement>("search").placeholder = t("controls.search");
  byId<HTMLInputElement>("search").setAttribute("aria-label", t("controls.search"));
  byId("open-card").textContent = t("controls.card");
  byId("another").textContent = t("controls.another");
  byId("close").setAttribute("aria-label", t("detail.close"));
}

function showStatus(message: string, isError = false, retryLogin?: string): void {
  status.className = isError ? "status error" : "status";
  status.replaceChildren(el("div", "", message));
  if (retryLogin) {
    const retry = el("button", "btn", t("error.retry"));
    retry.type = "button";
    retry.addEventListener("click", () => void start(retryLogin));
    status.append(retry);
  }
}

// ---------------------------------------------------------------- side panel

function detailContext(s: Session): DetailContext {
  return { model: s.model, label: nodeLabel, onSelect: selectNode };
}

function setPanelOpen(open: boolean): void {
  panel.classList.toggle("open", open);
  document.body.classList.toggle("detail-open", open);
  session?.view?.fitCanvas(open);
}

function renderPanel(): void {
  if (!session) return;
  const s = session;
  if (s.panel === "profile") {
    panelBody.replaceChildren(
      ...renderProfile(s.analysis, s.result, {
        onSubject: (key) => selectNode(subjectId(key)),
        onDownload: () => void exportPng(),
        onShare: (button) => void copyShareLink(button),
      }),
    );
  } else if (s.panel === "node" && s.selectedId) {
    const node = s.model.byId.get(s.selectedId);
    if (node) panelBody.replaceChildren(...renderDetail(node, detailContext(s)));
  }
}

function openProfile(): void {
  if (!session) return;
  session.view?.clearSelection();
  session.selectedId = null;
  session.panel = "profile";
  renderPanel();
  panel.scrollTop = 0;
  setPanelOpen(true);
  setUrl(session.analysis.user.login);
}

function selectNode(id: string): void {
  if (!session?.model.byId.has(id)) return;
  session.panel = "node";
  session.selectedId = id;
  setPanelOpen(true);
  session.view?.select(id); // may re-show a hidden group, so the legend is redrawn below
  renderPanel();
  renderControls(session);
  panel.scrollTop = 0;
  setUrl(session.analysis.user.login, `#${encodeURIComponent(id)}`);
}

function closePanel(): void {
  if (!session) return;
  session.panel = "closed";
  session.selectedId = null;
  session.view?.clearSelection();
  setPanelOpen(false);
  session.view?.overview();
  setUrl(session.analysis.user.login);
}

async function exportPng(): Promise<void> {
  if (!session) return;
  const button = document.getElementById("download-png");
  try {
    await downloadCard(session.analysis, session.result, shareUrl(session.analysis.user.login));
  } catch {
    if (button) button.textContent = t("card.downloadFailed");
  }
}

async function copyShareLink(button: HTMLButtonElement): Promise<void> {
  if (!session) return;
  const url = shareUrl(session.analysis.user.login);
  try {
    await navigator.clipboard.writeText(url);
    button.textContent = t("card.copied");
  } catch {
    button.textContent = url;
  }
}

// ---------------------------------------------------------------- mount

function renderControls(s: Session): void {
  const { user } = s.analysis;
  byId<HTMLImageElement>("avatar").src = user.avatarUrl;
  byId("who").textContent = user.name ? `${user.name} (@${user.login})` : `@${user.login}`;
  byId("counts").textContent = t("controls.counts", {
    repos: formatNumber(s.analysis.own.length),
    forks: formatNumber(s.analysis.forks.length),
    stars: formatNumber(s.analysis.stars.length),
  });
  const truncated = byId("truncated");
  truncated.hidden = !s.analysis.starsTruncated;
  truncated.textContent = t("controls.truncated");
  if (s.view) {
    const view = s.view;
    renderLegend(s.model, (g) => view.isVisible(g), (g) => {
      view.toggleGroup(g);
      renderControls(s);
    });
  }
}

function createView(mod: ViewModule | null, model: GraphModel, pendingHash: string): GraphView | null {
  if (!mod) return null;
  try {
    return new mod.GraphView({
      container: byId("graph"),
      model,
      label: nodeLabel,
      tooltip: nodeTooltip,
      onNodeClick: (n) => selectNode(n.id),
      onBackgroundClick: closePanel,
      onFirstLayout: () => {
        document.body.dataset.graph = "ready"; // lets E2E tests wait on a condition
        // keep the id in a local: by the time the timer fires the hash may be gone
        const initial = pendingHash;
        const owner = session;
        if (model.byId.has(initial)) setTimeout(() => session === owner && selectNode(initial), HASH_SELECT_DELAY_MS);
      },
    });
  } catch {
    return null;
  }
}

function mount(analysis: Analysis, mod: ViewModule | null): void {
  const model = buildGraph(analysis);
  const pendingHash = safeDecode(location.hash.slice(1));
  const view = createView(mod, model, pendingHash);
  const s: Session = { analysis, result: computeScores(analysis), model, view, clearSearch: () => {}, panel: "closed", selectedId: null };
  session = s;
  s.clearSearch = bindSearch(detailContext(s)).clear;
  landing.hidden = true;
  byId("controls").hidden = false;
  const hint = byId("hint");
  hint.hidden = false;
  hint.classList.toggle("warn", !view);
  hint.textContent = view ? t("controls.hint") : t("error.webgl");
  renderControls(s);
  openProfile();
}

function unmount(): void {
  loadSeq += 1; // a load still in flight must not mount after we left
  delete document.body.dataset.graph;
  session?.view?.destroy();
  session = null;
  setPanelOpen(false);
  panelBody.replaceChildren();
  byId("controls").hidden = true;
  byId("hint").hidden = true;
  landing.hidden = false;
}

async function start(login: string): Promise<void> {
  unmount();
  const seq = ++loadSeq;
  setUrl(login, location.hash);
  showStatus(t("load.user", { login }));
  const viewModule = loadViewModule().catch(() => null);
  try {
    const profile = await loadProfile(login, (p) => {
      if (seq === loadSeq) showStatus(t("load.progress", { repos: p.repoPages, stars: p.starPages }));
    });
    const mod = await viewModule;
    if (seq !== loadSeq) return;
    showStatus("");
    mount(analyze(profile), mod);
  } catch (error) {
    if (seq !== loadSeq) return;
    showStatus(errorMessage(error, login), true, login);
  }
}

// ---------------------------------------------------------------- events

byId("lookup-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const login = parseGithubInput(byId<HTMLInputElement>("lookup").value);
  if (!login) return showStatus(t("error.invalid"), true);
  history.pushState(null, "", `${location.pathname}?u=${encodeURIComponent(login)}`);
  void start(login);
});

byId("another").addEventListener("click", () => {
  history.pushState(null, "", location.pathname);
  unmount();
  showStatus("");
  byId<HTMLInputElement>("lookup").focus();
});

byId("open-card").addEventListener("click", openProfile);
byId("close").addEventListener("click", closePanel);
for (const id of ["lang-landing", "lang-toggle"]) {
  byId(id).addEventListener("click", () => setLang(getLang() === "zh" ? "en" : "zh"));
}

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || !session) return;
  session.clearSearch();
  closePanel();
});
window.addEventListener("resize", () => session?.view?.fitCanvas(panel.classList.contains("open")));

function routeFromUrl(): void {
  const login = parseGithubInput(new URLSearchParams(location.search).get("u") ?? "");
  if (login) void start(login);
  else {
    unmount();
    showStatus("");
  }
}
window.addEventListener("popstate", routeFromUrl);

onLangChange(() => {
  applyStaticText();
  if (!session) return;
  renderControls(session);
  renderPanel();
  session.view?.refresh();
  if (!session.view) byId("hint").textContent = t("error.webgl");
  else byId("hint").textContent = t("controls.hint");
});

setLang(getLang());
routeFromUrl();
