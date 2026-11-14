// Researcher tab (D18): a full analysis of one site and 7-day stay, written for researchers and mission
// designers. Carries D20 (lunar conditions), D16 (metrics + power calculator), D17 (score + formula),
// the terrain profile and its maps, D22 (other planets), what is NOT modelled, sources, and a download.
// Lane A owns this file. All numbers come from /lib/visibility.js.
import { V } from "./data";
import { createPanelRoot, esc, deg, az, pct, fmtUtc, whyWeights, WHY_WEIGHTS_CSS, WEIGHT_KEYS } from "./shared";
import type { MountPanel, PanelProps } from "./types";

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any
const L = V as unknown as Record<string, Any>;

export const mountResearcher: MountPanel = (container, props) => {
  const { host, root } = createPanelRoot(container, "researcher", CSS + WHY_WEIGHTS_CSS);
  const body = document.createElement("section");
  body.className = "card";
  root.append(body);
  let current: PanelProps = { ...props };
  let token = 0;
  let analysis: Any = null;
  const calc = { areaM2: 1, effPct: 30, panel: "tracking" as "tracking" | "fixed-flat", loadW: 100 };

  body.addEventListener("input", (e) => {
    const t = e.target as HTMLInputElement | HTMLSelectElement;
    const k = t.dataset.calc;
    if (!k) return;
    if (k === "panel") calc.panel = t.value as "tracking" | "fixed-flat";
    else (calc as Record<string, number | string>)[k] = Number(t.value);
    renderCalc();
  });
  body.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>("[data-action]")?.dataset.action;
    if (a === "download-json") downloadJson();
    else if (a === "download-csv") downloadCsv();
  });

  async function load() {
    const my = ++token;
    analysis = null;
    const site = V.listSites().find((s) => s.id === current.siteId);
    if (!site) { body.innerHTML = `<p class="warn">Unknown site.</p>`; return; }
    body.innerHTML = `<p class="muted">Loading the full analysis for ${esc(site.name)}…</p>`;
    try { await Promise.all([V.loadSite(site.id), V.loadDaily()]); } catch (err) {
      if (my === token) body.innerHTML = `<p class="warn">Could not load data (${esc((err as Error).message)}).</p>`; return;
    }
    if (my !== token) return;
    const start = `${current.landingDate}T00:00:00Z`;
    try {
      analysis = {
        generatedUtc: new Date().toISOString(), apiVersion: V.API_VERSION,
        site, stay: { start, days: V.VERDICT_RULE.STAY_DAYS },
        summary: V.getSummary(site.id, start, V.VERDICT_RULE.STAY_DAYS),
        metrics: V.getMetrics(site.id, start),
        conditions: L.getConditions(site.id, start),
        months: L.getMonthlyScores(site.id),
        score: L.getScore(site.id, current.landingDate),
        rankingAll: V.getRanking(current.landingDate),
        nasaCriteria: L.NASA_SITE_CRITERIA, criteriaCoverage: L.CRITERIA_COVERAGE,
        otherPlanets: L.OTHER_PLANETS_NOTE, notModeled: L.NOT_MODELED, sources: L.SOURCES,
      };
      paint();
      renderCalc();
    } catch (err) {
      const msg = (err as Error).message;
      body.innerHTML = /OUT_OF_COVERAGE/.test(msg)
        ? `<h2>Researcher view: ${esc(site.name)}</h2><p class="warn"><strong>Unavailable:</strong> no data for a 7-day stay from ${esc(current.landingDate)}. Data cover 2026–2029${site.landingDate ? " and 30 days around the landing" : ""}.</p>`
        : `<p class="warn">${esc(msg)}</p>`;
    }
  }

  function paint() {
    const A = analysis, s = A.site, c = A.conditions, m = A.metrics, t = c.terrain;
    const mm = (o: { min: number; max: number }, f: (x: number) => string) => `${f(o.min)} to ${f(o.max)}`;
    const n0 = (x: number) => x.toFixed(0), n1 = (x: number) => x.toFixed(1), n3 = (x: number) => x.toFixed(3);
    const lt = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.floor((h % 1) * 60)).padStart(2, "0")}`;
    const slope = t.localSlope ?? null;
    body.innerHTML = `
      <header>
        <p class="audience">RESEARCHER VIEW — written for researchers and mission designers</p>
        <h2>${esc(s.name)}</h2>
        <p class="muted">${esc(fmtCoords(s.lat, s.lon))} · ${s.category === "historic" ? "historic landing (a past mission, shown for comparison)" : "candidate site"} · 7-day stay from ${esc(current.landingDate)} 00:00 UTC</p>
        <div class="dl"><button type="button" data-action="download-json">Download full analysis (JSON)</button>
          <button type="button" data-action="download-csv">Download hourly data (CSV)</button></div>
      </header>

      <h3>What NASA weighs when choosing a landing region</h3>
      <ul class="small">${A.nasaCriteria.map((q: Any) => `<li>“${esc(q.text)}” <a href="${esc(q.url)}" target="_blank" rel="noopener">${esc(q.source)}</a></li>`).join("")}</ul>
      <table><thead><tr><th>Criterion</th><th>What this analysis provides</th></tr></thead><tbody>
        ${A.criteriaCoverage.map(([k, v]: [string, string]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</tbody></table>

      <h3>Lighting and power</h3>
      <table class="kv">
        <tr><th>Sunlight share (visible share of the Sun's disc)</th><td>${pct(m.pctLit)}</td><th>Longest dark stretch</th><td>${m.longestDarkHours} h</td></tr>
        <tr><th>Dark periods</th><td>${m.darkPeriods}</td><th>Longest continuous sunlight</th><td>${c.longestContinuousSunHours} h ${c.meetsNasa65DaySunBenchmark ? "(meets" : "(below"} NASA's 6.5-day = 156 h benchmark)</td></tr>
        <tr><th>Hours with part of the Sun's disc hidden</th><td>${c.partialSunHours}</td><th>Sunlight strength (actual Sun distance)</th><td>${mm(c.sunlightStrengthWm2, n1)} W/m²</td></tr>
        <tr><th>Sun distance</th><td>${mm(c.sunDistanceKm, (x) => (x / 1e6).toFixed(3))} million km</td><th>Lunar eclipses in the stay</th><td>${c.eclipses.length ? c.eclipses.map((e: Any) => `${esc(fmtUtc(e.start))}–${esc(fmtUtc(e.end).slice(11))}, up to ${n0(e.maxCoveredPct)}% of the Sun covered`).join("; ") : "none"}</td></tr>
      </table>
      <h4>Power calculator <span class="tag est">ESTIMATE</span></h4>
      <div class="calc">
        <label>Panel area (m²) <input type="number" min="0.01" step="0.1" value="${calc.areaM2}" data-calc="areaM2"/></label>
        <label>Efficiency (%) <input type="number" min="1" max="100" step="1" value="${calc.effPct}" data-calc="effPct"/></label>
        <label>Panel type <select data-calc="panel"><option value="tracking"${calc.panel === "tracking" ? " selected" : ""}>Sun-tracking</option><option value="fixed-flat"${calc.panel === "fixed-flat" ? " selected" : ""}>Fixed flat (horizontal)</option></select></label>
        <label>Lander power draw (W) <input type="number" min="0" step="1" value="${calc.loadW}" data-calc="loadW"/></label>
      </div>
      <div class="calc-out" aria-live="polite"></div>

      <h3>Communications with Earth (geometry only)</h3>
      <table class="kv">
        <tr><th>Earth in view (whole disc clears the skyline)</th><td>${pct(m.pctComms)}</td><th>Marginal hours (Earth partly hidden)</th><td>${c.earth.marginalHours}</td></tr>
        <tr><th>Longest contact gap</th><td>${m.longestContactGapHours} h</td><th>Contact windows</th><td>${m.contactWindows}</td></tr>
        <tr><th>Earth's elevation (wobble)</th><td>${mm(c.earth.elevationDeg, (x) => deg(x))}</td><th>Earth's azimuth (wobble)</th><td>${mm(c.earth.azimuthDeg, (x) => az(x))}</td></tr>
        <tr><th>Earth above the skyline</th><td>${mm(c.earth.marginDeg, (x) => deg(x))}</td><th>Sub-Earth point (libration)</th><td>lat ${mm(c.earth.subEarthLatDeg, n3)}°, lon ${mm(c.earth.subEarthLonDeg, n3)}°</td></tr>
        <tr><th>Distance to Earth</th><td>${mm(c.earthDistanceKm, (x) => x.toLocaleString("en", { maximumFractionDigits: 0 }))} km</td><th>One-way signal delay</th><td>${mm(c.signalDelaySeconds, n3)} s</td></tr>
        <tr><th>Sun near the Earth–Moon line</th><td colspan="3">${c.sunNearEarthLine.hours ? `<strong>Caution:</strong> ${c.sunNearEarthLine.hours} h, first ${esc(fmtUtc(c.sunNearEarthLine.first))}` : "no hours flagged"}. <span class="muted">${esc(c.sunNearEarthLine.note)}</span></td></tr>
      </table>
      <p class="muted small">${esc(m.commsNote)} Signal delay = distance ÷ ${L.LIGHT_SPEED_KM_S} km/s (speed of light, JPL Horizons).</p>

      <h3>Lunar season and time of day</h3>
      <table class="kv">
        <tr><th>Sub-solar latitude (season)</th><td>${mm(c.season.subSolarLatDeg, n3)}°</td><th>Lunar local solar time</th><td>${lt(c.lunarDay.localTimeAtStart)} → ${lt(c.lunarDay.localTimeAtEnd)} over the stay</td></tr>
        <tr><th>At the start</th><td>${c.lunarDay.litAtStart ? "Sun up" : "Sun down"}; ${c.lunarDay.hoursToSunChangeAtStart === null ? "no change within the data" : `${c.lunarDay.litAtStart ? "sunset" : "sunrise"} in ${c.lunarDay.hoursToSunChangeAtStart} h`}</td><th>Sun's compass sweep while lit</th><td>${c.sunSweep.firstAzimuthDeg === null ? "Sun not up" : `${n0(c.sunSweep.degreesWhileLit)}° of azimuth (${az(c.sunSweep.firstAzimuthDeg)} → ${az(c.sunSweep.lastAzimuthDeg)})`}</td></tr>
      </table>
      <p class="muted small">${esc(c.season.note.text)} <a href="${esc(c.season.note.url)}" target="_blank" rel="noopener">${esc(c.season.note.source)}</a>. ${esc(c.lunarDay.note)}</p>

      <h3>Best and worst months for this site (2026–2029)</h3>
      <p class="small">Best: ${A.months.best.map((x: Any) => `${x.key} (${n1(x.meanScore)})`).join(", ")}. Worst: ${A.months.worst.map((x: Any) => `${x.key} (${n1(x.meanScore)})`).join(", ")}.
        Best calendar month on average: ${monthName(A.months.bestCalendarMonth.key)} (${n1(A.months.bestCalendarMonth.meanScore)}); worst: ${monthName(A.months.worstCalendarMonth.key)} (${n1(A.months.worstCalendarMonth.meanScore)}).</p>
      <p class="muted small">${esc(A.months.note)}</p>

      <h3>Terrain profile</h3>
      ${profileSvg(t.elevationDeg)}
      <table class="kv">
        <tr><th>Horizon model</th><td>${t.model === "lola" ? "LOLA terrain" : "flat"}</td><th>Horizon range</th><td>${deg(Math.min(...t.elevationDeg))} to ${deg(Math.max(...t.elevationDeg))}</td></tr>
        <tr><th>Map near the site</th><td>${t.maps ? `${esc(t.maps.fine.product)}, ${t.maps.fine.metersPerPixel} m/px within ${t.maps.fine.withinKm} km` : "–"}</td><th>Maps beyond</th><td>${t.maps ? t.maps.far.map((f: Any) => `${esc(f.product)} (${f.metersPerPixel} m/px)`).join(", ") : "–"}</td></tr>
        <tr><th>Observer</th><td>${t.observer ? `${Math.abs(t.observer.groundHeightM).toFixed(1)} m ${t.observer.groundHeightM >= 0 ? "above" : "below"} the 1737.4 km sphere + ${t.observer.mastM} m mast (assumed)` : "–"}</td><th>Local slope</th><td>${slope?.over100m ? `${slope.over100m.slopeDeg.toFixed(1)}° over 100 m (downhill toward ${az(slope.over100m.downslopeAzimuthDeg)}); ${slope.pixel.slopeDeg.toFixed(1)}° over ${slope.pixel.baselineM} m` : "–"}</td></tr>
      </table>
      <p class="muted small">${esc(t.source ?? "")} ${esc(slope?.note ?? "")}</p>

      <h3>${esc(V.SCORE_LABEL)} <span class="tag est">PROTOTYPE</span></h3>
      <p class="meaning">${esc(V.SCORE_MEANING)}</p>
      <p class="small">${esc(V.SCORE_FORMULA_TEXT)}</p>
      <table><thead><tr><th>Weight</th><th>Term</th><th>Value</th><th>Default weight</th></tr></thead><tbody>
        ${WEIGHT_KEYS.map(([k, w]) => `<tr><td>${w}</td><td>${esc(V.SCORE_TERMS[k])}</td><td>${A.score.components[k].toFixed(3)}</td><td>${V.SCORE_DEFAULT_WEIGHTS[k]}</td></tr>`).join("")}
      </tbody></table>
      <p class="small">Score: <strong>${A.score.score.toFixed(1)}</strong> / 100 at default weights (adjust weights in Compare dates).</p>
      ${whyWeights("researcher")}

      <h3>Other planets</h3>
      <p class="small">${esc(A.otherPlanets.text)}</p>
      <ul class="small">${A.otherPlanets.sources.map((x: Any) => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a></li>`).join("")}</ul>

      <h3>What is NOT modelled</h3>
      <ul class="small">${A.notModeled.map((x: string) => `<li>${esc(x)}</li>`).join("")}</ul>

      <h3>Sources</h3>
      <ul class="small">${A.sources.map((x: Any) => `<li><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name)}</a></li>`).join("")}
        <li>Site coordinates for this site: <a href="${esc(s.source)}" target="_blank" rel="noopener">${esc(s.source)}</a></li></ul>`;
  }

  function renderCalc() {
    const out = body.querySelector(".calc-out");
    if (!out || !analysis) return;
    try {
      const p = V.computePower({ siteId: analysis.site.id, startUtc: analysis.stay.start, areaM2: calc.areaM2, efficiency: calc.effPct / 100, panel: calc.panel, loadW: calc.loadW });
      analysis.power = p;
      const kwh = (wh: number) => `${(wh / 1000).toFixed(1)} kWh`;
      out.innerHTML = `<table class="kv">
          <tr><th>Average power</th><td>${p.averageW.toFixed(0)} W</td><th>Energy over the stay</th><td>${kwh(p.energyWh)}</td></tr>
          <tr><th>Lander needs</th><td>${kwh(p.loadEnergyWh)}</td><th>Battery for the longest stretch with no sunlight (${p.longestNoPowerHours} h)</th><td>${kwh(p.batteryWh)}</td></tr>
        </table><ul class="small">${p.assumptions.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>`;
    } catch (err) { out.innerHTML = `<p class="warn small">${esc((err as Error).message)}</p>`; }
  }

  function save(name: string, text: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a"); a.href = url; a.download = name; root.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function downloadJson() {
    if (!analysis) return;
    const hourly = V.getTimeline(analysis.site.id, analysis.stay.start, V.VERDICT_RULE.STAY_DAYS).samples;
    save(`lunlux_${analysis.site.id}_${current.landingDate}_researcher.json`, JSON.stringify({ app: V.APP_NAME, description: V.APP_TAGLINE, ...analysis, hourly, calculatorInputs: { ...calc } }, null, 1), "application/json");
  }
  function downloadCsv() {
    if (!analysis) return;
    const s = V.getTimeline(analysis.site.id, analysis.stay.start, V.VERDICT_RULE.STAY_DAYS).samples;
    const cols = ["utc", "sunEl", "sunAz", "sunMarginDeg", "sunFraction", "sunSkylineFraction", "eclipseFraction", "lit", "irradianceWm2", "sunDistKm",
      "earthEl", "earthAz", "earthMarginDeg", "earthRadiusDeg", "comms", "earthMarginal", "earthDistKm"] as const;
    const head = [`# app,${V.APP_NAME} — ${V.APP_TAGLINE}`, `# site_id,${analysis.site.id}`, `# stay,${s[0].utc}..${s[s.length - 1].utc}`, `# api_version,${V.API_VERSION}`, `# horizon_model,${s[0].horizonModel}`,
      "# angles in degrees, azimuth clockwise from north, distances in km, irradiance in W/m2, UTC", cols.join(",")];
    save(`lunlux_${analysis.site.id}_${current.landingDate}_hourly.csv`, [...head, ...s.map((r) => cols.map((k) => (r as unknown as Record<string, unknown>)[k]).join(","))].join("\n") + "\n", "text/csv");
  }

  load();
  return {
    update(next) {
      const changed = (next.siteId !== undefined && next.siteId !== current.siteId) || (next.landingDate !== undefined && next.landingDate !== current.landingDate);
      current = { ...current, ...next };
      if (changed) load();
    },
    destroy() { token++; host.remove(); },
  };
};

function fmtCoords(lat: number, lon: number): string {
  return `${Math.abs(lat).toFixed(5)}°${lat < 0 ? "S" : "N"}, ${Math.abs(lon).toFixed(5)}°${lon < 0 ? "W" : "E"}`;
}
function monthName(mm: string): string {
  return new Date(Date.UTC(2026, Number(mm) - 1, 1)).toLocaleString("en", { month: "long", timeZone: "UTC" });
}
function profileSvg(h: number[]): string {
  const W = 720, Hh = 120, lo = Math.floor(Math.min(-1, ...h)), hi = Math.ceil(Math.max(1, ...h));
  const y = (e: number) => 8 + ((hi - e) / (hi - lo)) * (Hh - 24);
  const pts = h.map((e, i) => `${((i / 359) * W).toFixed(1)},${y(e).toFixed(1)}`).join(" ");
  const ticks = ["N", "E", "S", "W", "N"].map((c, i) => `<text x="${Math.min(W - 10, i * W / 4)}" y="${Hh - 2}">${c}</text>`).join("");
  return `<svg class="profile" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Terrain horizon elevation by azimuth, ${lo} to ${hi} degrees">
    <line x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}" class="zero"/><polyline points="${pts}" class="hz"/>${ticks}
    <text x="4" y="12">${hi}°</text><text x="4" y="${y(0) - 3}">0°</text><text x="4" y="${Hh - 14}">${lo}°</text></svg>`;
}

const CSS = `
.card { padding: var(--_pad); border: 1px solid var(--_border); border-radius: 14px; background: var(--_bg); line-height: 1.45; }
.audience { margin: 0 0 4px; font-size: var(--_fs-xs); font-weight: 700; letter-spacing: .08em; color: var(--_link); }
h2 { margin: 0 0 4px; font-size: var(--_fs-lg); }
h3 { margin: 20px 0 6px; font-size: 1rem; border-top: 1px solid var(--_border); padding-top: 12px; }
h4 { margin: 12px 0 4px; font-size: .9rem; }
p { margin: 6px 0; }
.small { font-size: var(--_fs-sm); }
.dl { display: flex; gap: 8px; flex-wrap: wrap; margin: 8px 0; }
.dl button { padding: 6px 12px; border: 1px solid var(--_accent); border-radius: 8px; background: var(--_accent); color: inherit; font-weight: 600; }
table { width: 100%; border-collapse: collapse; font-size: .82rem; font-variant-numeric: tabular-nums; margin: 4px 0; }
th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid var(--_border); vertical-align: top; }
.kv th { color: var(--_muted); font-weight: 500; width: 22%; }
a { color: var(--_link); word-break: break-word; }
ul { padding-left: 18px; margin: 4px 0; }
.tag.est { display: inline-block; padding: 0 6px; border-radius: 5px; font-size: .68rem; letter-spacing: .06em; border: 1px dashed var(--_muted); color: var(--_muted); }
.calc { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px 12px; margin: 6px 0; font-size: .85rem; }
.calc label { display: grid; gap: 3px; color: var(--_muted); }
.calc input, .calc select { font: inherit; padding: 4px 6px; border-radius: 6px; border: 1px solid var(--_border); background: transparent; color: var(--_text); }
svg.profile { width: 100%; height: auto; display: block; margin: 6px 0; }
.profile .hz { fill: none; stroke: var(--_horizon); stroke-width: 1.5; }
.profile .zero { stroke: var(--_muted); stroke-dasharray: 4 3; }
.profile text { fill: var(--_muted); font-size: 10px; }
`;
