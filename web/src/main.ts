import './style.css';
import { listSites, loadDaily, getDaily, MOCK, API_VERSION, VERDICT_RULE } from '../../lib/visibility.js';
import { LunarScene, type MoonSite, type Verdict } from './moon';
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
let daily: DailyResult | null = null;
let moon: LunarScene | null = null;
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
  '    <nav class="primary-nav" aria-label="Application views"><button id="nav-explore" type="button" class="nav-active" aria-pressed="true">Explore in 3D</button><button id="nav-compare" type="button" aria-pressed="false">Compare dates</button><button id="nav-horizon" type="button" aria-pressed="false">Stand here</button><button id="nav-credits" type="button" aria-pressed="false">Credits</button></nav>',
  '    <span class="real-data-chip">JPL Horizons · real data</span>',
  '  </header>',
  '  <section class="intro-block">',
  '    <p class="eyebrow">THE MOON, FROM A NEW PERSPECTIVE</p>',
  '    <h1>Where would you land?</h1>',
  '    <p>Explore ten lunar landing locations. Change the landing date to discover how sunlight and direct Earth visibility affect a seven-day mission.</p>',
  '  </section>',
  '  <aside id="mock-notice" class="mock-notice" hidden>DEMO / SIMULATED VALUES — NOT FOR MISSION USE</aside>',
  '  <section id="explore-view" class="explorer" aria-label="Interactive lunar landing site explorer">',
  '    <div class="scene-column">',
  '      <div class="moon-window">',
  '        <div class="scene-heading"><span>MOON-FIXED VIEW</span><span>3D · Drag to rotate · Scroll to zoom</span></div>',
  '        <div id="moon-stage" class="moon-stage" aria-label="Interactive 3D Moon with landing markers"></div>',
  '        <div class="scene-controls"><button type="button" id="reset-view">Full Moon</button><button type="button" id="polar-view">South pole view</button><span>NASA SVS Moon imagery · lighting illustrative · no terrain mesh</span></div>',
  '      </div>',
  '      <div class="date-controls">',
  '        <div class="date-heading"><span>LANDING DATE</span><span>All times in UTC · 7-day stay</span></div>',
  '        <div class="date-row"><button id="date-prev" aria-label="Seven days earlier" type="button">−7 days</button><input id="landing-date" type="date" value="2026-11-14" aria-label="Choose landing date"><button id="date-next" aria-label="Seven days later" type="button">+7 days</button></div>',
  '        <p id="data-status" class="data-status" role="status" aria-live="polite">Loading validated daily summaries…</p>',
  '      </div>',
  '      <div class="legend" aria-label="Landing condition legend">',
  '        <span><i class="dot clear"></i> Clear</span><span><i class="dot partial"></i> Partial</span><span><i class="dot out"></i> Out</span><span><i class="dot edge"></i> On the edge</span><span><i class="dot unavailable"></i> Unavailable</span>',
  '      </div>',
  '    </div>',
  '    <aside class="info-column">',
  '      <div id="side-card-mount" class="side-card-mount" aria-label="Site conditions and Plain Numbers details"></div>',
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
  '    <p>Moon surface color map: <a href="https://svs.gsfc.nasa.gov/4720" target="_blank" rel="noopener noreferrer">NASA SVS CGI Moon Kit (2025), lroc_color_2k.jpg</a>. Credit: NASA\'s Scientific Visualization Studio. Derived from LROC color data with polar albedo fill. NASA media usage is governed by <a href="https://www.nasa.gov/nasa-brand-center/images-and-media/" target="_blank" rel="noopener noreferrer">NASA media usage guidelines</a>; no separate software license is asserted for the imagery.</p>',
  '    <h3>Scientific ephemerides and terrain</h3>',
  '    <p>Sun and Earth directions, visibility and stay summaries: <a href="https://ssd.jpl.nasa.gov/horizons/" target="_blank" rel="noopener noreferrer">NASA/JPL Horizons</a>. Malapert horizon elevation: NASA Lunar Orbiter Laser Altimeter (LOLA), Lunar Reconnaissance Orbiter. These are the scientific sources; the globe texture is not a DEM.</p>',
  '    <h3>3D rendering library</h3>',
  '    <p><a href="https://threejs.org/" target="_blank" rel="noopener noreferrer">Three.js</a> and OrbitControls, copyright Three.js authors, <a href="https://github.com/mrdoob/three.js/blob/master/LICENSE" target="_blank" rel="noopener noreferrer">MIT License</a>. The interactive globe code was developed for this project; no external orbital scene has been imported.</p>',
  '    <h3>Implementation and limitations</h3>',
  '    <p>Site coordinates, visibility analysis, data checks and horizon panels: Lane A. App shell, Three.js globe, panel integration and hosting: Lane B. Current illumination is illustrative; true Sun/Earth directions in the Moon-fixed view remain Step 8. Any future borrowed assets must be added here with attribution and license before release.</p>',
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
const select = find<HTMLInputElement>('landing-date');

const buttonById = new Map<string, HTMLButtonElement>();
const statusById = new Map<string, HTMLSpanElement>();

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

const cleanVerdict = (value: string): Verdict => ['clear', 'partial', 'out', 'edge'].includes(value) ? value as Verdict : 'unavailable';

let sideCard: PanelHandle | null = null;
let compareGrid: PanelHandle | null = null;
let horizonView: PanelHandle | null = null;
type View = 'explore' | 'compare' | 'horizon' | 'credits';
let activeView: View = 'explore';

function openView(view: View): void {
  activeView = view;
  for (const name of ['explore', 'compare', 'horizon', 'credits'] as View[]) {
    find<HTMLElement>(name + '-view').hidden = name !== view;
    const button = find<HTMLButtonElement>('nav-' + name);
    button.classList.toggle('nav-active', name === view);
    button.setAttribute('aria-pressed', String(name === view));
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function updateAllPanels(): void {
  const next = { siteId: selectedSite, landingDate: selectedDate };
  sideCard?.update(next);
  compareGrid?.update(next);
  horizonView?.update(next);
}


function updateButtons(): void {
  for (const [id, button] of buttonById) {
    button.classList.toggle('active', id === selectedSite);
    button.setAttribute('aria-pressed', String(id === selectedSite));
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
  }
  moon?.setVerdicts(colors);
  updateButtons();
}

function setLandingDate(date: string): void {
  const timestamp = Date.parse(date + 'T00:00:00Z');
  if (!Number.isFinite(timestamp)) return;
  selectedDate = new Date(timestamp).toISOString().slice(0, 10);
  select.value = selectedDate;
  updateAllPanels();
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

let dataReady = false;
select.addEventListener('change', () => setLandingDate(select.value));
for (const [id, offset] of [['date-prev', -7], ['date-next', 7]] as Array<[string, number]>) {
  find<HTMLButtonElement>(id).addEventListener('click', () => {
    const value = Date.parse(selectedDate + 'T00:00:00Z') + offset * 86400000;
    setLandingDate(new Date(value).toISOString().slice(0, 10));
  });
}
find<HTMLButtonElement>('polar-view').addEventListener('click', () => moon?.focusSouthPole());
find<HTMLButtonElement>('reset-view').addEventListener('click', () => moon?.resetView());

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
  onSiteSelected: chooseSite,
  onDateSelected: setLandingDate,
  onOpenView: (view: 'compare' | 'horizon') => openView(view),
};
sideCard = mountSideCard(find<HTMLDivElement>('side-card-mount'), panelProps);
compareGrid = mountCompareGrid(find<HTMLDivElement>('compare-mount'), panelProps);
horizonView = mountHorizonView(find<HTMLDivElement>('horizon-mount'), panelProps);
for (const name of ['explore', 'compare', 'horizon', 'credits'] as View[]) {
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

window.addEventListener('pagehide', () => {
  moon?.destroy();
  sideCard?.destroy();
  compareGrid?.destroy();
  horizonView?.destroy();
}, { once: true });
