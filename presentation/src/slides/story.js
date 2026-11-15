// LunLux presentation narrative (D37: section labels follow NASA's demo outline). Keep exactly seven slides.
export const opening = [
`<section class="page cover">
  <div class="cover-moon" id="cover-moon" role="img" aria-label="The Moon, turning slowly"></div>
  <p class="eyebrow">TEAM AND CHALLENGE</p>
  <p class="challenge">NASA Space Apps Challenge 2026: Lunar Landing Site Navigator</p>
  <div class="cover-panel">
    <p class="kicker">TEAM LUNLUX</p>
    <h1 class="cover-brand"><img class="cover-wordmark" src="/brand/lunlux-wordmark.png" alt="LunLux"></h1>
    <p class="subtitle">Sunlight and Earth contact for lunar landing sites</p>
    <p class="cover-question">The place matters. So does the day.</p>
  </div>
  <p class="cover-photo-credit">Moon map: <a href="https://svs.gsfc.nasa.gov/4720" target="_blank" rel="noopener noreferrer">NASA's Scientific Visualization Studio</a>, CGI Moon Kit</p>
  <footer>01 / TEAM AND CHALLENGE</footer>
</section>`,
`<section class="page problem-slide">
  <p class="eyebrow">INTRODUCTION</p>
  <h2>What affects light levels?</h2>
  <div class="visual-split">
    <figure class="screenshot-frame hero-shot">
      <img src="/shots/01-stand-here-hill-hides-sun.png" alt="LunLux view of lunar hills blocking the Sun">
      <figcaption>A ridge can block the Sun at a particular site and hour.</figcaption>
    </figure>
    <div class="side-panel glass-panel">
      <p class="panel-intro">Three things change the answer.</p>
      <p class="short-point"><span class="point-symbol sun-symbol" aria-hidden="true"></span>How high the Sun is</p>
      <p class="short-point"><span class="point-symbol terrain-symbol" aria-hidden="true"></span>The hills around you</p>
      <p class="short-point"><span class="point-symbol date-symbol" aria-hidden="true"></span>The date you land</p>
    </div>
  </div>
  <footer>02 / INTRODUCTION</footer>
</section>`
];
export const closing = [
`<section class="page audiences-slide">
  <p class="eyebrow">WHO IT IS FOR</p>
  <h2>Built for educators and researchers</h2>
  <div class="audience-grid">
    <article class="audience-card glass-panel">
      <div class="audience-top"><span class="tag">EDUCATOR</span><p>Pictures and plain-language explanations</p></div>
      <figure class="screenshot-frame"><img src="/shots/02-explore-educator.png" alt="Educator view in LunLux Explore"></figure>
    </article>
    <article class="audience-card glass-panel">
      <div class="audience-top"><span class="tag earth-tag">RESEARCHER</span><p>Angles, timelines and mission trade-offs</p></div>
      <figure class="screenshot-frame"><img src="/shots/03-explore-researcher.png" alt="Researcher view in LunLux Explore"></figure>
    </article>
  </div>
  <footer>05 / WHO IT IS FOR</footer>
</section>`,
`<section class="page reflection-slide">
  <p class="eyebrow">HURDLES AND ACHIEVEMENTS</p>
  <h2>Hurdles and achievements</h2>
  <div class="twocol">
    <article class="glass-panel"><span class="tag">ACHIEVEMENTS</span>
      <ul class="facts">
        <li>7 of 7 hand-checks agree with NASA's Horizons within 0.0004°.</li>
        <li>Real terrain at all ten sites. Apollo 17's valley walls, up to 14° high, came straight from NASA's elevation maps.</li>
        <li>9 of NASA's 10 lunar eclipses for 2026–2029 found in our own data.</li>
      </ul></article>
    <article class="glass-panel"><span class="tag earth-tag">HURDLES</span>
      <ul class="facts">
        <li>At Malapert, moving the point about 1 km more than doubled Earth contact, so we chose the exact point and say so.</li>
        <li>Flat ground was wrong at the pole: the Sun stood above level yet hid behind a ridge 1.84 km away. We rebuilt on real terrain.</li>
        <li>Six outside images had unclear reuse terms, so we removed them.</li>
      </ul></article>
  </div>
  <footer>06 / HURDLES AND ACHIEVEMENTS</footer>
  <aside class="notes">Every figure is from the repository. 7 of 7: check_ephem, largest difference 0.000391°. Apollo 17: the computed terrain horizon (data/ephem/apollo17/horizon.json) rises from 0.45° to 14.23°; the horizon code has nothing site-specific. 9 of 10: check_d19; the tenth (18 July 2027) is a graze missed by 0.9% of Earth's radius because Earth's atmosphere isn't modelled. Malapert: data/README.md, original point vs the high-ground point 1.000 km away, Earth in view over terrain went from 41.2% to 100% under the original Earth-centre rule (2026–2029); under the current whole-disc rule the chosen point gets 86.0%, and the old point can only be the same or lower, so the move more than doubled Earth contact under either rule. Ridge: check_visibility, 19 September 2026 06:00 UTC, Sun 1.05° above level, skyline 6.03°, ridge 1.84 km east. Images: the simulator fork removed six textures with unclear reuse terms (fork commit aa00c53).</aside>
</section>`
];
