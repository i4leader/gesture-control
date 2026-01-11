/**
 * PerformanceMonitor - Tracks and displays performance metrics
 * Helps identify bottlenecks and optimize the gesture control experience
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  gestureDetectionTime: number;
  particleUpdateTime: number;
  renderTime: number;
  memoryUsage?: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    gestureDetectionTime: 0,
    particleUpdateTime: 0,
    renderTime: 0,
  };

  private frameCount = 0;
  private fpsUpdateInterval = 1000; // Update FPS every second
  private lastFpsUpdate = 0;

  private displayElement: HTMLElement | null = null;
  private isVisible = false;

  constructor() {
    this.createDisplay();
  }

  private createDisplay(): void {
    this.displayElement = document.createElement('div');
    this.displayElement.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 5px;
      z-index: 1000;
      display: none;
      min-width: 200px;
    `;
    document.body.appendChild(this.displayElement);

    // Toggle visibility with 'P' key
    document.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'p') {
        this.toggle();
      }
    });
  }

  public toggle(): void {
    this.isVisible = !this.isVisible;
    if (this.displayElement) {
      this.displayElement.style.display = this.isVisible ? 'block' : 'none';
    }
  }

  public startFrame(): number {
    return performance.now();
  }

  public endFrame(startTime: number): void {
    const now = performance.now();
    this.metrics.frameTime = now - startTime;
    this.frameCount++;

    // Update FPS calculation
    if (now - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      this.metrics.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
      this.updateDisplay();
    }
  }

  public recordGestureDetection(time: number): void {
    this.metrics.gestureDetectionTime = time;
  }

  public recordParticleUpdate(time: number): void {
    this.metrics.particleUpdateTime = time;
  }

  public recordRender(time: number): void {
    this.metrics.renderTime = time;
  }

  private updateDisplay(): void {
    if (!this.displayElement || !this.isVisible) return;

    // Get memory usage if available
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    }

    const html = `
      <div><strong>Performance Monitor</strong></div>
      <div>FPS: ${this.metrics.fps}</div>
      <div>Frame: ${this.metrics.frameTime.toFixed(1)}ms</div>
      <div>Gesture: ${this.metrics.gestureDetectionTime.toFixed(1)}ms</div>
      <div>Particles: ${this.metrics.particleUpdateTime.toFixed(1)}ms</div>
      <div>Render: ${this.metrics.renderTime.toFixed(1)}ms</div>
      ${this.metrics.memoryUsage ? `<div>Memory: ${this.metrics.memoryUsage}MB</div>` : ''}
      <div style="margin-top: 5px; font-size: 10px; color: #888;">Press 'P' to toggle</div>
    `;

    this.displayElement.innerHTML = html;
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public dispose(): void {
    if (this.displayElement) {
      document.body.removeChild(this.displayElement);
    }
  }
}