/**
 * Performance Configuration
 * Centralized settings for optimizing the gesture control experience
 */

export interface PerformanceConfig {
  // MediaPipe Detection
  gestureDetectionFps: number; // Target FPS for gesture detection
  
  // Particle System
  particleCount: number; // Number of particles to render
  particleUpdateThreshold: number; // Minimum movement to trigger updates
  textSamplingStep: number; // Pixel sampling step for text rendering
  
  // Post-Processing
  enableBloom: boolean;
  bloomKernelSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  enableChromaticAberration: boolean;
  enableColorGrading: boolean;
  
  // General
  enablePerformanceMonitor: boolean;
  targetFps: number;
}

// Device capability detection
const getDeviceCapability = (): 'low' | 'medium' | 'high' => {
  // Simple heuristic based on available features
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  if (!gl) return 'low';
  
  const renderer = gl.getParameter(gl.RENDERER);
  
  // Check for mobile devices
  if (/Mobile|Android|iPhone|iPad/.test(navigator.userAgent)) {
    return 'low';
  }
  
  // Check for integrated graphics (basic heuristic)
  if (renderer && renderer.includes('Intel')) {
    return 'medium';
  }
  
  return 'high';
};

// Performance presets based on device capability
const PERFORMANCE_PRESETS: Record<string, PerformanceConfig> = {
  low: {
    gestureDetectionFps: 20, // 50ms interval
    particleCount: 5000,
    particleUpdateThreshold: 0.002,
    textSamplingStep: 8,
    enableBloom: false,
    bloomKernelSize: 'SMALL',
    enableChromaticAberration: false,
    enableColorGrading: false,
    enablePerformanceMonitor: true,
    targetFps: 30,
  },
  medium: {
    gestureDetectionFps: 30, // 33ms interval
    particleCount: 8000,
    particleUpdateThreshold: 0.001,
    textSamplingStep: 6,
    enableBloom: true,
    bloomKernelSize: 'MEDIUM',
    enableChromaticAberration: true,
    enableColorGrading: false,
    enablePerformanceMonitor: false,
    targetFps: 60,
  },
  high: {
    gestureDetectionFps: 60, // No throttling
    particleCount: 10000,
    particleUpdateThreshold: 0.001,
    textSamplingStep: 4,
    enableBloom: true,
    bloomKernelSize: 'LARGE',
    enableChromaticAberration: true,
    enableColorGrading: true,
    enablePerformanceMonitor: false,
    targetFps: 60,
  },
};

/**
 * Get optimal performance configuration for current device
 */
export function getOptimalPerformanceConfig(): PerformanceConfig {
  const capability = getDeviceCapability();
  const config = PERFORMANCE_PRESETS[capability];
  
  console.log(`[Performance] Detected device capability: ${capability}`);
  console.log(`[Performance] Using preset:`, config);
  
  return config;
}

/**
 * Apply performance configuration to various systems
 */
export function applyPerformanceConfig(config: PerformanceConfig) {
  // Store in global for access by other modules
  (window as any).__PERFORMANCE_CONFIG = config;
  
  // Apply CSS optimizations for low-end devices
  if (config.targetFps <= 30) {
    document.documentElement.style.setProperty('--animation-duration', '0.5s');
  }
}

/**
 * Get current performance configuration
 */
export function getCurrentPerformanceConfig(): PerformanceConfig {
  return (window as any).__PERFORMANCE_CONFIG || getOptimalPerformanceConfig();
}