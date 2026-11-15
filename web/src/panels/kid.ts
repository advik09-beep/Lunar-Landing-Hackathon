// D32 Educator helpers: words a seven-year-old understands, pictures first, one short sentence at a time,
// no degrees. Fuller explanations for adults go in a small "For the teacher" fold-out.
// Lane A owns this file. Every picture is drawn from /lib numbers; nothing is calculated here.
import type { Verdict, Sample, State } from "./data";
import { esc } from "./shared";

/** One plain sentence per verdict (the symbol stays, so it is never colour alone). */
export const KID_VERDICT: Record<Verdict, { label: string; sentence: string }> = {
  clear: { label: "Great week", sentence: "Great week: the lander has sunshine and can see Earth almost all the time." },
  partial: { label: "Okay week", sentence: "Okay week: sometimes the lander has sunshine and Earth together, sometimes not." },
  out: { label: "Hard week", sentence: "Hard week: the lander almost never has sunshine and Earth together." },
  edge: { label: "Tricky week", sentence: "Tricky week: the Sun or Earth is only just peeking over the hills." },
};

/** How much of the week, in words (no numbers). */
export function kidAmount(pct: number): string {
  if (pct >= 95) return "all week";
  if (pct >= 70) return "most of the week";
  if (pct >= 35) return "about half the week";
  if (pct > 3) return "a little of the week";
  return "not this week";
}

export const kidDate = (d: string): string =>
  new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export const kidCategory = (c: "candidate" | "historic"): string =>
  c === "historic" ? "A lander really landed here." : "A place picked as a possible landing spot.";

/** "For the teacher" fold-out: a fuller explanation plus one question for the class. */
export function teacher(html: string, question: string): string {
  return `<details class="teacher"><summary>For the teacher</summary>${html}<p class="q"><strong>Ask the class:</strong> ${esc(question)}</p></details>`;
}

/** Ring picture: how much of the week the Sun (gold) or Earth (blue) is there. */
export function ring(pct: number, kind: "sun" | "earth", title: string): string {
  const r = 30, c = 2 * Math.PI * r, f = Math.max(0, Math.min(100, pct)) / 100;
  const words = kidAmount(pct);
  const icon = kind === "sun"
    ? `<circle cx="40" cy="40" r="9" class="ic-sun"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const k = Math.PI / 180 * a; return `<line x1="${40 + 12 * Math.cos(k)}" y1="${40 + 12 * Math.sin(k)}" x2="${40 + 16 * Math.cos(k)}" y2="${40 + 16 * Math.sin(k)}" class="ic-ray"/>`; }).join("")}`
    : `<circle cx="40" cy="40" r="12" class="ic-earth"/><path d="M33 36q4-5 9-1t6 6M31 44q5 2 8 6" class="ic-land"/>`;
  return `<figure class="ring ${kind}" data-ring="${kind}" data-pct="${pct.toFixed(1)}" role="img" aria-label="${esc(`${title}: ${words}`)}">
    <svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="${r}" class="track"/>
      <circle cx="40" cy="40" r="${r}" class="fill" stroke-dasharray="${(f * c).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 40 40)"/>${icon}</svg>
    <figcaption><strong>${esc(title)}</strong><span>${esc(words)}</span></figcaption></figure>`;
}

/** The week as a strip: one column per day, gold top = sunshine, blue bottom = Earth in sight, dark = neither. */
export function weekStrip(samples: Sample[], hour: number): string {
  const n = samples.length, W = 700, Hh = 60, bw = W / n, days = Math.round(n / 24);
  const rects = samples.map((s, i) => {
    const x = (i * bw).toFixed(2), w = (bw + 0.1).toFixed(2);
    return (s.lit ? `<rect x="${x}" y="0" width="${w}" height="${Hh / 2 - 1}" class="sun"/>` : "") +
      (s.comms ? `<rect x="${x}" y="${Hh / 2 + 1}" width="${w}" height="${Hh / 2 - 1}" class="earth"/>` : "");
  }).join("");
  const lines = Array.from({ length: days - 1 }, (_, k) => `<line x1="${((k + 1) * 24 * bw).toFixed(1)}" x2="${((k + 1) * 24 * bw).toFixed(1)}" y1="0" y2="${Hh}" class="dayline"/>`).join("");
  const labels = Array.from({ length: days }, (_, k) => `<text x="${((k + 0.5) * 24 * bw).toFixed(1)}" y="${Hh + 16}" text-anchor="middle">Day ${k + 1}</text>`).join("");
  const cx = ((hour + 0.5) * bw).toFixed(1);
  const sunDays = new Set(samples.flatMap((s, i) => (s.lit ? [Math.floor(i / 24)] : []))).size;
  return `<svg class="week" viewBox="0 0 ${W} ${Hh + 20}" role="img" aria-label="${esc(`The week, day by day: sunshine on ${sunDays} of ${days} days.`)}">
    <rect x="0" y="0" width="${W}" height="${Hh}" class="night"/>${rects}${lines}
    <line x1="${cx}" x2="${cx}" y1="0" y2="${Hh}" class="now"/>${labels}</svg>
    <p class="key"><span class="ki"><span class="k sun"></span>Sunshine</span><span class="ki"><span class="k earth"></span>Earth in sight</span><span class="ki"><span class="k night"></span>Neither</span><span class="ki"><span class="k now"></span>Now</span></p>`;
}

/** Now, in words: the Sun. */
export function kidSun(st: Pick<State, "lit" | "sunEl" | "sunFraction" | "eclipseFraction" | "sunSkylineFraction">): string {
  if (st.eclipseFraction > 0 && st.sunSkylineFraction > 0) return "Earth is blocking the Sun. This is called an eclipse.";
  if (st.sunFraction > 0 && st.sunFraction < 1) return st.lit ? "Most of the Sun peeks over a hill." : "Only a bit of the Sun peeks over a hill.";
  if (st.lit) return "The Sun is shining here.";
  if (st.sunEl > 0) return "The Sun is up, but a hill is hiding it.";
  return "It is night here. The Sun has set.";
}
/** Now, in words: Earth. */
export function kidEarth(st: Pick<State, "comms" | "earthEl" | "earthMarginal">): string {
  if (st.earthMarginal) return "Earth is half hidden behind a hill.";
  if (st.comms) return "The lander can see Earth.";
  if (st.earthEl > 0) return "Earth is up, but a hill is hiding it.";
  return "Earth is below the edge of the sky.";
}

export const KID_CSS = `
h2, h3, h4 { font-family: var(--llp-heading-font, inherit); }
.kid p { margin: 6px 0; }
.kid .lead { font-size: 1.05rem; }
.rings { display: flex; gap: 18px; flex-wrap: wrap; margin: 10px 0; }
.ring { display: flex; align-items: center; gap: 10px; margin: 0; }
.ring svg { width: 72px; height: 72px; }
.ring .track { fill: none; stroke: rgba(255,255,255,.10); stroke-width: 9; }
.ring.sun .fill { fill: none; stroke: var(--_sun); stroke-width: 9; stroke-linecap: round; }
.ring.earth .fill { fill: none; stroke: var(--_earth); stroke-width: 9; stroke-linecap: round; }
.ring figcaption { display: grid; font-size: .95rem; }
.ring figcaption span { color: var(--_muted); white-space: nowrap; }
.ring figcaption strong { white-space: nowrap; }
.ic-sun { fill: var(--_sun); } .ic-ray { stroke: var(--_sun); stroke-width: 2.5; stroke-linecap: round; }
.ic-earth { fill: var(--_earth); } .ic-land { fill: none; stroke: #0A0A0B; stroke-width: 2.5; stroke-linecap: round; }
svg.week { width: 100%; height: auto; display: block; margin-top: 6px; }
.week .night { fill: rgba(255,255,255,.05); }
.week .sun { fill: var(--_sun); } .week .earth { fill: var(--_earth); }
.week .dayline { stroke: var(--_bg); stroke-width: 2; }
.week .now { stroke: var(--_text); stroke-width: 2; stroke-dasharray: 4 2; }
.week text { fill: var(--_muted); font-size: 12px; }
.key { display: flex; flex-wrap: wrap; gap: 4px 14px; align-items: center; font-size: .82rem; color: var(--_muted); }
.ki { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
svg.week { max-width: 700px; }
.k { display: inline-block; width: 14px; height: 10px; border-radius: 2px; vertical-align: middle; }
.k.sun { background: var(--_sun); } .k.earth { background: var(--_earth); } .k.night { background: rgba(255,255,255,.12); }
.k.now { width: 2px; height: 12px; background: var(--_text); }
.teacher { margin: 8px 0; font-size: .85rem; border-left: 3px solid var(--_divider); padding-left: 10px; }
.teacher summary { cursor: pointer; color: var(--_link); text-decoration: underline; }
.teacher p, .teacher ul { margin: 6px 0; }
.teacher .q { color: var(--_text); }
`;
