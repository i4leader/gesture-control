import { NormalizedLandmark } from '@mediapipe/tasks-vision';

export type GestureType = 'none' | 'open_palm' | 'ok_sign' | 'fist' | 'wave' | 'victory' | 'finger_heart' | 'thumbs_up';

export class GestureManager {
    private waveHistory: number[] = []; // Store x-positions of wrist

    constructor() { }

    detectGesture(landmarks: NormalizedLandmark[]): GestureType {
        let currentGesture: GestureType = 'none';

        // 1. Check Wave first (dynamic gesture)
        if (this.checkWave(landmarks)) {
            return 'wave';
        }

        // 2. Static Gestures
        if (this.isFingerHeart(landmarks)) {
            currentGesture = 'finger_heart';
        } else if (this.isVictory(landmarks)) {
            currentGesture = 'victory';
        } else if (this.isThumbsUp(landmarks)) {
            currentGesture = 'thumbs_up';
        } else if (this.isOkSign(landmarks)) {
            currentGesture = 'ok_sign';
        } else if (this.isOpenPalm(landmarks)) {
            currentGesture = 'open_palm';
        } else if (this.isFist(landmarks)) {
            currentGesture = 'fist';
        }

        return currentGesture;
    }

    // Get palm center position (average of key landmarks)
    getPalmPosition(landmarks: NormalizedLandmark[]): { x: number, y: number, z: number } {
        // Use wrist (0) and middle finger MCP (9) to calculate palm center
        const wrist = landmarks[0];
        const middleMCP = landmarks[9];
        
        return {
            x: (wrist.x + middleMCP.x) / 2,
            y: (wrist.y + middleMCP.y) / 2,
            z: (wrist.z + middleMCP.z) / 2
        };
    }

    // Thumbs Up: Thumb extended, others curled
    private isThumbsUp(landmarks: NormalizedLandmark[]): boolean {
        const tips = [8, 12, 16, 20];
        const pips = [6, 10, 14, 18];

        const thumbTip = landmarks[4];
        const thumbMCP = landmarks[2];

        // Check 4 fingers curled
        const fingersCurled = tips.every((tip, i) => {
            return landmarks[tip].y > landmarks[pips[i]].y;
        });

        // Check thumb extended UP significantly
        const thumbExtended = thumbTip.y < thumbMCP.y - 0.05;

        return fingersCurled && thumbExtended;
    }

    private isVictory(landmarks: NormalizedLandmark[]): boolean {
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const indexPip = landmarks[6];
        const middlePip = landmarks[10];

        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];
        const ringPip = landmarks[14];
        const pinkyPip = landmarks[18];

        const indexExt = indexTip.y < indexPip.y;
        const middleExt = middleTip.y < middlePip.y;
        const ringCurled = ringTip.y > ringPip.y;
        const pinkyCurled = pinkyTip.y > pinkyPip.y;

        // Ensure fingers are somewhat separated? Optional.
        return indexExt && middleExt && ringCurled && pinkyCurled;
    }

    private isFingerHeart(landmarks: NormalizedLandmark[]): boolean {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const indexPip = landmarks[6]; // Index joint

        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];

        const middlePip = landmarks[10];
        const ringPip = landmarks[14];
        const pinkyPip = landmarks[18];

        // 1. Thumb should be somewhat UP (relative to index base?)
        // In a fist, thumb is often across. In heart, thumb tip meets index tip high up.

        // 2. Index tip and Thumb tip close
        const distance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
        const isClose = distance < 0.08; // Slightly Relaxed

        // 3. Others curled
        const othersCurled = middleTip.y > middlePip.y && ringTip.y > ringPip.y && pinkyTip.y > pinkyPip.y;

        // 4. Distinction from Fist:
        // In Fist, Index Tip is usually curled deeply (y > pip).
        // In Heart, Index acts as a support, often less curled.

        // Also check thumb tip height relative to other fingers.
        // In Heart, thumb tip is high.

        // Let's refine:
        // Thumb and Index close.
        // Middle, Ring, Pinky curled.
        // Index NOT fully curled down to palm?

        // In a Fist, Index Tip is lower than PIP (y > pip).
        // In Heart, Index Tip is usually above PIP (y < pip) or at least not curled.
        const indexNotCurled = indexTip.y < indexPip.y;

        return isClose && othersCurled && indexNotCurled;
    }

    // Simple check: Index touching Thumb, others extended
    private isOkSign(landmarks: NormalizedLandmark[]): boolean {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];
        const middlePip = landmarks[10];
        const ringPip = landmarks[14];
        const pinkyPip = landmarks[18];


        // Distance between thumb and index tip
        const distance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
        const isPinch = distance < 0.05;

        // Check if other fingers are extended
        const isMiddleExt = middleTip.y < middlePip.y;
        const isRingExt = ringTip.y < ringPip.y;
        const isPinkyExt = pinkyTip.y < pinkyPip.y;

        return isPinch && isMiddleExt && isRingExt && isPinkyExt;
    }

    private isOpenPalm(landmarks: NormalizedLandmark[]): boolean {
        const tips = [8, 12, 16, 20];
        const pips = [6, 10, 14, 18];

        // STRICTER Open Palm check to avoid confusion during transitions
        const fingersExt = tips.every((tip, i) => {
            return landmarks[tip].y < landmarks[pips[i]].y;
        });

        return fingersExt;
    }

    private isFist(landmarks: NormalizedLandmark[]): boolean {
        const tips = [8, 12, 16, 20];
        const pips = [6, 10, 14, 18];

        const fingersCurled = tips.every((tip, i) => {
            return landmarks[tip].y > landmarks[pips[i]].y;
        });

        return fingersCurled;
    }

    private checkWave(landmarks: NormalizedLandmark[]): boolean {
        // Use Middle Finger Tip
        const trackingPointX = landmarks[12].x;

        this.waveHistory.push(trackingPointX);
        if (this.waveHistory.length > 20) this.waveHistory.shift();

        if (this.waveHistory.length < 5) return false;

        const min = Math.min(...this.waveHistory);
        const max = Math.max(...this.waveHistory);

        // Lower threshold for wave detection
        return (max - min) > 0.15;
    }
}
