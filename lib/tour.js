// D25 tour captions (title/text = Researcher; kidTitle/kidText = Educator, D32: same facts, same sources) and D26 "Why the south pole?" text (Lane A writes, Lane B displays).
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
// Earth–Mars one-way light time, minutes (JPL Horizons quantity 21, Mars from 500@399, 2026-01-01..2029-12-31 daily; queried 2026-11-14).
export const MARS_LIGHT_TIME_MIN = Object.freeze({ min: 5.38, max: 20.06 });
export const lightVsSun = (body) => 10 ** (-0.4 * (MAGNITUDES_FROM_MOON[body].brightest - MAGNITUDES_FROM_MOON.sun.faintest));

const HZ = { name: "JPL Horizons System (our queries: Sun and Earth directions and distances; planet magnitudes seen from the Moon)", url: "https://ssd.jpl.nasa.gov/horizons/" };
const DE440 = { name: "Park et al. 2021, JPL DE440/DE441 ephemerides (planets' gravity included in the orbit calculations)", url: "https://ssd.jpl.nasa.gov/doc/Park.2021.AJ.DE440.pdf" };
const SVS5229 = { name: "NASA SVS, 'Seasons on the Moon' (tilt 1.5°; largest effect at the poles)", url: "https://svs.gsfc.nasa.gov/5229/" };
const ARTEMIS3 = { name: "NASA, Artemis III mission page ('The Sun will hover just above the horizon')", url: "https://www.nasa.gov/missions/artemis/artemis-iii/" };

export const TOUR_STOPS = Object.freeze([
  { id: "sun", body: "Sun", kidTitle: "The Sun gives power", kidText: "The Sun is the lander's only power. If a hill hides the Sun, the lander has no power.",
    title: "The only power source",
    text: "Where the Sun sits in the lunar sky decides whether a lander lives or goes dark. Its sunlight at the Moon swings between about 1,310 and 1,415 watts per square metre during 2026–2029 as the Sun's distance changes (our calculation from JPL Horizons and NASA's 1,361 W/m²).",
    ours: ["sunlight strength 1,310–1,415 W/m² (check_d19)"],
    sources: [{ name: "NASA NSSDCA Earth Fact Sheet ('Solar irradiance (W/m2) 1361.0')", url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html" }, HZ] },
  { id: "mercury", body: "Mercury", kidTitle: "Ice in the dark", kidText: "Mercury may have ice in craters that stay dark, like the Moon's south pole. From the Moon it is just a tiny dot, so it does not matter.",
    title: "Same trick, no effect",
    text: "Mercury is tilted just 2 degrees, and NASA says it may have water ice inside deep polar craters that stay in permanent shadow, the same reason the Moon's south pole matters. From the Moon it is only a dim point that never delivers even a billionth of the Sun's light (our JPL Horizons check), so it does nothing to a lander.",
    ours: [`brightest from the Moon: magnitude ${MAGNITUDES_FROM_MOON.mercury.brightest}`],
    sources: [{ name: "NASA, Mercury facts ('tilted just 2 degrees'; 'may have water ice at its north and south poles inside deep craters, but only in regions in permanent shadows')", url: "https://science.nasa.gov/mercury/facts/" }, HZ] },
  { id: "venus", body: "Venus", kidTitle: "Bright, but too far", kidText: "Venus is the brightest planet in the Moon's sky. It is still much too faint to give the lander power.",
    title: "Bright, but powerless",
    text: "The brightest planet in the Moon's sky, and still about two billionths of the Sun's light (our JPL Horizons check). Seen from Earth it is the third brightest object in the sky after the Sun and Moon, yet for a lander it changes nothing.",
    ours: [`brightest from the Moon: magnitude ${MAGNITUDES_FROM_MOON.venus.brightest}, brighter than every other planet in 2026–2029`],
    sources: [{ name: "NASA, Venus facts ('the third brightest object in the sky after the Sun and Moon')", url: "https://science.nasa.gov/venus/facts/" }, HZ] },
  { id: "earth", body: "Earth", kidTitle: "Home in the sky", kidText: "From the Moon, Earth stays in the same spot in the sky. If the lander can see Earth, a message gets home in a little over one second.",
    title: "The direct line home",
    text: "The Moon keeps the same face toward Earth, so from the near side Earth stays in almost the same spot in the sky, and from the far side it is never seen. When Earth is above a site's skyline a lander has a direct line of sight home, and a radio signal takes between about 1.2 and 1.4 seconds each way (our calculation from JPL Horizons distances).",
    ours: ["one-way signal delay 1.19–1.36 s over 2026–2029 (check_tour)"],
    sources: [{ name: "NASA, Moon facts ('The Earth and Moon are tidally locked')", url: "https://science.nasa.gov/moon/facts/" }, HZ] },
  { id: "mars", body: "Mars", kidTitle: "Too far to matter", kidText: "Mars is about half as big as Earth, and very far away. A message to Mars takes minutes, to the Moon a little over one second.",
    title: "Nothing to a lander",
    text: "Mars is about half the size of Earth, and from the Moon it gives far less than a billionth of the Sun's light (our JPL Horizons check), so it does nothing to a lander. A radio signal from Earth takes about 5 to 20 minutes to reach Mars but only about 1.2 to 1.4 seconds to reach the Moon (JPL Horizons one-way light times, 2026–2029).",
    ours: [`brightest from the Moon: magnitude ${MAGNITUDES_FROM_MOON.mars.brightest}`, `Earth–Mars one-way light time ${MARS_LIGHT_TIME_MIN.min}–${MARS_LIGHT_TIME_MIN.max} minutes`],
    sources: [{ name: "NASA, Mars facts ('Mars is about half the size of Earth')", url: "https://science.nasa.gov/mars/facts/" },
      { name: "JPL Horizons, quantity 21 '1-way down-leg light-time', Mars from Earth's centre, 2026–2029 daily (our query)", url: "https://ssd.jpl.nasa.gov/horizons/" }, HZ] },
  { id: "jupiter", body: "Jupiter", kidTitle: "Big, but far away", kidText: "Jupiter is heavier than all the other planets put together. It is so far away that it changes nothing for the lander.",
    title: "Shapes orbits, not landers",
    text: "NASA says Jupiter is more than twice as massive as the other planets combined, so its gravity nudges every orbit, and the NASA JPL orbit calculations we use already include it. For a lander on the Moon it is only a bright point, at most about a four-billionth of the Sun's light (our JPL Horizons check).",
    ours: [`brightest from the Moon: magnitude ${MAGNITUDES_FROM_MOON.jupiter.brightest}`],
    sources: [{ name: "NASA, Jupiter ('more than twice as massive as the other planets combined')", url: "https://science.nasa.gov/jupiter/" }, DE440, HZ] },
  { id: "saturn", body: "Saturn", kidTitle: "Rings of ice", kidText: "Saturn has rings made of ice and rock. From the Moon it is only a faint dot.",
    title: "Beautiful rings, no effect",
    text: "Saturn's rings are billions of small chunks of ice and rock. From the Moon it is a faint point, far under a billionth of the Sun's light (our JPL Horizons check), with no effect on a lander.",
    ours: [`brightest from the Moon: magnitude ${MAGNITUDES_FROM_MOON.saturn.brightest}`],
    sources: [{ name: "NASA, Saturn facts ('billions of small chunks of ice and rock')", url: "https://science.nasa.gov/saturn/facts/" }, HZ] },
  { id: "uranus", body: "Uranus", kidTitle: "Lying on its side", kidText: "Uranus spins lying on its side. The Moon stands almost straight, so at its poles the Sun stays low all day.",
    title: "Tipped on its side",
    text: "Uranus is tipped on its side, which gives it the most extreme seasons in the solar system. The Moon is tilted just 1.5 degrees, which is why sunlight at its poles always skims the horizon.",
    ours: [],
    sources: [{ name: "NASA, Uranus facts ('rotates at a nearly 90-degree angle'; 'the most extreme seasons')", url: "https://science.nasa.gov/uranus/facts/" }, SVS5229, ARTEMIS3] },
  { id: "neptune", body: "Neptune", kidTitle: "Very dim sunlight", kidText: "Neptune is so far away that noon looks like evening. On the Moon the Sun is bright, but a hill can still hide it.",
    title: "Too far to matter",
    text: "Neptune is more than 30 times as far from the Sun as Earth, and NASA says the light we get is roughly 900 times as bright, so high noon there would seem like dim twilight. At the Moon sunlight arrives at full strength (1,310 to 1,415 watts per square metre, our calculation), so for a lander the problem is never how strong the Sun is, only whether terrain is in the way.",
    ours: ["sunlight at the Moon 1,310–1,415 W/m² (check_d19)"],
    sources: [{ name: "NASA, Neptune facts ('more than 30 times as far from the Sun as Earth'; 'roughly 900 times as bright as sunlight on Neptune'; 'high noon ... would seem like dim twilight')", url: "https://science.nasa.gov/neptune/facts/" }, HZ] },
  { id: "moon", body: "Moon", kidTitle: "Long days, long nights", kidText: "A day on the Moon lasts about a month. Near the poles the Sun stays low, so hills can hide it.",
    title: "Where the lander lives",
    text: "One lunar day, from noon to noon, lasts about 29.5 Earth days (our measurement from JPL Horizons data), so most sites get roughly two weeks of light and two weeks of night. Near the poles the Sun hovers just above the horizon, so the terrain around a site decides who gets sunlight and who can see Earth, and that is what this tool checks.",
    ours: ["lunar day 29.53 Earth days: the sub-solar point drifts 360° west in that time (check_tour)"],
    sources: [{ name: "NASA, Moon facts", url: "https://science.nasa.gov/moon/facts/" }, ARTEMIS3, SVS5229, HZ] },
]);

// D26 "Why the south pole?" — one-line and full versions.
export const SOUTH_POLE = Object.freeze({
  oneLine: "Why the south pole? Water ice and long sunlight, but the Sun and Earth skim the horizon. Any site works; past landings are comparisons.",
  full: [
    "Why many missions target it: NASA describes the lunar south pole as \"an area that contains permanently shadowed regions rich in resources\", including \"water ice that was confirmed at the Moon's South Pole\", with the \"highest concentrations\" of ice \"within darkened craters at the poles\". NASA's candidate landing regions near the pole \"contain sites that provide continuous access to sunlight throughout a 6.5-day period\", which \"provides a power source and minimizes temperature variations\".",
    "The catch: the Moon is tilted only 1.5 degrees, so at the poles \"The Sun will hover just above the horizon, casting long, dark shadows\". Earth sits low there too: at our four candidate sites it never climbs more than about 11 degrees above level (our JPL Horizons data, 2026–2029). A ridge or a slope can block the Sun or Earth, so terrain decides. In our own example, moving the Malapert observer about 1 km more than doubled the time Earth is in view.",
    "This tool works for any site: the same method and checks run for all ten sites, near side and polar. The historic landings (Apollo 11, 12 and 17, Chandrayaan-3, IM-1 and IM-2) are past missions shown as comparisons for educators, not proposals.",
  ],
  sources: [
    { name: "NASA, 'NASA Identifies Candidate Regions for Landing Next Americans on Moon' (19 Aug 2022)", url: "https://www.nasa.gov/news-release/nasa-identifies-candidate-regions-for-landing-next-americans-on-moon/" },
    { name: "NASA, Moon facts (ice in permanently shadowed regions at the poles)", url: "https://science.nasa.gov/moon/facts/" },
    ARTEMIS3, SVS5229, HZ,
  ],
});
