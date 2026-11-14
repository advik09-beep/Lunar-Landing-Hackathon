// Shared helpers for Lane A panels: style isolation (Shadow DOM), wording, formatting.
import type { Verdict } from "./data";

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
  edge: { label: "On the edge", symbol: "⚠", short: "the Sun or Earth hugs the horizon, so terrain decides" },
};

/** Clamp a shared hour to the stay: 0 .. hours-1 (whole hours). */
export function clampHour(h: number | undefined, hours: number): number {
  const n = Math.round(Number(h ?? 0));
  return Number.isFinite(n) ? Math.min(hours - 1, Math.max(0, n)) : 0;
}

export function addDays(date: string, n: number): string {
  return new Date(Date.parse(date + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
}
export function fmtUtc(iso: string): string {
  return iso.replace("T", " ").replace(/:00Z$/, " UTC").replace(/Z$/, " UTC");
}
