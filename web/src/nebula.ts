import * as THREE from 'three';

// Original decorative canvas art. No sky coordinates, terrain or lighting data.
export function createNebulaBackground(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Nebula canvas unavailable');
  const hash = (x: number, y: number): number => {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const noise = (x: number, y: number): number => {
    const ix = Math.floor(x), iy = Math.floor(y);
    let fx = x - ix, fy = y - iy;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    return (hash(ix, iy) * (1 - fx) + hash(ix + 1, iy) * fx) * (1 - fy)
      + (hash(ix, iy + 1) * (1 - fx) + hash(ix + 1, iy + 1) * fx) * fy;
  };
  const fbm = (x: number, y: number): number => {
    let value = 0, amplitude = .55;
    for (let i = 0; i < 5; i++) {
      value += noise(x, y) * amplitude;
      x = x * 2.03 + 7.1;
      y = y * 2.03 - 3.7;
      amplitude *= .5;
    }
    return value;
  };
  const pixels = ctx.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const u = x / canvas.width, v = y / canvas.height;
      const turbulence = fbm(u * 6, v * 6);
      const band = Math.exp(-Math.pow((v - .58 + .32 * (u - .5) + .12 * turbulence) / .25, 2));
      const cloud = Math.pow(Math.max(0, fbm(u * 8 + turbulence * 3, v * 8) - .23), 1.6) * band;
      const dust = .4 + .6 * fbm(u * 18, v * 18);
      const teal = Math.max(0, (u - .48) * 2);
      const i = (y * canvas.width + x) * 4;
      pixels.data[i] = 3 + cloud * dust * (68 - teal * 45);
      pixels.data[i + 1] = 5 + cloud * dust * (32 + teal * 62);
      pixels.data[i + 2] = 13 + cloud * dust * 135;
      pixels.data[i + 3] = 255;
    }
  }
  ctx.putImageData(pixels, 0, 0);
  for (let i = 0; i < 950; i++) {
    const x = hash(i, 11) * canvas.width, y = hash(i, 73) * canvas.height;
    const bright = hash(i, 49);
    ctx.fillStyle = 'rgba(215,228,255,' + (.13 + bright * .53) + ')';
    ctx.beginPath();
    ctx.arc(x, y, bright > .98 ? 1.1 : .35 + bright * .35, 0, Math.PI * 2);
    ctx.fill();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
