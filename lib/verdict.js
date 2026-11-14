// Verdict rule, PLAN D5 (signed by both humans 2026-11-14). Shared by lib/visibility.js
// and scripts/build_daily.mjs so the daily file and live summaries use one rule.
export const VERDICT_RULE = { STAY_DAYS: 7, CLEAR_PCT: 90, OUT_PCT: 10, EDGE_DEG: 2 };

export const RULE_TEXT =
  `on the edge: Sun or Earth within ${VERDICT_RULE.EDGE_DEG}° of the horizon more than 50% of the time; ` +
  `otherwise clear: Sun and Earth both up at least ${VERDICT_RULE.CLEAR_PCT}% of the time; ` +
  `out: both up ${VERDICT_RULE.OUT_PCT}% of the time or less; partial: anything in between.`;

export function verdictOf({ pctBoth, pctSunEdge, pctEarthEdge }) {
  if (pctSunEdge > 50 || pctEarthEdge > 50) return "edge";
  if (pctBoth >= VERDICT_RULE.CLEAR_PCT) return "clear";
  if (pctBoth <= VERDICT_RULE.OUT_PCT) return "out";
  return "partial";
}
