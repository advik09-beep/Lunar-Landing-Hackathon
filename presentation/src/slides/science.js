// Scientific content (Lane A). Every figure here is printed by a check script; verify before changing.
export const science = [
`<section class="page data-slide"><p class="eyebrow">NASA DATA</p><h2>Hand-checked calculations match NASA's own data</h2><p class="lead">LunLux combines NASA/JPL Horizons ephemerides with NASA Lunar Reconnaissance Orbiter LOLA elevation data.</p><div class="stats"><article><strong>7 / 7</strong><span>hand-checks match NASA's own Horizons calculator; largest difference 0.0004°</span></article><article><strong>9 / 10</strong><span>of NASA's lunar eclipses for 2026-2029 found in our own data; the tenth is a faint graze that misses by under 1%</span></article><article><strong>1.84 km</strong><span>Malapert, 19 Sep 2026 06:00 UTC: the Sun 1.05° above flat ground, hidden behind a ridge 1.84 km east</span></article></div><p class="source">Source: NASA JPL Horizons; NASA LRO LOLA.</p><footer>03 / NASA DATA</footer><aside class="notes">All three come from our check scripts. 7/7: the Lane A lead queried the Horizons web app by hand at seven site, time and body combinations; the largest difference from our files is 0.000391° (check_ephem). 9/10: we find nine eclipses directly, each within 3 hours of NASA's time of greatest eclipse; the tenth, the penumbral eclipse of 18 July 2027, misses solid-Earth contact by 0.0081°, 0.9% of Earth's radius, because NASA's shadow includes Earth's atmosphere and ours does not (check_d19). Malapert: the Sun is 1.05° above a flat horizon but the terrain skyline there is 6.03° high, set by a ridge 1.84 km east, so terrain says dark where flat ground says sunlit (check_visibility, LOLA terrain).</aside></section>`,
`<section class="page workflow-slide">
  <p class="eyebrow">HOW IT WORKS</p>
  <h2>Directly compare landing sites</h2>
  <div class="visual-split">
    <figure class="screenshot-frame hero-shot">
      <img src="/shots/04-compare-which-day.png" alt="LunLux comparison grid showing how landing dates change outcomes">
      <figcaption>Explore the difference a date can make.</figcaption>
    </figure>
    <div class="side-panel glass-panel workflow-steps">
      <p class="short-step"><b>01</b><span>Choose a landing site and date</span></p>
      <p class="short-step"><b>02</b><span>Measure sunlight and Earth visibility</span></p>
      <p class="short-step"><b>03</b><span>Compare sites and dates</span></p>
      <p class="step-caveat">Terrain-aware analysis. Not a complete landing-safety assessment.</p>
    </div>
  </div>
  <footer>04 / HOW IT WORKS</footer>
</section>`
];
