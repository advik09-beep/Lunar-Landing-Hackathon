// Typed view of Lane A's /lib/visibility.js for the panels. No astronomy here: panels only
// read what /lib returns. (The library is plain JS; these types describe contract v1.2.)
import * as raw from "../../../lib/visibility.js";

export interface Site {
  id: string; name: string; lat: number; lon: number; kind: string;
  landingDate: string | null; source: string; coordsVerified: boolean; note: string;
  category: "candidate" | "historic"; // D21
}
export interface State {
  sunEl: number; sunAz: number; earthEl: number; earthAz: number;
  lit: boolean; comms: boolean;
  hoursToSunChange: number | null; hoursToEarthChange: number | null;
  terrain: "real" | "flat";
  sunMarginDeg: number; earthMarginDeg: number;
  sunEdge: boolean; earthEdge: boolean; edgeDeg: number;
  horizonModel: "lola" | "flat"; sampleUtc: string;
  // v1.6 (D19)
  sunFraction: number; sunSkylineFraction: number; eclipseFraction: number; earthMarginal: boolean; sunRadiusDeg: number; earthRadiusDeg: number; sunDistKm: number; earthDistKm: number; irradianceWm2: number;
}
export type Verdict = "clear" | "partial" | "out" | "edge";
export interface Summary {
  pctLit: number; pctComms: number; pctBoth: number; longestDarkHours: number;
  pctSunEdge: number; pctEarthEdge: number; verdict: Verdict; verdictRule: string;
}
export interface Sample {
  utc: string; sunEl: number; sunAz: number; earthEl: number; earthAz: number;
  lit: boolean; comms: boolean; sunEdge: boolean; earthEdge: boolean;
  sunMarginDeg: number; earthMarginDeg: number; horizonModel: "lola" | "flat";
  // v1.6 (D19)
  sunFraction: number; sunSkylineFraction: number; eclipseFraction: number; earthMarginal: boolean; sunRadiusDeg: number; earthRadiusDeg: number; sunDistKm: number; earthDistKm: number; irradianceWm2: number;
}
export interface Timeline {
  siteId: string; stepHours: number; mock: boolean; terrain: string;
  horizonModel: "lola" | "flat"; source: string; samples: Sample[];
}
export interface Horizon {
  siteId: string; model: "lola" | "flat"; resolutionDeg: number; elevationDeg: number[];
  source: string; verified: boolean; verifiedMeaning?: string;
  blockDistKm?: number[]; observer?: { lat: number; lon: number; groundHeightM: number; mastM: number; mastAssumed: boolean };
}
export interface Coverage {
  mock: boolean; stepHours: number; timeScale: string;
  sites: { siteId: string; ranges: [string, string][]; terrain: "lola" | "flat" }[];
}
export interface VerdictRule { STAY_DAYS: number; CLEAR_PCT: number; OUT_PCT: number; EDGE_DEG: number }
// v1.4 (D16 / D17)
export interface Metrics {
  hours: number; pctLit: number; longestDarkHours: number; darkPeriods: number;
  pctComms: number; longestContactGapHours: number; contactWindows: number; horizonModel: "lola" | "flat"; note: string; commsNote: string;
  partialSunHours: number; eclipseHours: number; earthMarginalHours: number; litHours: number;
}
export interface Power {
  hours: number; panel: "tracking" | "fixed-flat"; areaM2: number; efficiency: number; loadW: number;
  irradianceWm2: number; peakW: number; averageW: number; energyWh: number; loadEnergyWh: number; balanceWh: number;
  poweredHours: number; longestNoPowerHours: number; batteryWh: number; assumptions: string[]; estimate: true;
}
export type Weights = { sunlight: number; earth: number; shortDark: number; shortGap: number; clearance: number; slip: number };
export type RankFilter = "all" | "candidate" | "historic";
export interface RankRow { siteId: string; name: string; category: "candidate" | "historic"; score: number | null; available: boolean;
  components?: Record<keyof Weights, number>; }
export interface Ranking { landingDate: string; weights: Weights; isDefault: boolean; formula: string; prototype: true; filter: RankFilter; ranking: RankRow[] }

interface Api {
  MOCK: boolean; API_VERSION: string; VERDICT_RULE: VerdictRule;
  listSites(): Site[];
  loadSite(siteId: string): Promise<void>;
  loadDaily(): Promise<void>;
  getState(siteId: string, utc: string | number): State;
  getSummary(siteId: string, startUtc: string | number, days: number): Summary;
  getTimeline(siteId: string, startUtc: string | number, days: number, stepHours?: number): Timeline;
  getHorizon(siteId: string): Horizon;
  getCoverage(): Coverage;
  getMetrics(siteId: string, startUtc: string | number, days?: number): Metrics;
  computePower(o: { siteId: string; startUtc: string | number; days?: number; areaM2: number; efficiency: number; panel: "tracking" | "fixed-flat"; loadW: number }): Power;
  getRanking(landingDate: string, weights?: Partial<Weights>, filter?: RankFilter): Ranking;
  SITE_CATEGORIES: Record<"candidate" | "historic", string>;
  scoreOf(m: Metrics, weights?: Partial<Weights>): { score: number | null; components: Record<keyof Weights, number>; weights: Weights };
  SCORE_DEFAULT_WEIGHTS: Weights; SCORE_TERMS: Record<keyof Weights, string>; SCORE_FORMULA_TEXT: string;
  SOLAR_IRRADIANCE_W_M2: number; SOLAR_IRRADIANCE_SOURCE: string;
  SCORE_LABEL: string; SCORE_MEANING: string; WEIGHT_REASONS: Record<keyof Weights, string>; WEIGHTS_STATEMENT: string; WEIGHTS_EDUCATOR_TEXT: string;
}

export const V = raw as unknown as Api;
