// Shared JPL Horizons query for a lunar-surface observer (used by fetch_horizons.mjs and
// fetch_handcheck_fixture.mjs). Settings and their doc sources: data/README.md.
const API = "https://ssd.jpl.nasa.gov/api/horizons.api";
export const ALT_KM = 0; // UNVERIFIED site heights: all sites at 0 km above the 1737.4 km reference sphere.
const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
export const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const hz = (ms) => new Date(ms).toISOString().slice(0, 16).replace("T", " "); // "YYYY-MM-DD HH:MM"

function toIso(t) {
  const m = t.trim().match(/^(\d{4})-([A-Za-z]{3})-(\d{2}) (\d{2}):(\d{2})$/);
  if (!m) throw new Error(`Unparsed time: ${t}`);
  return `${m[1]}-${String(MONTHS[m[2]]).padStart(2, "0")}-${m[3]}T${m[4]}:${m[5]}:00Z`;
}

// site: { id, lat, lon }; target '10' (Sun) or '399' (Earth); start/stop in ms (UTC, on the hour).
export async function query(site, target, startMs, stopMs) {
  const params = {
    format: "json", COMMAND: `'${target}'`, OBJ_DATA: "NO", MAKE_EPHEM: "YES",
    EPHEM_TYPE: "OBSERVER", CENTER: "'coord@301'", COORD_TYPE: "GEODETIC",
    SITE_COORD: `'${site.lon},${site.lat},${ALT_KM}'`,
    START_TIME: `'${hz(startMs)}'`, STOP_TIME: `'${hz(stopMs)}'`, STEP_SIZE: "'1 h'",
    QUANTITIES: "'4'", CSV_FORMAT: "YES",
  };
  let body;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${API}?${new URLSearchParams(params)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      body = await res.json();
      break;
    } catch (e) {
      if (attempt >= 3) throw new Error(`${site.id}/${target}: ${e.message}`);
      await pause(5000 * attempt);
    }
  }
  if (body.error) throw new Error(`Horizons error for ${site.id}/${target}: ${body.error}`);
  const text = body.result;
  const need = ["{East-longitude positive}", "Atmos refraction: NO (AIRLESS)", "Date__(UT)__HR:MN", "Azi_(a-app), Elev_(a-app)"];
  for (const n of need) if (!text.includes(n)) throw new Error(`Header check failed (${n}) for ${site.id}/${target}`);
  if (!/Center pole\/equ\s*:\s*MEAN_ME \(high precision\)/.test(text)) throw new Error(`Not the high-precision MEAN_ME frame for ${site.id}/${target}`);

  const block = text.split("$$SOE")[1]?.split("$$EOE")[0];
  if (!block) throw new Error(`No $$SOE block for ${site.id}/${target}`);
  const rows = block.trim().split("\n").map((line) => {
    const c = line.split(",");
    return { utc: toIso(c[0]), az: Number(c[3]), el: Number(c[4]) };
  });
  rows.forEach((r, i) => {
    if (!Number.isFinite(r.az) || !Number.isFinite(r.el)) throw new Error(`Bad number in ${site.id}/${target} at ${r.utc}`);
    if (Date.parse(r.utc) !== startMs + i * 3600e3) throw new Error(`Gap/step error in ${site.id}/${target} at ${r.utc}`);
  });
  if (Date.parse(rows.at(-1).utc) !== stopMs) throw new Error(`Short table for ${site.id}/${target}`);
  const header = text.split("\n")
    .filter((l) => /^(Center geodetic|Center pole\/equ|Center radii|Atmos refraction|EOP file|EOP coverage)/.test(l))
    .map((l) => l.trim());
  return { rows, header, version: body.signature?.version };
}

