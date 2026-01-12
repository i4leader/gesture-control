/**
 * SystemInfo Component
 * Displays system information like resolution, FPS, etc. in the top-left corner
 */

export class SystemInfo {
  private container: HTMLElement;
  private infoElement!: HTMLElement; // Initialized in createInfoDisplay()
  private fps: number = 0;
  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private resolution: string = '';

  constructor(container: HTMLElement) {
    this.container = container;
    this.createInfoDisplay();
    this.updateResolution();
    
    // Listen for window resize to update resolution
    window.addEventListener('resize', () => {
      this.updateResolution();
    });
  }

  private createInfoDisplay(): void {
    this.infoElement = document.createElement('div');
    this.infoElement.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.7);
      color: #00FF00;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      padding: 12px;
      border-radius: 8px;
      z-index: 1000;
      border: 1px solid rgba(0, 255, 0, 0.3);
      backdrop-filter: blur(5px);
      min-width: 200px;
      line-height: 1.4;
    `;
    
    this.container.appendChild(this.infoElement);
    this.updateDisplay();
  }

  private updateResolution(): void {
    this.resolution = `${window.innerWidth}×${window.innerHeight}`;
  }

  public updateFPS(): void {
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;
      this.updateDisplay();
    }
  }

  private updateDisplay(): void {
    const userAgent = navigator.userAgent;
    const browser = this.getBrowserName(userAgent);
    const platform = navigator.platform;
    
    this.infoElement.innerHTML = `
      <div style="color: #CCFF00; font-weight: bold; margin-bottom: 8px;">📊 系统信息</div>
      <div>🖥️ 分辨率: ${this.resolution}</div>
      <div>⚡ 帧率: ${this.fps} FPS</div>
      <div>🌐 浏览器: ${browser}</div>
      <div>💻 平台: ${platform}</div>
      <div>🎮 WebGL: ${this.getWebGLVersion()}</div>
    `;
  }

  private getBrowserName(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getWebGLVersion(): string {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return 'Not Supported';
    
    const version = gl.getParameter(gl.VERSION);
    return version.includes('WebGL 2.0') ? 'WebGL 2.0' : 'WebGL 1.0';
  }

  public dispose(): void {
    if (this.infoElement && this.container.contains(this.infoElement)) {
      this.container.removeChild(this.infoElement);
    }
  }
}