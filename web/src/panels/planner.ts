// D28 planner panel: saved A/B scenario comparison and a mission requirements filter. Lane A owns this file.
// Numbers and the plain-words differences come from /lib (compareScenarios, checkRequirements).
import { V } from "./data";
import { createPanelRoot, esc } from "./shared";
import type { MountPanel, PanelProps } from "./types";

type Any = any; // eslint-disable-line @typescript-eslint/no-explicit-any
const L = V as unknown as Record<string, Any>;
type Scenario = { siteId: string; landingDate: string };
type SavedPair = { a: Scenario; b: Scenario; savedUtc: string };
const STORE_KEY = "llp-saved-scenarios-v1";

// Saved pairs live in this browser only (per-viewer convenience); every access is guarded.
function readSaved(): SavedPair[] { try { const v = JSON.parse(localStorage.getItem(STORE_KEY) ?? "[]"); return Array.isArray(v) ? v : []; } catch { return []; } }
function writeSaved(v: SavedPair[]) { try { localStorage.setItem(STORE_KEY, JSON.stringify(v)); } catch { /* storage unavailable: keep in memory only */ } }

export const mountPlanner: MountPanel = (container, props) => {
  const { host, root } = createPanelRoot(container, "planner", CSS);
  const body = document.createElement("section");
  body.className = "card";
  root.append(body);
  let current: PanelProps = { ...props };
  let token = 0;
  let A: Scenario = { siteId: props.siteId, landingDate: props.landingDate };
  let B: Scenario = { siteId: V.listSites().find((s) => s.id !== props.siteId)!.id, landingDate: props.landingDate };
  let saved: SavedPair[] = readSaved();
  const REQ = L.REQUIREMENTS as Record<string, { label: string; unit: string; kind: "max" | "min" }>;
  // Starting limits are examples for the user to change, not recommendations.
  const req: Record<string, { on: boolean; value: number }> = {
    maxDarkHours: { on: true, value: 48 }, maxGapHours: { on: true, value: 24 }, minSunPct: { on: true, value: 50 },
    minEarthPct: { on: false, value: 80 }, maxSlopeDeg: { on: false, value: 10 },
  };
  let reqFilter: "all" | "candidate" | "historic" = "all";

  body.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!t) return;
    const a = t.dataset.action;
    if (a === "use-a") { A = { siteId: current.siteId, landingDate: current.landingDate }; paintScenarioInputs(); renderCompare(); }
    else if (a === "use-b") { B = { siteId: current.siteId, landingDate: current.landingDate }; paintScenarioInputs(); renderCompare(); }
    else if (a === "swap") { [A, B] = [B, A]; paintScenarioInputs(); renderCompare(); }
    else if (a === "save") { saved = [{ a: { ...A }, b: { ...B }, savedUtc: new Date().toISOString() }, ...saved].slice(0, 20); writeSaved(saved); paintSaved(); }
    else if (a === "load") { const p = saved[Number(t.dataset.i)]; if (p) { A = { ...p.a }; B = { ...p.b }; paintScenarioInputs(); renderCompare(); } }
    else if (a === "delete") { saved.splice(Number(t.dataset.i), 1); writeSaved(saved); paintSaved(); }
    else if (a === "download-saved") downloadSaved();
    else if (a === "site" && t.dataset.site) current.onSiteSelected(t.dataset.site);
  });
  body.addEventListener("input", (e) => {
    const t = e.target as HTMLInputElement | HTMLSelectElement;
    const d = t.dataset;
    if (d.scen) {
      const target = d.scen === "a" ? A : B;
      if (d.field === "siteId") target.siteId = t.value; else if (t.value) target.landingDate = t.value;
      renderCompare();
    } else if (d.req) {
      if (d.part === "on") req[d.req].on = (t as HTMLInputElement).checked; else req[d.req].value = Number(t.value);
      renderRequirements();
    } else if (d.action === "req-filter") { reqFilter = t.value as typeof reqFilter; renderRequirements(); }
  });

  function paint() {
    const opts = (sel: string) => V.listSites().map((s) => `<option value="${s.id}"${s.id === sel ? " selected" : ""}>${esc(s.name)}${s.category === "historic" ? " (past landing)" : ""}</option>`).join("");
    body.innerHTML = `
      <h2>Compare two scenarios (A/B)</h2>
      <p class="muted small">Each scenario is a site and a landing date (a 7-day stay from 00:00 UTC). Differences are listed in plain words.</p>
      <div class="scen">
        ${(["a", "b"] as const).map((k) => `<fieldset><legend>${k.toUpperCase()}</legend>
          <label>Site <select data-scen="${k}" data-field="siteId">${opts((k === "a" ? A : B).siteId)}</select></label>
          <label>Landing date (UTC) <input type="date" data-scen="${k}" data-field="landingDate" value="${(k === "a" ? A : B).landingDate}"/></label>
          <button type="button" data-action="use-${k}">Use current selection</button></fieldset>`).join("")}
      </div>
      <div class="row"><button type="button" data-action="swap">Swap A and B</button><button type="button" data-action="save">Save this pair</button></div>
      <div class="compare-out" aria-live="polite"></div>
      <h3>Saved pairs <span class="muted small">(kept in this browser only)</span></h3>
      <div class="saved"></div>
      <h2>Mission requirements</h2>
      <p class="muted small">Set your limits. Every site is tested for a 7-day stay from ${esc(current.landingDate)}; failing limits are named. The starting numbers are examples to change, not recommendations.</p>
      <div class="reqs">${Object.entries(REQ).map(([k, q]) => `<label class="req"><input type="checkbox" data-req="${k}" data-part="on"${req[k].on ? " checked" : ""}/>
        <span>${esc(q.label)} ${q.kind === "max" ? "at most" : "at least"}</span>
        <input type="number" step="1" min="0" data-req="${k}" data-part="value" value="${req[k].value}"/> <span>${q.unit}</span></label>`).join("")}</div>
      <label class="filter">Sites <select data-action="req-filter"><option value="all">All sites</option><option value="candidate">Candidate sites</option><option value="historic">Historic landings (comparisons)</option></select></label>
      <div class="req-out" aria-live="polite"></div>`;
    (body.querySelector("select[data-action=req-filter]") as HTMLSelectElement).value = reqFilter;
    paintSaved();
  }
  function paintScenarioInputs() {
    for (const k of ["a", "b"] as const) {
      const s = k === "a" ? A : B;
      (body.querySelector(`select[data-scen=${k}]`) as HTMLSelectElement).value = s.siteId;
      (body.querySelector(`input[data-scen=${k}]`) as HTMLInputElement).value = s.landingDate;
    }
  }
  function paintSaved() {
    const box = body.querySelector(".saved");
    if (!box) return;
    const nm = (id: string) => V.listSites().find((s) => s.id === id)?.name ?? id;
    box.innerHTML = saved.length
      ? `<ul>${saved.map((p, i) => `<li>A: ${esc(nm(p.a.siteId))}, ${p.a.landingDate} · B: ${esc(nm(p.b.siteId))}, ${p.b.landingDate}
          <button type="button" data-action="load" data-i="${i}">Load</button> <button type="button" data-action="delete" data-i="${i}" aria-label="Delete saved pair ${i + 1}">Delete</button></li>`).join("")}</ul>
         <button type="button" data-action="download-saved">Download saved pairs (JSON)</button>`
      : `<p class="muted small">None yet. Use "Save this pair".</p>`;
  }

  async function renderCompare() {
    const my = ++token, out = body.querySelector(".compare-out");
    if (!out) return;
    out.innerHTML = `<p class="muted small">Comparing…</p>`;
    try { await Promise.all([V.loadSite(A.siteId), V.loadSite(B.siteId), V.loadDaily()]); } catch (err) { out.innerHTML = `<p class="warn">${esc((err as Error).message)}</p>`; return; }
    if (my !== token) return;
    try {
      const c = L.compareScenarios(A, B);
      const f = (v: number | null, d = 0) => (v === null ? "–" : v.toFixed(d));
      const verdict = (v: string) => (v === "edge" ? "On the edge" : v[0].toUpperCase() + v.slice(1));
      const row = (name: string, va: string, vb: string) => `<tr><th>${esc(name)}</th><td>${esc(va)}</td><td>${esc(vb)}</td></tr>`;
      out.innerHTML = `<table><thead><tr><th></th><th>A: ${esc(c.a.name)}, ${c.a.landingDate}</th><th>B: ${esc(c.b.name)}, ${c.b.landingDate}</th></tr></thead><tbody>
        ${row("Verdict", verdict(c.a.verdict), verdict(c.b.verdict))}
        ${row("Sun and Earth score (prototype)", f(c.a.score, 1), f(c.b.score, 1))}
        ${row("Sunlight share", f(c.a.pctLit) + "%", f(c.b.pctLit) + "%")}
        ${row("Earth-in-view share", f(c.a.pctComms) + "%", f(c.b.pctComms) + "%")}
        ${row("Longest blackout", c.a.longestDarkHours + " h", c.b.longestDarkHours + " h")}
        ${row("Longest gap without Earth", c.a.longestContactGapHours + " h", c.b.longestContactGapHours + " h")}
        ${row("Lunar-eclipse hours", c.a.eclipseHours + " h", c.b.eclipseHours + " h")}
        ${row("Local slope over 100 m", f(c.a.slopeDeg, 1) + "°", f(c.b.slopeDeg, 1) + "°")}
      </tbody></table>
      <h3>Differences in plain words</h3>
      <ul class="diff">${c.differences.map((d: string) => `<li>${esc(d)}</li>`).join("")}</ul>
      <p><strong>${esc(c.overall)}</strong></p>${c.notes.map((n: string) => `<p class="muted small">${esc(n)}</p>`).join("")}`;
    } catch (err) {
      const msg = (err as Error).message;
      out.innerHTML = `<p class="warn">${/OUT_OF_COVERAGE/.test(msg) ? "One of the scenarios has no data for a 7-day stay from that date (data cover 2026–2029 and 30 days around each past landing)." : esc(msg)}</p>`;
    }
  }

  async function renderRequirements() {
    const out = body.querySelector(".req-out");
    if (!out) return;
    try { await V.loadDaily(); } catch (err) { out.innerHTML = `<p class="warn">${esc((err as Error).message)}</p>`; return; }
    const limits: Record<string, number> = {};
    for (const [k, v] of Object.entries(req)) if (v.on && Number.isFinite(v.value)) limits[k] = v.value;
    const r = L.checkRequirements(current.landingDate, limits, reqFilter);
    out.innerHTML = `<p class="small"><strong>${r.passCount} of ${r.results.length}</strong> sites meet ${Object.keys(limits).length ? "every limit you set" : "your limits (none set: every site passes)"} for a stay from ${esc(current.landingDate)}.</p>
      <ul class="reqlist">${r.results.map((x: Any) => `<li class="${x.pass ? "pass" : "fail"}"><span class="mark" aria-hidden="true">${x.pass ? "✓" : "✕"}</span>
        <strong>${x.pass ? "PASS" : x.available ? "FAIL" : "NO DATA"}</strong>
        <button type="button" data-action="site" data-site="${x.siteId}">${esc(x.name)}</button>${x.category === "historic" ? ' <span class="muted small">(past landing, comparison)</span>' : ""}
        <div class="small">${esc(x.words)}</div></li>`).join("")}</ul>`;
  }

  function downloadSaved() {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ app: "Lunar Landing Site Navigator", savedPairs: saved }, null, 1)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = "saved-scenarios.json"; root.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  paint();
  renderCompare();
  renderRequirements();
  return {
    update(next) {
      const dateChanged = next.landingDate !== undefined && next.landingDate !== current.landingDate;
      current = { ...current, ...next };
      if (dateChanged) { paint(); renderRequirements(); renderCompare(); }
    },
    destroy() { token++; host.remove(); },
  };
};

const CSS = `
.card { padding: 18px 20px; border: 1px solid var(--llp-border, #344b69); border-radius: 14px; background: var(--llp-bg, #132138); line-height: 1.45; }
h2 { margin: 0 0 4px; font-size: 1.15rem; }
h2:not(:first-child) { margin-top: 22px; border-top: 1px solid var(--llp-border, #344b69); padding-top: 14px; }
h3 { margin: 14px 0 4px; font-size: .95rem; }
p { margin: 6px 0; }
.small { font-size: .82rem; }
.scen { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
fieldset { border: 1px solid var(--llp-border, #344b69); border-radius: 10px; padding: 8px 10px; display: grid; gap: 6px; font-size: .85rem; }
legend { font-weight: 700; padding: 0 4px; }
label { display: grid; gap: 3px; color: var(--llp-muted, #a8bbd3); }
select, input { font: inherit; padding: 4px 6px; border-radius: 6px; border: 1px solid var(--llp-border, #344b69); background: transparent; color: var(--llp-text, #ecf2ff); }
button { padding: 4px 10px; border: 1px solid var(--llp-border, #344b69); border-radius: 8px; background: transparent; color: inherit; font-size: .82rem; }
.row { display: flex; gap: 8px; margin: 8px 0; }
table { width: 100%; border-collapse: collapse; font-size: .84rem; font-variant-numeric: tabular-nums; margin: 6px 0; }
th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid var(--llp-border, #344b69); }
tbody th { color: var(--llp-muted, #a8bbd3); font-weight: 500; }
ul { padding-left: 18px; margin: 4px 0; }
.reqs { display: grid; gap: 6px; font-size: .85rem; margin: 6px 0; }
.req { display: grid; grid-template-columns: auto 1fr 80px 24px; gap: 8px; align-items: center; color: var(--llp-text, #ecf2ff); }
.filter { display: inline-grid; margin: 4px 0; font-size: .85rem; }
.reqlist { list-style: none; padding: 0; }
.reqlist li { padding: 6px 8px; border-left: 4px solid; margin: 4px 0; border-radius: 4px; }
.reqlist li.pass { border-color: var(--llp-clear, #4fbf7a); }
.reqlist li.fail { border-color: var(--llp-out, #e06a5f); border-left-style: dashed; }
.reqlist .mark { font-weight: 700; margin-right: 4px; }
.reqlist button { border: 0; padding: 0; text-decoration: underline; font-size: .9rem; }
`;
