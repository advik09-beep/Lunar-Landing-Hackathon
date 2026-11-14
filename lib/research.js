// D18 / D20 / D22 texts and sources for the Researcher view. Plain data; no calculations here.
export const LIGHT_SPEED_KM_S = 299792.458; // JPL Horizons output header: "c= 299792.458 km/s"
export const COMMS_CAUTION_DEG = 5; // our flag threshold for the Sun near the Earth–Moon line (illustrative, not a standard)

export const NASA_SITE_CRITERIA = [
  { text: "Factors in the selection process included science potential, launch window availability, terrain suitability, communication capabilities with Earth, and lighting conditions.",
    source: "NASA, 'NASA Provides Update on Artemis III Moon Landing Regions', 28 Oct 2024", url: "https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/" },
  { text: "…evaluated regions based on their ability to accommodate a safe landing, using criteria including terrain slope, ease of communications with Earth, and lighting conditions.",
    source: "NASA, 'NASA Identifies Candidate Regions for Landing Next Americans on Moon', 19 Aug 2022", url: "https://www.nasa.gov/news-release/nasa-identifies-candidate-regions-for-landing-next-americans-on-moon/" },
  { text: "All 13 regions contain sites that provide continuous access to sunlight throughout a 6.5-day period … it provides a power source and minimizes temperature variations.",
    source: "NASA, 19 Aug 2022 (same release)", url: "https://www.nasa.gov/news-release/nasa-identifies-candidate-regions-for-landing-next-americans-on-moon/" },
];
// How this tool answers each NASA criterion.
export const CRITERIA_COVERAGE = [
  ["Lighting conditions", "Yes: sunlight share, partial Sun, eclipses, dark stretches, longest continuous sunlight vs NASA's 6.5-day benchmark, power estimate."],
  ["Communication capabilities with Earth", "Geometry only: Earth in view (whole disc), marginal hours, contact gaps, distance and signal delay, Sun-near-Earth caution. No link budget."],
  ["Terrain slope / suitability", "Partly: local slope at the one observer point (1 pixel and 100 m baselines) and the terrain horizon. No hazard map, boulders or landing ellipse."],
  ["Launch window availability", "No: needs Earth launch and trajectory constraints. We show how the answer changes if the landing date slips (slip tolerance, 28-day grid)."],
  ["Science potential", "No: not modelled."],
  ["Temperature variations", "No temperatures. NASA ties sunlight to smaller temperature swings; the longest dark stretch is shown as a rough stand-in, not a thermal model."],
];

export const SEASON_NOTE = {
  text: "NASA: \"the tilt of the Moon is a mere 1.5°\" and \"The complete seasonal cycle on the Moon is its draconic year of about 346.6 Earth days.\" \"As on Earth, the largest effect is at the poles.\" " +
    "We show the sub-solar latitude: positive = Sun over the northern hemisphere (the Sun sits lower for southern sites), negative = over the southern hemisphere.",
  source: "NASA's Scientific Visualization Studio, 'Seasons on the Moon' (SVS 5229)", url: "https://svs.gsfc.nasa.gov/5229/",
};

export const OTHER_PLANETS_NOTE = {
  text: "Other planets: their gravity is already in the numbers. JPL's ephemerides (DE440/DE441, used by Horizons for every Sun, Earth and Moon position here) are computed by " +
    "\"fitting numerically integrated orbits\" of \"the Sun, the barycenters of eight planetary systems, the Moon, the Pluto system barycenter\", and the dynamical model even includes " +
    "\"Perturbations from 30 individual Kuiper belt objects\" (Park et al. 2021, JPL). Their light is negligible: seen from the Moon in 2026–2029, JPL Horizons gives the Sun an apparent " +
    "magnitude no fainter than −26.70 and Venus, the brightest planet, no brighter than −4.93, so Venus delivers at most about 2 billionths of the Sun's light. Radio from the planets is not modelled; " +
    "we found no JPL figure to quote, so we make no numeric claim about it.",
  sources: [
    { name: "Park, Folkner, Williams & Boggs (2021), 'The JPL Planetary and Lunar Ephemerides DE440 and DE441', Astronomical Journal 161:105", url: "https://ssd.jpl.nasa.gov/doc/Park.2021.AJ.DE440.pdf" },
    { name: "JPL Horizons, quantity 9 (APmag), observer 500@301, targets 10 (Sun), 299 (Venus), 599 (Jupiter), 499 (Mars), 2026-01-01..2029-12-31, 5-day steps", url: "https://ssd.jpl.nasa.gov/horizons/" },
  ],
};

export const NOT_MODELED = [
  "Landing hazards: boulders, craters smaller than the map pixel (20–60 m), dust, surface strength, the landing ellipse.",
  "Temperatures and thermal design (heaters, radiators, battery temperature).",
  "Communication link budget: antenna size and pointing, transmitter power, frequency, data rate, Earth ground-station availability.",
  "Launch windows, trajectories and the landing approach.",
  "Science value of the site.",
  "Light bent or scattered by Earth's atmosphere during lunar eclipses; the Sun's limb darkening.",
  "The skyline curving across the width of the Sun's or Earth's disc (treated as straight across each disc).",
  "Terrain closer than the map resolution; the horizon is for one point with an assumed 2 m mast.",
  "Shadowing by the lander itself; panel dust, degradation and conversion losses.",
  "Radio emission from the Sun or planets; planets' light (shown to be negligible) and gravity (already in JPL's ephemeris).",
  "Times are hourly samples: rises and sets are accurate to the hour.",
];

export const SOURCES = [
  { name: "JPL Horizons System (Sun and Earth directions, distances, Moon orientation)", url: "https://ssd.jpl.nasa.gov/horizons/" },
  { name: "LRO LOLA GDR elevation maps, polar and global (PDS Geosciences Node)", url: "https://pds-geosciences.wustl.edu/missions/lro/lola.htm" },
  { name: "NASA NSSDCA Sun, Earth and Moon fact sheets (radii, solar irradiance, mean distance)", url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/" },
  { name: "NASA GSFC lunar eclipse predictions 2021–2030 (Fred Espenak), cross-check", url: "https://eclipse.gsfc.nasa.gov/LEdecade/LEdecade2021.html" },
  { name: "NASA SVS 'Seasons on the Moon' (SVS 5229)", url: "https://svs.gsfc.nasa.gov/5229/" },
  { name: "NASA Artemis III landing-region releases (2022, 2024): selection criteria", url: "https://www.nasa.gov/news-release/nasa-provides-update-on-artemis-iii-moon-landing-regions/" },
  { name: "Park et al. 2021, JPL DE440/DE441 ephemerides", url: "https://ssd.jpl.nasa.gov/doc/Park.2021.AJ.DE440.pdf" },
  { name: "Site coordinates: NASA NSSDCA (Apollo), LROC/ASU (IM-1, IM-2, Chandrayaan-3, candidate mosaics), NASA (Artemis III regions)", url: "https://nssdc.gsfc.nasa.gov/planetary/lunar/lunar_sites.html" },
];
