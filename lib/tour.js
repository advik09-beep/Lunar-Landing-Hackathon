// D25 tour captions and D26 "Why the south pole?" text (Lane A writes, Lane B displays).
// Each tour stop answers: "What does this body do to a lander on the Moon?" Two plain sentences for an
// Educator audience, honest when the answer is "nothing". Every stop names its official NASA/JPL sources
// (checked 2026-11-14). Figures marked "ours" were computed by this team from JPL Horizons data.

// Apparent magnitudes seen from the Moon's centre, 2026-01-01..2029-12-31 at 5-day steps
// (JPL Horizons, quantity 9 APmag, observer 500@301; queried 2026-11-14). Brighter = more negative.
export const MAGNITUDES_FROM_MOON = Object.freeze({
  sun: { brightest: -26.784, faintest: -26.701 }, mercury: { brightest: -2.251, faintest: 6.129 },
  venus: { brightest: -4.928, faintest: -3.766 }, mars: { brightest: -1.409, faintest: 1.585 },
  jupiter: { brightest: -2.677, faintest: -1.663 }, saturn: { brightest: -0.296, faintest: 1.03 },
  uranus: { brightest: 5.545, faintest: 5.831 }, neptune: { brightest: 7.676, faintest: 7.825 },
});
/** Most of the Sun's light a planet ever delivers: brightest planet vs faintest Sun (ratio of fluxes). */
export const lightVsSun = (body) => 10 ** (-0.4 * (MAGNITUDES_FROM_MOON[body].brightest - MAGNITUDES_FROM_MOON.sun.faintest));

const HZ = { name: "JPL Horizons System (our queries: Sun and Earth directions and distances; planet magnitudes seen from the Moon)", url: "https://ssd.jpl.nasa.gov/horizons/" };
const DE440 = { name: "Park et al. 2021, JPL DE440/DE441 ephemerides (planets' gravity included in the orbit calculations)", url: "https://ssd.jpl.nasa.gov/doc/Park.2021.AJ.DE440.pdf" };
const SVS5229 = { name: "NASA SVS, 'Seasons on the Moon' (tilt 1.5°; largest effect at the poles)", url: "https://svs.gsfc.nasa.gov/5229/" };
const ARTEMIS3 = { name: "NASA, Artemis III mission page ('The Sun will hover just above the horizon')", url: "https://www.nasa.gov/missions/artemis/artemis-iii/" };

export const TOUR_STOPS = Object.freeze([
  { id: "sun", body: "Sun", title: "The only power source",
    text: "Where the Sun sits in the lunar sky decides whether a lander lives or goes dark. Its sunlight at the Moon swings between about 1,310 and 1,415 watts per square metre during 2026–2029 as the Sun's distance changes (our calculation from JPL Horizons and NASA's 1,361 W/m²).",
    ours: ["sunlight strength 1,310–1,415 W/m² (check_d19)"],
    sources: [{ name: "NASA NSSDCA Earth Fact Sheet ('Solar irradiance (W/m2) 1361.0')", url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html" }, HZ] },
  { id: "mercury", body: "Mercury", title: "Too small and faint to matter",
    text: "Mercury is the smallest planet and the nearest to the Sun, but from the Moon it is only a dim point that never delivers even a billionth of the Sun's light (our JPL Horizons check). It does nothing to a lander's power or radio, and its pull is already inside NASA JPL's orbit calculations.",
    ours: [`brightest from the Moon: magnitude ${MAGNITUDES_FROM_MOON.mercury.brightest}`],
    sources: [{ name: "NASA, Mercury facts ('the smallest planet in our solar system and nearest to the Sun')", url: "https://science.nasa.gov/mercury/facts/" }, HZ, DE440] },
  { id: "venus", body: "Venus", title: "Bright, but powerless",
    text: "The brightest planet in the Moon's sky, and still about two billionths of the Sun's light (our JPL Horizons check). Seen from Earth it is the third brightest object in the sky after the Sun and Moon, yet for a lander it changes nothing.",
    ours: [`brightest from the Moon: magnitude ${MAGNITUDES_FROM_MOON.venus.brightest}, brighter than every other planet in 2026–2029`],
    sources: [{ name: "NASA, Venus facts ('the third brightest object in the sky after the Sun and Moon')", url: "https://science.nasa.gov/venus/facts/" }, HZ] },
  { id: "earth", body: "Earth", title: "The only phone line home",
    text: "The Moon keeps the same face toward Earth, so from the near side Earth stays in almost the same spot in the sky, and from the far side it is never seen. When Earth is above a site's skyline the lander can talk straight to mission control, and each radio message takes between about 1.2 and 1.4 seconds to arrive (our calculation from JPL Horizons distances).",
    ours: ["one-way signal delay 1.19–1.36 s over 2026–2029 (check_tour)"],
    sources: [{ name: "NASA, Moon facts ('The Earth and Moon are tidally locked')", url: "https://science.nasa.gov/moon/facts/" }, HZ] },
  { id: "mars", body: "Mars", title: "Nothing to a lander",
    text: "Mars is about half the size of Earth, and from the Moon it is a small reddish point giving far less than a billionth of the Sun's light (our JPL Horizons check). It does nothing to a lander's power or radio.",
    ours: [`brightest from the Moon: magnitude ${MAGNITUDES_FROM_MOON.mars.brightest}`],
    sources: [{ name: "NASA, Mars facts ('Mars is about half the size of Earth')", url: "https://science.nasa.gov/mars/facts/" }, HZ] },
  { id: "jupiter", body: "Jupiter", title: "Shapes orbits, not landers",
    text: "NASA says Jupiter holds more than twice the combined material of the other bodies in the solar system, so its gravity nudges every orbit, and the NASA JPL orbit calculations we use already include it. For a lander on the Moon it is only a bright point, at most about a four-billionth of the Sun's light (our JPL Horizons check).",
    ours: [`brightest from the Moon: magnitude ${MAGNITUDES_FROM_MOON.jupiter.brightest}`],
    sources: [{ name: "NASA, Jupiter facts ('more than twice the combined material of the other bodies in the solar system')", url: "https://science.nasa.gov/jupiter/facts/" }, DE440, HZ] },
  { id: "saturn", body: "Saturn", title: "Beautiful rings, no effect",
    text: "Saturn's rings are billions of small chunks of ice and rock. From the Moon it is a faint point, far under a billionth of the Sun's light (our JPL Horizons check), with no effect on a lander.",
    ours: [`brightest from the Moon: magnitude ${MAGNITUDES_FROM_MOON.saturn.brightest}`],
    sources: [{ name: "NASA, Saturn facts ('billions of small chunks of ice and rock')", url: "https://science.nasa.gov/saturn/facts/" }, HZ] },
  { id: "uranus", body: "Uranus", title: "Tipped on its side",
    text: "Uranus is tipped on its side, which gives it the most extreme seasons in the solar system. The Moon is tilted just 1.5 degrees, which is why sunlight at its poles always skims the horizon.",
    ours: [],
    sources: [{ name: "NASA, Uranus facts ('rotates at a nearly 90-degree angle'; 'the most extreme seasons')", url: "https://science.nasa.gov/uranus/facts/" }, SVS5229, ARTEMIS3] },
  { id: "neptune", body: "Neptune", title: "Too far to matter",
    text: "Neptune is about 30 times farther from the Sun than Earth, so sunlight there is roughly 900 times weaker (our arithmetic: 30 × 30). From the Moon it is tens of trillions of times fainter than the Sun (our JPL Horizons check) and does nothing to a lander.",
    ours: ["30 × 30 = 900", `brightest from the Moon: magnitude ${MAGNITUDES_FROM_MOON.neptune.brightest}`],
    sources: [{ name: "NASA, Neptune facts ('more than 30 times as far from the Sun as Earth')", url: "https://science.nasa.gov/neptune/facts/" }, HZ] },
  { id: "moon", body: "Moon", title: "Where the lander lives",
    text: "One lunar day, from noon to noon, lasts about 29.5 Earth days (our measurement from JPL Horizons data), so most sites get roughly two weeks of light and two weeks of night. Near the poles the Sun hovers just above the horizon, so the terrain around a site decides who gets sunlight and who can see Earth, and that is what this tool checks.",
    ours: ["lunar day 29.53 Earth days: the sub-solar point drifts 360° west in that time (check_tour)"],
    sources: [{ name: "NASA, Moon facts", url: "https://science.nasa.gov/moon/facts/" }, ARTEMIS3, SVS5229, HZ] },
]);

// D26 "Why the south pole?" — one-line and full versions.
export const SOUTH_POLE = Object.freeze({
  oneLine: "Why the south pole? NASA aims for it because shadowed craters there hold water ice and nearby high ground can stay sunlit for days; the catch is that the Sun and Earth sit near the horizon, so terrain decides. This tool works for any site, and past landings are shown for comparison.",
  full: [
    "Why many missions target it: NASA describes the lunar south pole as \"an area that contains permanently shadowed regions rich in resources\", including \"water ice that was confirmed at the Moon's South Pole\", with the \"highest concentrations\" of ice \"within darkened craters at the poles\". NASA's candidate landing regions near the pole \"contain sites that provide continuous access to sunlight throughout a 6.5-day period\", which \"provides a power source and minimizes temperature variations\".",
    "The catch: the Moon is tilted only 1.5 degrees, so at the poles \"The Sun will hover just above the horizon, casting long, dark shadows\". Earth sits low there too: at our four candidate sites it never climbs more than about 11 degrees above level (our JPL Horizons data, 2026–2029). A ridge or a slope can block the Sun or Earth, so terrain decides. In our own example, moving the Malapert observer about 1 km changed Earth-in-view from 41% to 100% of the time.",
    "This tool works for any site: the same method and checks run for all ten sites, near side and polar. The historic landings (Apollo 11, 12 and 17, Chandrayaan-3, IM-1 and IM-2) are past missions shown as comparisons for educators, not proposals.",
  ],
  sources: [
    { name: "NASA, 'NASA Identifies Candidate Regions for Landing Next Americans on Moon' (19 Aug 2022)", url: "https://www.nasa.gov/news-release/nasa-identifies-candidate-regions-for-landing-next-americans-on-moon/" },
    { name: "NASA, Moon facts (ice in permanently shadowed regions at the poles)", url: "https://science.nasa.gov/moon/facts/" },
    ARTEMIS3, SVS5229, HZ,
  ],
});
