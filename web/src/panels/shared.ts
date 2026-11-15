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

/** D35 colour roles (identical in shell, panels and deck). Only two hues: gold for the Sun, blue for Earth.
 *  Everything else is grey. Contrast on the panel colour #1C1C1E: text 14.7:1, muted 6.7:1, sun 10.1:1, earth 6.7:1;
 *  on the 0.90 glass over pure white (#333334): text 10.9:1, muted 5.0:1, sun 7.5:1, earth 5.0:1. Black on the
 *  moonlight accent: 15.6:1. Verdict colours draw Moon-phase icons, not text. */
export const THEME = Object.freeze({
  sun: "#F2C14E",       // gold = the Sun and sunlight (only)
  earth: "#5AA9E6",     // blue = Earth and contact (only)
  clear: "#E8E4DA",     // verdict Clear: full bright disc (moonlight)
  partial: "#E8E4DA",   // verdict Partial: half-lit disc
  out: "#8E8B85",       // verdict Out: dark disc with this thin outline (not used for text)
  outFill: "#2A2A2C",
  edge: "#B5B1A9",      // verdict On the edge: dashed ring with a centre dot
  text: "#F2EEE6", muted: "#A6A29B", warn: "#F2EEE6", link: "#F2EEE6",
  bg: "#1C1C1E", page: "#0A0A0B", border: "#3A3A3C", focus: "#F2EEE6",
  accent: "#E8E4DA", onAccent: "#0A0A0B", // moonlight buttons and selected tabs, black text
  glass: "rgba(28, 28, 30, 0.90)", glassBlur: "14px",
  divider: "rgba(242, 238, 230, 0.16)",
  horizon: "#E8E2D0", ground: "#262626", groundLine: "#3A3A3A", sky: "#121214",
});

const BASE_CSS = `
:host {
  display: block; font: inherit;
  /* Private copies: each takes the shell's --llp-* value if set, else the D30 default. */
  --_sun: var(--llp-sun, ${THEME.sun}); --_earth: var(--llp-earth, ${THEME.earth});
  --_clear: var(--llp-clear, ${THEME.clear}); --_partial: var(--llp-partial, ${THEME.partial});
  --_out: var(--llp-out, ${THEME.out}); --_edge: var(--llp-edge, ${THEME.edge});
  --_text: var(--llp-text, ${THEME.text}); --_muted: var(--llp-muted, ${THEME.muted}); --_warn: var(--llp-warn, ${THEME.warn});
  --_link: var(--llp-link, ${THEME.link}); --_bg: var(--llp-bg, ${THEME.bg}); --_border: var(--llp-border, ${THEME.border});
  --_accent: var(--llp-accent, ${THEME.accent}); --_on-accent: var(--llp-on-accent, ${THEME.onAccent}); --_focus: var(--llp-focus, ${THEME.focus});
  --_out-fill: var(--llp-out-fill, ${THEME.outFill});
  --_horizon: var(--llp-horizon, ${THEME.horizon}); --_ground: var(--llp-ground, ${THEME.ground});
  --_ground-line: var(--llp-ground-line, ${THEME.groundLine}); --_sky: var(--llp-sky, ${THEME.sky});
  --_glass: var(--llp-glass, ${THEME.glass}); --_glass-blur: var(--llp-glass-blur, ${THEME.glassBlur}); --_divider: var(--llp-divider, ${THEME.divider});
  /* D30 type and spacing scale */
  --_fs-xs: .75rem; --_fs-sm: .84rem; --_fs-md: .95rem; --_fs-lg: 1.1rem; --_pad: 12px 14px; --_gap: 8px;
  color: var(--_text);
}
* { box-sizing: border-box; }
.muted { color: var(--_muted); }
a { color: var(--_link); text-decoration: underline; text-underline-offset: 3px; }
.warn { color: var(--_warn); }
button { font: inherit; cursor: pointer; }
:focus-visible { outline: 2px solid var(--_focus); outline-offset: 2px; }
h2, h3, h4 { font-family: var(--llp-heading-font, inherit); } /* D33: the shell sets its heading font (CMU Serif) here */
.vi { display: inline-block; vertical-align: middle; flex: none; }
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

/** D33: verdict symbols drawn as small inline SVG icons (not text characters), so they look the same on every
 *  computer. The word label always goes with them (never colour alone). */
export function verdictIcon(v: Verdict, size = 18): string {
  // D35: Moon phases in greys. Clear = full bright disc; Partial = half-lit disc; Out = dark disc, thin outline;
  // On the edge = dashed ring with a centre dot. The word label always goes with them.
  const body = {
    clear: `<circle cx="10" cy="10" r="8.6" style="fill:var(--_clear);stroke:var(--_clear)" stroke-width="1"/>`,
    partial: `<circle cx="10" cy="10" r="8" style="fill:var(--_out-fill);stroke:var(--_partial)" stroke-width="1.6"/><path d="M10 2a8 8 0 0 1 0 16z" style="fill:var(--_partial)"/>`,
    out: `<circle cx="10" cy="10" r="8" style="fill:var(--_out-fill);stroke:var(--_out)" stroke-width="1.3"/>`,
    edge: `<circle cx="10" cy="10" r="8" fill="none" style="stroke:var(--_edge)" stroke-width="1.6" stroke-dasharray="2.6 2.2"/><circle cx="10" cy="10" r="2.2" style="fill:var(--_edge)"/>`,
  }[v];
  return `<svg class="vi" data-icon="${v}" width="${size}" height="${size}" viewBox="0 0 20 20" aria-hidden="true" focusable="false">${body}</svg>`;
}
/** Pass / fail icons for the requirements list (D33). */
export function markIcon(pass: boolean, size = 16): string {
  return pass
    ? `<svg class="vi" data-icon="pass" width="${size}" height="${size}" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="9" style="fill:var(--_clear)"/><path d="M5.5 10.3l3 3 6-6.6" fill="none" style="stroke:var(--_on-accent)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    : `<svg class="vi" data-icon="fail" width="${size}" height="${size}" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="8" style="fill:var(--_out-fill);stroke:var(--_out)" stroke-width="1.3"/><path d="M6.8 6.8l6.4 6.4M13.2 6.8l-6.4 6.4" style="stroke:var(--_text)" stroke-width="2" stroke-linecap="round"/></svg>`;
}

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

/** D33: stay length used by a panel. Researcher content follows the shell's stayDays (1, 3, 7 or 14); Educator is always 7. */
export function stayFor(stayDays: number | undefined, researcher: boolean): 1 | 3 | 7 | 14 {
  return researcher && (stayDays === 1 || stayDays === 3 || stayDays === 14) ? stayDays : 7;
}
/** "1 day", "3 days", "a week", "2 weeks" style label for headings (Researcher). */
export const stayWords = (n: number): string => (n === 1 ? "1-day" : `${n}-day`);

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
.why-weights summary { cursor: pointer; color: var(--_link); text-decoration: underline; display: inline; }
.why-weights p, .why-weights ul { margin: 6px 0; }
.meaning { font-size: .82rem; color: var(--_muted); }
`;

export function addDays(date: string, n: number): string {
  return new Date(Date.parse(date + "T00:00:00Z") + n * 864e5).toISOString().slice(0, 10);
}
export function fmtUtc(iso: string): string {
  return iso.replace("T", " ").replace(/:00Z$/, " UTC").replace(/Z$/, " UTC");
}
