// Best-site score, PLAN D17 — PROTOTYPE. Lane A's proposed formula; weights are adjustable in the
// Researcher view. The Educator view always uses SCORE_DEFAULT_WEIGHTS and says so.
//
//   score = 100 × (wS·S + wE·E + wD·D + wG·G) / (wS + wE + wD + wG)
//     S = sunlight share of the stay            (0..1, higher is better)
//     E = Earth-in-view share of the stay       (0..1, higher is better)
//     D = 1 − longest dark stretch / stay hours (0..1, shorter dark stretches are better)
//     G = 1 − longest contact gap / stay hours  (0..1, shorter gaps without Earth are better)
// All four come from the terrain-aware hourly data (D16 metrics). Weights are relative (any scale).
export const SCORE_DEFAULT_WEIGHTS = Object.freeze({ sunlight: 35, earth: 25, shortDark: 25, shortGap: 15 });
export const SCORE_TERMS = Object.freeze({
  sunlight: "S = sunlight share of the stay",
  earth: "E = Earth-in-view share of the stay",
  shortDark: "D = 1 − (longest dark stretch ÷ stay length)",
  shortGap: "G = 1 − (longest gap without Earth ÷ stay length)",
});
export const SCORE_FORMULA_TEXT =
  "score = 100 × (wS·S + wE·E + wD·D + wG·G) ÷ (wS + wE + wD + wG), where S = sunlight share, E = Earth-in-view share, " +
  "D = 1 − longest dark stretch ÷ stay length, G = 1 − longest gap without Earth ÷ stay length (all between 0 and 1). PROTOTYPE.";

/** m: { pctLit, pctComms, longestDarkHours, longestContactGapHours, hours }. Returns { score, components, weights }. */
export function scoreOf(m, weights = SCORE_DEFAULT_WEIGHTS) {
  const w = { ...SCORE_DEFAULT_WEIGHTS, ...weights };
  const c = {
    sunlight: m.pctLit / 100,
    earth: m.pctComms / 100,
    shortDark: 1 - Math.min(m.longestDarkHours, m.hours) / m.hours,
    shortGap: 1 - Math.min(m.longestContactGapHours, m.hours) / m.hours,
  };
  const sumW = w.sunlight + w.earth + w.shortDark + w.shortGap;
  if (!(sumW > 0)) return { score: null, components: c, weights: w };
  const score = (100 * (w.sunlight * c.sunlight + w.earth * c.earth + w.shortDark * c.shortDark + w.shortGap * c.shortGap)) / sumW;
  return { score, components: c, weights: w };
}
