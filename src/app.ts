import * as THREE from 'three';
import { HandTracker } from './shared/HandTracker';
import { ParticleTextRenderer } from './particle-text/ParticleTextRenderer';
import { GestureManager, GestureType } from './particle-text/GestureManager';
import { Footer } from './ui/Footer';

export class App {
  private container: HTMLElement;
  private videoElement: HTMLVideoElement | null = null;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private handTracker: HandTracker;
  private particleRenderer: ParticleTextRenderer;
  private gestureManager: GestureManager;

  private footer: Footer;

  private currentGesture: GestureType = 'none';

  constructor(container: HTMLElement) {
    this.container = container;

    // Scene Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 10;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 1);
    this.container.appendChild(this.renderer.domElement);

    // Modules
    this.gestureManager = new GestureManager();
    this.handTracker = new HandTracker();
    this.footer = new Footer(this.container);
    this.particleRenderer = new ParticleTextRenderer(this.scene);

    this.createVideoElement();
    this.setupResize();
  }

  private createVideoElement() {
    this.videoElement = document.createElement('video');
    this.videoElement.style.position = 'absolute';
    this.videoElement.style.top = '0';
    this.videoElement.style.left = '0';
    this.videoElement.style.width = '100%';
    this.videoElement.style.height = '100%';
    this.videoElement.style.objectFit = 'cover';
    this.videoElement.style.zIndex = '-1';
    this.videoElement.style.transform = 'scaleX(-1)'; // Mirror
    this.videoElement.style.opacity = '0.3'; // Dim video
    this.videoElement.autoplay = true;
    this.videoElement.muted = true;
    this.videoElement.playsInline = true;
    this.container.appendChild(this.videoElement);
  }

  async start() {
    if (!this.videoElement) return;

    // Show initial text
    this.particleRenderer.updateText("请展示手势", 0xffffff);

    try {
      await this.handTracker.initialize(this.videoElement);
      this.footer.show();
      this.animate();
      console.log("App started");
    } catch (e) {
      console.error("Failed to start hand tracker", e);
    }
  }

  private setupResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    const result = this.handTracker.detectHands(performance.now());
    if (result && result.landmarks && result.landmarks.length > 0) {
      const gesture = this.gestureManager.detectGesture(result.landmarks[0]);

      if (gesture !== this.currentGesture) {
        this.handleGestureChange(gesture);
        this.currentGesture = gesture;
      }
    }

    this.particleRenderer.update();
    this.renderer.render(this.scene, this.camera);
  }

  private handleGestureChange(gesture: GestureType) {
    console.log('Gesture:', gesture);

    // If we are currently EXPLODING, maybe don't interrupt immediately?
    // Logic as per requirement:
    // Open Palm -> "你好阿里云"
    // OK -> "OK"
    // Bye -> "ByeBye"
    // Sudden Open (Explosion) -> Explode

    switch (gesture) {
      case 'open_palm':
        // Check if previous was fist to trigger explosion
        if (this.currentGesture === 'fist') {
          this.particleRenderer.explode();
        } else {
          this.particleRenderer.updateText("你好阿里云", 0x00aaff);
        }
        break;
      case 'ok_sign':
        this.particleRenderer.updateText("OK", 0xffff00);
        break;
      case 'wave':
        this.particleRenderer.updateText("ByeBye", 0xff00ff);
        break;
      case 'fist':
        // Just a state to allow transition to explosion
        // Optionally show something to indicate "charging" or just keep previous
        break;
    }
  }
}
