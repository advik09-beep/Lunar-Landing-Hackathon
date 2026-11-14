// Typed view of Lane A's /lib/visibility.js for the panels. No astronomy here: panels only
// read what /lib returns. (The library is plain JS; these types describe contract v1.2.)
import * as raw from "../../../lib/visibility.js";

export interface Site {
  id: string; name: string; lat: number; lon: number; kind: string;
  landingDate: string | null; source: string; coordsVerified: boolean; note: string;
}
export interface State {
  sunEl: number; sunAz: number; earthEl: number; earthAz: number;
  lit: boolean; comms: boolean;
  hoursToSunChange: number | null; hoursToEarthChange: number | null;
  terrain: "real" | "flat";
  sunMarginDeg: number; earthMarginDeg: number;
  sunEdge: boolean; earthEdge: boolean; edgeDeg: number;
  horizonModel: "lola" | "flat"; sampleUtc: string;
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
}

export const V = raw as unknown as Api;
