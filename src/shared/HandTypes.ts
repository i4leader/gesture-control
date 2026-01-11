/**
 * Hand tracking type definitions
 * Based on MediaPipe Tasks Vision HandLandmarker API
 * @see https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js
 */

/**
 * Hand identifier type for gesture attribution
 */
export type Handedness = 'left' | 'right' | 'unknown';

/**
 * Normalized landmark coordinates (0-1 range relative to image dimensions)
 */
export interface NormalizedLandmark {
  /** X coordinate normalized to image width (0-1) */
  x: number;
  /** Y coordinate normalized to image height (0-1) */
  y: number;
  /** Depth relative to wrist (negative = closer to camera) */
  z: number;
}

/**
 * World landmark coordinates in meters relative to hand center
 */
export interface WorldLandmark {
  /** X coordinate in meters */
  x: number;
  /** Y coordinate in meters */
  y: number;
  /** Z coordinate in meters */
  z: number;
}

/**
 * Hand classification category
 */
export interface HandCategory {
  /** "Left" or "Right" */
  categoryName: string;
  /** Confidence score (0-1) */
  score: number;
}

/**
 * MediaPipe hand landmark indices
 * @see https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker#hand_landmark_model
 */
export const HandLandmarkIndex = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_FINGER_MCP: 5,
  INDEX_FINGER_PIP: 6,
  INDEX_FINGER_DIP: 7,
  INDEX_FINGER_TIP: 8,
  MIDDLE_FINGER_MCP: 9,
  MIDDLE_FINGER_PIP: 10,
  MIDDLE_FINGER_DIP: 11,
  MIDDLE_FINGER_TIP: 12,
  RING_FINGER_MCP: 13,
  RING_FINGER_PIP: 14,
  RING_FINGER_DIP: 15,
  RING_FINGER_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const;

export type HandLandmarkIndexType =
  (typeof HandLandmarkIndex)[keyof typeof HandLandmarkIndex];

/**
 * Configuration options for HandLandmarker
 */
export interface HandTrackerConfig {
  /** Path to the hand_landmarker.task model file */
  modelAssetPath: string;
  /** Hardware delegate preference */
  delegate: 'GPU' | 'CPU';
  /** Maximum number of hands to detect (1-2) */
  numHands: number;
  /** Minimum confidence for hand detection (0-1) */
  minHandDetectionConfidence: number;
  /** Minimum confidence for hand presence (0-1) */
  minHandPresenceConfidence: number;
  /** Minimum confidence for hand tracking (0-1) */
  minTrackingConfidence: number;
}

/**
 * Default hand tracker configuration
 */
export const DEFAULT_HAND_TRACKER_CONFIG: HandTrackerConfig = {
  modelAssetPath:
    'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  delegate: 'GPU',
  numHands: 2,
  minHandDetectionConfidence: 0.5,
  minHandPresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
};

/**
 * Processed hand data for application use
 */
export interface ProcessedHand {
  /** Normalized landmarks (21 points) */
  landmarks: NormalizedLandmark[];
  /** World landmarks in meters (21 points) */
  worldLandmarks: WorldLandmark[];
  /** Hand classification (Left/Right) */
  handedness: HandCategory;
}

/**
 * 2D Point interface for trail tracking
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * Trail point with timestamp for smooth interpolation
 */
export interface TrailPoint extends Point2D {
  timestamp: number;
}

/**
 * Tracked hand with trail history
 */
export interface TrackedHand {
  id: string;
  landmarks: NormalizedLandmark[];
  trail: TrailPoint[];
  lastSeen: number;
  palmPosition: Point2D;
  previousPosition?: Point2D | null;
  handSize?: number;
  handedness?: string;
  velocity?: number;
}

/**
 * Trail point with radius for smooth interpolation
 */
export interface TrailPointWithRadius extends TrailPoint {
  radius: number;
}

/**
 * Configuration for hand trail tracking
 */
export interface HandTrailConfig {
  maxTrailLength: number;
  trailDecayTime: number;
  smoothingFactor: number;
  minMovementThreshold: number;
  interpolationPoints: number;
  dynamicRadius: boolean;
  baseClearRadius: number;
}

/**
 * Default hand trail configuration
 */
export const DEFAULT_HAND_TRAIL_CONFIG: HandTrailConfig = {
  maxTrailLength: 50,
  trailDecayTime: 2000, // 2 seconds
  smoothingFactor: 0.8,
  minMovementThreshold: 0.01,
  interpolationPoints: 5,
  dynamicRadius: true,
  baseClearRadius: 50,
};
