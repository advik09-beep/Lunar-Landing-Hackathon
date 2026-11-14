# /data — what is here and how it was made (Lane A)

Every setting below was confirmed in the JPL Horizons documentation or in the
header of our own Horizons output, on 2026-11-14. Sources:
- API doc: https://ssd-api.jpl.nasa.gov/doc/horizons.html
- Manual: https://ssd.jpl.nasa.gov/horizons/manual.html
- Available spans: https://ssd.jpl.nasa.gov/horizons/time_spans.html

## Files
| Path | What |
|---|---|
| `sites.js` | The 10 sites: id, name, lat, lon, kind, landing date, source, notes. |
| `ephem/<siteId>/<YYYY>.json` | Hourly Sun and Earth azimuth/elevation for calendar years 2026, 2027, 2028, 2029 (00:00 Jan 1 to 23:00 Dec 31 UTC). |
| `ephem/<siteId>/landing.json` | Same quantities, landing day 00:00 UTC −15 days to +15 days (inclusive, 721 rows). Only for landings before 2026: apollo11, apollo12, apollo17, chandrayaan3, im1, im2. |
| `ephem/index.json` | Every chunk file with its first and last UTC time and row count. |
| `ephem/sp_malapert/horizon.json` | Terrain horizon (step 7) for sp_malapert only: 360 elevation angles (deg), bin i = azimuth [i−0.5, i+0.5) clockwise from north, plus blocking distance, observer, method and source. Built by `node scripts/compute_horizon.mjs` from LOLA DEMs fetched by `node scripts/fetch_lola.mjs` into `data/raw/` (gitignored, ~485 MB). Checked by `node scripts/check_horizon.mjs`. Listed in `ephem/index.json` under `horizons`. |
| `daily.json` | Per-day stay summary for all sites (built by `node scripts/build_daily.mjs`). For every UTC date D whose 7-day stay (D 00:00Z, 168 hourly samples) is fully covered: `[litH, commsH, bothH, sunEdgeH, earthEdgeH, longestDarkH, verdict]`, grouped per site in contiguous segments `{ firstDate, rows }`. Margins use the terrain horizon where one exists (sp_malapert), else flat; edge = \|margin\| ≤ EDGE_DEG (2°). Rule constants are in the file header and in `lib/verdict.js`. ~410 KB, 14,694 rows. |

Each chunk file holds: `siteId, lat, lon, altKm, start, end, stepHours (1), count, decimals (3), timeScale ("UTC"), source, apiVersion, fetchedUtc, horizonsHeader` (lines copied from the Horizons output) and four arrays `sunAz, sunEl, earthAz, earthEl`. Row `i` is at `start + i hours`.

Made by `node scripts/fetch_horizons.mjs` and checked by `node scripts/check_ephem.mjs`.

## Horizons query (one request = one site × one target × one chunk)
| Setting | Value | Confirmed by |
|---|---|---|
| Endpoint | `https://ssd.jpl.nasa.gov/api/horizons.api`, `format=json`; table text in the JSON `result` field | API doc |
| `EPHEM_TYPE` | `OBSERVER` | API doc |
| `CENTER` | `'coord@301'` (user coordinates on the Moon, body 301) | API doc ("coord" uses `SITE_COORD`/`COORD_TYPE`); manual (`site @ body`) |
| `COORD_TYPE` | `GEODETIC` | API doc |
| `SITE_COORD` | `'E-lon,lat,alt'`: degrees, degrees, km | Manual: "E-long … (DEGREES)", "lat … (DEGREES)", "h - Altitude … (km)" |
| `COMMAND` | `'10'` Sun, `'399'` Earth | Manual: "`10` and `sun` refer to the center of the Sun", "`399` is the Earth's center" |
| `QUANTITIES` | `'4'` apparent azimuth and elevation | Manual / output footer |
| `APPARENT` | not sent; default is airless | Output header: `Atmos refraction: NO (AIRLESS)` |
| `START_TIME` / `STOP_TIME` | `'YYYY-MM-DD HH:MM'`, read as UT | Manual: observer tables default to UT |
| `STEP_SIZE` | `'1 h'` | API doc (`integer {units}`) |
| `CSV_FORMAT` | `YES`; data between `$$SOE` and `$$EOE` | API doc; manual |
| Limits | The docs state no output-line limit for observer tables and no API rate limit. We still keep each request to ≤ 8784 rows (one calendar year), send one request at a time, and pause 1.5 s between requests. | API doc, manual |

## Conventions (the M1/step 2 write-down)
- **Longitude sign: east-positive.** Output header: `Center pole/equ : MEAN_ME (high precision) {East-longitude positive}`. Manual: "+ east-longitude (prograde exceptions): Sun (10), Earth (399), Moon (301)". `sites.js` uses east-positive −180..180. Checked in the data: Earth is to the west at Apollo 11 (23.5°E) and to the east at Apollo 12 (23.4°W).
- **Frame:** Moon-fixed `MEAN_ME (high precision)` (that is the label printed in our header). The manual says the high-precision lunar rotation model covers A.D. 1550–2650, so both the Apollo windows and 2026–2029 are inside it. The script stops if any output header does not say `MEAN_ME (high precision)`.
- **Reference surface:** sphere, `Center radii : 1737.4, 1737.4, 1737.4 km`. All sites use altitude 0 km. **UNVERIFIED:** real site heights are not used. Elevation is measured from the plane perpendicular to the local zenith ("TOPOCENTRIC ONLY"), i.e. a flat horizon with no terrain.
- **Azimuth direction:** clockwise from north. Output footer: "Azimuth is measured clockwise from north: North(0) -> East(90) -> South(180) -> West(270)".
- **Angles:** degrees (manual, quantity 4: "Units: DEGREES"). Stored rounded to 3 decimals, so the maximum rounding error is 0.0005°.
- **Corrections:** "Airless apparent azimuth and elevation of target center. Compensated for light-time, the gravitational deflection of light, stellar aberration, precession and nutation" (output footer). No refraction (the Moon has no atmosphere). Sun and Earth are treated as points (their centres); disc size is ignored.
- **Time: UTC.** Column `Date__(UT)__HR:MN`. Manual: "After 1962, UT means UTC". API doc: "Times AFTER 1962 are in UTC". All our dates are after 1962. Times are stored as ISO 8601 with `Z`.
- **Sampling:** hourly on the hour. No interpolation. Any sunrise/sunset/Earthrise/Earthset time we derive is accurate to the hour only.

## Earth-orientation (EOP) file and dates after 2027-02-08 — resolved
Our header says `EOP file : eop.261113.p270209` and `EOP coverage : DATA-BASED 1962-JAN-20 TO 2026-NOV-13. PREDICTS-> 2027-FEB-08`.
What the docs say:
- EOP is used to get "UT1-UTC, polar motion, and nutation correction parameters necessary to determine the rotation between the Earth-fixed reference frame (ITRF93) to the inertial reference frame (ICRF)" (manual). The manual does not list it as an input for a site on the Moon.
- Time tags "refer to the time-scale conversion from TDB on Earth regardless of observer location" (manual). So the only way EOP reaches our data is through the UTC labels.
- "For future times outside the available EOP data-fit or prediction intervals, Horizons uses the last predicted values available in the EOP file as constants" (manual). "Future UTC leap-seconds are not known yet, so the closest known leap-second correction is used over future time-spans" (manual).

What it means for us (our own calculation, not a doc statement): after 2027-02-08 a UTC time could be off by at most about one second, if a leap second is added that Horizons doesn't know about yet. The Sun moves about 360° per 29.5 days across the lunar sky, about 0.00014° per second of time. So the angle error is about 0.0002° at most, far below our 0.1° tolerance and below the 0.0005° storage rounding. **No action needed; the data is usable through 2029.**

## Checks run (2026-11-14)
- **Hand-checks:** 7 of 7 values from the Horizons web app (Sheldon) match our first 7-day files to six decimals. The six planned rows are apollo11 2026-11-14 12:00, im1 2026-11-17 08:00 and sp_malapert 2026-11-20 06:00, each Sun and Earth. The seventh is sp_malapert Sun 2026-11-17 08:00.
- **Regression:** `scripts/check_ephem.mjs` re-reads the same 7 rows from the widened files: 7/7 within 0.0005° (max difference 0.000431°, which is the 3-decimal rounding). PASS.
- **Apollo 11 landing:** at the landing hour (1969-07-20 20:00 UTC) the Sun is at azimuth 88.804°, elevation 10.553°: low in the east.
- **Earth:** high (> 30°) at the Apollo sites, within 10° of the horizon at the four south-pole sites.

## Known limits
- Site altitudes are not used (0 km on a 1737.4 km sphere).
- Flat horizon only. Terrain is step 7.
- The frame used by most site-coordinate sources is not stated (see the STATUS.md Lane A source log). The four south-pole sites are representative points of ~15 km regions, not landing points.
- The Chandrayaan-3 landing time is a secondary source and approximate; the IM-2 time is minute-precision only.

## Terrain horizon (step 7, sp_malapert only)
- **Observer point (D10, 2026-11-14):** highest ground within 1 km of the representative point; a slope, not a summit. 85.97972°S, 0.67183°E, 4885.5 m above the 1737.4 km sphere (highest LOLA 20 m pixel within 1 km of the original representative point 86.0°S, 0.3°E; `scripts/find_highest_point.mjs`). It sits on the 1 km circle: the ground keeps rising beyond it (highest within 3 km: 5123.5 m, also at the circle's edge). Its Horizons data in `ephem/sp_malapert/` were re-downloaded for these coordinates.
- **DEMs (PDS Geosciences, LOLA GDR polar):** `ldem_80s_20m` (20 m/px; only rows within ±22 km of the original point, via HTTP range), `ldem_80s_80m` (80 m, to 80°S), `ldem_75s_120m` (120 m, to 75°S), `ldem_60s_240m` (240 m, to 60°S). https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/polar/img/
- **Label facts:** polar stereographic centred on −90°, sphere 1737.4 km, "MEAN EARTH/POLAR AXIS OF DE421", LSB 16-bit, `HEIGHT = DN × 0.5` m, "Map values are relative to a radius of 1737.4 km" (same sphere as our Horizons data). Orientation from `catalog/dsmap_polar.cat`: "In the south, Longitude 0 extends straight up from the center, and Longitude 90 East extends to the right." Preliminary LOLA data (products created 2017).
- **Method:**
  - Observer on the 20 m DEM surface + 2 m mast (ASSUMED).
  - Rays every 0.1° of azimuth along great circles. Exact spherical geometry (curvature included). Bilinear heights from the finest DEM covering each point.
  - A ray stops when even the DEM maximum height (7027 m, label DERIVED_MAXIMUM) could no longer rise above the best angle found. Every bin stopped this way before any data edge, so the search is complete in every direction.
  - Bin value = maximum of its ten rays.
- **Sanity numbers (D10 point):** smooth-sphere horizon dip 4.293° at 130.3 km. In Earth's directions (az ~352°–8° over 2026–2029) the horizon is −3.1° to −3.5°. Bins 351°–5° are set by terrain 120–160 km away; bins 6°–8° are set by ground ~40 m away that slopes downhill. Ignoring ground closer than 500 m lowers those three bins slightly and changes no Earth answer in 2026–2029; the smallest Earth margin there is 0.05°.
- **Robust demo case:** 2026-09-19 06:00 UTC, Sun az 85.3°, el +1.05° (flat: lit). Terrain horizon 6.03°, set by a ridge 1.84 km east (terrain: dark). Earth el −2.05° (flat: not in view) is above the −3.16° terrain horizon (terrain: in view).

### "Where you stand changes the answer" — two comparisons, each with its own distance
**1. Original point vs D10 point: 1.000 km apart** (both 2026–2029, hourly):

| | Original representative point (86.0°S, 0.3°E) | D10 point (85.97972°S, 0.67183°E) |
|---|---|---|
| Ground height above sphere | 4830.5 m | 4885.5 m |
| Smooth-sphere dip | 4.268° | 4.293° |
| Horizon toward Earth (az 352°–358°) | ~+5.6°, set by ground 140–180 m away | −3.1° to −3.5°, set by terrain 120–160 km away |
| Sun visible: flat → terrain | 50.4% → 29.1% | 50.4% → 45.8% |
| Earth in view: flat → terrain | 69.1% → 41.2% | 69.2% → **100%** |
| 2026-09-19 06:00 UTC | Sun blocked (ridge 3.24 km east, 5.54°) | Sun blocked (ridge 1.84 km east, 6.03°) |

**2. Moving the observer 200 m (earlier sensitivity runs; northern horizon, Earth's direction):**
- From the original point: 200 m north → 1.6°; 200 m south → 8.0–8.6°; 200 m east → ~4°; 200 m west → ~11.8°; 10 m mast instead of 2 m → 3.4° (unshifted: ~5.6°).
- From the D10 point: 200 m north → −3.3° (unchanged); 200 m south → +5.0° to +5.8° (back on the rising slope, set by ground ~80 m away); 200 m east → −2.5°; 200 m west → −3.3° to −2.8°; 10 m mast → no change.
- Directions blocked by distant ridges barely move: east (az 90°) stays 6.0°–6.7° in every shift. Ray density 10 → 20 per degree: no change.
