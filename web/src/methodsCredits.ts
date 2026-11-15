// D34: Source/term disclosure built from the project root NOTICE.
// Update in coordination with Lane A when the source NOTICE changes.
type CitedSite = { shortName: string; source?: string };
const safe = (text: string): string => text.replace(/[&<>"']/g, c =>
  ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]!);
const url = (href: string, title: string): string =>
  `<a href="${href}" target="_blank" rel="noopener noreferrer">${safe(title)}</a>`;
const sourceItem = (title: string, terms: string, citation: string, detail = ""): string =>
  `<li><strong>${safe(title)}</strong><span>${safe(terms)}. Source: ${citation}.${detail ? " " + detail : ""}</span></li>`;
const nasa = "NASA-origin data or imagery; governed by NASA use guidance (not a software licence)";

export function methodsCredits(sites: CitedSite[]): string[] {
  const nasaPolicy = url("https://www.nasa.gov/nasa-brand-center/images-and-media/", "NASA imagery and media guidelines");
  const landingSiteSources = sites.filter(site => site.source && /^https:\/\//.test(site.source))
    .map(site => sourceItem(site.shortName, "Site coordinates and mission history are factual source data",
      url(site.source!, "official or cited landing-site source")));
  return [
    '    <p class="rights-intro">Original LunLux code and text: Apache License 2.0, copyright 2026 Sheldon Spence and Advik Chaudhary. External data, images, fonts and software keep their own terms. Attribution does not imply NASA endorsement.</p>',
    '    <p class="rights-intro">This is a readable summary of the project ' +
      url("https://github.com/advik09-beep/Lunar-Landing-Hackathon/blob/main/NOTICE", "third-party NOTICE") +
      ' and ' + url("https://github.com/advik09-beep/Lunar-Landing-Hackathon/blob/main/LICENSE", "Apache 2.0 LICENSE") +
      '. NASA scientific facts are not software-licensed under Apache 2.0.</p>',
    '<h3>Scientific data and sources</h3><ul class="rights-list">',
    sourceItem("Sun and Earth positions, distances, hourly files and daily summaries", nasa,
      url("https://ssd.jpl.nasa.gov/horizons/", "NASA/JPL Horizons")),
    sourceItem("Lunar skyline and local terrain", nasa,
      url("https://pds-geosciences.wustl.edu/missions/lro/lola.htm", "NASA LRO LOLA / PDS Geosciences")),
    sourceItem("Landing coordinates and mission dates", "Factual data from NASA NSSDCA, LROC/Arizona State University, ISRO and NASA",
      url("https://github.com/advik09-beep/Lunar-Landing-Hackathon/blob/main/data/sites.js", "source citations for each site")),
    ...landingSiteSources,
    sourceItem("Lunar eclipse comparisons", nasa, url("https://eclipse.gsfc.nasa.gov/", "NASA GSFC Eclipse Web Site")),
    sourceItem("NASA planetary facts, diagrams and quoted text in Tour/Report", nasa,
      url("https://science.nasa.gov/solar-system/", "NASA Solar System") +
      "; " + url("https://svs.gsfc.nasa.gov/", "NASA SVS") +
      "; " + url("https://ssd.jpl.nasa.gov/horizons/", "NASA/JPL Horizons"),
      "Individual quotations also link to their source pages in the research panels."),
    '</ul>',
    '<h3>NASA imagery used in LunLux</h3><p class="rights-note">NASA-hosted media may include third-party material. Exact published credit lines are preserved; see ' + nasaPolicy + '.</p><ul class="rights-list">',
    sourceItem("CGI Moon Kit, 2K and 4K lunar texture", nasa,
      url("https://svs.gsfc.nasa.gov/4720", "NASA Scientific Visualization Studio"),
      "Credit: NASA’s Scientific Visualization Studio."),
    sourceItem("Apollo 8 Earthrise", nasa,
      url("https://www.nasa.gov/image-article/apollo-8-earthrise/", "NASA image page"),
      "Image Credit: NASA."),
    sourceItem("Lunar South Pole (PIA13523)", nasa,
      url("https://science.nasa.gov/photojournal/the-lunar-south-pole", "NASA image page"),
      "Credits: NASA/GSFC/Arizona State University."),
    sourceItem("A Scientist on the Moon (Apollo 17)", nasa,
      url("https://science.nasa.gov/resource/a-scientist-on-the-moon", "NASA image page"),
      "Credit: NASA."),
    sourceItem("South Pole Illumination Map (PIA13720)", nasa,
      url("https://science.nasa.gov/photojournal/south-pole-illumination-map", "NASA image page"),
      "Credits: NASA/GSFC/Arizona State University."),
    sourceItem("LRO Earthrise (2015)", nasa,
      url("https://www.nasa.gov/image-article/nasa-releases-new-high-resolution-earthrise-image-2/", "NASA image page"),
      "Image Credit: NASA/Goddard/Arizona State University."),
    '</ul>',
    '<h3>Background music</h3><ul class="rights-list">',
    sourceItem("'Borealis' by Scott Buckley", "Creative Commons Attribution 4.0 International (CC BY 4.0); original recording streamed from the composer's website, volume reduced in the player",
      url("https://www.scottbuckley.com.au/library/borealis/", "original music and download") + "; " +
      url("https://creativecommons.org/licenses/by/4.0/", "CC BY 4.0 licence"),
      "Music plays only after pressing Music on; it is off by default."),
    '</ul>',
    '<h3>Self-hosted fonts</h3><ul class="rights-list">',
    sourceItem("CMU Serif (computer-modern 0.1.3)", "Font files: SIL Open Font License 1.1; npm wrapper: MIT",
      url("https://github.com/stevenpetryk/computer-modern", "computer-modern") + "; " +
      url("https://cm-unicode.sourceforge.io/", "Computer Modern Unicode")),
    sourceItem("Source Serif 4 (@fontsource/source-serif-4 5.3.1)", "SIL Open Font License 1.1",
      url("https://fontsource.org/fonts/source-serif-4", "Fontsource")),
    '</ul>',
    '<h3>Rendering, build and type packages</h3><ul class="rights-list">',
    sourceItem("Three.js and OrbitControls (0.181)", "MIT License",
      url("https://github.com/mrdoob/three.js", "Three.js source")),
    sourceItem("Vite (5.4)", "MIT License", url("https://github.com/vitejs/vite", "Vite source")),
    sourceItem("TypeScript (5.9)", "Apache License 2.0", url("https://github.com/microsoft/TypeScript", "TypeScript source")),
    sourceItem("@types/three (0.181)", "MIT License", url("https://github.com/DefinitelyTyped/DefinitelyTyped", "DefinitelyTyped source")),
    '<li><strong>Transitive build dependencies</strong><span>Each retains its package-specific terms; full versions and provenance are in ' +
      url("https://github.com/advik09-beep/Lunar-Landing-Hackathon/blob/main/web/package-lock.json", "web/package-lock.json") + '.</span></li>',
    '</ul>',
    '<h3>Embedded simulator and its texture licences</h3><ul class="rights-list">',
    sourceItem("OzAILabs SolarSystemSimulator source", "Upstream README states MIT, but a complete upstream licence file was not verified; permission remains unresolved",
      url("https://github.com/OzAILabs/SolarSystemSimulator", "upstream repository") + "; " +
      url("https://github.com/advik09-beep/SolarSystemSimulator", "our separate fork")),
    sourceItem("Twelve remaining solar-system texture files (Sun, Mercury, Venus, Earth day/night, Moon, Mars, Jupiter, Saturn, Saturn rings, Uranus, Neptune)",
      "Creative Commons Attribution 4.0 International (CC BY 4.0); attribution and changes required",
      url("https://www.solarsystemscope.com/textures/", "Solar System Scope") + "; " +
      url("https://creativecommons.org/licenses/by/4.0/", "licence text")),
    '<li><strong>Pluto, Europa, Io, Ganymede, Callisto and Titan maps</strong><span>Removed from the currently deployed fork. These six bodies use plain untextured spheres; former image sources and unresolved historical permissions are documented in ' +
      url("https://github.com/advik09-beep/Lunar-Landing-Hackathon/blob/main/THIRD_PARTY_LICENSE_AUDIT.md", "the targeted texture audit") + '.</span></li>',
    '</ul>',
    '<h3>Attribution and marks</h3><ul class="rights-list">',
    sourceItem("NASA names, marks and insignia", "NASA's use rules apply; NASA endorsement is not implied",
      url("https://www.nasa.gov/nasa-brand-center/", "NASA Brand Center")),
    '<li><strong>LunLux wordmark and icon</strong><span>Team-created branding, as recorded in NOTICE; Apache 2.0 grants no trademark rights. Team original code and text are credited to Sheldon Spence and Advik Chaudhary.</span></li>',
    '<li><strong>Other visual references</strong><span>Starfield styling was discussed with reference to ' +
      url("https://www.huescreen.com/starfield/", "Hue Screen Starfield") + ' and ' +
      url("https://github.com/etrepat/starfield", "etrepat/starfield (MIT)") +
      '; no code or imagery was copied into the current shell.</span></li>',
    '</ul>',
    '<p class="rights-note">Model limits: sunlight is visibility, not assured power; Earth in sight is geometry, not an assured communication link; the globe is illustrative and terrain is analyzed in the horizon panel. The Sun and Earth score is this team’s own formula, not a NASA standard.</p>',
  ];
}
