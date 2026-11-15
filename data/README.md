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
| `ephem/_scene/<YYYY>.json`, `ephem/_scene/landing_<siteId>.json` | Step 8 scene data: hourly sub-solar and sub-Earth points on the Moon (lon/lat, MOON_ME, east-positive), Sun and Earth distances (km), and the Sun–Moon–Earth angle (S-T-O). Same coverage as the site data. Built by `node scripts/fetch_scene.mjs`, checked by `node scripts/check_scene.mjs`. Listed in `ephem/index.json` under `scene`. ~2.3 MB. |
| `daily.json` | Per-day stay summary for all sites (built by `node scripts/build_daily.mjs`). For every UTC date D whose 7-day stay (D 00:00Z, 168 hourly samples) is fully covered: `[litH, commsH, bothH, sunEdgeH, earthEdgeH, longestDarkH, verdict, darkPeriods, contactWindows, longestGapH]` (the last three added for D16), grouped per site in contiguous segments `{ firstDate, rows }`. Margins use the terrain horizon where one exists (sp_malapert), else flat; edge = \|margin\| ≤ EDGE_DEG (2°). Rule constants are in the file header and in `lib/verdict.js`. ~410 KB, 14,694 rows. |
| `ephem/_daily/daily_1.json`, `daily_3.json`, `daily_14.json` | D33: the same summary for 1-, 3- and 14-day stays (Researcher stay length), built by `node scripts/build_daily.mjs 1` (or 3, 14), same columns as `daily.json`. Kept inside `ephem/` so the existing build copy publishes them. ~0.6–0.7 MB each. |

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
- **Hand-checks:** 7 of 7 values from the Horizons web app (the Lane A lead) match our first 7-day files to six decimals. The six planned rows are apollo11 2026-11-14 12:00, im1 2026-11-17 08:00 and sp_malapert 2026-11-20 06:00, each Sun and Earth. The seventh is sp_malapert Sun 2026-11-17 08:00.
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
| Earth in view: flat → terrain (original rule: Earth's centre above the skyline) | 69.1% → 41.2% | 69.2% → **100%** |
| Earth in view over terrain, current rule (Earth's whole disc clear, D19) | the same or lower than 41.2% | **86.0%** |
| 2026-09-19 06:00 UTC | Sun blocked (ridge 3.24 km east, 5.54°) | Sun blocked (ridge 1.84 km east, 6.03°) |

**2. Moving the observer 200 m (earlier sensitivity runs; northern horizon, Earth's direction):**
- From the original point: 200 m north → 1.6°; 200 m south → 8.0–8.6°; 200 m east → ~4°; 200 m west → ~11.8°; 10 m mast instead of 2 m → 3.4° (unshifted: ~5.6°).
- From the D10 point: 200 m north → −3.3° (unchanged); 200 m south → +5.0° to +5.8° (back on the rising slope, set by ground ~80 m away); 200 m east → −2.5°; 200 m west → −3.3° to −2.8°; 10 m mast → no change.
- Directions blocked by distant ridges barely move: east (az 90°) stays 6.0°–6.7° in every shift. Ray density 10 → 20 per degree: no change.

## Scene data (step 8): Sun and Earth seen from the Moon
- **Query:** `EPHEM_TYPE=OBSERVER`, `COMMAND='301'` (Moon), `CENTER='500@399'` (Earth centre), `QUANTITIES='14,15,19,20,24'`, `RANGE_UNITS=KM`, `CSV_FORMAT=YES`, hourly.
- **Quantity definitions (manual):**
  - 14 = "Apparent planetodetic longitude and latitude of the center of the target disc seen by the OBSERVER at print-time" (the sub-Earth point).
  - 15 = "Apparent sub-solar longitude and latitude of the Sun on the target" ("Light travel-time from Sun to target and from target to observer is taken into account").
  - 19 = "The Sun's apparent range ... relative to the target center".
  - 20 = "Apparent range ... of the target center relative to the observer".
  - 24 = "The Sun-Target-Observer angle". `RANGE_UNITS` (API doc): `AU` | `KM`.
- **Output header:** `Target pole/equ : MOON_ME {East-longitude positive}`, `Target radii : 1737.4, 1737.4, 1737.4 km` (a sphere, so planetodetic = planetocentric latitude). Longitudes are output 0–360°E; `getSceneState` returns −180..180°E. The site queries print `MEAN_ME (high precision)` for the observer frame. The checks below show the two agree to within 0.007°.
- **Caveat (manual):** the sub-points are "not exactly the same as the 'nearest point' for a non-spherical target shape". The Moon here is a sphere, so this doesn't apply.
- **Checks (`scripts/check_scene.mjs`):**
  - Sun/Earth elevations implied at a site match the Lane A lead's three hand-checked site/hours within 0.0034°.
  - They match our site files for all 10 sites (every 6th hour 2026–2029, 58,440 site-hours) within 0.0007° (Sun) / 0.0065° (Earth).
  - The angle between the two directions equals Horizons' S-T-O within 0.006°.
  - At all 49 full moons in 2026–2029 the sub-solar and sub-Earth points are within 5.0° of each other.
  - Tolerance 0.05°: see STATUS.md.

## Terrain on more sites (D12, prototype): stage 1, the four south-pole candidates
Same method, scripts and checks as Malapert (above). Observer point = highest ground within 1 km of each candidate's representative point (D12). Every site uses the same maps:
- **20 m/px** `ldem_80s_20m` within 20 km of the site (its own ±22 km row window)
- **80 m/px** `ldem_80s_80m` to 80°S, **120 m/px** `ldem_75s_120m` to 75°S, **240 m/px** `ldem_60s_240m` to 60°S

All are PDS LOLA GDR polar products, preliminary (2017). Mast 2 m (assumed). No bin was limited by a map edge.

| Site | Observer point (D12) | What kind of point | Ground above sphere | Terrain horizon range | Sun visible: flat → terrain | Earth in view: flat → terrain | Earth-facing skyline |
|---|---|---|---|---|---|---|---|
| sp_cabeus_b_peak | 83.61274°S, 68.61071°W (747 m from rep. point) | a local high point (within 3 km at most 5 m higher) | 4596 m | −4.89° to +0.15° | 50.6% → 68.5% | 60.0% → 72.5% | set by downhill ground 0.26–0.7 km away (horizon −2.1° to −2.6°); 76% of Earth hours |
| sp_haworth | 86.70752°S, 23.14284°W (998 m) | a slope, not a summit (on the 1 km circle) | 1624.5 m | −3.42° to +7.20° | 50.5% → 30.9% | 63.7% → 31.5% | ridges 4.4–7.7 km away |
| sp_malapert | 85.97972°S, 0.67183°E (1000 m; D10) | a slope, not a summit (on the 1 km circle) | 4885.5 m | −4.86° to +6.13° | 50.4% → 45.8% | 69.2% → 100% | terrain 120–160 km away (bins 6°–8°: ground 40 m away, downhill) |
| sp_nobile_rim2 | 83.91491°S, 58.92558°E (855 m) | inside the 1 km circle, not a summit (higher ground within 3 km) | 1044.5 m | −0.64° to +6.18° | 50.0% → 47.2% | 64.9% → 65.1% | ridges 10.8–16.1 km away |

Hours with the Sun above the flat horizon but behind terrain (2026–2029): Cabeus B 0, Haworth 10,626, Malapert 3,820, Nobile Rim 2 1,134.

## Terrain on more sites (D12, prototype): stage 2, the three recent landings
Observer point = the **landed coordinates** (D12), on the DEM surface + 2 m mast (assumed). Map choice comes from `scripts/lola_maps.mjs`: the finest PDS LOLA GDR polar map that covers a ±22 km window around the site. All maps are polar stereographic, centred on −90°, "MEAN EARTH/POLAR AXIS OF DE421", heights relative to 1737.4 km (checked from each label). Beyond 20 km: 80 m (to 80°S), 120 m (to 75°S), 240 m (to 60°S), 400 m (`ldem_45s_400m`, to 45°S). No bin was limited by a map edge.

| Site | Landed point (source) | Fine map within 20 km | Ground above sphere (LOLA) | Published elevation | Terrain horizon | Sun visible: flat → terrain | Earth in view: flat → terrain | Earth-facing skyline |
|---|---|---|---|---|---|---|---|---|
| im2 | 84.7906°S, 29.1957°E (LROC located resting point) | `ldem_80s_20m`, **20 m/px** | 5321.9 m | not stated | −1.46° to +4.07° | 50.2% → 45.1% | 72.7% → 81.3% | ridges 9.3–16.2 km away |
| im1 | 80.13°S, 1.44°E (LROC landed point) | `ldem_75s_30m`, **30 m/px** (80°S is too close to the 20 m map's edge) | 2594.2 m | LROC: 2579 m | −0.21° to +10.93° | 50.3% → 39.5% | 100% → 100% | 2.6–3.1 km away |
| chandrayaan3 | 69.3741°S, 32.32°E (LROC "Chandrayaan-3 Landing Site", lander imaged; **moved from ISRO's prime-site centre** 69.367621°S, 32.348126°E, ~0.35 km) | `ldem_60s_60m`, **60 m/px** | 529.1 m | LROC: 532 m | +0.56° to +2.48° | 50.1% → 47.8% | 100% → 100% | 15–41 km away |

- **Elevation cross-check:** the LOLA ground height at IM-1 and Chandrayaan-3 matches LROC's published elevation within 15 m and 3 m.
- **IM-2:** LROC says the lander rests on its side in a ~20 m crater. A 20 m/px map can't resolve that crater, so the horizon describes the surrounding terrain, not the view from inside the small crater.
- **Chandrayaan-3:** 60 m/px is the finest polar product reaching 69°S, so small nearby features aren't resolved.
- **Map agreement (`check_horizon.mjs`):** fine vs coarser map near each site, mean |diff| 2.7 m (IM-2), within limits at IM-1 (30 m vs 120 m), 4.2 m (Chandrayaan-3).
- **Sun above the flat horizon but behind terrain, 2026–2029:** IM-2 2,046 h, IM-1 3,784 h, Chandrayaan-3 830 h.

## Terrain on more sites (D12, prototype): stage 3, the Apollo sites. All 10 sites now have terrain.
Observer point = the **landed (LM) coordinates** from NSSDCA, on the DEM surface + 2 m mast (assumed). These sites lie outside every polar map, so they use the **global simple-cylindrical LOLA GDR maps** (PDS Geosciences, `lola_gdr/cylindrical/img/`):
- **Within 20 km:** a ±22 km row window of the site's `ldem_1024_<lat band>_<lon band>` tile: 1024 px/deg, label MAP_SCALE 0.0296 km/px, so **~30 m/px**.
- **Beyond 20 km:** a ±8° latitude row window of `ldem_128` (128 px/deg, label MAP_SCALE 236.901 m/px, **~237 m/px**).

Label facts: SIMPLE CYLINDRICAL, CENTER_LONGITUDE 180, east-positive 0–360, "MEAN EARTH/POLAR AXIS OF DE421", heights "relative to a radius of 1737.4 km", LSB 16-bit × 0.5 m. Pixel formula from `catalog/dsmap.cat`: `SAMPLE = NINT(SPO + RES·(LON − CENTER_LONGITUDE)) + 1`, `LINE = NINT(LPO − RES·(LAT − CENTER_LATITUDE)) + 1`. Checked against each tile's edges.

**Search stopping bound:** the polar maps' DERIVED_MAXIMUM (~7 km) only covers the poles. For these sites the bound is the highest point in the site's own fetched windows + 500 m (the 237 m map smooths peaks): 11,279 m (Apollo 11), 10,611 m (Apollo 12), 9,309 m (Apollo 17). No ray left its windows (0 edge-limited bins).

| Site | Landed point (NSSDCA) | Fine map within 20 km | Ground relative to sphere | Terrain horizon | Sun visible: flat → terrain | Earth in view: flat → terrain | Earth-facing skyline |
|---|---|---|---|---|---|---|---|
| apollo11 | 0.67408°N, 23.47297°E | `ldem_1024_00n_15n_000_030`, ~30 m/px | **−1927.8 m** (below) | −0.61° to +1.33° | 50.1% → 49.9% | 100% → 100% | 1.3–6.8 km away |
| apollo12 | 3.01239°S, 23.42157°W | `ldem_1024_15s_00s_330_360`, ~30 m/px | **−1421.9 m** (below) | −0.41° to +0.73° | 50.4% → 50.1% | 100% → 100% | 0.39–1.0 km away (68% of Earth hours < 500 m) |
| apollo17 | 20.1908°N, 30.77168°E | `ldem_1024_15n_30n_030_060`, ~30 m/px | **−2628.6 m** (below) | +0.45° to +14.23° | 50.1% → 47.9% | 100% → 100% | 10.7–12.9 km away |

- **Observers below the reference sphere:** all three sit 1.4–2.6 km *below* 1737.4 km (mare and valley floors). A "smooth-sphere dip" relative to that sphere is undefined there, so `horizon.json` records `smoothSphereDipDeg: null` with a note. It also records `mastDipDeg` (0.087°, the dip from a 2 m mast over a smooth sphere through the ground point).
- **Apollo 11's tile window stops at the equator**, because its tile is 0°–15°N. In the ~1.5 km strip south of the equator within 20 km, heights come from the 237 m map.
- **Apollo 12:** Earth's direction is set by ground 0.39–1.0 km away (low horizon, +0.2° to +0.7°). Earth is high (100% in view either way), so no answer changes.
- **Apollo 17** sits in a deep valley: its horizon reaches 14.2°, and the Sun is blocked by terrain for 764 h in 2026–2029 while above the flat horizon (356 h by ridges ≥ 2 km away).
- **Map agreement (`check_horizon.mjs`):** 30 m tile vs 237 m map within ~9 km of each site: mean |diff| 4.1 m, 2.1 m, 14.6 m.

