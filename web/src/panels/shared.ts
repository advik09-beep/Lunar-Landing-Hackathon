// Shared helpers for Lane A panels: style isolation (Shadow DOM), wording, formatting.
import { V, type Verdict, type Weights } from "./data";

/**
 * Creates the panel's own element inside the shell's container and attaches a Shadow DOM to it.
 * Panel CSS lives only inside the shadow root, so it cannot leak into the shell, and shell CSS
 * cannot reach panel internals. Inherited properties (font-family, color) and CSS custom
 * properties (--llp-*) do pass in, so the shell can theme panels without touching their files.
 */
export function createPanelRoot(container: HTMLElement, kind: string, css: string): { host: HTMLElement; root: ShadowRoot } {
  const host = document.createElement("div");
  host.className = `llp-panel llp-${kind}`;
  host.dataset.lanePanel = kind;
  const root = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = BASE_CSS + css;
  root.append(style);
  container.append(host);
  return { host, root };
}

const BASE_CSS = `
:host { display: block; color: var(--llp-text, #ecf2ff); font: inherit; }
* { box-sizing: border-box; }
.muted { color: var(--llp-muted, #a8bbd3); }
.warn { color: var(--llp-warn, #ffd49d); }
button { font: inherit; cursor: pointer; }
:focus-visible { outline: 2px solid var(--llp-focus, #8fc1ff); outline-offset: 2px; }
`;

export const esc = (s: unknown): string =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const deg = (x: number, digits = 2): string => `${x >= 0 ? "+" : "−"}${Math.abs(x).toFixed(digits)}°`;
export const az = (x: number): string => `${(Math.round(x * 10) / 10 % 360).toFixed(1)}°`; // 359.97 -> "0.0°", never "360.0°"
export const pct = (x: number): string => `${Math.round(x)}%`;

/** Words + symbol for each verdict. Color is extra, never the only signal (PLAN: "never shown by color alone"). */
export const VERDICT_WORDS: Record<Verdict, { label: string; symbol: string; short: string }> = {
  clear: { label: "Clear", symbol: "✓", short: "sunlight and Earth in view together most of the stay" },
  partial: { label: "Partial", symbol: "◐", short: "sunlight and Earth in view together only part of the stay" },
  out: { label: "Out", symbol: "✕", short: "sunlight and Earth rarely in view together" },
  edge: { label: "On the edge", symbol: "⚠", short: "the Sun or Earth hugs the horizon, so terrain decides" }, // flat-horizon wording
};

/** "On the edge" means different things by horizon model (Sheldon, 2026-11-14):
 *  flat sites: terrain isn't modelled, so terrain decides; terrain sites: terrain is already included,
 *  so the body is grazing the skyline and small changes in position matter. */
export const EDGE_WORDS = {
  flat: "the Sun or Earth hugs the horizon, so terrain decides",
  lola: "grazing the skyline: small changes in position matter",
} as const;
export function verdictShort(v: Verdict, model: "flat" | "lola"): string {
  return v === "edge" ? EDGE_WORDS[model] : VERDICT_WORDS[v].short;
}

/** Clamp a shared hour to the stay: 0 .. hours-1 (whole hours). */
export function clampHour(h: number | undefined, hours: number): number {
  const n = Math.round(Number(h ?? 0));
  return Number.isFinite(n) ? Math.min(hours - 1, Math.max(0, n)) : 0;
}

/** D17: the six weights in display order with their symbols. */
export const WEIGHT_KEYS: [keyof Weights, string][] = [["sunlight", "wS"], ["earth", "wE"], ["shortDark", "wD"], ["shortGap", "wG"], ["clearance", "wC"], ["slip", "wT"]];
/** Clickable "Why these weights?" (a native <details>, keyboard accessible). */
export function whyWeights(level: "educator" | "researcher"): string {
  const body = level === "educator"
    ? `<p>${esc(V.WEIGHTS_EDUCATOR_TEXT)}</p>`
    : `<ul>${WEIGHT_KEYS.map(([k, w]) => `<li><strong>${w} = ${V.SCORE_DEFAULT_WEIGHTS[k]}:</strong> ${esc(V.WEIGHT_REASONS[k])}</li>`).join("")}</ul><p>${esc(V.WEIGHTS_STATEMENT)}</p>`;
  return `<details class="why-weights"><summary>Why these weights?</summary>${body}</details>`;
}
export const WHY_WEIGHTS_CSS = `
.why-weights { margin: 6px 0; font-size: .84rem; }
.why-weights summary { cursor: pointer; color: var(--llp-link, #9cc6ff); text-decoration: underline; display: inline; }
.why-weights p, .why-weights ul { margin: 6px 0; }
.meaning { font-size: .82rem; color: var(--llp-muted, #a8bbd3); }
`;

export function addDays(date: string, n: number): string {
  return new Date(Date.parse(date + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
}
export function fmtUtc(iso: string): string {
  return iso.replace("T", " ").replace(/:00Z$/, " UTC").replace(/Z$/, " UTC");
}
