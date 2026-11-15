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

/** D30 colour roles and scale (identical in shell and panels). Contrast on the card colour #132138:
 *  sun 9.6:1, earth 6.3:1, clear 7.0:1, out 6.3:1, edge 6.1:1, text 14.4:1, muted 8.2:1, warn 6.8:1, link 9.2:1. */
export const THEME = Object.freeze({
  sun: "#F2C14E",       // gold = the Sun and sunlight (only)
  earth: "#5AA9E6",     // blue = Earth and contact (only)
  clear: "#4FBF7A",     // verdict Clear: solid green
  partial: "#4FBF7A",   // verdict Partial: half-filled green outline (same green, never yellow)
  out: "#94A3B8",       // verdict Out: slate grey
  edge: "#B48CF0",      // verdict On the edge: violet
  text: "#ECF2FF", muted: "#A8BBD3", warn: "#F28B82", link: "#9CC6FF",
  bg: "#132138", page: "#091322", border: "#344B69", focus: "#9CC6FF",
  accent: "#4F46B8",    // D31: indigo for selected controls, kept distinct from Earth blue (white text on it 6.45:1)
  glass: "rgba(19, 33, 56, 0.90)", glassBlur: "14px", // D31 glass panels: at 0.90 every text colour passes 4.5:1 even over white
  divider: "rgba(168, 187, 211, 0.18)",
  horizon: "#E8E2D0", ground: "#2A2620", groundLine: "#4A443A", sky: "#0D1A2E",
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
  --_accent: var(--llp-accent, ${THEME.accent}); --_focus: var(--llp-focus, ${THEME.focus});
  --_horizon: var(--llp-horizon, ${THEME.horizon}); --_ground: var(--llp-ground, ${THEME.ground});
  --_ground-line: var(--llp-ground-line, ${THEME.groundLine}); --_sky: var(--llp-sky, ${THEME.sky});
  --_glass: var(--llp-glass, ${THEME.glass}); --_glass-blur: var(--llp-glass-blur, ${THEME.glassBlur}); --_divider: var(--llp-divider, ${THEME.divider});
  /* D30 type and spacing scale */
  --_fs-xs: .75rem; --_fs-sm: .84rem; --_fs-md: .95rem; --_fs-lg: 1.1rem; --_pad: 12px 14px; --_gap: 8px;
  color: var(--_text);
}
* { box-sizing: border-box; }
.muted { color: var(--_muted); }
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
  const dark = "#0b1322";
  const body = {
    clear: `<circle cx="10" cy="10" r="9" style="fill:var(--_clear)"/><path d="M5.5 10.3l3 3 6-6.6" fill="none" stroke="${dark}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
    partial: `<circle cx="10" cy="10" r="8" fill="none" style="stroke:var(--_partial)" stroke-width="2.4"/><path d="M10 4.5a5.5 5.5 0 0 0 0 11z" style="fill:var(--_partial)"/>`,
    out: `<circle cx="10" cy="10" r="9" style="fill:var(--_out)"/><path d="M6.6 6.6l6.8 6.8M13.4 6.6l-6.8 6.8" stroke="${dark}" stroke-width="2.2" stroke-linecap="round"/>`,
    edge: `<circle cx="10" cy="10" r="9" style="fill:var(--_edge)"/><circle cx="10" cy="10" r="7.4" fill="none" stroke="${dark}" stroke-width="1.3" stroke-dasharray="2.2 1.8"/><path d="M10 5.6v5.4" stroke="${dark}" stroke-width="2.2" stroke-linecap="round"/><circle cx="10" cy="13.9" r="1.3" fill="${dark}"/>`,
  }[v];
  return `<svg class="vi" data-icon="${v}" width="${size}" height="${size}" viewBox="0 0 20 20" aria-hidden="true" focusable="false">${body}</svg>`;
}
/** Pass / fail icons for the requirements list (D33). */
export function markIcon(pass: boolean, size = 16): string {
  return pass
    ? `<svg class="vi" data-icon="pass" width="${size}" height="${size}" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="9" style="fill:var(--_clear)"/><path d="M5.5 10.3l3 3 6-6.6" fill="none" stroke="#0b1322" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    : `<svg class="vi" data-icon="fail" width="${size}" height="${size}" viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="9" style="fill:var(--_warn)"/><path d="M6.6 6.6l6.8 6.8M13.4 6.6l-6.8 6.8" stroke="#0b1322" stroke-width="2.2" stroke-linecap="round"/></svg>`;
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
