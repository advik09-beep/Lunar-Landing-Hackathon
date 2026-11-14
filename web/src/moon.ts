import * as THREE from 'three';
import { THEME } from './panels/shared';
import { createNebulaBackground } from './nebula';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export type MoonSite = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  kind?: string;
  coordsVerified?: boolean;
};
export type Verdict = 'clear' | 'partial' | 'out' | 'edge' | 'unavailable';

// Moon-fixed MOON_ME, east-positive (Lane A API v1.3). The 3D mapping is
// exactly the same as spherePoint(): (X, Y, Z) -> (X, Z, -Y).
export type SceneState = {
  sampleUtc: string;
  sun: { dir: number[]; distKm: number };
  earth: { dir: number[]; distKm: number };
};
const toThree = ([x, y, z]: readonly number[]): THREE.Vector3 =>
  new THREE.Vector3(x, z, -y);


type Marker = {
  site: MoonSite;
  object: THREE.Sprite;
  halo: THREE.Mesh;
  normal: THREE.Vector3;
};

const palette: Record<Verdict,string> = {
  clear:THEME.clear, partial:THEME.partial, out:THEME.out, edge:THEME.edge, unavailable:THEME.warn,
};
const symbols: Record<Verdict,string> = {clear:'✓',partial:'◐',out:'✕',edge:'⚠',unavailable:'?'};

function spherePoint(lat: number, lon: number, radius = 1): THREE.Vector3 {
  // Mean Earth / polar-axis frame, east-positive. Display rotation: (x,z,-y).
  const a = THREE.MathUtils.degToRad(lat);
  const b = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(
    Math.cos(a) * Math.cos(b) * radius,
    Math.sin(a) * radius,
    -Math.cos(a) * Math.sin(b) * radius,
  );
}

export class LunarScene {
  private renderer: THREE.WebGLRenderer;
  private readonly ambientLight: THREE.AmbientLight;
  private readonly sunLight: THREE.DirectionalLight;
  private readonly nebula: THREE.CanvasTexture;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private markers: Marker[] = [];
  private pinTextures = new Map<Verdict, THREE.CanvasTexture>();
  private pinTexture(verdict: Verdict): THREE.CanvasTexture {
    const cached = this.pinTextures.get(verdict); if (cached) return cached;
    const canvas = document.createElement('canvas'); canvas.width=96; canvas.height=128;
    const c=canvas.getContext('2d')!;
    c.strokeStyle=palette[verdict]; c.fillStyle=THEME.bg; c.lineWidth=5;
    if(verdict==='edge') c.setLineDash([7,5]);
    c.beginPath(); c.moveTo(28,72); c.lineTo(48,112); c.lineTo(68,72); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.arc(48,44,34,0,Math.PI*2); c.fillStyle=verdict==='clear'?palette.clear:THEME.bg; c.fill(); c.stroke();
    c.setLineDash([]);
    if(verdict==='partial') { c.save(); c.beginPath(); c.rect(12,8,36,72); c.clip(); c.beginPath(); c.arc(48,44,31,0,Math.PI*2); c.fillStyle=palette.partial; c.globalAlpha=.35; c.fill(); c.restore(); }
    c.fillStyle=verdict==='clear'?'#0B1322':palette[verdict]; c.font='bold 39px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(symbols[verdict],48,45);
    const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace; this.pinTextures.set(verdict,texture); return texture;
  }
  private readonly poleCallouts: Array<{id:string;sprite:THREE.Sprite;leader:THREE.Line}> = [];
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private selected: string | null = null;
  private hovered: string | null = null;
  private targetCamera: THREE.Vector3 | null = null;
  private targetFocus: THREE.Vector3 | null = null;
  private animationFrame = 0;
  private visible = true;
  setVisible(visible: boolean): void {
    if (this.visible === visible) return;
    this.visible = visible;
    cancelAnimationFrame(this.animationFrame);
    if (visible) { this.resize(); this.animate(); }
  }
  private resizeObserver: ResizeObserver;
  private downPosition: { x: number; y: number } | null = null;
  private readonly onPointerMove: (event: PointerEvent) => void;
  private readonly onPointerDown: (event: PointerEvent) => void;
  private readonly onPointerUp: (event: PointerEvent) => void;

  constructor(
    private readonly container: HTMLElement,
    sites: MoonSite[],
    private readonly onSelect: (id: string) => void,
  ) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.5;
    this.container.appendChild(this.renderer.domElement);

    this.nebula = createNebulaBackground();
    this.scene.background = this.nebula;

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
    this.camera.position.set(2.6, 1.4, 3.4);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.minDistance = 1.38;
    this.controls.maxDistance = 7.2;
    this.controls.enablePan = false;

    // One authoritative Sun source from Lane A scene data; no second key/rim
    // that would incorrectly illuminate the Moon's true night side.
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.32);
    this.scene.add(this.ambientLight);
    this.sunLight = new THREE.DirectionalLight(0xfff9ed, 0);
    this.sunLight.position.set(10, 0, 0);
    this.sunLight.target.position.set(0, 0, 0);
    this.scene.add(this.sunLight, this.sunLight.target);

    const moonMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 1, metalness: 0,
    });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), moonMaterial);
    // D11(a) NASA CGI Moon Kit: equirectangular, north up, 0° at centre,
    // east-positive longitudes. Lane A verified default SphereGeometry UVs
    // against LOLA: no mesh rotation, UV offset or marker rotation.
    this.scene.add(moon);
    new THREE.TextureLoader().load(
      '/moon/lroc_color_4k.jpg',
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
        moonMaterial.map = texture;
        moonMaterial.needsUpdate = true;
      },
      undefined,
      (error) => console.error('NASA CGI Moon Kit texture failed to load:', error),
    );

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.018, 64, 48),
      new THREE.MeshBasicMaterial({ color: 0x9ab4db, transparent: true, opacity: 0.035, side: THREE.BackSide, depthWrite: false }),
    );
    this.scene.add(atmosphere);

    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x7692bb, transparent: true, opacity: 0.19 });
    for (const lat of [-60, -30, 0, 30, 60]) {
      const points = Array.from({ length: 145 }, (_, i) => spherePoint(lat, i * 2.5 - 180, 1.006));
      this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMaterial));
    }
    for (const lon of [-120, -60, 0, 60, 120, 180]) {
      const points = Array.from({ length: 101 }, (_, i) => spherePoint(i * 1.8 - 90, lon, 1.006));
      this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMaterial));
    }

    for (const site of sites) {
      if (!Number.isFinite(site.lat) || !Number.isFinite(site.lon)) continue;
      const normal = spherePoint(site.lat, site.lon);
      const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map:this.pinTexture('unavailable'), transparent:true, depthWrite:false }));
      marker.scale.set(.105,.14,1);
      marker.center.set(.5,.12);
      marker.position.copy(normal).multiplyScalar(1.035);
      marker.userData.siteId = site.id;
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.047, 0.058, 32),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide }),
      );
      halo.position.copy(normal).multiplyScalar(1.054);
      halo.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      halo.visible = false; // only the selected site has a ring
      this.scene.add(halo, marker);
      this.markers.push({ site, object: marker, halo, normal });
    }

    this.onPointerDown = (e) => { this.downPosition = { x: e.clientX, y: e.clientY }; this.targetCamera = null; };
    this.onPointerUp = (e) => {
      if (!this.downPosition || Math.hypot(e.clientX - this.downPosition.x, e.clientY - this.downPosition.y) > 7) return;
      const id = this.hitTest(e);
      if (id) this.onSelect(id);
      this.downPosition = null;
    };
    this.onPointerMove = (e) => {
      const id = this.hitTest(e);
      if (id !== this.hovered) {
        this.hovered = id;
        this.renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
        this.renderer.domElement.title = id ? this.markers.find(m => m.site.id === id)?.site.name ?? '' : 'Drag to rotate the Moon';
      }
    };
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.addEventListener('pointerup', this.onPointerUp);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.animate();
  }

  private hitTest(e: PointerEvent): string | null {
    const bounds = this.renderer.domElement.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return null;
    this.pointer.set((e.clientX - bounds.left) / bounds.width * 2 - 1, -(e.clientY - bounds.top) / bounds.height * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.markers.map(m => m.object));
    const nearest = hits[0];
    // Prevent clicking markers that are currently behind the Moon.
    if (nearest) {
      const normal = nearest.object.position.clone().normalize();
      if (normal.dot(this.camera.position.clone().sub(nearest.object.position)) > 0) {
        return nearest.object.userData.siteId as string;
      }
    }
    return null;
  }

  setSceneState(state: SceneState): void {
    if ([state.sun.dir, state.earth.dir].some(v => v.length !== 3 || !v.every(Number.isFinite))) {
      throw new Error('Invalid Moon-fixed direction vectors from scene data');
    }
    const sun = toThree(state.sun.dir).normalize();
    // The Moon is fixed; the actual Sun direction changes with UTC.
    this.sunLight.position.copy(sun).multiplyScalar(10);
    this.sunLight.intensity = 3.2;
    this.ambientLight.intensity = 0.065;

  }

  clearSceneState(): void {
    // Never retain a previous date's lighting when data are unavailable.
    this.sunLight.intensity = 0;
    this.ambientLight.intensity = 0.32; // neutral inspection light, not ephemeris
  }

  setVerdicts(values: Map<string, Verdict>): void {
    const descriptions: string[] = [];
    for (const m of this.markers) {
      const verdict = values.get(m.site.id) ?? 'unavailable';
      descriptions.push(m.site.name + ': ' + verdict);
      m.object.material.map = this.pinTexture(verdict);
      m.object.material.needsUpdate = true;
      // Never cover an opaque verdict-colored marker with a larger white halo.
      m.halo.visible = m.site.id === this.selected;
      (m.halo.material as THREE.MeshBasicMaterial).opacity = m.site.id === this.selected ? .85 : .40;
    }
    // Also expose marker meaning to assistive technology, not only colors.
    this.renderer.domElement.setAttribute('aria-label', '3D Moon markers by seven-day landing verdict: ' + descriptions.join('; '));
  }

  private setPoleCallouts(visible:boolean): void {
    for(const item of this.poleCallouts){item.sprite.visible=visible;item.leader.visible=visible;}
  }

  focusSite(id: string): void {
    const marker = this.markers.find(m => m.site.id === id);
    if (!marker) return;
    this.selected = id;
    this.setPoleCallouts(marker.site.kind === 'south-pole');
    const position = marker.normal.clone().multiplyScalar(2.0);
    this.targetCamera = position;
    this.targetFocus = marker.normal.clone().multiplyScalar(0.18);
    for (const m of this.markers) {
      m.halo.scale.setScalar(m.site.id === id ? 1.3 : 1);
      m.halo.visible = true;
      (m.halo.material as THREE.MeshBasicMaterial).opacity = m.site.id === id ? 0.5 : 0.12;
    }
  }

  focusSouthPole(): void {
    this.setPoleCallouts(true);
    this.targetCamera = new THREE.Vector3(0.0, -2.1, 0.45);
    this.targetFocus = new THREE.Vector3(0, -0.15, 0);
  }

  resetView(): void {
    this.setPoleCallouts(false);
    this.selected = null;
    this.targetCamera = new THREE.Vector3(2.6, 1.4, 3.4);
    this.targetFocus = new THREE.Vector3(0, 0, 0);
  }

  private resize(): void {
    const w = Math.max(1, this.container.clientWidth);
    const h = Math.max(1, this.container.clientHeight);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  private animate = (): void => {
    if (!this.visible || document.hidden) { this.animationFrame = requestAnimationFrame(this.animate); return; }
    this.animationFrame = requestAnimationFrame(this.animate);
    if (this.targetCamera && this.targetFocus) {
      this.camera.position.lerp(this.targetCamera, 0.07);
      this.controls.target.lerp(this.targetFocus, 0.07);
      if (this.camera.position.distanceTo(this.targetCamera) < 0.004) {
        this.targetCamera = null;
        this.targetFocus = null;
      }
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  destroy(): void {
    for (const texture of this.pinTextures.values()) texture.dispose();
    this.pinTextures.clear();
    cancelAnimationFrame(this.animationFrame);
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp);
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.controls.dispose();
    this.scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) {
          if ('map' in material && material.map instanceof THREE.Texture) material.map.dispose();
          material.dispose();
        }
      } else if (object instanceof THREE.Line) {
        object.geometry.dispose();
        (object.material as THREE.Material).dispose();
      } else if (object instanceof THREE.Sprite) {
        const material = object.material as THREE.SpriteMaterial;
        material.map?.dispose();
        material.dispose();
      }
    });
    this.nebula.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
