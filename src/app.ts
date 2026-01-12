import * as THREE from 'three';
import { HandTracker } from './shared/HandTracker';
import { ParticleTextRenderer } from './particle-text/ParticleTextRenderer';
import { GestureManager, GestureType } from './particle-text/GestureManager';
import { Footer } from './ui/Footer';
import { SystemInfo } from './ui/SystemInfo';
import { GestureInfo } from './ui/GestureInfo';
import { PerformanceMonitor } from './utils/PerformanceMonitor';
import { getOptimalPerformanceConfig, applyPerformanceConfig, getCurrentPerformanceConfig } from './config/performance';

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
  private gestureHud!: HTMLElement; // Initialized in createGestureHud()
  private performanceMonitor?: PerformanceMonitor; // Optional based on config
  private systemInfo: SystemInfo;
  private gestureInfo: GestureInfo;

  private currentGesture: GestureType = 'none';

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.style.position = 'relative'; // Create stacking context

    // Apply performance optimizations based on device capability
    const perfConfig = getOptimalPerformanceConfig();
    applyPerformanceConfig(perfConfig);

    // Scene Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.z = 10;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);

    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.renderer.domElement.style.zIndex = '2'; // Canvas on top
    this.container.appendChild(this.renderer.domElement);

    // Modules
    this.gestureManager = new GestureManager();
    this.handTracker = new HandTracker();
    this.footer = new Footer(this.container);
    this.particleRenderer = new ParticleTextRenderer(this.scene, perfConfig.particleCount);
    this.systemInfo = new SystemInfo(this.container);
    this.gestureInfo = new GestureInfo(this.container);
    
    // Only create performance monitor if enabled
    if (perfConfig.enablePerformanceMonitor) {
      this.performanceMonitor = new PerformanceMonitor();
    }

    this.createVideoElement();
    this.createGestureHud();
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
    this.videoElement.style.zIndex = '1'; // Video behind canvas but above background
    this.videoElement.style.transform = 'scaleX(-1)'; // Mirror
    
    // Add dreamy/blurry filter effect
    this.videoElement.style.filter = 'blur(2px) opacity(0.6) contrast(0.8) brightness(0.9)';
    this.videoElement.style.backdropFilter = 'blur(1px)';
    
    this.videoElement.autoplay = true;
    this.videoElement.muted = true;
    this.videoElement.playsInline = true;
    this.container.appendChild(this.videoElement);
  }

  private createGestureHud() {
    this.gestureHud = document.createElement('div');
    this.gestureHud.style.position = 'absolute';
    this.gestureHud.style.top = '20px';
    this.gestureHud.style.left = '50%';
    this.gestureHud.style.transform = 'translateX(-50%)';
    this.gestureHud.style.padding = '10px 20px';
    this.gestureHud.style.borderRadius = '20px';
    this.gestureHud.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    this.gestureHud.style.color = '#fff';
    this.gestureHud.style.fontFamily = 'monospace';
    this.gestureHud.style.fontSize = '16px';
    this.gestureHud.style.backdropFilter = 'blur(5px)';
    this.gestureHud.style.border = '1px solid rgba(255,255,255,0.2)';
    this.gestureHud.innerText = '等待手势 (Waiting for gesture)...';
    this.container.appendChild(this.gestureHud);
  }

  async start() {
    if (!this.videoElement) return;

    // Show initial state (random particles)
    this.particleRenderer.resetParticles();

    try {
      // Apply performance-based detection frequency
      const perfConfig = getCurrentPerformanceConfig();
      const detectionInterval = 1000 / perfConfig.gestureDetectionFps;
      this.handTracker.setDetectionIntervalMs(detectionInterval);
      
      await this.handTracker.initialize(this.videoElement);

      // Remove loading screen explicitly
      const loadingScreen = document.querySelector('.initial-loading');
      if (loadingScreen) {
        loadingScreen.remove();
      }

      this.footer.show();
      this.animate();
      console.log(`App started with ${perfConfig.gestureDetectionFps}fps gesture detection`);
    } catch (e: any) {
      console.error("Failed to start hand tracker", e);
      const loadingScreen = document.querySelector('.initial-loading');
      if (loadingScreen) {
        // Stop spinner
        const spinner = loadingScreen.querySelector('.spinner') as HTMLElement;
        if (spinner) spinner.style.display = 'none';

        // Show error message
        const p = loadingScreen.querySelector('p');
        if (p) {
          p.innerText = `启动失败 (Start failed): ${e.message || e}`;
          p.style.color = '#ff4444';
        }

        // Add retry button or helpful hint
        const hint = document.createElement('div');
        hint.style.marginTop = '15px';
        hint.style.fontSize = '12px';
        hint.style.opacity = '0.8';
        hint.innerHTML = `
          如果是网络原因(如无法加载模型)，请检查网络连接。<br>
          如果是摄像头权限，请允许访问。<br>
          <button onclick="window.location.reload()" style="margin-top:10px;padding:5px 10px;background:#333;color:#fff;border:none;border-radius:4px;cursor:pointer">重试 (Retry)</button>
        `;
        loadingScreen.appendChild(hint);
      }
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
    const frameStart = this.performanceMonitor?.startFrame();
    requestAnimationFrame(this.animate);

    // Update system info FPS
    this.systemInfo.updateFPS();

    // Gesture Detection with timing
    const gestureStart = performance.now();
    const result = this.handTracker.detectHands(performance.now());
    this.performanceMonitor?.recordGestureDetection(performance.now() - gestureStart);

    if (result && result.landmarks && result.landmarks.length > 0) {
      const landmarks = result.landmarks[0];
      const gesture = this.gestureManager.detectGesture(landmarks);
      const palmPosition = this.gestureManager.getPalmPosition(landmarks);

      // Get handedness information
      const handedness = result.handednesses && result.handednesses[0] && result.handednesses[0][0] 
        ? result.handednesses[0][0].categoryName.toLowerCase() 
        : 'unknown';
      const confidence = result.handednesses && result.handednesses[0] && result.handednesses[0][0]
        ? result.handednesses[0][0].score
        : 0;

      // Update gesture info display
      this.gestureInfo.updateGestureInfo(gesture, handedness, confidence);

      // Update fist ball position if active
      if (this.currentGesture === 'fist' && this.particleRenderer.isFistBallEffect()) {
        this.particleRenderer.updateFistBallPosition(palmPosition);
      }

      if (gesture !== this.currentGesture) {
        // Update last meaningful gesture before changing, IF current was meaningful
        if (this.currentGesture !== 'none') {
          this.lastMeaningfulGesture = this.currentGesture;
        }

        this.handleGestureChange(gesture, palmPosition);
        this.currentGesture = gesture;
      }

    } else {
      // No hands detected
      if (this.currentGesture !== 'none') {
        this.currentGesture = 'none';
        this.gestureHud.innerText = "未检测到手势 (No hands)";
        this.gestureHud.style.color = '#aaa';
        this.particleRenderer.resetParticles();
        
        // Update gesture info for no hands
        this.gestureInfo.updateGestureInfo('none', 'unknown', 0);
      }
    }

    // Particle Update with timing
    const particleStart = performance.now();
    this.particleRenderer.update();
    this.performanceMonitor?.recordParticleUpdate(performance.now() - particleStart);

    // Render with timing
    const renderStart = performance.now();
    this.renderer.render(this.scene, this.camera);
    this.performanceMonitor?.recordRender(performance.now() - renderStart);

    if (frameStart !== undefined) {
      this.performanceMonitor?.endFrame(frameStart);
    }
  }

  private lastMeaningfulGesture: GestureType = 'none';

  private handleGestureChange(gesture: GestureType, palmPosition?: { x: number, y: number, z: number }) {
    console.log('Gesture:', gesture);
    this.gestureHud.innerText = `当前手势: ${this.getGestureName(gesture)}`;
    this.gestureHud.style.color = '#fff';

    switch (gesture) {
      case 'open_palm':
        // Check if we recently had a fist and there's an active fist ball
        if (this.lastMeaningfulGesture === 'fist' && this.particleRenderer.isFistBallEffect()) {
          this.particleRenderer.explode();
          this.gestureHud.innerText += " (爆炸!)";
          this.gestureHud.style.color = '#FF1493'; // Hot Pink/Neon Pink
        } else {
          this.particleRenderer.updateText("Hello World", 0x00ff00);
        }
        break;
      case 'ok_sign':
        this.particleRenderer.updateText("OK", 0xffff00);
        break;
      case 'wave':
        this.particleRenderer.updateText("ByeBye", 0xff00ff);
        break;
      case 'victory':
        this.particleRenderer.updateText("Yeah!! ✌️", 0x00ffff);
        break;
      case 'finger_heart':
        this.particleRenderer.updateText("比心 ❤️", 0xff69b4); // HotPink
        break;
      case 'thumbs_up':
        this.particleRenderer.updateText("Great", 0x4488ff);
        break;
      case 'fist':
        // Create fist ball effect at palm position
        this.particleRenderer.createFistBall(palmPosition);
        this.gestureHud.innerText += " (聚集中...)";
        this.gestureHud.style.color = '#FFA500'; // Neon Orange
        break;
    }
  }

  private getGestureName(gesture: GestureType): string {
    switch (gesture) {
      case 'open_palm': return '手掌 (Open Palm)';
      case 'ok_sign': return 'OK 手势';
      case 'wave': return '挥手 (Wave)';
      case 'fist': return '握拳 (Fist)';
      case 'victory': return '剪刀手 (Victory)';
      case 'finger_heart': return '比心 (Heart)';
      case 'thumbs_up': return '点赞 (Thumbs Up)';
      default: return '未知 (Unknown)';
    }
  }
}
