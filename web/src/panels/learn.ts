// D32 Learn tab (Educator view of the fourth tab): a simple visual report for a seven-year-old, built from
// OUR data, plus real NASA photos with their official source page and exact credit.
// Lane A owns this file. Every number comes from /lib/visibility.js; nothing is calculated here except
// picking maxima, run lengths and drawing positions from those numbers.
import { V, type Sample } from "./data";
import { createPanelRoot, esc, verdictIcon } from "./shared";
import { KID_CSS, KID_VERDICT, kidDate, kidAmount, ring, teacher } from "./kid";
import type { MountPanel, PanelProps } from "./types";
import earthriseUrl from "./img/nasa_apollo8_earthrise.jpg";
import southPoleUrl from "./img/nasa_pia13523_south_pole.jpg";
import scientistUrl from "./img/nasa_apollo17_scientist_on_moon.jpg";
import illuminationUrl from "./img/nasa_pia13720_south_pole_illumination.jpg";
import lroEarthriseUrl from "./img/nasa_lro_earthrise_2015.jpg";

/** NASA photos: official page and the credit line exactly as NASA gives it (first two checked 2026-11-14,
 *  the last three 2026-11-15, D34). Images resized for the web. */
export const LEARN_PHOTOS = [
  { id: "earthrise", src: earthriseUrl, alt: "Earth rising above the grey edge of the Moon, against a black sky.",
    kid: "Earth seen from a spaceship flying around the Moon.",
    teacher: "Apollo 8 Earthrise. Earth seems to rise here only because the spacecraft was orbiting the Moon. Standing on the Moon's surface, Earth stays in almost the same spot in the sky (see “Earth stays in one spot” above).",
    credit: "Image Credit: NASA", page: "https://www.nasa.gov/image-article/apollo-8-earthrise/" },
  { id: "south-pole", src: southPoleUrl, alt: "Black-and-white map of the Moon's south pole, full of craters, with long dark shadows.",
    kid: "The Moon's south pole. Some deep craters here never get sunshine.",
    teacher: "Lunar South Pole (PIA13523): a mosaic from the camera on NASA's Lunar Reconnaissance Orbiter. Because the Sun stays near the horizon here, crater floors can stay in permanent shadow, which is where water ice can survive.",
    credit: "Credits: NASA/GSFC/Arizona State University", page: "https://science.nasa.gov/photojournal/the-lunar-south-pole" },
  { id: "scientist", src: scientistUrl, alt: "An astronaut in a white spacesuit stands next to a flag on the grey Moon, with a small blue Earth high in the black sky.",
    kid: "An astronaut on the Moon. The small dot above the flag is Earth.",
    teacher: "A Scientist on the Moon. NASA's caption: “Scientist-astronaut Harrison H. Schmitt stands by the American flag during a moonwalk on the Apollo 17 mission. Home, that small dot in the blackness of space above the flag, is a quarter-million miles away.”",
    credit: "Credit: NASA", page: "https://science.nasa.gov/resource/a-scientist-on-the-moon" },
  { id: "illumination", src: illuminationUrl, alt: "A round grey map of the area around the Moon's south pole, with bright and dark patches and a big crater in the middle.",
    kid: "A map of sunshine near the south pole. It shows which spots get sunshine and which stay dark.",
    teacher: "South Pole Illumination Map (PIA13720), from NASA's Lunar Reconnaissance Orbiter camera. NASA's caption: “Multi-temporal illumination map of the lunar south pole, Shackleton crater (19 kilometers diameter, or 12 miles) is in the center.” It is built from many images over time, so it shows how often each spot is lit, not one moment.",
    credit: "Credits: NASA/GSFC/Arizona State University", page: "https://science.nasa.gov/photojournal/south-pole-illumination-map" },
  { id: "lro-earthrise", src: lroEarthriseUrl, alt: "Earth, blue and white, rising above the grey edge of the Moon.",
    kid: "Earth seen by a NASA spacecraft that flies around the Moon.",
    teacher: "NASA Releases New High-Resolution Earthrise Image. NASA's caption: “NASA's Lunar Reconnaissance Orbiter (LRO) recently captured a unique view of Earth from the spacecraft's vantage point in orbit around the moon.” NASA describes it as a composite image. As with Apollo 8, Earth seems to rise only because the spacecraft is moving.",
    credit: "Image Credit: NASA/Goddard/Arizona State University", page: "https://www.nasa.gov/image-article/nasa-releases-new-high-resolution-earthrise-image-2/" },
] as const;

/** D34 "Try it yourself": preset places and dates, chosen from our data, opened through the shell's
 *  shareable-link parameters (tab, level, site, date, hour, view). */
export const TRY_IT = Object.freeze([
  { id: "hill", siteId: "sp_malapert", date: "2026-09-19", hour: 6, view: "horizon", title: "See a hill hide the Sun",
    kid: "Stand at Malapert. The Sun is up, but a hill is in the way." },
  { id: "sunny", siteId: "sp_malapert", date: "2026-11-22", hour: 0, view: "globe", title: "A sunny week near the south pole",
    kid: "Land at Malapert this week. The Sun and Earth stay in sight all week." },
  { id: "night", siteId: "apollo11", date: "2026-11-01", hour: 0, view: "globe", title: "A week of night at Apollo 11",
    kid: "Land where Apollo 11 landed. It is night all week, but Earth stays in sight." },
] as const);
export const tryHref = (x: { siteId: string; date: string; hour: number; view: string }): string =>
  `?tab=explore&level=educator&site=${encodeURIComponent(x.siteId)}&date=${x.date}&hour=${x.hour}&view=${x.view}`;

/** "The ten places": where each site is, in words, from its latitude (no degrees shown). */
export function placeWords(lat: number): string {
  if (lat <= -80) return "Very close to the south pole.";
  if (lat <= -60) return "Far in the south.";
  return "Near the middle of the Moon.";
}

/** Fixed examples so the explainers say the same thing every time (checked by scripts/check_d32.mjs). */
export const LEARN_EXAMPLES = Object.freeze({
  ridge: { siteId: "sp_malapert", utc: "2026-09-19T06:00:00Z" },
  high: { siteId: "apollo11", start: "2026-11-14T00:00:00Z", days: 30 },
  low: { siteId: "sp_malapert", start: "2026-11-14T00:00:00Z", days: 30 },
  dayNight: { siteId: "apollo11", start: "2026-11-14T00:00:00Z", days: 120 },
  earth: { siteId: "apollo11", start: "2026-11-14T00:00:00Z", days: 30 },
});

/** Facts for the explainers, straight from /lib. Exported for the checks. */
export function learnFacts() {
  const E = LEARN_EXAMPLES;
  const st = V.getState(E.ridge.siteId, E.ridge.utc);
  const hz = V.getHorizon(E.ridge.siteId);
  const bin = Math.round(st.sunAz) % 360;
  const tl = (x: { siteId: string; start: string; days: number }) => V.getTimeline(x.siteId, x.start, x.days).samples;
  const hi = tl(E.high), lo = tl(E.low), dn = tl(E.dayNight), ea = tl(E.earth);
  // Day and night: lengths of complete sunshine and night runs (hours), and sunrise-to-sunrise spans.
  const runs: { lit: boolean; hours: number; startIdx: number }[] = [];
  dn.forEach((s, i) => { const r = runs[runs.length - 1]; if (r && r.lit === s.lit) r.hours++; else runs.push({ lit: s.lit, hours: 1, startIdx: i }); });
  const whole = runs.slice(1, -1); // drop runs cut by the window edges
  const rises = whole.filter((r) => r.lit).map((r) => dn[r.startIdx].utc);
  return {
    ridge: { sunEl: st.sunEl, sunAz: st.sunAz, marginDeg: st.sunMarginDeg, skylineDeg: st.sunEl - st.sunMarginDeg, lit: st.lit,
      blockDistKm: hz.blockDistKm?.[bin] ?? null, horizon: hz.elevationDeg },
    highSunDeg: Math.max(...hi.map((s) => s.sunEl)), lowSunDeg: Math.max(...lo.map((s) => s.sunEl)),
    dayNight: { sunHours: whole.filter((r) => r.lit).map((r) => r.hours), nightHours: whole.filter((r) => !r.lit).map((r) => r.hours), sunrises: rises,
      sunriseToSunriseDays: rises.slice(1).map((r, i) => (Date.parse(r) - Date.parse(rises[i])) / 864e5), samples: dn },
    earth: { elMin: Math.min(...ea.map((s) => s.earthEl)), elMax: Math.max(...ea.map((s) => s.earthEl)),
      azMin: Math.min(...ea.map((s) => s.earthAz)), azMax: Math.max(...ea.map((s) => s.earthAz)),
      sunElMin: Math.min(...ea.map((s) => s.sunEl)), sunElMax: Math.max(...ea.map((s) => s.sunEl)), samples: ea },
  };
}

export async function renderLearn(body: HTMLElement, current: PanelProps, isCurrent: () => boolean): Promise<void> {
  const ids = [...new Set([current.siteId, ...Object.values(LEARN_EXAMPLES).map((x) => x.siteId)])];
  body.innerHTML = `<p class="muted">Getting the pictures ready…</p>`;
  try { await Promise.all([...ids.map((id) => V.loadSite(id)), V.loadDaily()]); } catch (err) {
    if (isCurrent()) body.innerHTML = `<p class="warn">Could not load data (${esc((err as Error).message)}).</p>`;
    return;
  }
  if (!isCurrent()) return;
  const F = learnFacts();
  const site = V.listSites().find((s) => s.id === current.siteId);
  let mine = "";
  try {
    const sm = V.getSummary(current.siteId, `${current.landingDate}T00:00:00Z`, V.VERDICT_RULE.STAY_DAYS);
    mine = `<section class="mine"><h3>Your place: ${esc(site?.shortName ?? current.siteId)}</h3>
      <p>Landing on ${esc(kidDate(current.landingDate))}.</p>
      <div class="rings">${ring(sm.pctLit, "sun", "Sunshine")}${ring(sm.pctComms, "earth", "Earth in sight")}</div>
      <p>Sunshine ${esc(kidAmount(sm.pctLit))}. Earth in sight ${esc(kidAmount(sm.pctComms))}.</p></section>`;
  } catch { mine = `<section class="mine"><h3>Your place</h3><p>We have no data for that week.</p></section>`; }
  const dn = F.dayNight, sunDays = Math.round(avg(dn.sunHours) / 24), nightDays = Math.round(avg(dn.nightHours) / 24);
  const r = F.ridge;
  let week: Record<string, { verdict: keyof typeof KID_VERDICT; pctLit: number; pctComms: number } | null> = {};
  try { const dly = (V as unknown as { getDaily(d: string, n: number): unknown }).getDaily(current.landingDate, 1) as { sites: Record<string, ({ verdict: keyof typeof KID_VERDICT; pctLit: number; pctComms: number } | null)[]> }; week = Object.fromEntries(Object.entries(dly.sites).map(([k, v]) => [k, v[0]])); } catch { week = {}; }
  const card = (pic: string, words: string) => `<section class="ex"><div class="pic-col">${pic}</div><div class="words">${words}</div></section>`;
  const mStart = learnMonthStart(current.landingDate);
  const watch = monthData(mStart);
  const quiz = quizFor(current);
  body.innerHTML = `<div class="kid learn">
    <header><h2>Learn: sunshine and Earth on the Moon</h2>
      <p class="lead">A lander needs sunshine for power. It needs to see Earth to send messages home.</p></header>
    ${mine}

    <div class="grid2">
    ${card(ridgeSvg(r), `<h3>1. A hill can hide the Sun</h3>
      <p>The Sun is up in the sky.</p>
      <p>But a tall hill is in the way.</p>
      <p>So the lander gets no sunshine.</p>
      ${teacher(`<p>Real skyline at Malapert (high ground near NASA's candidate region) on 19 September 2026 at 06:00 UTC. The Sun is ${r.sunEl.toFixed(2)} degrees above level, but the terrain skyline in that direction stands ${r.skylineDeg.toFixed(2)} degrees high, set by a ridge ${r.blockDistKm === null ? "nearby" : `${r.blockDistKm.toFixed(2)} km`} to the east. A flat-ground model would call this hour sunny; with terrain it is dark. Skyline from NASA's LOLA elevation maps, Sun position from NASA JPL Horizons.</p>`,
        "Can you remember a time a building or a tree hid the Sun from you?")}`)}
    ${card(`<div class="pair">${skySvg(F.highSunDeg, "Apollo 11", "near the middle of the Moon")}${skySvg(F.lowSunDeg, "Malapert", "near the south pole")}</div>`, `<h3>2. Near the poles, the Sun stays low</h3>
      <p>Near the middle of the Moon, the Sun climbs high.</p>
      <p>Near the south pole, the Sun stays close to the ground.</p>
      <p>That is why hills matter so much there.</p>
      ${teacher(`<p>Highest Sun in the 30 days from 14 November 2026: Apollo 11 about ${Math.round(F.highSunDeg)} degrees above level, Malapert about ${Math.round(F.lowSunDeg)} degrees (NASA JPL Horizons). The Moon's axis is tilted only about 1.5 degrees, so at the poles the Sun always skims the horizon (NASA SVS 5229).</p>`,
        "If the Sun stayed low all day where you live, what would your shadow look like?")}`)}
    ${card(dayNightSvg(dn.samples), `<h3>3. A day on the Moon lasts about a month</h3>
      <p>On the Moon, sunshine lasts about ${words(sunDays)} days.</p>
      <p>Then night lasts about ${words(nightDays)} days.</p>
      <p>On Earth, a whole day and night take just one day.</p>
      ${teacher(`<p>At Apollo 11 from 14 November 2026: complete sunshine stretches of ${list(dn.sunHours.map((h) => (h / 24).toFixed(1)))} days and nights of ${list(dn.nightHours.map((h) => (h / 24).toFixed(1)))} days. Sunrise to sunrise: ${list(dn.sunriseToSunriseDays.map((d) => d.toFixed(1)))} days (hourly data, so each is good to about an hour). One lunar day, noon to noon, averages about 29.5 Earth days.</p>`,
        "What would you do during a night that lasts two weeks?")}`)}
    ${card(earthSvg(F.earth.samples), `<h3>4. Earth stays in one spot</h3>
      <p>The Sun crosses the Moon's sky.</p>
      <p>Earth stays in almost the same spot.</p>
      <p>That is because the Moon always shows Earth the same face.</p>
      ${teacher(`<p>At Apollo 11 over the 30 days from 14 November 2026, Earth's height stays between ${Math.round(F.earth.elMin)} and ${Math.round(F.earth.elMax)} degrees and its compass direction between ${Math.round(F.earth.azMin)} and ${Math.round(F.earth.azMax)} degrees, while the Sun goes from ${Math.round(F.earth.sunElMin)} to ${Math.round(F.earth.sunElMax)} degrees (below the ground at night). The small wobble is called libration. Positions from NASA JPL Horizons.</p>`,
        "If Earth never moves in the Moon's sky, could you use it to find your way?")}`)}
    </div>

    <section class="watch"><h3>5. Watch a month</h3>
      <p>Press play. Watch the Sun move for one month at two places.</p>
      <div class="watch-ctl"><button type="button" class="play" data-action="play" aria-pressed="false">▶ Play</button>
        <input type="range" class="month" min="0" max="${watch.n - 1}" step="1" value="0" aria-label="Time in the month"/>
        <output class="month-when">Day 1</output></div>
      <div class="grid2">${watch.sites.map((w) => `<figure class="sky-panel" data-watch="${w.siteId}">
        ${watchSvg(w.horizon)}
        <figcaption><strong>${esc(w.name)}</strong> <span class="now-words"></span></figcaption></figure>`).join("")}</div>
      ${teacher(`<p>Hourly NASA JPL Horizons positions for the 30 days from ${esc(mStart)}, drawn over each site's real skyline from NASA's LOLA maps (the line). Left to right is the compass, north to north; up is height above level, on the same scale for both. Highest Sun this month: ${esc(watch.sites.map((w) => `${w.name} about ${Math.round(w.maxEl)} degrees`).join(", "))}. A faded Sun is below the skyline.</p>`,
        "Why does the Sun at Malapert hide behind hills so often?")}</section>

    <section class="quiz"><h3>6. Can you tell?</h3>
      <p>${quiz ? `Think about ${esc(quiz.siteName)}, landing on ${esc(kidDate(current.landingDate))}. Tap an answer.` : "We have no data for that week. Pick another day."}</p>
      ${quiz ? `<div class="grid3">${quiz.qs.map((q, i) => `<div class="q-card" data-q="${i}"><p class="q">${esc(q.q)}</p>
        <div class="opts">${q.options.map((o, j) => `<button type="button" data-action="answer" data-q="${i}" data-o="${j}">${esc(o)}</button>`).join("")}</div>
        <p class="answer" aria-live="polite"></p></div>`).join("")}</div>
      ${teacher(quiz.teacherHtml, "Can you find a week where the answers change?")}` : ""}</section>

    <section class="tryit"><h3>7. Try it yourself</h3>
      <p>Pick a card. The tool opens at that place and day.</p>
      <div class="grid3">${TRY_IT.map((t) => { const st = V.listSites().find((x) => x.id === t.siteId)!; return `<a class="card try" data-try="${t.id}" href="${tryHref(t)}">
        <strong>${esc(t.title)}</strong><span>${esc(t.kid)}</span><span class="muted small">${esc(st.shortName)}, ${esc(kidDate(t.date))}</span><span class="go">Open it</span></a>`; }).join("")}</div>
      ${teacher(`<p>Each card opens Explore in the Educator view at a place, date and hour chosen from our data: Malapert on 19 September 2026 at 06:00 UTC (the Sun ${r.sunEl.toFixed(2)} degrees above level, behind a ridge); Malapert in the week from 22 November 2026 (sunlight and Earth in view for all 168 hours); Apollo 11 in the week from 1 November 2026 (no sunlight, Earth in view the whole week).</p>`,
        "Before you open a card, guess: will the lander have sunshine?")}</section>

    <section class="places"><h3>8. The ten places</h3>
      <div class="grid5">${V.listSites().map((st) => { const w = week[st.id]; return `<a class="card place" data-place="${st.id}" href="${tryHref({ siteId: st.id, date: current.landingDate, hour: 0, view: "globe" })}">
        <strong>${w ? verdictIcon(w.verdict, 18) : ""} ${esc(st.shortName)}</strong>
        <span>${esc(placeWords(st.lat))}</span>
        <span>${st.landingDate ? `A lander landed here in ${st.landingDate.slice(0, 4)}.` : "A possible landing spot."}</span>
        <span class="muted small">${w ? `This week: ${esc(KID_VERDICT[w.verdict].label.toLowerCase())}. Sunshine ${esc(kidAmount(w.pctLit))}.` : "No data for this week."}</span>
        <span class="go">Visit</span></a>`; }).join("")}</div>
      ${teacher(`<p>Six are past landings (Apollo 11, 12 and 17, Chandrayaan-3, IM-1, IM-2), shown for comparison; four are candidate points from NASA's Artemis III candidate regions. “This week” is the 7-day stay from ${esc(current.landingDate)}. Where each place is comes from its latitude; landing years come from each site's source in the data.</p>`,
        "Which place would you pick for a lander that must talk to Earth all the time?")}</section>

    <section class="photos-sec"><h3>9. Real NASA photos</h3>
      <div class="grid5">${LEARN_PHOTOS.map((p) => `<figure class="photo card" data-photo="${p.id}">
        <img src="${p.src}" alt="${esc(p.alt)}" loading="lazy" width="320"/>
        <figcaption><p>${esc(p.kid)}</p>
          <p class="credit">${esc(p.credit)}; <a href="${esc(p.page)}" target="_blank" rel="noopener">NASA source page</a></p>
          ${teacher(`<p>${esc(p.teacher)}</p>`, PHOTO_Q[p.id])}</figcaption></figure>`).join("")}</div></section>
  </div>`;
  wireWatch(body, watch);
  wireQuiz(body, quiz);
}

// ---- "Watch a month" (2026-11-15): the Sun over one month at Apollo 11 and Malapert, from the hourly data ----
const WATCH_SITES = ["apollo11", "sp_malapert"] as const;
/** First day of the month shown: the chosen landing date, kept inside the 2026–2029 data. */
export function learnMonthStart(landingDate: string): string {
  const t = Math.min(Math.max(Date.parse(landingDate + "T00:00:00Z"), Date.parse("2026-01-01T00:00:00Z")), Date.parse("2029-12-01T00:00:00Z"));
  return new Date(t).toISOString().slice(0, 10);
}
type WatchSite = { siteId: string; name: string; samples: Sample[]; horizon: number[]; maxEl: number };
function monthData(start: string): { n: number; start: string; sites: WatchSite[] } {
  const sites = WATCH_SITES.map((id) => {
    const samples = V.getTimeline(id, `${start}T00:00:00Z`, 30).samples;
    return { siteId: id, name: V.listSites().find((x) => x.id === id)!.shortName, samples, horizon: V.getHorizon(id).elevationDeg, maxEl: Math.max(...samples.map((s) => s.sunEl)) };
  });
  return { n: sites[0].samples.length, start, sites };
}
const WW = 520, WH = 220, ELO = -10, EHI = 90;
const wx = (a: number) => ((((a % 360) + 360) % 360) / 360) * WW, wy = (e: number) => ((EHI - e) / (EHI - ELO)) * WH;
function watchSvg(h: number[]): string {
  let d = "";
  for (let a = 0; a <= 360; a++) d += `${a ? "L" : "M"}${wx(a === 360 ? 359.999 : a).toFixed(1)},${wy(h[a % 360]).toFixed(1)}`;
  return `<svg class="pic watchpic" viewBox="0 0 ${WW} ${WH + 18}" role="img" aria-label="The sky all the way around, with the real hills and the Sun.">
    <rect width="${WW}" height="${WH}" class="sky"/>
    <path d="${d}L${WW},${WH}L0,${WH}Z" class="ground"/><path d="${d}" class="hill"/>
    <g class="sunpic"><circle class="sun-dot" cx="0" cy="0" r="9"/></g>
    ${["N", "E", "S", "W", "N"].map((c, i) => `<text x="${Math.min(WW - 12, i * WW / 4 + 2)}" y="${WH + 15}" class="lab small">${c}</text>`).join("")}</svg>`;
}
const timers = new WeakMap<HTMLElement, number>();
function wireWatch(body: HTMLElement, watch: { n: number; sites: WatchSite[] }): void {
  const old = timers.get(body); if (old) { clearInterval(old); timers.delete(body); }
  const slider = body.querySelector<HTMLInputElement>("input.month"), btn = body.querySelector<HTMLButtonElement>("button.play"), when = body.querySelector("output.month-when");
  if (!slider || !btn || !when) return;
  const show = (i: number) => {
    when.textContent = `Day ${Math.floor(i / 24) + 1}`;
    for (const w of watch.sites) {
      const s = w.samples[i], fig = body.querySelector(`[data-watch="${w.siteId}"]`);
      if (!fig) continue;
      const dot = fig.querySelector<SVGCircleElement>("circle.sun-dot")!;
      dot.setAttribute("cx", wx(s.sunAz).toFixed(1)); dot.setAttribute("cy", wy(Math.max(ELO + 1, s.sunEl)).toFixed(1));
      dot.classList.toggle("hidden", !s.lit);
      fig.querySelector(".now-words")!.textContent = s.lit ? "The Sun is shining." : s.sunEl > 0 ? "A hill hides the Sun." : "It is night.";
    }
  };
  const stop = () => { const t = timers.get(body); if (t) clearInterval(t); timers.delete(body); btn.textContent = "▶ Play"; btn.setAttribute("aria-pressed", "false"); };
  const play = () => {
    if (Number(slider.value) >= watch.n - 1) slider.value = "0";
    btn.textContent = "❚❚ Pause"; btn.setAttribute("aria-pressed", "true");
    timers.set(body, window.setInterval(() => {
      if (!body.contains(slider)) { stop(); return; }
      const i = Math.min(watch.n - 1, Number(slider.value) + 3);
      slider.value = String(i); show(i);
      if (i >= watch.n - 1) stop();
    }, 40) as unknown as number);
  };
  btn.addEventListener("click", () => (timers.has(body) ? stop() : play()));
  slider.addEventListener("input", () => { stop(); show(Number(slider.value)); });
  show(0);
}

// ---- "Can you tell?" (2026-11-15): three questions answered from the live data for the chosen week ----
type Quiz = { siteName: string; qs: { q: string; options: string[]; correct: number; why: string }[]; teacherHtml: string };
const amountChoice = (p: number) => (p >= 95 ? 0 : p > 3 ? 1 : 2); // all week / some of the week / not this week (same cut-offs as kidAmount)
export function quizFor(current: Pick<PanelProps, "siteId" | "landingDate">): Quiz | null {
  let daily: { sites: Record<string, ({ pctLit: number; pctComms: number } | null)[]> };
  try { daily = (V as unknown as { getDaily(d: string, n: number): typeof daily }).getDaily(current.landingDate, 1); } catch { return null; }
  const me = daily.sites[current.siteId]?.[0];
  if (!me) return null;
  const site = V.listSites().find((x) => x.id === current.siteId)!;
  const otherId = current.siteId === "apollo11" ? "sp_malapert" : "apollo11";
  const other = V.listSites().find((x) => x.id === otherId)!, them = daily.sites[otherId]?.[0];
  const sun = amountChoice(me.pctLit), earth = amountChoice(me.pctComms);
  const sunWords = ["Yes, all week.", "Only some of the week.", "No, not this week."], earthWords = sunWords;
  const qs: Quiz["qs"] = [
    { q: `Will the lander at ${site.shortName} get sunshine all week?`, options: ["All week", "Some of the week", "Not at all"], correct: sun, why: sunWords[sun] },
    { q: `Can the lander at ${site.shortName} see Earth all week?`, options: ["All week", "Some of the week", "Not at all"], correct: earth, why: earthWords[earth] },
  ];
  if (them) {
    const d = me.pctLit - them.pctLit;
    const c = Math.abs(d) < 5 ? 2 : d > 0 ? 0 : 1;
    qs.push({ q: `Which place gets more sunshine this week?`, options: [site.shortName, other.shortName, "About the same"], correct: c,
      why: c === 2 ? "They get about the same." : `${c === 0 ? site.shortName : other.shortName} gets more.` });
  }
  const pc = (x: number) => `${x.toFixed(0)}%`;
  const teacherHtml = `<p>Answers come from the 7-day stay from ${esc(current.landingDate)} 00:00 UTC. ${esc(site.shortName)}: sunlight ${pc(me.pctLit)} of the hours, Earth in view ${pc(me.pctComms)}.${them ? ` ${esc(other.shortName)}: sunlight ${pc(them.pctLit)}.` : ""} “All week” means at least 95%, “not at all” 3% or less, and “about the same” within 5 percentage points. Positions from NASA JPL Horizons over NASA LOLA terrain.</p>`;
  return { siteName: site.shortName, qs, teacherHtml };
}
function wireQuiz(body: HTMLElement, quiz: Quiz | null): void {
  if (!quiz) return;
  body.querySelectorAll<HTMLButtonElement>("button[data-action=answer]").forEach((b) => b.addEventListener("click", () => {
    const q = quiz.qs[Number(b.dataset.q)], pick = Number(b.dataset.o), card = b.closest(".q-card")!;
    card.querySelectorAll("button").forEach((x) => x.classList.remove("picked", "right"));
    b.classList.add("picked");
    card.querySelector(`button[data-o="${q.correct}"]`)!.classList.add("right");
    card.querySelector(".answer")!.textContent = (pick === q.correct ? "Yes! " : "Not quite. ") + q.why;
  }));
}

const PHOTO_Q: Record<string, string> = {
  earthrise: "Why does Earth look like it is rising in this photo?",
  "south-pole": "Why might ice hide in the dark craters?",
  scientist: "Find Earth in the photo. Why does it look so small?",
  illumination: "Where on this map would you put a lander that needs power?",
  "lro-earthrise": "This spacecraft is moving. How does that make Earth seem to rise?",
};

export const mountLearn: MountPanel = (container, props) => {
  const { host, root } = createPanelRoot(container, "learn", CARD_CSS + KID_CSS + LEARN_CSS);
  const body = document.createElement("section");
  body.className = "card";
  root.append(body);
  let current: PanelProps = { ...props }, token = 0;
  const go = () => { const my = ++token; renderLearn(body, current, () => my === token); };
  go();
  return {
    update(next) {
      const changed = (next.siteId !== undefined && next.siteId !== current.siteId) || (next.landingDate !== undefined && next.landingDate !== current.landingDate);
      current = { ...current, ...next };
      if (changed) go();
    },
    destroy() { token++; host.remove(); },
  };
};

const list = (a: string[]) => (a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);
const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const words = (n: number) => ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"][n] ?? String(n);

function ridgeSvg(r: { sunEl: number; sunAz: number; horizon: number[]; lit: boolean }): string {
  // East half of the real skyline (azimuth 20..160), drawn tall so the ridge reads clearly.
  const a0 = 20, a1 = 160, W = 560, H = 200, lo = -6, hi = 12;
  const x = (a: number) => ((a - a0) / (a1 - a0)) * W, y = (e: number) => ((hi - e) / (hi - lo)) * H;
  let d = "";
  for (let a = a0; a <= a1; a++) d += `${a === a0 ? "M" : "L"}${x(a).toFixed(1)},${y(r.horizon[a % 360]).toFixed(1)}`;
  const sx = x(r.sunAz), sy = y(r.sunEl);
  return `<svg class="pic" viewBox="0 0 ${W} ${H}" role="img" aria-label="A real hill skyline with the Sun just above level but behind the hill.">
    <rect width="${W}" height="${H}" class="sky"/>
    <line x1="0" x2="${W}" y1="${y(0)}" y2="${y(0)}" class="level"/>
    <g class="sunpic hidden"><circle cx="${sx}" cy="${sy}" r="11"/></g>
    <path d="${d}L${W},${H}L0,${H}Z" class="ground"/><path d="${d}" class="hill"/>
    <text x="${sx > W / 2 ? sx - 16 : sx + 16}" y="${sy - 16}" class="lab" text-anchor="${sx > W / 2 ? "end" : "start"}">Sun (behind the hill)</text></svg>
    <p class="key"><span class="ki"><span class="k line"></span>The real hills</span><span class="ki"><span class="k level"></span>Where flat ground would be</span></p>`;
}
function skySvg(maxEl: number, name: string, where: string): string {
  const W = 260, H = 150, cx = W / 2, gy = 120, R = 100, k = (Math.max(0, maxEl) * Math.PI) / 180;
  const sx = cx + R * Math.cos(k), sy = gy - R * Math.sin(k); // drawn at the real angle; no number shown
  return `<figure class="sky-fig"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`${name}: the Sun's highest point in the sky`)}">
    <path d="M${cx - R},${gy} A${R},${R} 0 0 1 ${cx + R},${gy}" class="dome"/>
    <line x1="10" x2="${W - 10}" y1="${gy}" y2="${gy}" class="hill"/>
    <line x1="${cx}" x2="${sx}" y1="${gy}" y2="${sy}" class="ray"/>
    <g class="sunpic"><circle cx="${sx}" cy="${sy}" r="10"/></g>
    <rect x="${cx - 6}" y="${gy - 10}" width="12" height="10" class="lander"/></svg>
    <figcaption><strong>${esc(name)}</strong> ${esc(where)}</figcaption></figure>`;
}
function dayNightSvg(s: Sample[]): string {
  const W = 700, H = 46, bw = W / s.length;
  const bars = s.map((x, i) => (x.lit ? `<rect x="${(i * bw).toFixed(2)}" y="0" width="${(bw + 0.1).toFixed(2)}" height="${H}" class="sun"/>` : "")).join("");
  const weeks = Array.from({ length: Math.floor(s.length / 168) }, (_, k) => `<line x1="${((k + 1) * 168 * bw).toFixed(1)}" x2="${((k + 1) * 168 * bw).toFixed(1)}" y1="${H}" y2="${H + 6}" class="tick"/>`).join("");
  return `<svg class="pic" viewBox="0 0 ${W} ${H + 8}" role="img" aria-label="About four months at Apollo 11: long stretches of sunshine and long nights.">
    <rect width="${W}" height="${H}" class="night"/>${bars}${weeks}</svg>
    <p class="key"><span class="ki"><span class="k sun"></span>Sunshine</span><span class="ki"><span class="k night"></span>Night</span><span class="ki">Each tick: one week</span></p>`;
}
function earthSvg(s: Sample[]): string {
  const W = 560, H = 200, lo = -90, hi = 90;
  const x = (a: number) => (((a % 360) + 360) % 360) / 360 * W, y = (e: number) => ((hi - e) / (hi - lo)) * H;
  const sun = s.filter((_, i) => i % 6 === 0).map((p) => `<circle cx="${x(p.sunAz).toFixed(1)}" cy="${y(p.sunEl).toFixed(1)}" r="2.5" class="sundot"/>`).join("");
  const earth = s.filter((_, i) => i % 6 === 0).map((p) => `<circle cx="${x(p.earthAz).toFixed(1)}" cy="${y(p.earthEl).toFixed(1)}" r="3" class="earthdot"/>`).join("");
  const ex = x(s[0].earthAz), ey = y(s[0].earthEl);
  return `<svg class="pic" viewBox="0 0 ${W} ${H}" role="img" aria-label="Over a month, the Sun's dots spread across the whole sky, while Earth's dots stay in one small cluster.">
    <rect width="${W}" height="${y(0)}" class="sky"/><rect y="${y(0)}" width="${W}" height="${H - y(0)}" class="groundflat"/>
    ${sun}${earth}<text x="${ex < W / 2 ? ex + 14 : ex - 14}" y="${Math.max(18, ey + 5)}" class="lab" text-anchor="${ex < W / 2 ? "start" : "end"}">Earth</text>
    ${["N", "E", "S", "W"].map((c, i) => `<text x="${i * W / 4 + 4}" y="${H - 6}" class="lab small">${c}</text>`).join("")}</svg>
    <p class="key"><span class="ki"><span class="k sun dot"></span>The Sun, every 6 hours for a month</span><span class="ki"><span class="k earth dot"></span>Earth, same times</span></p>`;
}

export const CARD_CSS = `
.card { padding: var(--_pad); border: 0; border-radius: 14px; background: var(--_glass); backdrop-filter: blur(var(--_glass-blur)); -webkit-backdrop-filter: blur(var(--_glass-blur)); line-height: 1.5; }
h2 { margin: 0 0 4px; font-size: var(--_fs-lg); }
h3 { margin: 18px 0 6px; font-size: 1rem; }
`;
export const LEARN_CSS = `
.learn section { padding-top: 10px; border-top: 1px solid var(--_divider); margin-top: 12px; }
.learn h3 { border-top: 0; padding-top: 0; margin-top: 4px; } /* one divider per section (the section rule), not two */
.learn svg.pic, .learn .pair { max-width: 560px; }
.grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 22px; } /* full width, explainers two by two */
.grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.grid5 { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; } /* ten places five across; photos in one row */
.learn .ex { margin: 0; padding: 0; border: 0; }
.learn .ex .pic-col svg.pic, .learn .ex .pair { margin-left: auto; margin-right: auto; }
.learn .ex .words h3 { margin-top: 8px; }
.watch-ctl { display: flex; gap: 10px; align-items: center; margin: 6px 0 10px; max-width: 700px; }
.watch-ctl input { flex: 1; }
.watch-ctl .play { padding: 6px 14px; border: 1px solid var(--_accent); border-radius: 8px; background: var(--_accent); color: inherit; font-weight: 650; white-space: nowrap; }
.month-when { font-variant-numeric: tabular-nums; min-width: 4.5em; }
.sky-panel { margin: 0; } .sky-panel figcaption { margin-top: 4px; } .now-words { color: var(--_muted); margin-left: 6px; }
.sun-dot { fill: var(--_sun); stroke: #0b1322; stroke-width: 2; } .sun-dot.hidden { fill-opacity: .3; stroke-dasharray: 3 2; stroke: var(--_text); }
.q-card { padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,.05); }
.q-card .q { font-weight: 650; }
.opts { display: flex; flex-wrap: wrap; gap: 6px; }
.opts button { padding: 6px 10px; border: 1px solid var(--_border); border-radius: 8px; background: transparent; color: inherit; }
.opts button.picked { border-color: var(--_text); }
.opts button.right { background: var(--_accent); border-color: var(--_accent); }
.answer { min-height: 1.4em; font-weight: 650; }
.photo.card { margin: 0; } .photo.card img { width: 100%; height: auto; border-radius: 8px; display: block; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px; margin: 8px 0; max-width: 980px; }
.card { display: grid; gap: 4px; align-content: start; padding: 10px 12px; border-radius: 10px; background: rgba(255,255,255,.05); color: var(--_text); text-decoration: none; }
.card:hover, .card:focus-visible { background: rgba(255,255,255,.10); }
.card strong { display: flex; gap: 6px; align-items: center; }
.card .go { color: var(--_link); text-decoration: underline; font-size: .85rem; }
.small { font-size: var(--_fs-sm); }
.k.dot { width: 10px; height: 10px; border-radius: 50%; } .k.line { height: 3px; background: var(--_horizon); } .k.level { height: 0; border-top: 2px dashed var(--_muted); }
svg.pic { width: 100%; height: auto; display: block; margin: 6px 0; }
.pic .sky, .sky-fig .sky { fill: var(--_sky); }
.pic .level { stroke: var(--_muted); stroke-dasharray: 6 4; }
.pic .ground { fill: var(--_ground); } .pic .groundflat { fill: var(--_ground); }
.pic .hill, .sky-fig .hill { fill: none; stroke: var(--_horizon); stroke-width: 2.5; }
.sunpic circle { fill: var(--_sun); stroke: #0b1322; stroke-width: 2; }
.lab { fill: var(--_text); font-size: 14px; font-weight: 650; paint-order: stroke; stroke: #0b1322; stroke-width: 3px; }
.lab.small { font-size: 12px; font-weight: 500; fill: var(--_muted); }
.pair { display: flex; gap: 14px; flex-wrap: wrap; }
.sky-fig { margin: 0; flex: 1; min-width: 200px; }
.sky-fig svg { width: 100%; height: auto; }
.sky-fig .dome { fill: var(--_sky); stroke: rgba(255,255,255,.15); }
.sky-fig .ray { stroke: var(--_sun); stroke-dasharray: 4 3; stroke-width: 2; }
.sky-fig .lander { fill: var(--_text); }
.sky-fig figcaption { font-size: .9rem; }
.pic .night { fill: rgba(255,255,255,.06); } .pic .sun { fill: var(--_sun); } .pic .tick { stroke: var(--_muted); }
.sundot { fill: var(--_sun); opacity: .8; } .earthdot { fill: var(--_earth); }
.photos { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; }
.photo { margin: 0; } .photo img { width: 100%; height: auto; border-radius: 10px; display: block; }
.photo .credit { font-size: .78rem; color: var(--_muted); }
.photo a { color: var(--_link); }
.mine .rings { margin: 6px 0; }
`;
