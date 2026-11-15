// D32 shell-only reading levels. Scientific facts and source data remain in /lib.
type ReadingLevel = 'educator' | 'researcher';

export function syncTourSources(level: ReadingLevel): void {
  const caption = document.querySelector<HTMLElement>('#tour-science-caption');
  const sources = caption?.querySelector<HTMLParagraphElement>(':scope > p:nth-of-type(2)');
  if (!caption || !sources) return;
  const pole = caption.querySelector<HTMLDetailsElement>(':scope > details:not(.tour-teacher-notes)');
  let teacher = caption.querySelector<HTMLDetailsElement>(':scope > details.tour-teacher-notes');
  if (!teacher) {
    teacher = document.createElement('details');
    teacher.className = 'tour-teacher-notes';
    const summary = document.createElement('summary');
    summary.textContent = 'For the teacher';
    teacher.append(summary, sources.cloneNode(true));
    if (pole) teacher.append(pole.cloneNode(true));
    caption.append(teacher);
  }
  const kid = level === 'educator';
  sources.hidden = kid;
  teacher.hidden = !kid;
  if (pole) pole.hidden = kid;
}

let creditState: { original: HTMLElement[]; intro: HTMLDivElement; notes: HTMLDetailsElement } | null = null;
function syncCredits(kid: boolean): void {
  const credits = document.querySelector<HTMLElement>('#credits-view');
  if (!credits) return;
  if (!creditState) {
    const original = Array.from(credits.children).slice(1) as HTMLElement[];
    const intro = document.createElement('div');
    intro.className = 'kid-sources-list';
    intro.innerHTML = `<p class="credits-byline">LunLux, by the LunLux team.</p>
      <p>We check where our Moon facts come from.</p>
      <ul>
        <li>NASA tells us where the Sun and Earth are.</li>
        <li>NASA maps show the hills on the Moon.</li>
        <li>NASA pictures help us learn about space.</li>
        <li>Our team made the score. It is not a NASA rule.</li>
        <li>We name the people who made the tools and pictures.</li>
      </ul>`;
    const notes = document.createElement('details');
    notes.className = 'educator-credits';
    const summary = document.createElement('summary');
    summary.textContent = 'For the teacher';
    notes.append(summary, ...original.map(el => el.cloneNode(true)));
    credits.append(intro, notes);
    creditState = { original, intro, notes };
  }
  creditState.intro.hidden = !kid;
  creditState.notes.hidden = !kid;
  for (const node of creditState.original) node.hidden = kid;
}

export function syncShellCopy(level: ReadingLevel): void {
  const kid = level === 'educator';
  const put = (selector: string, child: string, adult: string) => {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) element.textContent = kid ? child : adult;
  };
  put('.overview-title-subtitle',
    'See where the Sun shines and where we can see Earth from the Moon.',
    'Sunlight and Earth contact for lunar landing sites');
  put('#overview-title-card > p:not(.overview-title-subtitle):not(.overview-audio-note)',
    'The Sun helps power a Moon lander. Seeing Earth helps it send messages home.',
    'Only the Sun and Earth determine the sunlight and direct Earth visibility we evaluate for a lunar lander. Other planets’ gravity is already included in NASA’s ephemerides.');
  put('.overview-audio-note', 'Sound is off. Press the speaker to hear it.', 'Tour sound starts off. Use the speaker button for sound.');
  put('#skip-moon', 'Go to the Moon', 'Skip to the Moon');
  put('#nav-credits', 'How we know', 'Data and methods');
  put('#globe-mode', 'See the Moon', 'Globe');
  put('#horizon-mode', 'Stand here', 'Horizon');
  put('#reset-view', 'Whole Moon', 'Reset view');
  put('#polar-view', 'South pole', 'South pole view');
  put('#enter-explore', 'Explore the Moon', 'Explore the Moon and landing sites');
  put('.site-footer', 'Our facts come from NASA. We check each hour.', 'NASA/JPL Horizons; NASA LRO LOLA; Hourly data');
  put('#date-prev', '← 7 days', '−7');
  put('#date-next', '7 days →', '+7');
  put('#credits-view > h2', 'Where do our facts come from?', 'LunLux — Credits and sources');
  syncCredits(kid);

  const siteLabel = document.querySelector('.toolbar-site')?.firstChild;
  if (siteLabel) siteLabel.textContent = kid ? 'Place ' : 'Site ';
  const hourLabel = document.querySelector('.toolbar-hour')?.firstChild;
  if (hourLabel) hourLabel.textContent = kid ? 'Look at ' : 'Inspect ';
  const groups = document.querySelectorAll<HTMLOptGroupElement>('#site-picker optgroup');
  if (groups[0]) groups[0].label = kid ? 'Places we might visit' : 'Candidate sites';
  if (groups[1]) groups[1].label = kid ? 'Places where landers went' : 'Historic landings';

  const verdicts: Record<string, [string, string, string]> = {
    clear: ['Great week', 'We can see both the Sun and Earth for most of the week.', 'Clear'],
    partial: ['Okay week', 'We can see both the Sun and Earth for some of the week.', 'Partial'],
    out: ['Hard week', 'It is hard to see the Sun and Earth together.', 'Out'],
    edge: ['Tricky week', 'A small hill or a small move may change what we can see.', 'On the edge'],
  };
  for (const [name, [child, childTip, adult]] of Object.entries(verdicts)) {
    const chip = document.querySelector<HTMLElement>('.verdict-chip.' + name);
    if (!chip) continue;
    chip.dataset.adultTip ||= chip.title;
    if (chip.lastChild) chip.lastChild.textContent = ' ' + (kid ? child : adult);
    chip.title = kid ? childTip : chip.dataset.adultTip;
  }

  const brightNote = document.getElementById('bright-note'); // D35: Educator legend line
  if (brightNote) brightNote.hidden = !kid;

  const aria = (id: string, child: string, adult: string) =>
    document.getElementById(id)?.setAttribute('aria-label', kid ? child : adult);
  aria('global-clock', 'Pick a place and a day', 'Landing site and time');
  aria('landing-date', 'Day to land on the Moon', 'Landing date UTC');
  aria('hour-slider', 'Choose a time in the week', 'Moment inspected within the seven-day stay');
  aria('verdict-legend', 'What the colors and symbols mean', 'Seven-day verdict legend');
  aria('compare-view', 'Compare weeks', 'Compare landing dates');
  aria('explore-view', 'Explore the Moon', 'Interactive lunar landing site explorer');
  aria('horizon-view', 'See what the lander sees', 'Stand here horizon panorama');
  aria('credits-view', 'Where our facts and pictures come from', 'Project credits');
  aria('overview-title-card', 'Start the Moon tour', 'Solar system tour introduction');
  aria('overview-view', 'Solar system tour', 'Sun Earth Moon overview');
  aria('overview-stage', 'Solar system picture', 'Solar system overview visualization');
  aria('moon-stage', 'Moon with places to land', 'Interactive 3D Moon with landing markers');
  aria('side-card-mount', 'What happens at this place', 'Site conditions and Educator Researcher details');
  aria('date-prev', 'Go back one week', 'Move landing date seven days earlier');
  aria('date-next', 'Go forward one week', 'Move landing date seven days later');
  for (const tip of Array.from(document.querySelectorAll<HTMLElement>('.clock-tip > summary'))) {
    tip.setAttribute('aria-label', kid ? 'For the teacher' : tip.closest('.tour-info') ?
      'About the solar system scene' : 'About the date and inspection time');
  }
  const dateLabel = document.querySelector<HTMLElement>('.toolbar-date > label.sr-only');
  if (dateLabel) dateLabel.textContent = kid ? 'Day to land' : 'Landing date UTC';
  const unavailableMoon = document.querySelector<HTMLElement>('#moon-stage.scene-unavailable');
  if (unavailableMoon) unavailableMoon.textContent = kid ?
    'The Moon picture did not load. Pick a place above to keep going.' :
    'Interactive 3D view unavailable in this browser. Choose a site from the list to continue.';
}
