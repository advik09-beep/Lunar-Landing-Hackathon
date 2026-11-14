import './style.css';
import { listSites, loadDaily, getDaily, loadScene, getSceneState, MOCK, VERDICT_RULE, TOUR_STOPS, SOUTH_POLE } from '../../lib/visibility.js';
import { LunarScene, type MoonSite, type Verdict, type SceneState } from './moon';
import { OverviewScene } from './overview';
import { mountStarfield } from './starfield';
import { mountSideCard, mountCompareGrid, mountHorizonView, mountResearcher, mountPlanner, type PanelHandle } from './panels';

interface Site extends MoonSite {
  kind?: string;
  category: 'candidate' | 'historic';
  shortName: string;
  landingDate?: string | null;
  source?: string;
  coordsVerified?: boolean;
  note?: string;
}

interface DailyRow {
  date: string;
  verdict: Verdict;
  pctLit: number;
  pctComms: number;
  pctBoth: number;
}

interface DailyResult {
  sites: Record<string, Array<DailyRow | null>>;
  verdictRule?: string;
}

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Missing #app container');

const sites = listSites() as Site[];
if (!Array.isArray(sites) || sites.length !== 10 || sites.some(s => !s || typeof s.id !== 'string' || typeof s.name !== 'string')) {
  throw new Error('Expected exactly ten landing sites from the scientific data module');
}

const dateOrigin = '2026-11-14';
let selectedDate = dateOrigin;
let selectedSite = sites[0].id;
let readingLevel: 'educator' | 'researcher' = 'educator';
let selectedHour = 0; // 0–167, hourly samples within the seven-day landing stay
let daily: DailyResult | null = null;
let moon: LunarScene | null = null;
let overview: OverviewScene | null = null;
let simulatorFrame: HTMLIFrameElement | null = null;
let disposeOverviewMessages: (() => void) | null = null;
function syncOverviewClock(): void {
  const frame = document.querySelector<HTMLIFrameElement>('#overview-stage iframe');
  if (!frame?.contentWindow) return;
  const utc = new Date(Date.parse(selectedDate + 'T00:00:00Z') + selectedHour * 3600000).toISOString();
  frame.contentWindow.postMessage({ type: 'lunar-navigator:set-clock', utc }, new URL(frame.src).origin);
  const status = document.getElementById('overview-clock-status');
  if (status) status.textContent = 'Inspection moment: ' + utc.replace('T', ' ').slice(0, 16) +
    ' UTC · Illustrative planetary positions; use Explore for site conditions.';
}
const verdictNames: Record<Verdict, string> = {
  clear: 'Clear',
  partial: 'Partial',
  out: 'Out',
  edge: 'On the edge',
  unavailable: 'Unavailable',
};

app.innerHTML = [
  '<main class="app-shell">',
  '  <header class="topbar">',
  '    <div class="brand"><span class="brand-kicker">NASA SPACE APPS 2026</span><strong>LunLux</strong><span class="brand-subtitle">Sunlight and Earth contact for lunar landing sites</span></div>',
  '    <nav class="primary-nav" aria-label="Main navigation"><button id="nav-overview" type="button" class="nav-active" aria-pressed="true">Tour</button><button id="nav-explore" type="button" aria-pressed="false">Explore</button><button id="nav-compare" type="button" aria-pressed="false">Compare</button><button id="nav-researcher" type="button" aria-pressed="false">Report</button></nav>',
  '    <div class="header-tools"><div class="reading-level" role="group" aria-label="Reading level"><button id="level-educator" aria-pressed="true" type="button">Educator</button><button id="level-researcher" aria-pressed="false" type="button">Researcher</button></div><button id="nav-credits" class="methods-link" type="button" aria-pressed="false">Data and methods</button></div>',
  '  </header>',
  '  <section class="intro-block">',
  '    <p class="eyebrow">THE MOON, FROM A NEW PERSPECTIVE</p>',
  '    <h1>Where would you land?</h1>',
  '    <p>Explore ten lunar landing locations. Change the landing date to discover how sunlight and direct Earth visibility affect a seven-day mission.</p>',
  '  </section>',
  '  <aside id="mock-notice" class="mock-notice" hidden>DEMO / SIMULATED VALUES — NOT FOR MISSION USE</aside>',
  '  <section id="global-clock" class="global-clock" aria-label="Landing site and time" hidden>',
  '    <label class="toolbar-site" for="site-picker">Site <select id="site-picker" aria-label="Landing site"></select></label>',
  '    <div class="toolbar-date"><button id="date-prev" type="button" aria-label="Move landing date seven days earlier">−7</button><label class="sr-only" for="landing-date">Landing date UTC</label><input id="landing-date" type="date" value="2026-11-14" aria-label="Landing date UTC"><button id="date-next" type="button" aria-label="Move landing date seven days later">+7</button></div>',
  '    <label class="toolbar-hour" for="hour-slider">Inspect <input id="hour-slider" type="range" min="0" max="167" value="0" step="1" aria-label="Moment inspected within the seven-day stay"><output id="hour-output" for="hour-slider">Day 1 · 00:00 UTC</output></label>',
  '    <details class="clock-tip"><summary aria-label="About the date and inspection time">ⓘ</summary><p>The 7-day stay starts at 00:00 UTC on the landing date. The slider chooses the moment you inspect within that stay; it does not move the landing time. Hourly data.</p></details>',
  '    <p id="data-status" class="sr-only" role="status" aria-live="polite">Loading conditions…</p>',
  '  </section>',
  '  <section id="verdict-legend" class="verdict-legend" aria-label="Seven-day verdict legend" hidden>',
  `    <span class="verdict-chip clear" title="Sunlight and Earth both visible for at least ${VERDICT_RULE.CLEAR_PCT}% of the stay"><b>✓</b> Clear</span>`,
  '    <span class="verdict-chip partial" title="Sunlight and Earth visible together for part of the stay"><b>◐</b> Partial</span>',
  `    <span class="verdict-chip out" title="Sunlight and Earth visible together for ${VERDICT_RULE.OUT_PCT}% or less of the stay"><b>✕</b> Out</span>`,
  `    <span class="verdict-chip edge" title="Sun or Earth grazes the skyline within ${VERDICT_RULE.EDGE_DEG}° for most of the stay; small position changes matter"><b>⚠</b> On the edge</span>`,
  '  </section>',
  '  <section id="overview-view" class="overview-view" aria-label="Sun Earth Moon overview">',
  '    <div class="overview-window">',
  '      <div class="overview-caption"><strong id="overview-source">THE SUN · EARTH · MOON</strong><span id="overview-note">Illustrative sizes, positions and motion — not to scale; not ephemeris geometry</span></div>',
  '      <p id="overview-mission-message" class="overview-mission-message">Of everything in the solar system, the Sun determines the sunlight available for a lunar lander\'s potential power, while Earth determines when a direct radio link is geometrically possible. Other planets: their gravity is already in our numbers. JPL planetary ephemerides include their gravitational effects; their light is negligible compared with sunlight. Radio from other planets is not modeled.</p>',
  '      <div id="overview-stage" class="overview-stage" aria-label="Solar system overview visualization"></div>',
  '      <div id="tour-science-caption" class="tour-science-caption" hidden aria-live="polite"></div>',
  '      <p id="overview-clock-status" class="overview-clock-status" role="status">Simulator planetary ephemeris is not validated for the selected date.</p>',
  '      <div id="overview-title-card" class="overview-title-card" role="region" aria-label="Solar system tour introduction"><h2>LunLux</h2><p class="overview-title-subtitle">Sunlight and Earth contact for lunar landing sites</p><p>Only the Sun and Earth determine the sunlight and direct Earth visibility we evaluate for a lunar lander. Other planets’ gravity is already included in NASA’s ephemerides.</p><div><button id="start-tour" type="button">Start tour</button><button id="skip-moon" type="button">Skip to the Moon</button></div><p class="overview-audio-note">Tour sound starts off. Use the speaker button for sound.</p></div>',
  '      <div class="overview-footer"><p id="overview-disclaimer">Choose the Moon to explore real landing sites and verified Sun/Earth visibility at your selected UTC date and hour.</p><button id="enter-explore" type="button">Explore the Moon and landing sites</button></div>',
  '    </div>',
  '  </section>',
  '  <section id="explore-view" class="explorer" aria-label="Interactive lunar landing site explorer" hidden>',
  '    <div class="scene-column">',
  '      <div class="explore-controls"><div class="view-toggle" role="group" aria-label="Explore view"><button id="globe-mode" type="button" aria-pressed="true">Globe</button><button id="horizon-mode" type="button" aria-pressed="false">Horizon</button></div></div>',
  '      <div class="moon-window">',
  '        <div class="scene-heading"><span>MOON-FIXED VIEW</span><span>3D · Drag to rotate · Scroll to zoom</span></div>',
  '        <p id="explore-south-pole-note" class="explore-south-pole-note"></p>',
  '        <div id="moon-stage" class="moon-stage" aria-label="Interactive 3D Moon with landing markers"></div>',
  '        <div class="scene-controls"><button type="button" id="reset-view">Full Moon</button><button type="button" id="polar-view">South pole view</button><span>NASA SVS Moon imagery · JPL Horizons Sun lighting · no terrain mesh</span></div>',
  '        <p id="lighting-status" class="lighting-status" role="status" aria-live="polite">Loading Sun/Earth directions from JPL Horizons…</p>',
  '      </div>',


  '    </div>',
  '    <aside class="info-column">',
  '      <div id="side-card-mount" class="side-card-mount" aria-label="Site conditions and Educator Researcher details"></div>',
  '    </aside>',
  '  </section>',
  '  <section id="compare-view" class="panel-view" aria-label="Compare landing dates" hidden><div id="compare-mount"></div></section>',
  '  <section id="horizon-view" class="panel-view" aria-label="Stand here horizon panorama" hidden><div id="horizon-mount"></div></section>',
  '  <section id="researcher-view" class="panel-view researcher-view" aria-label="Researcher analysis" hidden><div id="researcher-mount"></div></section>',
  '  <section id="planner-view" class="panel-view planner-view" aria-label="Planner: A/B scenarios and mission requirements" hidden><div id="planner-mount"></div></section>',
  '  <section id="credits-view" class="panel-view credits-view" aria-label="Project credits" hidden>',
  '    <h2>LunLux — Credits and sources</h2>',
  '    <p><strong>LunLux</strong> — Sunlight and Earth contact for lunar landing sites.</p><p>We distinguish scientific data from visual illustration. The Moon image is aesthetic imagery; it is not used to calculate landing-site visibility.</p>',
  '    <h3>NASA Scientific Visualization Studio — CGI Moon Kit</h3>',
  '    <p>Moon surface color map: <a href="https://svs.gsfc.nasa.gov/4720" target="_blank" rel="noopener noreferrer">NASA SVS CGI Moon Kit (2025), official 2K JPEG and 4K color JPEG derived once from the 2025 4096×2048 sRGB TIFF</a>. Credit: NASA\'s Scientific Visualization Studio. Derived from LROC color data with polar albedo fill. NASA media usage is governed by <a href="https://www.nasa.gov/nasa-brand-center/images-and-media/" target="_blank" rel="noopener noreferrer">NASA media usage guidelines</a>; no separate software license is asserted for the imagery.</p>',
  '    <h3>Scientific ephemerides and terrain</h3>',
  '    <p>Sun and Earth directions, visibility and stay summaries: <a href="https://ssd.jpl.nasa.gov/horizons/" target="_blank" rel="noopener noreferrer">NASA/JPL Horizons</a>. Terrain horizons at all ten landing sites use NASA Lunar Reconnaissance Orbiter Laser Altimeter (LOLA) GDR elevation maps via PDS Geosciences, including polar and global coverage; observer coordinates, map sources and resolution for each site are listed in each site’s report. NASA/JPL Horizons supplies Sun/Earth ephemerides. The decorative Moon texture is not terrain elevation data.</p>',
  '    <h3>NASA planet facts and tour captions</h3>',
  '    <p>Tour captions use NASA science.nasa.gov planet fact pages, NASA SVS and JPL Horizons. Planet brightness figures are from our own JPL Horizons magnitude queries, labeled as team calculations.</p>',
  '    <h3>3D rendering library</h3>',
  '    <p><a href="https://threejs.org/" target="_blank" rel="noopener noreferrer">Three.js</a> and OrbitControls, copyright Three.js authors, <a href="https://github.com/mrdoob/three.js/blob/master/LICENSE" target="_blank" rel="noopener noreferrer">MIT License</a>. The interactive globe and three-body overview were written for this project. Original drifting starfield visually informed by <a href="https://www.huescreen.com/starfield/" target="_blank" rel="noopener noreferrer">Hue Screen Starfield</a> (no code or assets copied), and previously by <a href="https://github.com/etrepat/starfield" target="_blank" rel="noopener noreferrer">etrepat/starfield</a>, copyright (c) 2010 Estanislau Trepat, <a href="https://github.com/etrepat/starfield/blob/develop/LICENSE" target="_blank" rel="noopener noreferrer">MIT License</a>; legacy Three.js source was not copied.</p>',
  '    <h3>Solar-system overview — upstream simulator</h3>',
  '    <p>Approved upstream: <a href="https://github.com/OzAILabs/SolarSystemSimulator" target="_blank" rel="noopener noreferrer">OzAILabs/SolarSystemSimulator</a>. The authors describe its source as MIT-licensed in the README. Its planetary textures are separately sourced from <a href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noopener noreferrer">Solar System Scope</a> (CC BY 4.0), Planet Pixel Emporium, NASA/USGS Astrogeology and Steve Albers; attribution and individual reuse terms follow the upstream README. Our public <a href="https://github.com/advik09-beep/SolarSystemSimulator" target="_blank" rel="noopener noreferrer">GitHub fork</a> runs separately at <a href="https://solar-system-simulator-usmdo-club.vercel.app/" target="_blank" rel="noopener noreferrer">solar-system-simulator-usmdo-club.vercel.app</a>; the embedded simulator receives the shared UTC inspection clock, but its planetary positions are illustrative and not validated JPL ephemerides.</p>',
  '    <h3>Implementation and limitations</h3>',
  '    <p>Moon-fixed Sun lighting uses verified hourly JPL Horizons scene data. Earth position and terrain visibility remain available in the Stand here horizon view. The globe has no terrain shadows; The explorer nebula is original procedural decorative artwork, not an observed or simulated lunar sky. Any future borrowed assets must be added here with attribution and license before release.</p>',
  '  </section>',
  '  <footer class="site-footer">NASA/JPL Horizons · NASA LRO LOLA · Hourly data</footer>',
  '</main>',
].join('\n');

const find = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error('Missing UI element #' + id);
  return element as T;
};

find<HTMLElement>('mock-notice').hidden = !MOCK;
const sitePicker = find<HTMLSelectElement>('site-picker');
const status = find<HTMLParagraphElement>('data-status');
const lightingStatus = find<HTMLParagraphElement>('lighting-status');
const select = find<HTMLInputElement>('landing-date');
find<HTMLElement>('explore-south-pole-note').textContent = SOUTH_POLE.oneLine;
const hourSlider = find<HTMLInputElement>('hour-slider');
const hourOutput = find<HTMLOutputElement>('hour-output');
const DATE_MIN = Date.UTC(2026, 0, 1);
const DATE_MAX = Date.UTC(2029, 11, 24);
select.max = '2029-12-24';

for (const category of ['candidate','historic'] as const) {
  const group = document.createElement('optgroup');
  group.label = category === 'candidate' ? 'Candidate sites' : 'Historic landings';
  for (const site of sites.filter(s => s.category === category)) {
    const option = document.createElement('option');
    option.value = site.id; option.textContent = site.shortName; option.title = site.name;
    group.append(option);
  }
  sitePicker.append(group);
}
sitePicker.value = selectedSite;
sitePicker.addEventListener('change', () => chooseSite(sitePicker.value));

const cleanVerdict = (value: string): Verdict => ['clear', 'partial', 'out', 'edge'].includes(value) ? value as Verdict : 'unavailable';

let sideCard: PanelHandle | null = null;
let compareGrid: PanelHandle | null = null;
let horizonView: PanelHandle | null = null;
let researcherView: PanelHandle | null = null;
let plannerView: PanelHandle | null = null;
type View = 'overview' | 'explore' | 'compare' | 'horizon' | 'researcher' | 'planner' | 'credits';
let activeView: View = 'overview';
let exploreMode: 'globe' | 'horizon' = 'globe';
function setExploreMode(mode: 'globe' | 'horizon'): void {
  exploreMode = mode;
  find<HTMLElement>('moon-stage').closest<HTMLElement>('.moon-window')!.hidden = mode !== 'globe';
  find<HTMLElement>('horizon-view').hidden = activeView !== 'explore' || mode !== 'horizon';
  find<HTMLElement>('globe-mode').setAttribute('aria-pressed', String(mode === 'globe'));
  find<HTMLElement>('horizon-mode').setAttribute('aria-pressed', String(mode === 'horizon'));
  moon?.setVisible(activeView === 'explore' && mode === 'globe');
  if (activeView === 'explore') updateAllPanels();
}
find<HTMLElement>('explore-view').querySelector('.scene-column')!.append(find<HTMLElement>('horizon-view'));
find<HTMLElement>('globe-mode').addEventListener('click', () => setExploreMode('globe'));
find<HTMLElement>('horizon-mode').addEventListener('click', () => setExploreMode('horizon'));

function showTourTitle(): void {
  find<HTMLElement>('tour-science-caption').hidden = true;
  openView('overview');
  find<HTMLElement>('overview-title-card').hidden = false;
}
function startSolarTour(): void {
  find<HTMLElement>('tour-science-caption').hidden = true;
  find<HTMLElement>('overview-title-card').hidden = true;
  openView('overview');
  const frame = find<HTMLIFrameElement>('overview-stage').querySelector('iframe');
  frame?.contentWindow?.postMessage({ type: 'lunar-navigator:start-tour' }, new URL(frame.src).origin);
}
function openView(view: View): void {
  if (view === 'horizon') { exploreMode = 'horizon'; view = 'explore'; }
  if (view === 'planner') view = 'compare';
  activeView = view;
  document.body.dataset.view = view;
  find<HTMLElement>('global-clock').hidden = view === 'overview' || view === 'credits';
  find<HTMLElement>('verdict-legend').hidden = view !== 'explore' && view !== 'compare';
  for (const name of ['overview', 'explore', 'compare', 'horizon', 'researcher', 'planner', 'credits'] as View[]) {
    find<HTMLElement>(name + '-view').hidden = name !== view;
    const button = document.getElementById('nav-' + name);
    button?.classList.toggle('nav-active', name === view);
    button?.setAttribute('aria-pressed', String(name === view));
  }
  if (view === 'compare') find<HTMLElement>('planner-view').hidden = false;
  updateAllPanels();
  setExploreMode(exploreMode);
  // Detach the independent WebGL iframe outside Tour so it cannot consume GPU time.
  if (simulatorFrame) {
    if (view === 'overview' && !simulatorFrame.isConnected) find<HTMLElement>('overview-stage').append(simulatorFrame);
    else if (view !== 'overview' && simulatorFrame.isConnected) simulatorFrame.remove();
  }
  overview?.setVisible(view === 'overview');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// Only visible views receive expensive data updates. Panels keep their own state.
const panelSelections = new WeakMap<PanelHandle, string>();
function updatePanel(panel: PanelHandle, wholeStay = false): void {
  const props = { siteId: selectedSite, landingDate: selectedDate, level: readingLevel, ...(wholeStay ? {} : {hour:selectedHour}) };
  const key = JSON.stringify(props);
  if (panelSelections.get(panel) !== key) { panel.update(props); panelSelections.set(panel,key); }
}
function updateAllPanels(): void {
  if (activeView === 'explore') {
    sideCard ??= mountSideCard(find<HTMLDivElement>('side-card-mount'), currentPanelProps());
    updatePanel(sideCard);
    if (exploreMode === 'horizon') {
      horizonView ??= mountHorizonView(find<HTMLDivElement>('horizon-mount'), currentPanelProps());
      updatePanel(horizonView);
    }
  } else if (activeView === 'compare') {
    compareGrid ??= mountCompareGrid(find<HTMLDivElement>('compare-mount'), currentPanelProps());
    plannerView ??= mountPlanner(find<HTMLDivElement>('planner-mount'), currentPanelProps());
    updatePanel(compareGrid); updatePanel(plannerView,true);
  } else if (activeView === 'researcher') {
    researcherView ??= mountResearcher(find<HTMLDivElement>('researcher-mount'), currentPanelProps());
    updatePanel(researcherView,true);
  }
}

function updateButtons(): void { sitePicker.value = selectedSite; }

function chooseSite(id: string): void {
  if (!sites.some(site => site.id === id)) return;
  selectedSite = id;
  moon?.focusSite(id);
  updateButtons();
  updateAllPanels();
}

function updateDaily(): void {
  if (!daily) {
    updateButtons();
    return;
  }
  const colors = new Map<string, Verdict>();
  for (const site of sites) {
    const row = daily.sites[site.id]?.[0];
    const verdict = row ? cleanVerdict(row.verdict) : 'unavailable';
    colors.set(site.id, verdict);

  }
  moon?.setVerdicts(colors);
  updateButtons();
}

let sceneReady = false;
function updateSceneLighting(): void {
  if (!sceneReady) return;
  try {
    const utc = new Date(Date.parse(selectedDate + 'T00:00:00Z') + selectedHour * 3600000).toISOString();
    const sceneState = getSceneState(utc) as SceneState;
    moon?.setSceneState(sceneState);
    lightingStatus.textContent =
      'JPL Horizons Sun lighting · ' + sceneState.sampleUtc +
      ' · Earth ' + Math.round(sceneState.earth.distKm).toLocaleString() +
      ' km away · Earth shown in Horizon. Decorative sky; no terrain shadows.';
    lightingStatus.dataset.state = 'ready';
  } catch (error) {
    moon?.clearSceneState();
    lightingStatus.textContent = String(error).includes('OUT_OF_COVERAGE')
      ? 'Lighting unavailable for this date: outside validated Horizons scene coverage.'
      : 'Sun lighting is unavailable for this date.';
    lightingStatus.dataset.state = 'unavailable';
  }
}

function setLandingDate(date: string): void {
  const timestamp = Date.parse(date + 'T00:00:00Z');
  if (!Number.isFinite(timestamp)) return;
  selectedDate = new Date(timestamp).toISOString().slice(0, 10);
  select.value = selectedDate;
  renderClockHour();
  syncOverviewClock();
  updateAllPanels();
  updateSceneLighting();
  if (dataReady) {
    try {
      daily = getDaily(selectedDate, 1) as DailyResult;
      status.textContent = '7-day stay starting ' + selectedDate + ' · hourly NASA/JPL Horizons data';
    } catch (error) {
      daily = null;
      status.textContent = 'Conditions unavailable for the selected date.';
    }
    updateDaily();
  }
}

function renderClockHour(): void {
  const utc = new Date(Date.parse(selectedDate + 'T00:00:00Z') + selectedHour * 3600000)
    .toISOString().slice(0, 16).replace('T', ' ');
  hourSlider.value = String(selectedHour);
  hourOutput.textContent = 'Day ' + (Math.floor(selectedHour / 24) + 1) + ' · ' + utc.slice(11) + ' UTC';
  hourOutput.title = utc + ' UTC';
}

let panelUpdateTimer = 0;
function setHour(value: number): void {
  const hour = Math.max(0, Math.min(167, Math.round(value)));
  if (!Number.isFinite(hour)) return;
  selectedHour = hour;
  renderClockHour();
  syncOverviewClock();
  clearTimeout(panelUpdateTimer);
  panelUpdateTimer = window.setTimeout(updateAllPanels, 90);
  updateSceneLighting();
}

let dataReady = false;
select.addEventListener('change', () => setLandingDate(select.value));
hourSlider.addEventListener('input', () => setHour(Number(hourSlider.value)));
for (const [id, offset] of [['date-prev', -7], ['date-next', 7]] as Array<[string, number]>) {
  find<HTMLButtonElement>(id).addEventListener('click', () => {
    const value = Date.parse(selectedDate + 'T00:00:00Z') + offset * 86400000;
    setLandingDate(new Date(value).toISOString().slice(0, 10));
  });
}
find<HTMLButtonElement>('polar-view').addEventListener('click', () => moon?.focusSouthPole());
find<HTMLButtonElement>('reset-view').addEventListener('click', () => moon?.resetView());

const destroyStarfield = mountStarfield();

// D14 amendment: embed the separately deployed user fork of OzAILabs.
// The fork/deployment URL is configured at build time, never guessed.
// Until it exists, retain the previous functional 3-body scene rather
// than displaying a broken or unauthenticated external iframe.
const configuredOverviewUrl = (import.meta as ImportMeta & {
  env?: { VITE_SOLAR_OVERVIEW_URL?: string }
}).env?.VITE_SOLAR_OVERVIEW_URL?.trim();
let embedUrl: URL | null = null;
if (configuredOverviewUrl) {
  try {
    const parsed = new URL(configuredOverviewUrl);
    if (parsed.protocol === 'https:') embedUrl = parsed;
    else console.warn('OzAILabs overview URL must use HTTPS');
  } catch {
    console.warn('Invalid OzAILabs overview URL; using fallback scene');
  }
}
const overviewStage = find<HTMLDivElement>('overview-stage');
if (embedUrl) {
  const frame = document.createElement('iframe');
  simulatorFrame = frame;
  frame.className = 'overview-iframe';
  frame.title = 'OzAILabs Solar System Simulator — embedded interactive overview';
  embedUrl.searchParams.set('lunarEmbed', '1');
  embedUrl.searchParams.set('parentOrigin', window.location.origin);
  frame.src = embedUrl.href;
  frame.addEventListener('load', syncOverviewClock);
  frame.loading = 'eager';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.allow = 'fullscreen';
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-pointer-lock allow-downloads allow-forms');
  overviewStage.replaceChildren(frame);
  // Only accept navigation from the exact trusted simulator iframe origin.
  const onSimulatorMessage = (event: MessageEvent): void => {
    if (event.source !== frame.contentWindow || event.origin !== embedUrl.origin) return;
    const data = event.data;
    if (data && typeof data === 'object' && data.type === 'lunar-navigator:tour-stop') {
      const stop = TOUR_STOPS.find((item: { id: string }) => item.id === data.bodyId);
      if (!stop) return;
      const caption = find<HTMLElement>('tour-science-caption');
      caption.replaceChildren();
      const title = document.createElement('strong');
      title.textContent = stop.title;
      const body = document.createElement('p');
      body.textContent = stop.text;
      caption.append(title, body);
      const sources = document.createElement('p');
      sources.append('Sources: ');
      for (const [index, source] of stop.sources.entries()) {
        if (index) sources.append(' · ');
        const a = document.createElement('a');
        a.href = source.url;
        a.textContent = source.name;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        sources.append(a);
      }
      caption.append(sources);
      if (stop.id === 'moon') {
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = 'Why the south pole?';
        details.append(summary);
        for (const paragraph of SOUTH_POLE.full) {
          const p = document.createElement('p');
          p.textContent = paragraph;
          details.append(p);
        }
        for (const source of SOUTH_POLE.sources) {
          const a = document.createElement('a');
          a.href = source.url;
          a.textContent = source.name + ' · ';
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          details.append(a);
        }
        caption.append(details);
        const handoff = document.createElement('p');
        handoff.textContent = 'The tour will open Explore in about 12 seconds. Choose Skip to the Moon to open it now.';
        caption.append(handoff);
      }
      caption.hidden = false;
    }
    if (data && typeof data === 'object' &&
        data.type === 'lunar-navigator:open-explore' && data.body === 'moon') {
      openView('explore');
    }
  };
  window.addEventListener('message', onSimulatorMessage);
  disposeOverviewMessages = () => window.removeEventListener('message', onSimulatorMessage);
  find<HTMLElement>('overview-source').textContent = 'SOLAR SYSTEM · OzAILabs simulator';
  find<HTMLElement>('overview-note').textContent = 'Illustrative solar system · not to scale';
  find<HTMLElement>('overview-disclaimer').textContent =
    'The selected UTC inspection time is sent to the simulator. Its planetary orbits are illustrative, not validated historical ephemerides; Explore and Stand here use JPL Horizons data.';
} else {
  try {
    overview = new OverviewScene(overviewStage, () => openView('explore'));
    overview.setVisible(true);
  } catch (error) {
    console.warn('Overview scene unavailable:', error);
    overviewStage.textContent = '3D overview unavailable. Choose Explore to open the Moon.';
  }
}
find<HTMLButtonElement>('enter-explore').addEventListener('click', () => openView('explore'));
find<HTMLButtonElement>('start-tour').addEventListener('click', startSolarTour);
find<HTMLButtonElement>('skip-moon').addEventListener('click', () => openView('explore'));
find<HTMLButtonElement>('nav-overview').addEventListener('click', showTourTitle);

try {
  moon = new LunarScene(find<HTMLDivElement>('moon-stage'), sites, chooseSite);
  moon.focusSite(selectedSite);
  moon.setVisible(false);
} catch (error) {
  const stage = find<HTMLDivElement>('moon-stage');
  stage.textContent = 'Interactive 3D view unavailable in this browser. Choose a site from the list to continue.';
  stage.classList.add('scene-unavailable');
  console.warn('WebGL lunar scene unavailable:', error);
}
function currentPanelProps() {
  return { siteId: selectedSite, landingDate: selectedDate, hour: selectedHour, level: readingLevel,
    onHourSelected: setHour, onSiteSelected: chooseSite, onDateSelected: setLandingDate,
    onOpenView: (view: 'compare' | 'horizon') => openView(view) };
}
find<HTMLElement>('compare-view').append(find<HTMLElement>('planner-view'));
for (const name of ['overview', 'explore', 'compare', 'horizon', 'researcher', 'planner', 'credits'] as View[]) {
  if (name !== 'overview') document.getElementById('nav-' + name)?.addEventListener('click', () => openView(name));
}
for (const level of ['educator','researcher'] as const) {
  find<HTMLButtonElement>('level-' + level).addEventListener('click', () => {
    readingLevel = level;
    for (const name of ['educator','researcher']) find<HTMLElement>('level-' + name).setAttribute('aria-pressed', String(name === level));
    for (const panel of [sideCard,compareGrid,horizonView,researcherView,plannerView]) panel?.update({level});
    updateAllPanels();
  });
}
updateButtons();
openView('overview');

async function initializeData(): Promise<void> {
  try {
    await loadDaily();
    dataReady = true;
    setLandingDate(selectedDate);
  } catch (error) {
    status.textContent = 'Conditions could not be loaded. Please refresh to try again.';
    status.dataset.state = 'error';
  }
}
void initializeData();

async function initializeSceneLighting(): Promise<void> {
  try {
    await loadScene();
    sceneReady = true;
    updateSceneLighting();
  } catch (error) {
    sceneReady = false;
    moon?.clearSceneState();
    lightingStatus.textContent = 'Sun lighting could not be loaded. Please refresh to try again.';
    lightingStatus.dataset.state = 'unavailable';
  }
}
void initializeSceneLighting();

window.addEventListener('pagehide', () => {
  moon?.destroy();
  overview?.destroy();
  disposeOverviewMessages?.();
  destroyStarfield();
  sideCard?.destroy();
  compareGrid?.destroy();
  horizonView?.destroy();
  researcherView?.destroy();
  plannerView?.destroy();
}, { once: true });
