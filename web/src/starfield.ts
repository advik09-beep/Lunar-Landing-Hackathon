/**
 * D14 visual refresh: independent, lightweight depth-parallax starfield.
 * Visual reference: Hue Screen Starfield, https://www.huescreen.com/starfield/
 * Original code, not copied or embedded from the referenced website.
 *
 * Previous stars moved only 0.7–4px/sec, which appeared motionless. These
 * three layers travel ~4–42px/sec with a subtle pointer parallax. The sky
 * lives behind the app, never inside either 3D scene or data visualization.
 */
type Star = {
  x: number;
  y: number;
  depth: number;
  radius: number;
  brightness: number;
  phase: number;
  tint: string;
};

export function mountStarfield(): () => void {
  const canvas = document.createElement('canvas');
  canvas.className = 'starfield-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.dataset.effect = 'depth-parallax';
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) { canvas.remove(); return () => {}; }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let width = 0;
  let height = 0;
  let frame = 0;
  let last = 0;
  let elapsed = 0;
  let stars: Star[] = [];
  let pointerX = 0;
  let pointerY = 0;
  let parallaxX = 0;
  let parallaxY = 0;
  let seed = 20261114;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  function resize(): void {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Reinitialize consistently across screen sizes; not random per frame.
    seed = 20261114;
    stars = Array.from({ length: Math.min(460, Math.max(260, Math.round(width * height / 3600))) }, () => {
      const r = random();
      const depth = r < .50 ? .22 + random() * .19 : r < .86 ? .48 + random() * .22 : .77 + random() * .23;
      const color = random();
      return {
        x: random() * width,
        y: random() * height,
        depth,
        radius: depth < .45 ? .65 : depth < .75 ? .9 + random() * .6 : 1.5 + random() * 1.1,
        brightness: .4 + random() * .45,
        phase: random() * Math.PI * 2,
        tint: color < .71 ? '236,233,226' : color < .89 ? '214,211,204' : '245,241,232', // D35: neutral stars, no tint
      };
    });
    render();
  }

  function pointerMove(event: PointerEvent): void {
    if (reduced.matches) return;
    pointerX = (event.clientX / Math.max(1, width) - .5) * 2;
    pointerY = (event.clientY / Math.max(1, height) - .5) * 2;
  }

  function render(): void {
    ctx!.clearRect(0, 0, width, height);
    for (const s of stars) {
      const travelX = elapsed * (5 + 21 * s.depth);
      const travelY = elapsed * (4 + 39 * s.depth);
      const parallax = s.depth * s.depth;
      // Wrap both axes without a visible cut or texture seam.
      const x = ((s.x + travelX + parallaxX * parallax * 23) % (width + 16) + width + 16) % (width + 16) - 8;
      const y = ((s.y - travelY + parallaxY * parallax * 16) % (height + 16) + height + 16) % (height + 16) - 8;
      const flicker = reduced.matches ? 1 : .9 + .1 * Math.sin(elapsed * (1.15 + s.depth * 1.2) + s.phase);
      const alpha = Math.min(.9, s.brightness * flicker * (.42 + .75 * s.depth));
      const color = 'rgba(' + s.tint + ',' + alpha.toFixed(3) + ')';

      // Near stars get a short illuminated motion trail; the far sky stays calm.
      if (s.depth > .76 && !reduced.matches) {
        ctx!.strokeStyle = 'rgba(' + s.tint + ',' + (alpha * .32).toFixed(3) + ')';
        ctx!.lineWidth = s.radius * .7;
        ctx!.beginPath();
        ctx!.moveTo(x - 3.5 * s.depth, y + 7 * s.depth);
        ctx!.lineTo(x, y);
        ctx!.stroke();
      }
      ctx!.fillStyle = color;
      ctx!.beginPath();
      ctx!.arc(x, y, s.radius, 0, Math.PI * 2);
      ctx!.fill();
    }
  }

  function tick(time: number): void {
    frame = 0;
    if (reduced.matches || document.hidden) return;
    const dt = last ? Math.min(.05, (time - last) / 1000) : 0;
    last = time;
    elapsed += dt;
    const smoothing = 1 - Math.exp(-dt * 4.5);
    parallaxX += (pointerX - parallaxX) * smoothing;
    parallaxY += (pointerY - parallaxY) * smoothing;
    render();
    frame = window.requestAnimationFrame(tick);
  }

  function resume(): void {
    window.cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    render();
    if (!reduced.matches && !document.hidden) frame = window.requestAnimationFrame(tick);
  }
  function visibilityChanged(): void { resume(); }
  function resized(): void { resize(); resume(); }

  window.addEventListener('resize', resized);
  window.addEventListener('pointermove', pointerMove, { passive: true });
  document.addEventListener('visibilitychange', visibilityChanged);
  reduced.addEventListener('change', resume);
  resize();
  resume();

  return () => {
    window.cancelAnimationFrame(frame);
    window.removeEventListener('resize', resized);
    window.removeEventListener('pointermove', pointerMove);
    document.removeEventListener('visibilitychange', visibilityChanged);
    reduced.removeEventListener('change', resume);
    canvas.remove();
  };
}
