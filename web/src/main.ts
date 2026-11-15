import 'computer-modern/cmu-serif.css';
import '@fontsource/source-serif-4/400.css';
import '@fontsource/source-serif-4/600.css';
import '@fontsource/source-serif-4/700.css';
import './style.css';
import { syncShellCopy, syncTourSources } from './educatorCopy';
import { methodsCredits } from './methodsCredits';
import { listSites, loadDaily, getDaily, loadScene, getSceneState, MOCK, VERDICT_RULE, TOUR_STOPS, SOUTH_POLE, SCORE_OWN_FORMULA, STAY_OPTIONS } from '../../lib/visibility.js';
import { LunarScene, type MoonSite, type Verdict, type SceneState } from './moon';
import { OverviewScene } from './overview';
import { mountStarfield } from './starfield';
import { mountSideCard, mountCompareGrid, mountHorizonView, mountResearcher, mountPlanner, type PanelHandle } from './panels';
import { verdictIcon } from './panels/shared';

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

// D35: open on today's date (UTC), kept inside the data range 2026-01-01 .. 2029-12-24 (the last full 7-day stay).
// A date in a shared link still wins (below).
const dateOrigin = new Date(Math.min(Math.max(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()), Date.UTC(2026,0,1)), Date.UTC(2029,11,24))).toISOString().slice(0, 10);
let selectedDate = dateOrigin;
let selectedSite = sites[0].id;
let readingLevel: 'educator' | 'researcher' = 'educator';
type StayDays = 1 | 3 | 7 | 14;
let stayDays: StayDays = 7;
let selectedHour = 0; // Chosen hour within the active stay (0–167 in Educator).
const linkParams = new URLSearchParams(window.location.search);
const linkedSite = linkParams.get('site');
if (linkedSite && sites.some(s => s.id === linkedSite)) selectedSite = linkedSite;
const linkedDate = linkParams.get('date');
if (linkedDate && /^\d{4}-\d{2}-\d{2}$/.test(linkedDate)) {
  const time = Date.parse(linkedDate + 'T00:00:00Z');
  if (Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === linkedDate &&
      time >= Date.UTC(2026,0,1) && time <= Date.UTC(2029,11,24)) selectedDate = linkedDate;
}
const linkedLevel = linkParams.get('level');
if (linkedLevel === 'educator' || linkedLevel === 'researcher') readingLevel = linkedLevel;
else if (linkParams.get('tab') === 'report') readingLevel = 'researcher';
const linkedStay = Number(linkParams.get('stay'));
if (readingLevel === 'researcher' && linkParams.has('stay') && STAY_OPTIONS.includes(linkedStay)) stayDays = linkedStay as StayDays;
const activeStayDays = (): StayDays => readingLevel === 'researcher' ? stayDays : 7;
const linkedHour = Number(linkParams.get('hour'));
if (linkParams.has('hour') && Number.isInteger(linkedHour)) selectedHour = Math.max(0, Math.min(activeStayDays()*24 - 1, linkedHour));
const linkedTab = linkParams.get('tab');
const linkedExplore = linkParams.get('view') === 'horizon' ? 'horizon' : 'globe';
let daily: DailyResult | null = null;
let moon: LunarScene | null = null;
let overview: OverviewScene | null = null;
let simulatorFrame: HTMLIFrameElement | null = null;
let disposeOverviewMessages: (() => void) | null = null;
let shownTourStopId: string | null = null;
function formatUtc(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date(value)) + ' UTC';
}
function syncOverviewClock(): void {
  const frame = document.querySelector<HTMLIFrameElement>('#overview-stage iframe');
  if (!frame?.contentWindow) return;
  const utc = new Date(Date.parse(selectedDate + 'T00:00:00Z') + selectedHour * 3600000).toISOString();
  frame.contentWindow.postMessage({ type: 'lunar-navigator:set-clock', utc }, new URL(frame.src).origin);
  const status = document.getElementById('overview-clock-status');
  if (status) status.textContent = 'Inspection moment: ' + formatUtc(utc) +
    '. Planet positions are illustrative; use Explore for site conditions.';
}
const verdictNames: Record<Verdict, string> = {
  clear: 'Clear',
  partial: 'Partial',
  out: 'Out',
  edge: 'On the edge',
  unavailable: 'Unavailable',
};

app.innerHTML = [
  '<p class="small-screen-note" role="note">LunLux is built for a computer screen. Please open it on a laptop or desktop.</p>',
  '<main class="app-shell">',
  '  <header class="topbar">',
  '    <div class="brand"><span class="brand-kicker">NASA SPACE APPS 2026</span><img class="brand-wordmark" src="/brand/lunlux-wordmark.png" alt="LunLux" width="1934" height="495"><span class="brand-subtitle">Sunlight and Earth contact for lunar landing sites</span></div>',
  '    <nav class="primary-nav" aria-label="Main navigation"><button id="nav-overview" type="button" class="nav-active" aria-pressed="true">Tour</button><button id="nav-explore" type="button" aria-pressed="false">Explore</button><button id="nav-compare" type="button" aria-pressed="false">Compare</button><button id="nav-researcher" type="button" aria-pressed="false">Learn</button></nav>',
  '    <div class="header-tools"><div class="reading-level" role="group" aria-label="Reading level"><button id="level-educator" aria-pressed="true" type="button">Educator</button><button id="level-researcher" aria-pressed="false" type="button">Researcher</button></div><button id="music-toggle" class="music-toggle" type="button" aria-pressed="false" aria-label="Play Borealis background music" title="Play background music: Borealis by Scott Buckley">🔇 Music off</button><button id="nav-credits" class="methods-link" type="button" aria-pressed="false">Data and methods</button></div>',
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
  '    <label id="stay-control" class="toolbar-stay" for="stay-days" hidden>Stay <select id="stay-days" aria-label="Length of stay"><option value="1">1 day</option><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option></select></label>',
  '    <label class="toolbar-hour" for="hour-slider">Inspect <input id="hour-slider" type="range" min="0" max="167" value="0" step="1" aria-label="Moment inspected within the seven-day stay"><output id="hour-output" for="hour-slider">Day 1  00:00 UTC</output></label>',
  '    <details class="clock-tip"><summary aria-label="About the date and inspection time">ⓘ</summary><p>The 7-day stay starts at 00:00 UTC on the landing date. The slider chooses the moment you inspect within that stay; it does not move the landing time. Hourly data.<br><br>Drag to turn the Moon; scroll to zoom. The Moon stays fixed while the Sun and Earth move around it. A faint light shows the night side; it is a visual aid, not sunlight. The globe is smooth; local terrain appears in Horizon.<br><br><span id="lighting-status" class="lighting-status" role="status" aria-live="polite">Loading sunlight for the chosen moment…</span></p></details>',
  '    <p id="data-status" class="sr-only" role="status" aria-live="polite">Loading conditions…</p>',
  '  </section>',
  '  <section id="verdict-legend" class="verdict-legend" aria-label="Seven-day verdict legend" hidden>',
  `    <span class="verdict-chip clear" title="Sunlight and Earth both visible for at least ${VERDICT_RULE.CLEAR_PCT}% of the stay">${verdictIcon("clear",22)} Clear</span>`,
  `    <span class="verdict-chip partial" title="Sunlight and Earth visible together for part of the stay">${verdictIcon("partial",22)} Partial</span>`,
  `    <span class="verdict-chip out" title="Sunlight and Earth visible together for ${VERDICT_RULE.OUT_PCT}% or less of the stay">${verdictIcon("out",22)} Out</span>`,
  `    <span class="verdict-chip edge" title="Sun or Earth grazes the skyline within ${VERDICT_RULE.EDGE_DEG}° for most of the stay; small position changes matter">${verdictIcon("edge",22)} On the edge</span>`,
  '    <span class="verdict-chip earth-horizon-chip" title="Blue dashed circle: Earth is on the geometric horizon; terrain may block it"><span class="earth-dash-key" aria-hidden="true"></span> Earth on horizon</span>',
  '    <span id="bright-note" class="bright-note">Green is good, coral is hard, violet is tricky.</span>',
  '  </section>',
  '  <section id="overview-view" class="overview-view" aria-label="Sun Earth Moon overview">',
  '    <div class="overview-window">',
  '      <div class="overview-caption"><strong id="overview-source">THE SUN; EARTH; MOON</strong><span id="overview-note">Illustrative sizes, positions and motion — not to scale; not ephemeris geometry</span></div>',
  '      <p id="overview-mission-message" class="overview-mission-message">Of everything in the solar system, the Sun determines the sunlight available for a lunar lander\'s potential power, while Earth determines when a direct radio link is geometrically possible. Other planets: their gravity is already in our numbers. JPL planetary ephemerides include their gravitational effects; their light is negligible compared with sunlight. Radio from other planets is not modeled.</p>',
  '      <div id="overview-stage" class="overview-stage" aria-label="Solar system overview visualization"></div>',
  '      <div id="tour-science-caption" class="tour-science-caption" hidden aria-live="polite"></div>',
  '<details class="tour-info clock-tip"><summary aria-label="About the solar system scene">ⓘ</summary><p>Planet positions and sizes are illustrative. Use Explore for landing-site conditions.<br><br><span id="overview-clock-status" role="status">The selected moment is loading.</span></p></details>',
  '      <div id="overview-title-card" class="overview-title-card" role="region" aria-label="Solar system tour introduction"><h2><img class="overview-wordmark" src="/brand/lunlux-wordmark.png" alt="LunLux" width="1934" height="495"></h2><p class="overview-title-subtitle">Sunlight and Earth contact for lunar landing sites</p><p>Only the Sun and Earth determine the sunlight and direct Earth visibility we evaluate for a lunar lander. Other planets’ gravity is already included in NASA’s ephemerides.</p><div><button id="start-tour" type="button">Start tour</button><button id="skip-moon" type="button">Skip to the Moon</button></div><p class="overview-audio-note">Background music starts off. Use the Music button in the header to turn it on.</p></div>',
  '      <div class="overview-footer"><p id="overview-disclaimer">Choose the Moon to explore real landing sites and verified Sun/Earth visibility at your selected UTC date and hour.</p><button id="enter-explore" type="button">Explore the Moon and landing sites</button></div>',
  '    </div>',
  '  </section>',
  '  <section id="explore-view" class="explorer" aria-label="Interactive lunar landing site explorer" hidden>',
  '    <div class="scene-column">',
  '      <div class="explore-controls"><div class="view-toggle" role="group" aria-label="Explore view"><button id="globe-mode" type="button" aria-pressed="true">Globe</button><button id="horizon-mode" type="button" aria-pressed="false">Horizon</button></div></div>',
  '      <div class="moon-window">',
  '        <div id="moon-stage" class="moon-stage" aria-label="Interactive 3D Moon with landing markers"></div>',
  '        <div class="scene-controls"><button type="button" id="reset-view">Reset view</button><button type="button" id="polar-view">South pole view</button></div>',
  '      </div>',


  '    </div>',
  '    <aside class="info-column">',
  '      <div id="side-card-mount" class="side-card-mount" aria-label="Site conditions and Educator Researcher details"></div>',
  '    </aside>',
  '  </section>',
  '  <section id="compare-view" class="panel-view" aria-label="Compare landing dates" hidden><div id="compare-mount"></div></section>',
  '  <section id="horizon-view" class="panel-view" aria-label="Stand here horizon panorama" hidden><div id="horizon-mount"></div></section>',
  '  <section id="researcher-view" class="panel-view researcher-view" aria-label="Learn about the Moon" hidden><div id="researcher-mount"></div></section>',
  '  <section id="planner-view" class="panel-view planner-view" aria-label="Planner: A/B scenarios and mission requirements" hidden><div id="planner-mount"></div></section>',
  '  <section id="credits-view" class="panel-view credits-view" aria-label="Project credits" hidden>',
  '    <h2>LunLux — Credits and sources</h2>',
  '    <p>Made for the NASA Space Apps Challenge 2026. <a href="https://github.com/advik09-beep/Lunar-Landing-Hackathon" target="_blank" rel="noopener noreferrer">View the code on GitHub</a>.</p>',
  '    <p>' + SCORE_OWN_FORMULA + '</p>',
  '    <p><strong>LunLux</strong> — Sunlight and Earth contact for lunar landing sites; by Sheldon Spence and Advik Chaudhary.</p><p>We distinguish scientific data from visual illustration. The Moon image is aesthetic imagery; it is not used to calculate landing-site visibility.</p>',
  ...methodsCredits(sites),
  '  </section>',
  '  <footer class="site-footer">NASA/JPL Horizons; NASA LRO LOLA; Hourly data</footer>',
  '</main>',
].join('\n');

const find = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error('Missing UI element #' + id);
  return element as T;
};

// Background soundtrack: opt-in only, quiet, and shared across all four tabs.
// The embedded simulator is already permanently muted in LunLux mode, so there
// is no generated ambient pad competing with this track.
// 'Borealis' by Scott Buckley, licensed CC BY 4.0: https://www.scottbuckley.com.au/library/borealis/
const musicToggle = find<HTMLButtonElement>('music-toggle');
const backgroundMusic = new Audio('https://www.scottbuckley.com.au/library/wp-content/uploads/2019/09/sb_borealis.mp3');
backgroundMusic.preload = 'none'; // Do not download until the visitor opts in.
backgroundMusic.loop = true;
backgroundMusic.volume = 0.12;
let musicEnabled = false;

function syncMusicToggle(): void {
  musicToggle.textContent = musicEnabled ? '🔊 Music on' : '🔇 Music off';
  musicToggle.setAttribute('aria-pressed', String(musicEnabled));
  musicToggle.setAttribute('aria-label', musicEnabled ? 'Pause Borealis background music' : 'Play Borealis background music');
  musicToggle.title = musicEnabled ? 'Pause background music: Borealis by Scott Buckley' : 'Play background music: Borealis by Scott Buckley';
}
musicToggle.addEventListener('click', () => {
  if (musicEnabled) {
    musicEnabled = false;
    backgroundMusic.pause();
    syncMusicToggle();
    return;
  }
  musicEnabled = true;
  syncMusicToggle();
  // play() happens in direct response to a visitor click (browser autoplay policy).
  void backgroundMusic.play().catch(() => {
    musicEnabled = false;
    backgroundMusic.pause();
    syncMusicToggle();
    musicToggle.textContent = 'Music unavailable';
    musicToggle.title = 'Could not load Borealis. Click to try again.';
  });
});
// Stop audio when leaving the tab. Returning to LunLux never starts it automatically.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && musicEnabled) {
    musicEnabled = false;
    backgroundMusic.pause();
    syncMusicToggle();
  }
});
syncMusicToggle();

find<HTMLElement>('mock-notice').hidden = !MOCK;
const sitePicker = find<HTMLSelectElement>('site-picker');
const status = find<HTMLParagraphElement>('data-status');
const lightingStatus = find<HTMLElement>('lighting-status');
const select = find<HTMLInputElement>('landing-date');
select.value = selectedDate;
const stayPicker = find<HTMLSelectElement>('stay-days');
stayPicker.value = String(stayDays);
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
let exploreMode: 'globe' | 'horizon' = linkedExplore;
// D37: Safari/WebKit throws after 100 history.replaceState calls in a short window ("more than 100 times per
// 10 seconds"), and that error used to escape the slider handler, freezing the controls. The address bar is now
// updated at most a few times a second (with a final update after the last change), and an error here can never
// stop the controls.
const LINK_MIN_INTERVAL_MS = 300;
let linkLastWrite = 0;
let linkTimer: number | undefined;
function syncShareLink(): void {
  const wait = LINK_MIN_INTERVAL_MS - (performance.now() - linkLastWrite);
  if (wait > 0) {
    if (linkTimer === undefined) linkTimer = window.setTimeout(() => { linkTimer = undefined; syncShareLink(); }, wait);
    return;
  }
  linkLastWrite = performance.now();
  try { writeShareLink(); } catch (error) { console.warn('Could not update the address bar', error); }
}
function writeShareLink(): void {
  const url = new URL(window.location.href);
  const tab = activeView === 'overview' ? 'tour' :
    activeView === 'researcher' ? (readingLevel === 'educator' ? 'learn' : 'report') :
    activeView === 'credits' ? 'methods' : activeView;
  url.searchParams.set('tab', tab);
  url.searchParams.set('level', readingLevel);
  url.searchParams.set('site', selectedSite);
  url.searchParams.set('date', selectedDate);
  url.searchParams.set('hour', String(selectedHour));
  url.searchParams.set('view', exploreMode);
  if (readingLevel === 'researcher') url.searchParams.set('stay', String(stayDays));
  else url.searchParams.delete('stay');
  history.replaceState(history.state, '', url.pathname + url.search + url.hash);
}
function setExploreMode(mode: 'globe' | 'horizon'): void {
  exploreMode = mode;
  find<HTMLElement>('moon-stage').closest<HTMLElement>('.moon-window')!.hidden = mode !== 'globe';
  find<HTMLElement>('horizon-view').hidden = activeView !== 'explore' || mode !== 'horizon';
  find<HTMLElement>('globe-mode').setAttribute('aria-pressed', String(mode === 'globe'));
  find<HTMLElement>('horizon-mode').setAttribute('aria-pressed', String(mode === 'horizon'));
  moon?.setVisible(activeView === 'explore' && mode === 'globe');
  if (activeView === 'explore') updateAllPanels();
  syncShareLink();
}
find<HTMLElement>('explore-view').querySelector('.scene-column')!.append(find<HTMLElement>('horizon-view'));
find<HTMLElement>('globe-mode').addEventListener('click', () => setExploreMode('globe'));
find<HTMLElement>('horizon-mode').addEventListener('click', () => setExploreMode('horizon'));

function showTourTitle(): void {
  shownTourStopId = null;
  find<HTMLElement>('tour-science-caption').hidden = true;
  openView('overview');
  find<HTMLElement>('overview-title-card').hidden = false;
}
function startSolarTour(): void {
  shownTourStopId = null;
  find<HTMLElement>('tour-science-caption').hidden = true;
  find<HTMLElement>('overview-title-card').hidden = true;
  openView('overview');
  const frame = find<HTMLIFrameElement>('overview-stage').querySelector('iframe');
  frame?.contentWindow?.postMessage({ type: 'lunar-navigator:start-tour' }, new URL(frame.src).origin);
}
function openView(view: View): void {
  if (view === 'horizon') { exploreMode = 'horizon'; view = 'explore'; }
  if (view === 'planner') view = 'compare';
  const enteringExplore = view === 'explore' && activeView !== 'explore';
  activeView = view;
  document.body.dataset.view = view;
  find<HTMLElement>('global-clock').hidden = view === 'overview' || view === 'credits';
  find<HTMLElement>('verdict-legend').hidden = view !== 'explore';
  for (const name of ['overview', 'explore', 'compare', 'horizon', 'researcher', 'planner', 'credits'] as View[]) {
    find<HTMLElement>(name + '-view').hidden = name !== view;
    const button = document.getElementById('nav-' + name);
    button?.classList.toggle('nav-active', name === view);
    button?.setAttribute('aria-pressed', String(name === view));
  }
  if (view === 'compare') find<HTMLElement>('planner-view').hidden = readingLevel === 'educator';
  updateAllPanels();
  setExploreMode(exploreMode);
  if (enteringExplore) moon?.focusSite(selectedSite);
  // Detach the independent WebGL iframe outside Tour so it cannot consume GPU time.
  if (simulatorFrame) {
    if (view === 'overview' && !simulatorFrame.isConnected) find<HTMLElement>('overview-stage').append(simulatorFrame);
    else if (view !== 'overview' && simulatorFrame.isConnected) simulatorFrame.remove();
  }
  overview?.setVisible(view === 'overview');
  syncShareLink();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// Only visible views receive expensive data updates. Panels keep their own state.
const panelSelections = new WeakMap<PanelHandle, string>();
function updatePanel(panel: PanelHandle, wholeStay = false): void {
  const props = { siteId: selectedSite, landingDate: selectedDate, level: readingLevel, stayDays: activeStayDays(), ...(wholeStay ? {} : {hour:selectedHour}) };
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
  syncShareLink();
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
  moon?.setVerdicts(colors, activeStayDays());
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
      'Sunlight shown for ' + formatUtc(sceneState.sampleUtc) +
      '. Earth is ' + Math.round(sceneState.earth.distKm).toLocaleString() +
      ' km away; its position is shown in Horizon. The stars are decorative.';
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
  syncShareLink();
  renderClockHour();
  syncOverviewClock();
  updateAllPanels();
  updateSceneLighting();
  void refreshDaily();
}

function renderClockHour(): void {
  const utc = new Date(Date.parse(selectedDate + 'T00:00:00Z') + selectedHour * 3600000)
    .toISOString().slice(0, 16).replace('T', ' ');
  hourSlider.value = String(selectedHour);
  const day = Math.floor(selectedHour / 24) + 1;
  const hour = selectedHour % 24;
  const simpleTime = hour === 0 ? 'midnight' : hour === 12 ? 'noon' :
    hour < 12 ? hour + ' in the morning' : hour < 18 ? (hour - 12) + ' in the afternoon' : (hour - 12) + ' at night';
  hourOutput.textContent = readingLevel === 'educator' ? 'Day ' + day + '  ' + simpleTime : 'Day ' + day + '  ' + utc.slice(11) + ' UTC';
  hourOutput.title = readingLevel === 'educator' ? 'The time you are looking at on day ' + day + '.' : formatUtc(new Date(Date.parse(selectedDate + 'T00:00:00Z') + selectedHour * 3600000).toISOString());
}

let panelUpdateTimer = 0;
function setHour(value: number): void {
  const hour = Math.max(0, Math.min(activeStayDays()*24 - 1, Math.round(value)));
  if (!Number.isFinite(hour)) return;
  selectedHour = hour;
  syncShareLink();
  renderClockHour();
  syncOverviewClock();
  clearTimeout(panelUpdateTimer);
  panelUpdateTimer = window.setTimeout(updateAllPanels, 90);
  updateSceneLighting();
}

let dailyRequestToken = 0;
async function refreshDaily(): Promise<void> {
  const token = ++dailyRequestToken;
  const days = activeStayDays();
  daily = null;
  moon?.setVerdicts(new Map<string, Verdict>(), days); // Do not show old stay/date verdicts while a new daily file loads.
  status.dataset.state = 'loading';
  status.textContent = readingLevel === 'educator' ? 'Checking this week.' : 'Loading landing-site conditions…';
  try {
    await loadDaily(days);
    if (token !== dailyRequestToken) return;
    daily = getDaily(selectedDate, 1, days) as DailyResult;
    status.dataset.state = 'ready';
    status.textContent = readingLevel === 'educator' ? 'Showing the week that starts on your day.' : days + '-day stay starting ' + formatUtc(selectedDate + 'T00:00:00Z') + '; hourly NASA/JPL Horizons data';
  } catch (error) {
    if (token !== dailyRequestToken) return;
    daily = null;
    status.textContent = 'Conditions unavailable for the selected date and stay length.';
    status.dataset.state = 'unavailable';
  }
  updateDaily();
}

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
      shownTourStopId = stop.id;
      const caption = find<HTMLElement>('tour-science-caption');
      caption.replaceChildren();
      const title = document.createElement('strong');
      title.textContent = readingLevel === 'educator' ? stop.kidTitle : stop.title;
      const body = document.createElement('p');
      body.textContent = readingLevel === 'educator' ? stop.kidText : stop.text;
      caption.append(title, body);
      const sources = document.createElement('p');
      sources.append('Sources: ');
      for (const [index, source] of stop.sources.entries()) {
        if (index) sources.append('; ');
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
          a.textContent = source.name + '; ';
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          details.append(a);
        }
        caption.append(details);
        const handoff = document.createElement('div');
        handoff.className = 'moon-handoff';
        const prompt = document.createElement('p');
        prompt.className = 'moon-prompt';
        prompt.textContent = 'Click here to go to the Moon';
        const action = document.createElement('button');
        action.type = 'button';
        action.className = 'moon-tour-action';
        action.textContent = 'Click here to go to the Moon';
        action.addEventListener('click', () => openView('explore'));
        handoff.append(prompt, action);
        caption.append(handoff);
      }
      caption.hidden = false;
      syncTourSources(readingLevel);
    }
    if (data && typeof data === 'object' &&
        data.type === 'lunar-navigator:open-explore' && data.body === 'moon') {
      openView('explore');
    }
  };
  window.addEventListener('message', onSimulatorMessage);
  disposeOverviewMessages = () => window.removeEventListener('message', onSimulatorMessage);
  find<HTMLElement>('overview-source').textContent = 'SOLAR SYSTEM; OzAILabs simulator';
  find<HTMLElement>('overview-note').textContent = 'Illustrative solar system; not to scale';
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
  return { siteId: selectedSite, landingDate: selectedDate, hour: selectedHour, level: readingLevel, stayDays: activeStayDays(),
    onHourSelected: setHour, onSiteSelected: chooseSite, onDateSelected: setLandingDate,
    onOpenView: (view: 'compare' | 'horizon') => openView(view) };
}
find<HTMLElement>('compare-view').append(find<HTMLElement>('planner-view'));
for (const name of ['overview', 'explore', 'compare', 'horizon', 'researcher', 'planner', 'credits'] as View[]) {
  if (name !== 'overview') document.getElementById('nav-' + name)?.addEventListener('click', () => openView(name));
}
function refreshTourCaptionLanguage(): void {
  if (!shownTourStopId) return;
  const stop = TOUR_STOPS.find((item: { id: string }) => item.id === shownTourStopId);
  const caption = find<HTMLElement>('tour-science-caption');
  const heading = caption.querySelector<HTMLElement>(':scope > strong');
  const body = caption.querySelector<HTMLParagraphElement>(':scope > p');
  if (!stop || !heading || !body) return;
  heading.textContent = readingLevel === 'educator' ? stop.kidTitle : stop.title;
  body.textContent = readingLevel === 'educator' ? stop.kidText : stop.text;
}
function syncReadingLevelUI(): void {
  const isEducator = readingLevel === 'educator';
  find<HTMLButtonElement>('nav-researcher').textContent = isEducator ? 'Learn' : 'Report';
  find<HTMLElement>('researcher-view').setAttribute('aria-label', isEducator ? 'Learn about the Moon' : 'Researcher report');
  find<HTMLElement>('planner-view').hidden = activeView !== 'compare' || isEducator;
  document.body.dataset.readingLevel = readingLevel;
  moon?.setReadingLevel(readingLevel);
  find<HTMLElement>('stay-control').hidden = isEducator;
  stayPicker.value = String(stayDays);
  hourSlider.max = String(activeStayDays()*24 - 1);
  syncShellCopy(readingLevel);
  renderClockHour();
}
function applyStayLength(): void {
  const days = activeStayDays();
  find<HTMLElement>('stay-control').hidden = readingLevel !== 'researcher';
  stayPicker.value = String(stayDays);
  hourSlider.max = String(days*24 - 1);
  selectedHour = Math.min(selectedHour, days*24 - 1);
  renderClockHour();
  syncOverviewClock();
  updateSceneLighting();
  for (const panel of [sideCard,compareGrid,horizonView,researcherView,plannerView]) panel?.update({stayDays:days,hour:selectedHour,level:readingLevel});
  updateAllPanels();
  void refreshDaily();
  syncShareLink();
}
stayPicker.addEventListener('change', () => {
  const value = Number(stayPicker.value);
  if (!STAY_OPTIONS.includes(value)) return;
  stayDays = value as StayDays;
  applyStayLength();
});
for (const level of ['educator','researcher'] as const) {
  find<HTMLButtonElement>('level-' + level).addEventListener('click', () => {
    readingLevel = level;
    selectedHour = Math.min(selectedHour, activeStayDays()*24 - 1);
    syncReadingLevelUI();
    refreshTourCaptionLanguage();
    syncTourSources(readingLevel);
    syncShareLink();
    for (const name of ['educator','researcher']) find<HTMLElement>('level-' + name).setAttribute('aria-pressed', String(name === level));
    applyStayLength();
  });
}
for (const name of ['educator','researcher'] as const) {
  find<HTMLElement>('level-' + name).setAttribute('aria-pressed', String(name === readingLevel));
}
syncReadingLevelUI();
updateButtons();
const initialView: View = linkedTab === 'explore' ? 'explore' :
  linkedTab === 'compare' ? 'compare' :
  linkedTab === 'learn' || linkedTab === 'report' ? 'researcher' :
  linkedTab === 'methods' ? 'credits' : 'overview';
openView(initialView);

void refreshDaily();

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
  backgroundMusic.pause();
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
