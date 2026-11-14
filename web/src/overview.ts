import * as THREE from 'three';

/**
 * D14 overview: original Three.js implementation, three bodies only.
 * Distances, scales and motions here are intentionally NOT scientific;
 * the Moon-fixed explorer alone uses getSceneState and site coordinates.
 * Starfield is a separate background behind the DOM, not in this scene.
 */
export class OverviewScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(43, 1, .1, 80);
  private moon: THREE.Mesh;
  private earth: THREE.Mesh;
  private sun: THREE.Mesh;
  private moonLabel: THREE.Sprite;
  private readonly observer: ResizeObserver;
  private readonly prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  private frame = 0;
  private elapsed = 0;
  private last = 0;
  private visible = false;
  private down: { x: number; y: number } | null = null;
  private readonly onDown: (e: PointerEvent) => void;
  private readonly onUp: (e: PointerEvent) => void;
  private readonly onMove: (e: PointerEvent) => void;
  private readonly onMotionChanged: () => void;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();

  constructor(private container: HTMLElement, private onMoonClick: () => void) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.5;
    this.container.append(this.renderer.domElement);
    this.camera.position.set(0, 1.1, 11.5);
    this.camera.lookAt(0, 0, 0);

    this.scene.add(new THREE.AmbientLight(0xd9e4fc, .28));
    const sunPos = new THREE.Vector3(-3.8, .3, .2);
    const visualSun = new THREE.PointLight(0xffe0b0, 160, 30, 1.2);
    visualSun.position.copy(sunPos);
    this.scene.add(visualSun);

    this.sun = new THREE.Mesh(
      new THREE.SphereGeometry(.96, 64, 48),
      new THREE.MeshBasicMaterial({ color: 0xffd486 }),
    );
    this.sun.position.copy(sunPos);
    this.scene.add(this.sun);
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = glowCanvas.height = 128;
    const gc = glowCanvas.getContext('2d');
    if (gc) {
      const g = gc.createRadialGradient(64,64,12,64,64,64);
      g.addColorStop(0,'rgba(255,205,92,.45)');
      g.addColorStop(.4,'rgba(255,157,75,.26)');
      g.addColorStop(1,'rgba(255,157,75,0)');
      gc.fillStyle = g; gc.fillRect(0,0,128,128);
    }
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowCanvas), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.position.copy(sunPos);
    glow.scale.set(3.8,3.8,1);
    this.scene.add(glow);

    const earthTextureCanvas = document.createElement('canvas');
    earthTextureCanvas.width = 512; earthTextureCanvas.height = 256;
    const ec = earthTextureCanvas.getContext('2d');
    if (ec) {
      ec.fillStyle = '#125d9b'; ec.fillRect(0,0,512,256);
      const shapes = [
        [45,50,70,30], [95,100,48,38], [155,55,58,23],
        [225,95,78,40], [305,43,110,28], [340,125,75,55],
        [450,75,28,45], [455,180,33,16],
      ];
      ec.fillStyle = '#4f9562';
      for (const [x,y,rx,ry] of shapes) {
        ec.beginPath(); ec.ellipse(x,y,rx,ry,-.32,0,Math.PI*2); ec.fill();
      }
      ec.fillStyle = 'rgba(244,248,255,.36)';
      for (let i=0;i<35;i++){
        const x=(i*173.17)%512, y=(i*43.91)%256;
        ec.beginPath(); ec.ellipse(x,y,19+(i%5)*6,3+(i%3)*4,.2,0,Math.PI*2); ec.fill();
      }
    }
    const earthTexture = new THREE.CanvasTexture(earthTextureCanvas);
    earthTexture.colorSpace = THREE.SRGBColorSpace;
    this.earth = new THREE.Mesh(
      new THREE.SphereGeometry(.7, 64, 48),
      new THREE.MeshStandardMaterial({ map: earthTexture, roughness: 1, metalness: 0 }),
    );
    this.earth.position.set(.05, -.28, 0);
    this.scene.add(this.earth);

    this.moon = new THREE.Mesh(
      new THREE.SphereGeometry(.47, 96, 72),
      new THREE.MeshStandardMaterial({ color: 0xa4a9b0, roughness: 1, metalness: 0 }),
    );
    this.moon.position.set(3.35, .25, .15);
    this.scene.add(this.moon);
    new THREE.TextureLoader().load('/moon/lroc_color_2k.jpg', (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = this.moon.material as THREE.MeshStandardMaterial;
      material.color.set(0xffffff);
      material.map = texture;
      material.needsUpdate = true;
      this.render();
    });

    this.scene.add(this.makeLabel('SUN · illustrative', sunPos.clone().add(new THREE.Vector3(0,-1.28,0)), 1.55));
    this.scene.add(this.makeLabel('EARTH · not to scale', this.earth.position.clone().add(new THREE.Vector3(0,-1.08,0)), 1.8));
    this.moonLabel = this.makeLabel('MOON · click to explore', this.moon.position.clone().add(new THREE.Vector3(0,-.79,0)), 2.05);
    this.scene.add(this.moonLabel);

    this.onDown = (e) => { this.down = { x:e.clientX, y:e.clientY }; };
    this.onUp = (e) => {
      if (!this.down) return;
      const moved = Math.hypot(this.down.x-e.clientX,this.down.y-e.clientY);
      this.down = null;
      if (moved <= 7 && this.hitMoon(e)) this.onMoonClick();
    };
    this.onMove = (e) => { this.renderer.domElement.style.cursor = this.hitMoon(e) ? 'pointer' : 'default'; };
    this.renderer.domElement.addEventListener('pointerdown', this.onDown);
    this.renderer.domElement.addEventListener('pointerup', this.onUp);
    this.renderer.domElement.addEventListener('pointermove', this.onMove);
    this.onMotionChanged = () => { if (this.visible) this.setVisible(false), this.setVisible(true); };
    this.prefersReducedMotion.addEventListener('change',this.onMotionChanged);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.resize();
  }

  private makeLabel(text: string, at: THREE.Vector3, width: number): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 82;
    const ctx = canvas.getContext('2d');
    if(ctx) {
      ctx.fillStyle = 'rgba(13,24,40,.8)'; ctx.fillRect(0,0,512,82);
      ctx.fillStyle = '#e5f2ff'; ctx.textAlign='center';
      ctx.font='600 29px sans-serif'; ctx.fillText(text,256,54);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
    label.position.copy(at);
    label.scale.set(width, width*82/512, 1);
    return label;
  }

  private hitMoon(e: PointerEvent): boolean {
    const bounds = this.renderer.domElement.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return false;
    this.pointer.set((e.clientX-bounds.left)/bounds.width*2-1,-(e.clientY-bounds.top)/bounds.height*2+1);
    this.raycaster.setFromCamera(this.pointer,this.camera);
    return this.raycaster.intersectObject(this.moon).length>0;
  }

  private resize(): void {
    const w=Math.max(1,this.container.clientWidth), h=Math.max(1,this.container.clientHeight);
    this.camera.aspect=w/h; this.camera.updateProjectionMatrix();
    this.renderer.setSize(w,h,false);
    this.render();
  }

  private tick = (time: number): void => {
    if (!this.visible) return;
    const delta = this.last ? Math.min(.05,(time-this.last)/1000) : 0;
    this.last=time; this.elapsed += delta;
    if (!this.prefersReducedMotion.matches) {
      this.earth.rotation.y += delta*.16;
      this.moon.rotation.y += delta*.09;
      this.moon.position.y=.25+Math.sin(this.elapsed*.18)*.12;
      this.moonLabel.position.y=this.moon.position.y-.79;
    }
    this.render();
    if (!this.prefersReducedMotion.matches) this.frame=requestAnimationFrame(this.tick);
  };

  private render(): void { this.renderer.render(this.scene,this.camera); }

  setVisible(visible: boolean): void {
    this.visible=visible;
    cancelAnimationFrame(this.frame);
    this.last=0;
    if(visible) {
      this.resize();
      if(this.prefersReducedMotion.matches) this.render();
      else this.frame=requestAnimationFrame(this.tick);
    }
  }

  destroy(): void {
    this.setVisible(false);
    this.observer.disconnect();
    this.prefersReducedMotion.removeEventListener('change', this.onMotionChanged);
    this.renderer.domElement.removeEventListener('pointerdown',this.onDown);
    this.renderer.domElement.removeEventListener('pointerup',this.onUp);
    this.renderer.domElement.removeEventListener('pointermove',this.onMove);
    this.scene.traverse(obj=>{
      if(obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mat=obj.material as THREE.MeshStandardMaterial;
        mat.map?.dispose();mat.dispose();
      } else if(obj instanceof THREE.Sprite) {
        const mat=obj.material as THREE.SpriteMaterial;
        mat.map?.dispose();mat.dispose();
      }
    });
    this.renderer.dispose(); this.renderer.domElement.remove();
  }
}
