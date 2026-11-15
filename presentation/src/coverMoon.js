// D35 cover Moon: NASA SVS CGI Moon Kit colour map (the same map as the site) on a slowly turning sphere.
// In the printed PDF (?print-pdf) the sphere is drawn once and swapped for a still image.
import * as THREE from "three";

export function mountCoverMoon(el, { print = false } = {}) {
  if (!el) return;
  const size = 720;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: print });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(size, size, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  el.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 10);
  camera.position.set(0, 0, 3.9);
  scene.add(new THREE.AmbientLight(0xffffff, 0.12));
  const sun = new THREE.DirectionalLight(0xfff6ea, 2.6);
  sun.position.set(-3, 0.6, 2.2); // lit from the left, so the terminator faces the slide's text
  scene.add(sun);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 }));
  moon.rotation.x = 0.12;
  scene.add(moon);
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  new THREE.TextureLoader().load("/moon/lroc_color_2k.jpg", (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    moon.material.map = tex; moon.material.needsUpdate = true;
    if (print) {
      moon.rotation.y = -0.6;
      renderer.render(scene, camera);
      const img = new Image(); img.alt = "The Moon"; img.src = renderer.domElement.toDataURL("image/png");
      renderer.domElement.replaceWith(img); renderer.dispose();
      return;
    }
    let last = performance.now();
    const tick = (t) => {
      const dt = Math.min(0.1, (t - last) / 1000); last = t;
      if (!reduce) moon.rotation.y += dt * 0.06; // about one turn every 105 seconds
      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}
