import * as THREE from 'three';
import { THEME } from './panels/shared';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export type MoonSite = {
  id: string;
  name: string;
  shortName?: string;
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
  halo: THREE.Sprite;
  normal: THREE.Vector3;
};

const palette: Record<Verdict,string> = {
  clear:THEME.clear, partial:THEME.partial, out:THEME.out, edge:THEME.edge, unavailable:THEME.muted,
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
  private readonly ambientLight: THREE.AmbientLight;
  private readonly sunLight: THREE.DirectionalLight;
  private readonly inspectionLight: THREE.DirectionalLight;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private markers: Marker[] = [];
  private pinTextures = new Map<Verdict, THREE.CanvasTexture>();
  private readonly selectionTexture = (() => {
    const canvas = document.createElement('canvas'); canvas.width = 96; canvas.height = 128;
    const c = canvas.getContext('2d')!;
    c.strokeStyle = THEME.text; c.lineWidth = 4;
    c.beginPath(); c.arc(48, 44, 42, 0, Math.PI * 2); c.stroke();
    return new THREE.CanvasTexture(canvas);
  })();
  private pinTexture(verdict: Verdict): THREE.CanvasTexture {
    const cached = this.pinTextures.get(verdict); if (cached) return cached;
    const canvas = document.createElement('canvas'); canvas.width=96; canvas.height=128;
    const c=canvas.getContext('2d')!;
    // D36: a solid coloured body with a dark outline (green Clear/Partial, coral Out, violet On the edge),
    // holding the grey Moon-phase icon on a dark disc, so the verdict reads on the lit and the dark Moon.
    const body = verdict === 'clear' || verdict === 'partial' ? THEME.pinGood : verdict === 'out' ? THEME.pinOut : verdict === 'edge' ? THEME.pinEdge : THEME.pinNone;
    c.lineJoin='round'; c.strokeStyle=THEME.pinInk; c.fillStyle=body; c.lineWidth=6;
    c.beginPath(); c.moveTo(25,70); c.lineTo(48,114); c.lineTo(71,70); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.arc(48,44,38,0,Math.PI*2); c.fill(); c.stroke();
    c.fillStyle=body; c.fillRect(30,66,36,10); // join head and tip without an inner seam
    c.fillStyle=THEME.bg; c.beginPath(); c.arc(48,44,27,0,Math.PI*2); c.fill();
    c.strokeStyle=THEME.pinInk; c.lineWidth=2; c.stroke();
    c.save(); c.translate(48,44);
    if (verdict === 'clear') {
      c.fillStyle=palette.clear; c.beginPath(); c.arc(0,0,20,0,Math.PI*2); c.fill();
    } else if (verdict === 'partial') {
      c.fillStyle=THEME.outFill; c.beginPath(); c.arc(0,0,19,0,Math.PI*2); c.fill();
      c.strokeStyle=palette.partial; c.lineWidth=3.5; c.stroke();
      c.fillStyle=palette.partial; c.beginPath(); c.arc(0,0,19,-Math.PI/2,Math.PI/2); c.closePath(); c.fill();
    } else if (verdict === 'out') {
      c.fillStyle=THEME.outFill; c.strokeStyle=palette.out; c.lineWidth=3;
      c.beginPath(); c.arc(0,0,19,0,Math.PI*2); c.fill(); c.stroke();
    } else if (verdict === 'edge') {
      c.strokeStyle=palette.edge; c.lineWidth=3.5; c.setLineDash([6,5]);
      c.beginPath(); c.arc(0,0,18,0,Math.PI*2); c.stroke(); c.setLineDash([]);
      c.fillStyle=palette.edge; c.beginPath(); c.arc(0,0,5,0,Math.PI*2); c.fill();
    } else {
      c.strokeStyle=palette.unavailable; c.lineWidth=3.5;
      c.beginPath(); c.arc(0,0,18,0,Math.PI*2); c.stroke();
      c.beginPath(); c.moveTo(-8,0); c.lineTo(8,0); c.stroke();
    }
    c.restore();
    const texture=new THREE.CanvasTexture(canvas); texture.colorSpace=THREE.SRGBColorSpace; this.pinTextures.set(verdict,texture); return texture;
  }
  private readonly poleCallouts: Array<{id:string;sprite:THREE.Sprite;leader:THREE.Line}> = [];
  private pinHeads: Array<{ id: string; x: number; y: number }> = []; // pin heads on screen (for label placement)
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private selected: string | null = null;
  private hovered: string | null = null;
  private readingLevel: 'educator' | 'researcher' = 'educator';
  private selectedNameLabel!: HTMLDivElement;
  private hoveredNameLabel!: HTMLDivElement;
  private earthOverheadLabel!: HTMLDivElement;
  private earthOverheadSprite!: THREE.Sprite;
  private earthHorizonRing!: THREE.Line;
  private earthExplanation!: HTMLDivElement;
  private earthOverheadNormal = new THREE.Vector3();
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
    this.selectedNameLabel = this.createMapLabel('moon-site-label selected');
    this.hoveredNameLabel = this.createMapLabel('moon-site-label hovered');
    this.earthOverheadLabel = this.createMapLabel('moon-site-label earth-overhead-label');
    this.earthOverheadLabel.textContent = 'Earth is straight above here';
    this.earthOverheadLabel.setAttribute('role', 'button');
    this.earthOverheadLabel.setAttribute('aria-label', 'Earth is straight above here. Read explanation');
    this.earthOverheadLabel.tabIndex = 0;
    this.earthOverheadLabel.addEventListener('click', () => this.toggleEarthExplanation());
    this.earthOverheadLabel.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.toggleEarthExplanation(); }
    });
    this.earthExplanation = document.createElement('div');
    this.earthExplanation.className = 'earth-explanation';
    this.earthExplanation.hidden = true;
    this.earthExplanation.setAttribute('role', 'note');
    const heading = document.createElement('strong');
    heading.textContent = 'Earth on the Moon';
    const description = document.createElement('p');
    description.textContent = 'At the blue dot, Earth is directly overhead. Along the dashed blue circle, Earth sits on the geometric horizon. Beyond that circle, the Moon blocks Earth. Nearby hills can also block the view.';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'earth-explanation-close';
    close.textContent = 'Close';
    close.addEventListener('click', () => this.toggleEarthExplanation(false));
    this.earthExplanation.append(heading, description, close);
    this.container.append(this.earthExplanation);

    // Transparent canvas lets the shared moving starfield continue behind the Moon.
    this.renderer.setClearColor(0x000000, 0);

    this.camera = new THREE.PerspectiveCamera(42, 1, 0.01, 100);
    this.camera.position.set(2.6, 1.4, 3.4);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.minDistance = 1.38;
    this.controls.maxDistance = 7.2;
    this.controls.enablePan = false;

    // Sun direction remains data-driven. This faint camera-side light is a labeled visual aid.
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.14);
    this.scene.add(this.ambientLight);
    this.inspectionLight = new THREE.DirectionalLight(0xd8d6d0, 0.24);
    this.scene.add(this.inspectionLight);
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
      new THREE.MeshBasicMaterial({ color: 0xbdbab3, transparent: true, opacity: 0.035, side: THREE.BackSide, depthWrite: false }),
    );
    this.scene.add(atmosphere);

    // The sub-Earth point is where Earth would be directly overhead from the lunar surface.
    // Its Moon-fixed direction comes from the same time-dependent JPL scene as lighting.
    const earthCanvas = document.createElement('canvas'); earthCanvas.width = 64; earthCanvas.height = 64;
    const earthContext = earthCanvas.getContext('2d')!;
    earthContext.fillStyle = THEME.earth;
    earthContext.beginPath(); earthContext.arc(32,32,19,0,Math.PI*2); earthContext.fill();
    earthContext.strokeStyle = THEME.text; earthContext.lineWidth = 4;
    earthContext.beginPath(); earthContext.arc(32,32,19,0,Math.PI*2); earthContext.stroke();
    const earthTexture = new THREE.CanvasTexture(earthCanvas);
    earthTexture.colorSpace = THREE.SRGBColorSpace;
    this.earthOverheadSprite = new THREE.Sprite(new THREE.SpriteMaterial({map:earthTexture,transparent:true,depthWrite:false}));
    this.earthOverheadSprite.scale.set(.12,.12,1);
    this.earthOverheadSprite.visible = false;
    this.scene.add(this.earthOverheadSprite);

    // The great circle perpendicular to the Moon-fixed direction to Earth:
    // every point on this line has Earth at exactly 0° geometric elevation.
    // This is not a terrain-aware skyline; the Horizon panel handles terrain.
    const horizonPoints = Array.from({ length: 257 }, (_, i) => {
      const angle = i * Math.PI * 2 / 256;
      return new THREE.Vector3(Math.cos(angle) * 1.025, Math.sin(angle) * 1.025, 0);
    });
    const horizonMaterial = new THREE.LineDashedMaterial({
      color: THEME.earth, dashSize: 0.045, gapSize: 0.028, transparent: true, opacity: 0.85, depthWrite: false,
    });
    this.earthHorizonRing = new THREE.Line(new THREE.BufferGeometry().setFromPoints(horizonPoints), horizonMaterial);
    this.earthHorizonRing.computeLineDistances();
    this.earthHorizonRing.visible = false;
    this.scene.add(this.earthHorizonRing);

    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x8a8780, transparent: true, opacity: 0.19 });
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
      const marker = new THREE.Sprite(new THREE.SpriteMaterial({ map:this.pinTexture('unavailable'), transparent:true, depthWrite:false, depthTest:false }));
      marker.renderOrder = 3;
      marker.scale.set(.105,.14,1);
      marker.center.set(.5,.12);
      marker.position.copy(normal).multiplyScalar(1.035);
      marker.userData.siteId = site.id;
      // Same billboard, anchor, size and position: ring stays concentric with the pin head
      // from every camera angle, including the closely spaced south-pole sites.
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: this.selectionTexture, transparent: true, opacity: .85, depthWrite: false, depthTest: false,
      }));
      halo.position.copy(marker.position);
      halo.center.copy(marker.center);
      halo.scale.copy(marker.scale);
      halo.renderOrder = 1;
      halo.visible = false; // only the selected site has a ring
      this.scene.add(halo, marker);
      this.markers.push({ site, object: marker, halo, normal });
    }

    this.onPointerDown = (e) => { this.downPosition = { x: e.clientX, y: e.clientY }; this.targetCamera = null; };
    this.onPointerUp = (e) => {
      if (!this.downPosition || Math.hypot(e.clientX - this.downPosition.x, e.clientY - this.downPosition.y) > 7) return;
      const id = this.hitTest(e);
      if (this.earthOverheadSprite.visible &&
          this.earthOverheadNormal.dot(this.camera.position.clone().normalize()) > 0.1 &&
          this.raycaster.intersectObject(this.earthOverheadSprite).length > 0) {
        this.toggleEarthExplanation();
      } else if (id) this.onSelect(id);
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

  private toggleEarthExplanation(open = this.earthExplanation.hidden): void {
    this.earthExplanation.hidden = !open;
    this.earthOverheadLabel.setAttribute('aria-expanded', String(open));
  }

  private hitTest(e: PointerEvent): string | null {
    const bounds = this.renderer.domElement.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return null;
    this.pointer.set((e.clientX - bounds.left) / bounds.width * 2 - 1, -(e.clientY - bounds.top) / bounds.height * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.markers.filter(m => m.object.visible).map(m => m.object)); // D36: only pins on the near side
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

  private createMapLabel(className: string): HTMLDivElement {
    const element = document.createElement('div');
    element.className = className;
    element.hidden = true;
    this.container.append(element);
    return element;
  }

  /** Put a site's name beside its pin, in the spot that covers the fewest other pins (D36, kept in D37). */
  private positionPinLabel(element: HTMLDivElement, m: Marker): void {
    if (!m.object.visible) { element.hidden = true; return; }
    const w = this.container.clientWidth, h = this.container.clientHeight;
    const p = m.object.position.clone().project(this.camera);
    if (p.z < -1 || p.z > 1) { element.hidden = true; return; }
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2);
    const pxPerUnit = (h / 2) / (this.camera.position.distanceTo(m.object.position) * tanHalf);
    const x = (p.x + 1) * .5 * w, tipY = (1 - p.y) * .5 * h;
    const headY = tipY - m.object.scale.y * pxPerUnit * 0.54, gap = m.object.scale.x * pxPerUnit * 0.45 + 8;
    element.hidden = false;
    const lw = element.offsetWidth || 200, lh = element.offsetHeight || 30, r = m.object.scale.x * pxPerUnit * 0.42;
    const others = this.pinHeads.filter((q) => q.id !== m.site.id);
    // Try right, left and above the pin; keep the spot that covers the fewest other pins (and stays inside the view).
    const spots: { left: number; top: number; d: number }[] = [];
    for (const d of [0, 36, 72, 110]) {
      spots.push({ left: x + gap + d, top: headY - lh / 2, d }, { left: x - gap - lw - d, top: headY - lh / 2, d });
      spots.push({ left: x - lw / 2, top: headY - gap - lh - 4 - d, d }, { left: x - lw / 2, top: tipY + 6 + d, d });
    }
    const cost = (sp: { left: number; top: number; d: number }) =>
      others.filter((q) => q.x + r > sp.left && q.x - r < sp.left + lw && q.y + r > sp.top && q.y - r < sp.top + lh + r).length * 1000
      + (sp.left < 4 || sp.left + lw > w - 4 || sp.top < 4 || sp.top + lh > h - 4 ? 5000 : 0) + sp.d;
    const best = spots.reduce((a2, b2) => (cost(b2) < cost(a2) ? b2 : a2));
    element.style.left = best.left + 'px';
    element.style.top = best.top + 'px';
    element.style.transform = 'none';
  }

  private positionMapLabel(element: HTMLDivElement, surfaceNormal: THREE.Vector3, offset: number, besidePin = false): void {
    // No labels on the far side of the Moon; the foreground Moon always occludes them.
    if (surfaceNormal.dot(this.camera.position.clone().normalize()) < .09) { element.hidden = true; return; }
    const position = surfaceNormal.clone().multiplyScalar(offset).project(this.camera);
    if (position.z < -1 || position.z > 1) { element.hidden = true; return; }
    const width = this.container.clientWidth;
    const x = (position.x + 1) * .5 * width;
    const y = (1 - position.y) * .5 * this.container.clientHeight;
    if (besidePin) {
      // Anchor at the actual pin rather than beyond it, then put text to the side.
      // Flip left close to the right edge so the full site name stays readable.
      const flip = x > width - 245;
      element.style.left = (x + (flip ? -22 : 22)) + 'px';
      element.style.top = y + 'px';
      element.style.transform = flip ? 'translate(-100%, -50%)' : 'translate(0, -50%)';
    } else {
      element.style.left = x + 'px';
      element.style.top = y + 'px';
      element.style.transform = 'translate(-50%, -100%)';
    }
    element.hidden = false;
  }

  private updateMapLabels(): void {
    const selected = this.markers.find(marker => marker.site.id === this.selected);
    if (selected) {
      this.selectedNameLabel.textContent = this.readingLevel === 'educator' ? (selected.site.shortName || selected.site.name) : selected.site.name;
      this.positionPinLabel(this.selectedNameLabel, selected);
    } else this.selectedNameLabel.hidden = true;
    const hovered = this.markers.find(marker => marker.site.id === this.hovered && marker.site.id !== this.selected);
    if (hovered) {
      this.hoveredNameLabel.textContent = hovered.site.name;
      this.positionPinLabel(this.hoveredNameLabel, hovered);
    } else this.hoveredNameLabel.hidden = true;
    if (this.earthOverheadSprite.visible) this.positionMapLabel(this.earthOverheadLabel, this.earthOverheadNormal, 1.05, true);
    else this.earthOverheadLabel.hidden = true;
  }

  setSceneState(state: SceneState): void {
    if ([state.sun.dir, state.earth.dir].some(v => v.length !== 3 || !v.every(Number.isFinite))) {
      throw new Error('Invalid Moon-fixed direction vectors from scene data');
    }
    const sun = toThree(state.sun.dir).normalize();
    // The Moon is fixed; the actual Sun direction changes with UTC.
    this.sunLight.position.copy(sun).multiplyScalar(10);
    this.sunLight.intensity = 3.2;
    this.ambientLight.intensity = 0.14;
    this.earthOverheadNormal.copy(toThree(state.earth.dir)).normalize();
    this.earthOverheadSprite.position.copy(this.earthOverheadNormal).multiplyScalar(1.05);
    this.earthOverheadSprite.visible = true;
    this.earthHorizonRing.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), this.earthOverheadNormal);
    this.earthHorizonRing.visible = true;
  }

  clearSceneState(): void {
    // Never retain a previous date's lighting when data are unavailable.
    this.sunLight.intensity = 0;
    this.ambientLight.intensity = 0.32; // neutral inspection light, not ephemeris
    this.earthOverheadSprite.visible = false;
    this.earthHorizonRing.visible = false;
    this.earthOverheadLabel.hidden = true;
    this.toggleEarthExplanation(false);
  }

  setReadingLevel(level: 'educator' | 'researcher'): void {
    this.readingLevel = level;
    this.updateMapLabels();
  }

  setVerdicts(values: Map<string, Verdict>, stayDays = 7): void {
    const descriptions: string[] = [];
    for (const m of this.markers) {
      const verdict = values.get(m.site.id) ?? 'unavailable';
      descriptions.push(m.site.name + ': ' + verdict);
      m.object.material.map = this.pinTexture(verdict);
      m.object.material.needsUpdate = true;
      // Never cover an opaque verdict-colored marker with a larger white halo.
      m.halo.visible = m.site.id === this.selected;
      m.halo.material.opacity = m.site.id === this.selected ? .85 : .40;
    }
    // Also expose marker meaning to assistive technology, not only colors.
    this.renderer.domElement.setAttribute('aria-label', '3D Moon markers by ' + stayDays + '-day landing verdict: ' + descriptions.join('; '));
  }

  private setPoleCallouts(visible:boolean): void {
    for(const item of this.poleCallouts){item.sprite.visible=visible;item.leader.visible=visible;}
  }

  focusSite(id: string): void {
    const marker = this.markers.find(m => m.site.id === id);
    if (!marker) return;
    this.selected = id;
    this.setPoleCallouts(marker.site.kind === 'south-pole');
    const position = marker.normal.clone().multiplyScalar(this.wholeMoonDistance());
    this.targetCamera = position;
    this.targetFocus = new THREE.Vector3();
    for (const m of this.markers) {
      m.halo.visible = m.site.id === id;
      m.halo.material.opacity = .85;
    }
  }

  focusSouthPole(): void {
    this.setPoleCallouts(true);
    this.targetCamera = new THREE.Vector3(0.0, -2.1, 0.45);
    this.targetFocus = new THREE.Vector3(0, -0.15, 0);
  }

  resetView(): void {
    this.setPoleCallouts(false);
    if (this.selected) { this.focusSite(this.selected); return; }
    this.targetCamera = new THREE.Vector3(2.6, 1.4, 3.4);
    this.targetFocus = new THREE.Vector3(0, 0, 0);
  }

  private wholeMoonDistance(): number {
    const halfVertical = THREE.MathUtils.degToRad(this.camera.fov) / 2;
    const halfHorizontal = Math.atan(Math.tan(halfVertical) * this.camera.aspect);
    return 1.14 / Math.sin(Math.min(halfVertical, halfHorizontal));
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
      // Turn around the globe without cutting through it on long site changes.
      const distance = THREE.MathUtils.lerp(this.camera.position.length(), this.targetCamera.length(), .07);
      this.camera.position.lerp(this.targetCamera, .07).normalize().multiplyScalar(distance);
      this.controls.target.lerp(this.targetFocus, 0.07);
      if (this.camera.position.distanceTo(this.targetCamera) < 0.004) {
        this.targetCamera = null;
        this.targetFocus = null;
      }
    }
    this.controls.update();
    this.inspectionLight.position.copy(this.camera.position);
    this.trackPins();
    this.updateMapLabels();
    this.renderer.render(this.scene, this.camera);
  };

  /** D37: pins stay on their true spots. Each frame: hide pins on the far side (pins draw on top of the globe)
   *  and record where each pin head is on screen, so site names can sit where they cover the fewest pins. */
  private trackPins(): void {
    const h = Math.max(1, this.container.clientHeight), w = Math.max(1, this.container.clientWidth);
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2);
    this.pinHeads = [];
    for (const m of this.markers) {
      const facing = m.normal.dot(this.camera.position.clone().sub(m.object.position).normalize()) > 0.05;
      m.object.visible = facing;
      m.halo.visible = facing && m.site.id === this.selected;
      if (!facing) continue;
      const p = m.object.position.clone().project(this.camera);
      const pxPerUnit = (h / 2) / (this.camera.position.distanceTo(m.object.position) * tanHalf);
      this.pinHeads.push({ id: m.site.id, x: (p.x + 1) * w / 2, y: (1 - p.y) * h / 2 - m.object.scale.y * pxPerUnit * 0.54 });
    }
  }


  destroy(): void {
    this.selectedNameLabel.remove();
    this.hoveredNameLabel.remove();
    this.earthOverheadLabel.remove();
    this.earthExplanation.remove();
    for (const texture of this.pinTextures.values()) texture.dispose();
    this.pinTextures.clear();
    this.selectionTexture.dispose();
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
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
