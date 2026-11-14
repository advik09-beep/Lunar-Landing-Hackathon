/**
 * D14: original modern starfield treatment behind the application only.
 * Inspired by etrepat/starfield (Estanislau Trepat, MIT License),
 * https://github.com/etrepat/starfield. No legacy 2011 Three.js APIs or
 * source code copied. The effect is a 2D decorative background, separate
 * from both scientific and illustrative 3D canvases.
 */
type Star = { x: number; y: number; size: number; speed: number; brightness: number };

export function mountStarfield(): () => void {
  const canvas = document.createElement('canvas');
  canvas.className = 'starfield-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) { canvas.remove(); return () => {}; }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let last = 0;
  let width = 0;
  let height = 0;
  let stars: Star[] = [];
  // Fixed-seed LCG: predictable appearance even after a resize.
  let seed = 3172026;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };

  function resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed = 3172026;
    stars = Array.from({ length: 180 }, () => ({
      x: random() * width, y: random() * height,
      size: .5 + random() * 1.3,
      speed: .7 + random() * 4.0,
      brightness: .28 + random() * .56,
    }));
    paint(0);
  }

  function paint(dt: number): void {
    ctx!.clearRect(0, 0, width, height);
    for (const star of stars) {
      if (!reduced.matches) {
        star.y -= dt * star.speed;
        star.x += dt * star.speed * .09;
        if (star.y < -4) { star.y += height + 8; star.x = (star.x + width * .3) % width; }
        if (star.x > width) star.x -= width;
      }
      ctx!.fillStyle = 'rgba(199,223,255,' + star.brightness.toFixed(3) + ')';
      ctx!.beginPath();
      ctx!.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx!.fill();
    }
  }

  function tick(time: number): void {
    const dt = last ? Math.min((time - last) / 1000, .05) : 0;
    last = time;
    paint(dt);
    if (!reduced.matches) frame = requestAnimationFrame(tick);
  }
  function motionChanged(): void {
    cancelAnimationFrame(frame);
    last = 0;
    paint(0);
    if (!reduced.matches) frame = requestAnimationFrame(tick);
  }
  window.addEventListener('resize', resize);
  reduced.addEventListener('change', motionChanged);
  resize();
  motionChanged();

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', resize);
    reduced.removeEventListener('change', motionChanged);
    canvas.remove();
  };
}
