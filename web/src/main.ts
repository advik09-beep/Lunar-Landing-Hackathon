import './style.css';
import { listSites, loadDaily, getDaily, loadScene, getSceneState, MOCK, API_VERSION, VERDICT_RULE } from '../../lib/visibility.js';
import { LunarScene, type MoonSite, type Verdict, type SceneState } from './moon';
import { OverviewScene } from './overview';
import { mountStarfield } from './starfield';
import { mountSideCard, mountCompareGrid, mountHorizonView, type PanelHandle } from './panels';

interface Site extends MoonSite {
  kind?: string;
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
let selectedHour = 0; // 0–167, hourly samples within the seven-day landing stay
let daily: DailyResult | null = null;
let moon: LunarScene | null = null;
let overview: OverviewScene | null = null;
let disposeOverviewMessages: (() => void) | null = null;
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
  '    <div class="brand"><span class="brand-kicker">NASA SPACE APPS 2026</span><strong>Lunar Landing Site Navigator</strong></div>',
  '    <nav class="primary-nav" aria-label="Application views"><button id="nav-overview" type="button" class="nav-active" aria-pressed="true">Overview</button><button id="nav-explore" type="button" aria-pressed="false">Explore in 3D</button><button id="nav-compare" type="button" aria-pressed="false">Compare dates</button><button id="nav-horizon" type="button" aria-pressed="false">Stand here</button><button id="nav-credits" type="button" aria-pressed="false">Credits</button></nav>',
  '    <span class="real-data-chip">JPL Horizons · real data</span>',
  '  </header>',
  '  <section class="intro-block">',
  '    <p class="eyebrow">THE MOON, FROM A NEW PERSPECTIVE</p>',
  '    <h1>Where would you land?</h1>',
  '    <p>Explore ten lunar landing locations. Change the landing date to discover how sunlight and direct Earth visibility affect a seven-day mission.</p>',
  '  </section>',
  '  <aside id="mock-notice" class="mock-notice" hidden>DEMO / SIMULATED VALUES — NOT FOR MISSION USE</aside>',
  '  <section id="global-clock" class="global-clock" aria-label="Shared landing date and time controls">',
  '    <div class="clock-top"><strong>Landing-site timeline · Explore, Compare and Stand here</strong><span>UTC · 7-day stay · 168 hourly samples</span></div>',
  '    <div class="clock-input-row"><button id="date-prev" type="button" aria-label="Move landing date seven days earlier">−7 days</button><label for="landing-date">Landing date</label><input id="landing-date" type="date" value="2026-11-14" aria-label="Landing date UTC"><button id="date-next" type="button" aria-label="Move landing date seven days later">+7 days</button><output id="date-output" for="landing-date">2026-11-14</output></div>',
  '    <label class="clock-slider-label" for="date-slider">Change landing date (2026–2029)</label>',
  '    <input id="date-slider" type="range" min="0" max="1453" value="317" step="1" aria-label="Change landing date between 2026 and 2029">',
  '    <div class="clock-input-row"><label for="hour-slider">Hour within seven-day stay</label><input id="hour-slider" type="range" min="0" max="167" value="0" step="1" aria-label="Hour of the stay"><output id="hour-output" for="hour-slider">Hour 1 of 168 · 2026-11-14 00:00 UTC</output></div>',
  '    <p id="data-status" class="data-status" role="status" aria-live="polite">Loading validated daily summaries…</p>',
  '  </section>',
  '  <section id="verdict-legend" class="verdict-legend" aria-label="What landing condition colors mean">',
  '    <div class="verdict-guide-heading"><strong>What do the marker colors mean?</strong><span>Each verdict covers the full 7-day stay, not only the selected hour.</span></div>',
  '    <div class="verdict-guide-grid">',
  `      <div class="verdict-guide-item clear"><strong>● Clear</strong><span>Sunlight and Earth both visible together for at least ${VERDICT_RULE.CLEAR_PCT}% of the stay.</span></div>`,
  '      <div class="verdict-guide-item partial"><strong>◐ Partial</strong><span>Both are visible together for part of the stay, but not enough to be clear.</span></div>',
  `      <div class="verdict-guide-item out"><strong>✕ Out</strong><span>Sunlight and Earth are visible together for ${VERDICT_RULE.OUT_PCT}% or less of the stay.</span></div>`,
  `      <div class="verdict-guide-item edge"><strong>⚠ On the edge</strong><span>Sun or Earth stays near the local horizon (within ${VERDICT_RULE.EDGE_DEG}°); terrain and position matter.</span></div>`,
  '    </div>',
  '    <p class="verdict-guide-note">These indicate potential sunlight and direct Earth line of sight, not guaranteed power or communications. Gray means data unavailable. Detailed terrain estimates differ by location.</p>',
  '  </section>',
  '  <section id="overview-view" class="overview-view" aria-label="Sun Earth Moon overview">',
  '    <div class="overview-window">',
  '      <div class="overview-caption"><strong id="overview-source">THE SUN · EARTH · MOON</strong><span id="overview-note">Illustrative sizes, positions and motion — not to scale; not ephemeris geometry</span></div>',
  '      <p id="overview-mission-message" class="overview-mission-message">Of everything in the solar system, the Sun determines the sunlight available for a lunar lander\'s potential power, while Earth determines when a direct radio link is geometrically possible. Other planets: their gravity is already in our numbers. JPL planetary ephemerides include their gravitational effects; their light is negligible compared with sunlight. Radio from other planets is not modeled.</p>',
  '      <div id="overview-stage" class="overview-stage" aria-label="Solar system overview visualization"></div>',
  '      <div class="overview-footer"><p id="overview-disclaimer">Choose the Moon to explore real landing sites and verified Sun/Earth visibility at your selected UTC date and hour.</p><button id="enter-explore" type="button">Explore the Moon and landing sites</button></div>',
  '    </div>',
  '  </section>',
  '  <section id="explore-view" class="explorer" aria-label="Interactive lunar landing site explorer" hidden>',
  '    <div class="scene-column">',
  '      <div class="moon-window">',
  '        <div class="scene-heading"><span>MOON-FIXED VIEW</span><span>3D · Drag to rotate · Scroll to zoom</span></div>',
  '        <div id="moon-stage" class="moon-stage" aria-label="Interactive 3D Moon with landing markers"></div>',
  '        <div class="scene-controls"><button type="button" id="reset-view">Full Moon</button><button type="button" id="polar-view">South pole view</button><span>NASA SVS Moon imagery · JPL Horizons Sun lighting · no terrain mesh</span></div>',
  '        <p id="lighting-status" class="lighting-status" role="status" aria-live="polite">Loading Sun/Earth directions from JPL Horizons…</p>',
  '      </div>',


  '    </div>',
  '    <aside class="info-column">',
  '      <div id="side-card-mount" class="side-card-mount" aria-label="Site conditions and Educator Researcher details"></div>',
  '      <section class="pole-picker" aria-label="Four south pole candidate sites">',
  '        <h3>Four south-pole candidates</h3>',
  '        <p>Choose A, B, C or D. Matching offset labels appear in the polar 3D view, with leader lines pointing to their true coordinates.</p>',
  '        <div id="pole-buttons" class="pole-buttons"></div>',
  '      </section>',
  '      <div class="site-browser">',
  '        <div class="site-list-header"><h3>Landing sites</h3><span>10 locations</span></div>',
  '        <div id="site-buttons" class="site-buttons" role="group" aria-label="Choose a lunar landing site"></div>',
  '      </div>',
  '    </aside>',
  '  </section>',
  '  <section id="compare-view" class="panel-view" aria-label="Compare landing dates" hidden><div id="compare-mount"></div></section>',
  '  <section id="horizon-view" class="panel-view" aria-label="Stand here horizon panorama" hidden><div id="horizon-mount"></div></section>',
  '  <section id="credits-view" class="panel-view credits-view" aria-label="Project credits" hidden>',
  '    <h2>Credits and sources</h2>',
  '    <p>We distinguish scientific data from visual illustration. The Moon image is aesthetic imagery; it is not used to calculate landing-site visibility.</p>',
  '    <h3>NASA Scientific Visualization Studio — CGI Moon Kit</h3>',
  '    <p>Moon surface color map: <a href="https://svs.gsfc.nasa.gov/4720" target="_blank" rel="noopener noreferrer">NASA SVS CGI Moon Kit (2025), official 2K JPEG and 4K color JPEG derived once from the 2025 4096×2048 sRGB TIFF</a>. Credit: NASA\'s Scientific Visualization Studio. Derived from LROC color data with polar albedo fill. NASA media usage is governed by <a href="https://www.nasa.gov/nasa-brand-center/images-and-media/" target="_blank" rel="noopener noreferrer">NASA media usage guidelines</a>; no separate software license is asserted for the imagery.</p>',
  '    <h3>Scientific ephemerides and terrain</h3>',
  '    <p>Sun and Earth directions, visibility and stay summaries: <a href="https://ssd.jpl.nasa.gov/horizons/" target="_blank" rel="noopener noreferrer">NASA/JPL Horizons</a>. Terrain horizons at all ten landing sites use NASA Lunar Reconnaissance Orbiter Laser Altimeter (LOLA) GDR elevation maps via PDS Geosciences, including polar and global coverage; observer coordinates, map sources and resolution for each site are documented in data/README.md. NASA/JPL Horizons supplies Sun/Earth ephemerides. The decorative Moon texture is not terrain elevation data.</p>',
  '    <h3>3D rendering library</h3>',
  '    <p><a href="https://threejs.org/" target="_blank" rel="noopener noreferrer">Three.js</a> and OrbitControls, copyright Three.js authors, <a href="https://github.com/mrdoob/three.js/blob/master/LICENSE" target="_blank" rel="noopener noreferrer">MIT License</a>. The interactive globe and three-body overview were written for this project. Original drifting starfield visually informed by <a href="https://www.huescreen.com/starfield/" target="_blank" rel="noopener noreferrer">Hue Screen Starfield</a> (no code or assets copied), and previously by <a href="https://github.com/etrepat/starfield" target="_blank" rel="noopener noreferrer">etrepat/starfield</a>, copyright (c) 2010 Estanislau Trepat, <a href="https://github.com/etrepat/starfield/blob/develop/LICENSE" target="_blank" rel="noopener noreferrer">MIT License</a>; legacy Three.js source was not copied.</p>',
  '    <h3>Solar-system overview — upstream simulator</h3>',
  '    <p>Approved upstream: <a href="https://github.com/OzAILabs/SolarSystemSimulator" target="_blank" rel="noopener noreferrer">OzAILabs/SolarSystemSimulator</a>. The authors describe its source as MIT-licensed in the README. Its planetary textures are separately sourced from <a href="https://www.solarsystemscope.com/textures/" target="_blank" rel="noopener noreferrer">Solar System Scope</a> (CC BY 4.0), Planet Pixel Emporium, NASA/USGS Astrogeology and Steve Albers; attribution and individual reuse terms follow the upstream README. Our public <a href="https://github.com/advik09-beep/SolarSystemSimulator" target="_blank" rel="noopener noreferrer">GitHub fork</a> runs separately at <a href="https://solar-system-simulator-usmdo-club.vercel.app/" target="_blank" rel="noopener noreferrer">solar-system-simulator-usmdo-club.vercel.app</a>; the embedded full solar system is not synchronized to this app\'s landing-date control.</p>',
  '    <h3>Implementation and limitations</h3>',
  '    <p>Site coordinates, visibility analysis, data checks and horizon panels: Lane A. App shell, Three.js globe, panel integration and hosting: Lane B. Moon-fixed Sun lighting uses verified hourly JPL Horizons scene data. Earth position and terrain visibility remain available in the Stand here horizon view. The globe has no terrain shadows; The explorer nebula is original procedural decorative artwork, not an observed or simulated lunar sky. Any future borrowed assets must be added here with attribution and license before release.</p>',
  '  </section>',
  '  <footer class="site-footer">Site coordinates and visibility: shared scientific data API <code>/lib/visibility.js</code> · API <span id="api-version"></span> · Moon image: NASA Scientific Visualization Studio, CGI Moon Kit (aesthetic color map; not scientific terrain).</footer>',
  '</main>',
].join('\n');

const find = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error('Missing UI element #' + id);
  return element as T;
};

find<HTMLElement>('mock-notice').hidden = !MOCK;
find<HTMLElement>('api-version').textContent = API_VERSION;
const siteButtons = find<HTMLDivElement>('site-buttons');
const status = find<HTMLParagraphElement>('data-status');
const lightingStatus = find<HTMLParagraphElement>('lighting-status');
const select = find<HTMLInputElement>('landing-date');
const dateSlider = find<HTMLInputElement>('date-slider');
const hourSlider = find<HTMLInputElement>('hour-slider');
const dateOutput = find<HTMLOutputElement>('date-output');
const hourOutput = find<HTMLOutputElement>('hour-output');
const DATE_MIN = Date.UTC(2026, 0, 1);
const DATE_MAX = Date.UTC(2029, 11, 24);
dateSlider.max = String(Math.round((DATE_MAX - DATE_MIN) / 86400000));

const buttonById = new Map<string, HTMLButtonElement>();
const statusById = new Map<string, HTMLSpanElement>();
const poleButtonById = new Map<string, HTMLButtonElement>();
const poleStatusById = new Map<string, HTMLSpanElement>();

for (const site of sites) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'site-choice';
  button.setAttribute('aria-label', 'Focus ' + site.name);
  const label = document.createElement('span');
  label.className = 'site-choice-name';
  label.textContent = site.name;
  const verdict = document.createElement('span');
  verdict.className = 'site-choice-status unavailable';
  verdict.textContent = '…';
  button.append(label, verdict);
  button.addEventListener('click', () => chooseSite(site.id));
  siteButtons.append(button);
  buttonById.set(site.id, button);
  statusById.set(site.id, verdict);
}

const poleContainer = find<HTMLDivElement>('pole-buttons');
const poleSites = sites.filter(s => s.kind === 'south-pole');
poleSites.forEach((site,index) => {
  const button = document.createElement('button');
  button.type='button';
  button.className='pole-choice';
  const letter = document.createElement('b');
  letter.className='pole-letter';
  letter.textContent=['A','B','C','D'][index];
  const title=document.createElement('span');
  title.className='pole-name';
  title.textContent=site.name.split(' (')[0];
  const statusEl=document.createElement('span');
  statusEl.className='pole-status unavailable';
  statusEl.textContent='…';
  button.append(letter,title,statusEl);
  button.addEventListener('click',()=>chooseSite(site.id));
  button.setAttribute('aria-label', 'Select south pole site '+letter.textContent+': '+site.name);
  poleContainer.append(button);
  poleButtonById.set(site.id,button);
  poleStatusById.set(site.id,statusEl);
});

const cleanVerdict = (value: string): Verdict => ['clear', 'partial', 'out', 'edge'].includes(value) ? value as Verdict : 'unavailable';

let sideCard: PanelHandle | null = null;
let compareGrid: PanelHandle | null = null;
let horizonView: PanelHandle | null = null;
type View = 'overview' | 'explore' | 'compare' | 'horizon' | 'credits';
let activeView: View = 'overview';

function openView(view: View): void {
  activeView = view;
  for (const name of ['overview', 'explore', 'compare', 'horizon', 'credits'] as View[]) {
    find<HTMLElement>(name + '-view').hidden = name !== view;
    const button = find<HTMLButtonElement>('nav-' + name);
    button.classList.toggle('nav-active', name === view);
    button.setAttribute('aria-pressed', String(name === view));
  }
  overview?.setVisible(view === 'overview');
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function updateAllPanels(): void {
  const next = { siteId: selectedSite, landingDate: selectedDate, hour: selectedHour };
  sideCard?.update(next);
  compareGrid?.update(next);
  horizonView?.update(next);
}


function updateButtons(): void {
  for (const [id, button] of buttonById) {
    button.classList.toggle('active', id === selectedSite);
    button.setAttribute('aria-pressed', String(id === selectedSite));
  }
  for(const [id,button] of poleButtonById){
    button.classList.toggle('active',id === selectedSite);
    button.setAttribute('aria-pressed',String(id === selectedSite));
  }
}

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
    const element = statusById.get(site.id);
    if (element) {
      element.className = 'site-choice-status ' + verdict;
      element.textContent = verdictNames[verdict];
    }
    const poleStatus=poleStatusById.get(site.id);
    if(poleStatus){
      poleStatus.className='pole-status '+verdict;
      poleStatus.textContent=verdictNames[verdict];
    }
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
      ' km away (Earth shown in Stand here). Decorative nebula, not an observed sky. The globe does not model local terrain blocking.';
    lightingStatus.dataset.state = 'ready';
  } catch (error) {
    moon?.clearSceneState();
    lightingStatus.textContent = String(error).includes('OUT_OF_COVERAGE')
      ? 'Lighting unavailable for this date: outside validated Horizons scene coverage.'
      : 'Lighting unavailable: ' + String(error);
    lightingStatus.dataset.state = 'unavailable';
  }
}

function setLandingDate(date: string): void {
  const timestamp = Date.parse(date + 'T00:00:00Z');
  if (!Number.isFinite(timestamp)) return;
  selectedDate = new Date(timestamp).toISOString().slice(0, 10);
  select.value = selectedDate;
  dateOutput.textContent = selectedDate;
  dateSlider.value = String(Math.max(0, Math.min(Number(dateSlider.max), Math.round((timestamp - DATE_MIN) / 86400000))));
  renderClockHour();
  updateAllPanels();
  updateSceneLighting();
  if (dataReady) {
    try {
      daily = getDaily(selectedDate, 1) as DailyResult;
      status.textContent = '7-day stay starting ' + selectedDate + ' · real hourly Horizons data summarized by Lane A';
    } catch (error) {
      daily = null;
      status.textContent = 'Date unavailable: ' + String(error);
    }
    updateDaily();
  }
}

function renderClockHour(): void {
  const utc = new Date(Date.parse(selectedDate + 'T00:00:00Z') + selectedHour * 3600000)
    .toISOString().slice(0, 16).replace('T', ' ');
  hourSlider.value = String(selectedHour);
  hourOutput.textContent = 'Hour ' + (selectedHour + 1) + ' of 168 · ' + utc + ' UTC';
}

function setHour(value: number): void {
  const hour = Math.max(0, Math.min(167, Math.round(value)));
  if (!Number.isFinite(hour)) return;
  selectedHour = hour;
  renderClockHour();
  updateAllPanels();
  updateSceneLighting();
}

let dataReady = false;
select.addEventListener('change', () => setLandingDate(select.value));
dateSlider.addEventListener('input', () => setLandingDate(new Date(DATE_MIN + Number(dateSlider.value) * 86400000).toISOString().slice(0, 10)));
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
  frame.className = 'overview-iframe';
  frame.title = 'OzAILabs Solar System Simulator — embedded interactive overview';
  embedUrl.searchParams.set('lunarEmbed', '1');
  embedUrl.searchParams.set('parentOrigin', window.location.origin);
  frame.src = embedUrl.href;
  frame.loading = 'eager';
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.allow = 'fullscreen';
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-pointer-lock allow-downloads allow-forms');
  overviewStage.replaceChildren(frame);
  // Only accept navigation from the exact trusted simulator iframe origin.
  const onSimulatorMessage = (event: MessageEvent): void => {
    if (event.source !== frame.contentWindow || event.origin !== embedUrl.origin) return;
    const data = event.data;
    if (data && typeof data === 'object' &&
        data.type === 'lunar-navigator:open-explore' && data.body === 'moon') {
      openView('explore');
    }
  };
  window.addEventListener('message', onSimulatorMessage);
  disposeOverviewMessages = () => window.removeEventListener('message', onSimulatorMessage);
  find<HTMLElement>('overview-source').textContent = 'SOLAR SYSTEM · OzAILabs simulator';
  find<HTMLElement>('overview-note').textContent = 'Full solar system · separate simulator time; our mission clock controls Explore, Compare and Stand here';
  find<HTMLElement>('overview-disclaimer').textContent =
    'Interactive solar-system simulator. This is a visual overview with its own time; the landing-site timeline controls Explore, Compare and Stand here. Select Explore to study the Moon with verified site data.';
} else {
  try {
    overview = new OverviewScene(overviewStage, () => openView('explore'));
    overview.setVisible(true);
  } catch (error) {
    console.warn('Overview scene unavailable:', error);
    overviewStage.textContent = '3D overview unavailable. Use the Explore button to open the Moon.';
  }
}
find<HTMLButtonElement>('enter-explore').addEventListener('click', () => openView('explore'));

try {
  moon = new LunarScene(find<HTMLDivElement>('moon-stage'), sites, chooseSite);
  moon.focusSite(selectedSite);
} catch (error) {
  const stage = find<HTMLDivElement>('moon-stage');
  stage.textContent = 'Interactive 3D view unavailable in this browser. Choose a site from the list to continue.';
  stage.classList.add('scene-unavailable');
  console.warn('WebGL lunar scene unavailable:', error);
}
const panelProps = {
  siteId: selectedSite,
  landingDate: selectedDate,
  hour: selectedHour,
  onHourSelected: setHour,
  onSiteSelected: chooseSite,
  onDateSelected: setLandingDate,
  onOpenView: (view: 'compare' | 'horizon') => openView(view),
};
sideCard = mountSideCard(find<HTMLDivElement>('side-card-mount'), panelProps);
compareGrid = mountCompareGrid(find<HTMLDivElement>('compare-mount'), panelProps);
horizonView = mountHorizonView(find<HTMLDivElement>('horizon-mount'), panelProps);
for (const name of ['overview', 'explore', 'compare', 'horizon', 'credits'] as View[]) {
  find<HTMLButtonElement>('nav-' + name).addEventListener('click', () => openView(name));
}
updateButtons();

async function initializeData(): Promise<void> {
  try {
    await loadDaily();
    dataReady = true;
    setLandingDate(selectedDate);
  } catch (error) {
    status.textContent = 'Scientific daily summaries could not be loaded. ' + String(error);
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
    lightingStatus.textContent = 'Lighting unavailable: scene data could not be loaded (' + String(error) + ').';
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
}, { once: true });
