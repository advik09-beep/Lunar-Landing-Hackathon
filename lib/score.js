// "Sun and Earth score", PLAN D17 + amendment (both humans, 2026-11-14) — PROTOTYPE.
// Lane A's proposed formula. The Educator view always uses SCORE_DEFAULT_WEIGHTS and says so;
// the Researcher view lets you change every weight. Weights are this team's judgment, not a NASA standard.
//
// Six terms, each between 0 and 1, for the 7-day stay from the landing date (terrain-aware hourly data):
//   S  sunlight share of the stay
//   E  Earth-in-view share of the stay
//   D  1 − longest dark stretch ÷ stay hours
//   G  1 − longest gap without Earth ÷ stay hours
//   C  clearance: during the hours each body is visible, how far it sits above the terrain skyline,
//      min(margin, 15°) ÷ 15° averaged over those hours; C = (Sun's + Earth's) ÷ 2 (0 if never visible)
//   T  slip tolerance: 1 − (drop of the five-term score if the landing moves up to ±3 days) ÷ 100,
//      where drop = today's five-term score − the lowest five-term score in that ±3-day window (≥ 0);
//      dates outside the data are skipped
//   score = 100 × (wS × S + wE × E + wD × D + wG × G + wC × C + wT × T) ÷ (wS + wE + wD + wG + wC + wT)
export const CLEARANCE_FULL_DEG = 15;
export const SLIP_DAYS = 3;
export const SCORE_LABEL = "Sun and Earth score";
/** D33: the one plain sentence shown in the Researcher score section (and in the shell's Data and methods). */
export const SCORE_OWN_FORMULA = "The Sun and Earth score is this team's own formula, not a NASA standard.";
export const SCORE_MEANING =
  "100 means the Sun and Earth stay in view, well above the skyline, for the whole 7-day stay, and the answer holds if the landing slips by up to 3 days. " +
  "It does not mean the site is safe: slopes, boulders, temperatures, landing hazards and mission risks are not included.";
export const SCORE_DEFAULT_WEIGHTS = Object.freeze({ sunlight: 25, earth: 20, shortDark: 15, shortGap: 10, clearance: 15, slip: 15 });
export const SCORE_TERMS = Object.freeze({
  sunlight: "S = sunlight share of the stay",
  earth: "E = Earth-in-view share of the stay",
  shortDark: "D = 1 − (longest dark stretch ÷ stay length)",
  shortGap: "G = 1 − (longest gap without Earth ÷ stay length)",
  clearance: `C = how far the Sun and Earth sit above the skyline while visible (full credit at ${CLEARANCE_FULL_DEG}° or more)`,
  slip: `T = 1 − (how much the score drops if the landing moves up to ±${SLIP_DAYS} days ÷ 100)`,
});
export const SCORE_FORMULA_TEXT =
  "score = 100 × (wS × S + wE × E + wD × D + wG × G + wC × C + wT × T) ÷ (wS + wE + wD + wG + wC + wT). " +
  `S = sunlight share; E = Earth-in-view share; D = 1 − longest dark stretch ÷ stay length; G = 1 − longest gap without Earth ÷ stay length; ` +
  `C = mean of min(height above the skyline, ${CLEARANCE_FULL_DEG}°) ÷ ${CLEARANCE_FULL_DEG}° over the hours each body is visible, Sun and Earth averaged; ` +
  `T = 1 − (drop of the score without T if the landing moves up to ±${SLIP_DAYS} days) ÷ 100. All terms 0 to 1.`;
export const WEIGHT_REASONS = Object.freeze({
  sunlight: "Sunlight is weighted most: without power nothing else on the lander runs.",
  earth: "Earth contact comes next: without it there are no commands going up and no data coming down.",
  shortDark: "The longest dark stretch counts separately: one long blackout is harder to survive (battery, heaters) than the same darkness spread out.",
  shortGap: "The longest gap without Earth counts less: a lander can store data and wait, but long silences add risk.",
  clearance: "Clearance measures how fragile the answer is: a Sun or Earth grazing the skyline can be lost to a small change in position or terrain detail.",
  slip: "Slip tolerance also measures fragility: real launch dates move, and a good answer that collapses if the date slips is less useful.",
});
export const WEIGHTS_STATEMENT = "These weights are this team's judgment, not a NASA standard. The Researcher view lets you change them.";
export const WEIGHTS_EDUCATOR_TEXT =
  "Sunlight counts most, because without power nothing else works, and talking to Earth comes next. " +
  "We also reward sites where the Sun and Earth sit well above the skyline and where the answer stays good if the landing date slips. " +
  WEIGHTS_STATEMENT;

const TERMS5 = ["sunlight", "earth", "shortDark", "shortGap", "clearance"];
/** Terms S, E, D, G, C (0..1) from a metrics row: { pctLit, pctComms, longestDarkHours, longestContactGapHours, hours, clearance }. */
export function termsOf(m) {
  return {
    sunlight: m.pctLit / 100,
    earth: m.pctComms / 100,
    shortDark: 1 - Math.min(m.longestDarkHours, m.hours) / m.hours,
    shortGap: 1 - Math.min(m.longestContactGapHours, m.hours) / m.hours,
    clearance: m.clearance,
  };
}
/** Five-term score (no slip term), 0..100, or null if those weights sum to 0. */
export function baseScore(m, weights = SCORE_DEFAULT_WEIGHTS) {
  const w = { ...SCORE_DEFAULT_WEIGHTS, ...weights }, c = termsOf(m);
  const sw = TERMS5.reduce((a, k) => a + w[k], 0);
  return sw > 0 ? (100 * TERMS5.reduce((a, k) => a + w[k] * c[k], 0)) / sw : null;
}
/** Slip tolerance T from today's metrics and the metrics rows within ±SLIP_DAYS (nulls skipped). */
export function slipTolerance(today, window, weights = SCORE_DEFAULT_WEIGHTS) {
  const b = baseScore(today, weights);
  if (b === null) return 1;
  const others = window.filter(Boolean).map((r) => baseScore(r, weights));
  const low = Math.min(b, ...others);
  return 1 - Math.max(0, b - low) / 100;
}
/** Full score. m: metrics row; window: metrics rows for the dates within ±SLIP_DAYS (may include m). */
export function scoreOf(m, weights = SCORE_DEFAULT_WEIGHTS, window = [m]) {
  const w = { ...SCORE_DEFAULT_WEIGHTS, ...weights };
  const c = { ...termsOf(m), slip: slipTolerance(m, window, w) };
  const keys = [...TERMS5, "slip"];
  const sumW = keys.reduce((a, k) => a + w[k], 0);
  if (!(sumW > 0)) return { score: null, components: c, weights: w };
  return { score: (100 * keys.reduce((a, k) => a + w[k] * c[k], 0)) / sumW, components: c, weights: w };
}
