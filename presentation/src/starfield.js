// D37: the site's drifting starfield (web/src/starfield.ts, same seed, speeds and neutral colours) behind every
// slide. In the printed PDF (?print-pdf) one still frame is drawn and used as each slide's background instead.
export function mountStarfield({ print = false } = {}) {
  let seed = 20261114;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const makeStars = (width, height) => {
    seed = 20261114;
    return Array.from({ length: Math.min(460, Math.max(260, Math.round(width * height / 3600))) }, () => {
      const r = random();
      const depth = r < .50 ? .22 + random() * .19 : r < .86 ? .48 + random() * .22 : .77 + random() * .23;
      const color = random();
      return { x: random() * width, y: random() * height, depth,
        radius: depth < .45 ? .65 : depth < .75 ? .9 + random() * .6 : 1.5 + random() * 1.1,
        brightness: .4 + random() * .45, phase: random() * Math.PI * 2,
        tint: color < .71 ? "236,233,226" : color < .89 ? "214,211,204" : "245,241,232" };
    });
  };
  const draw = (ctx, stars, width, height, elapsed, still) => {
    ctx.clearRect(0, 0, width, height);
    for (const s of stars) {
      const x = ((s.x + elapsed * (5 + 21 * s.depth)) % (width + 16) + width + 16) % (width + 16) - 8;
      const y = ((s.y - elapsed * (4 + 39 * s.depth)) % (height + 16) + height + 16) % (height + 16) - 8;
      const flicker = still ? 1 : .9 + .1 * Math.sin(elapsed * (1.15 + s.depth * 1.2) + s.phase);
      const alpha = Math.min(.9, s.brightness * flicker * (.42 + .75 * s.depth));
      if (s.depth > .76 && !still) {
        ctx.strokeStyle = `rgba(${s.tint},${(alpha * .32).toFixed(3)})`; ctx.lineWidth = s.radius * .7;
        ctx.beginPath(); ctx.moveTo(x - 3.5 * s.depth, y + 7 * s.depth); ctx.lineTo(x, y); ctx.stroke();
      }
      ctx.fillStyle = `rgba(${s.tint},${alpha.toFixed(3)})`;
      ctx.beginPath(); ctx.arc(x, y, s.radius, 0, Math.PI * 2); ctx.fill();
    }
  };
  if (print) {
    // One still frame at the deck's size, as every slide's background.
    const w = 1440, h = 810, c = document.createElement("canvas"); c.width = w * 2; c.height = h * 2;
    const ctx = c.getContext("2d"); ctx.setTransform(2, 0, 0, 2, 0, 0);
    draw(ctx, makeStars(w, h), w, h, 0, true);
    document.documentElement.style.setProperty("--print-stars", `url(${c.toDataURL("image/png")})`);
    document.documentElement.classList.add("print-stars");
    return;
  }
  const canvas = document.createElement("canvas");
  canvas.className = "deck-starfield"; canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d", { alpha: true });
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let width = 1, height = 1, stars = [], elapsed = 0, last = 0;
  const resize = () => {
    width = Math.max(1, window.innerWidth); height = Math.max(1, window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px"; canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = makeStars(width, height);
    draw(ctx, stars, width, height, elapsed, reduced.matches);
  };
  const tick = (t) => {
    const dt = last ? Math.min(.05, (t - last) / 1000) : 0; last = t;
    if (!reduced.matches && !document.hidden) { elapsed += dt; draw(ctx, stars, width, height, elapsed, false); }
    requestAnimationFrame(tick);
  };
  window.addEventListener("resize", resize);
  resize(); requestAnimationFrame(tick);
}
