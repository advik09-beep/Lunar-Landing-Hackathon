import * as THREE from 'three';
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

type Marker = {
  site: MoonSite;
  object: THREE.Mesh;
  halo: THREE.Mesh;
  normal: THREE.Vector3;
};

const palette: Record<Verdict, number> = {
  clear: 0x9accff,
  partial: 0x4b89c9,
  out: 0x27374f,
  edge: 0xeab14e,
  unavailable: 0x7b859a,
};

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
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private markers: Marker[] = [];
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private selected: string | null = null;
  private hovered: string | null = null;
  private targetCamera: THREE.Vector3 | null = null;
  private targetFocus: THREE.Vector3 | null = null;
  private animationFrame = 0;
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

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
    this.camera.position.set(2.6, 1.4, 3.4);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.minDistance = 1.38;
    this.controls.maxDistance = 7.2;
    this.controls.enablePan = false;

    this.scene.add(new THREE.AmbientLight(0xe0ebff, 1.08));
    const key = new THREE.DirectionalLight(0xf8f3ea, 2.6);
    key.position.set(4, 3, 6);
    this.scene.add(key);
    const rim = new THREE.DirectionalLight(0x8bb9ff, 0.85);
    rim.position.set(-3, -1, -3);
    this.scene.add(rim);

    const moonMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 1, metalness: 0,
    });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), moonMaterial);
    // D11(a) NASA CGI Moon Kit: equirectangular, north up, 0° at centre,
    // east-positive longitudes. Lane A verified default SphereGeometry UVs
    // against LOLA: no mesh rotation, UV offset or marker rotation.
    this.scene.add(moon);
    new THREE.TextureLoader().load(
      '/moon/lroc_color_2k.jpg',
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
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.023, 16, 12),
        new THREE.MeshBasicMaterial({ color: palette.unavailable }),
      );
      marker.position.copy(normal).multiplyScalar(1.037);
      marker.userData.siteId = site.id;
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(0.032, 16, 12),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, depthWrite: false }),
      );
      halo.position.copy(normal).multiplyScalar(1.033);
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

  setVerdicts(values: Map<string, Verdict>): void {
    for (const m of this.markers) {
      const verdict = values.get(m.site.id) ?? 'unavailable';
      (m.object.material as THREE.MeshBasicMaterial).color.setHex(palette[verdict]);
      m.halo.visible = verdict !== 'out';
    }
  }

  focusSite(id: string): void {
    const marker = this.markers.find(m => m.site.id === id);
    if (!marker) return;
    this.selected = id;
    const position = marker.normal.clone().multiplyScalar(2.0);
    this.targetCamera = position;
    this.targetFocus = marker.normal.clone().multiplyScalar(0.18);
    for (const m of this.markers) {
      m.halo.scale.setScalar(m.site.id === id ? 1.8 : 1);
      (m.halo.material as THREE.MeshBasicMaterial).opacity = m.site.id === id ? 0.5 : 0.12;
    }
  }

  focusSouthPole(): void {
    this.targetCamera = new THREE.Vector3(0.0, -2.1, 0.45);
    this.targetFocus = new THREE.Vector3(0, -0.15, 0);
  }

  resetView(): void {
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
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
