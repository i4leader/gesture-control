/**
 * GestureInfo Component
 * Displays gesture recognition information in the bottom-left corner
 */

import { GestureType } from '../particle-text/GestureManager';

export class GestureInfo {
  private container: HTMLElement;
  private infoElement!: HTMLElement; // Initialized in createInfoDisplay()
  private currentGesture: GestureType = 'none';
  private handedness: string = 'unknown';
  private confidence: number = 0;
  private lastUpdateTime: number = 0;

  constructor(container: HTMLElement) {
    this.container = container;
    this.createInfoDisplay();
  }

  private createInfoDisplay(): void {
    this.infoElement = document.createElement('div');
    this.infoElement.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.7);
      color: #FF1493;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      padding: 12px;
      border-radius: 8px;
      z-index: 1000;
      border: 1px solid rgba(255, 20, 147, 0.3);
      backdrop-filter: blur(5px);
      min-width: 200px;
      line-height: 1.4;
    `;
    
    this.container.appendChild(this.infoElement);
    this.updateDisplay();
  }

  public updateGestureInfo(gesture: GestureType, handedness: string = 'unknown', confidence: number = 0): void {
    this.currentGesture = gesture;
    this.handedness = handedness;
    this.confidence = confidence;
    this.lastUpdateTime = Date.now();
    this.updateDisplay();
  }

  private updateDisplay(): void {
    const gestureEmoji = this.getGestureEmoji(this.currentGesture);
    const gestureName = this.getGestureName(this.currentGesture);
    const handEmoji = this.getHandEmoji(this.handedness);
    const timeSinceUpdate = Date.now() - this.lastUpdateTime;
    const isActive = timeSinceUpdate < 100; // Consider active if updated within 100ms
    
    this.infoElement.innerHTML = `
      <div style="color: #CCFF00; font-weight: bold; margin-bottom: 8px;">👋 手势识别</div>
      <div>🤚 检测到: ${handEmoji} ${this.getHandName(this.handedness)}</div>
      <div>✋ 手势: ${gestureEmoji} ${gestureName}</div>
      <div>📊 置信度: ${(this.confidence * 100).toFixed(1)}%</div>
      <div>🔄 状态: ${isActive ? '<span style="color: #00FF00">活跃</span>' : '<span style="color: #FFA500">待机</span>'}</div>
    `;
  }

  private getGestureEmoji(gesture: GestureType): string {
    const emojiMap: { [key in GestureType]: string } = {
      'none': '❓',
      'open_palm': '🖐️',
      'ok_sign': '👌',
      'fist': '✊',
      'wave': '👋',
      'victory': '✌️',
      'finger_heart': '💖',
      'thumbs_up': '👍'
    };
    return emojiMap[gesture] || '❓';
  }

  private getGestureName(gesture: GestureType): string {
    const nameMap: { [key in GestureType]: string } = {
      'none': '无手势',
      'open_palm': '展示手掌',
      'ok_sign': 'OK手势',
      'fist': '握拳',
      'wave': '挥手',
      'victory': '剪刀手',
      'finger_heart': '比心',
      'thumbs_up': '点赞'
    };
    return nameMap[gesture] || '未知';
  }

  private getHandEmoji(handedness: string): string {
    switch (handedness.toLowerCase()) {
      case 'left': return '👈';
      case 'right': return '👉';
      default: return '🤷';
    }
  }

  private getHandName(handedness: string): string {
    switch (handedness.toLowerCase()) {
      case 'left': return '左手';
      case 'right': return '右手';
      default: return '未知';
    }
  }

  public dispose(): void {
    if (this.infoElement && this.container.contains(this.infoElement)) {
      this.container.removeChild(this.infoElement);
    }
  }
}