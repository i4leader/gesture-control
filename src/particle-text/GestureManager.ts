import { NormalizedLandmark } from '@mediapipe/tasks-vision';

export type GestureType = 'none' | 'open_palm' | 'ok_sign' | 'fist' | 'wave';

export class GestureManager {
    private previousGesture: GestureType = 'none';
    private gestureStartTime: number = 0;
    private waveHistory: number[] = []; // Store x-positions of wrist
    private lastLandmarks: NormalizedLandmark[] | null = null;

    constructor() { }

    detectGesture(landmarks: NormalizedLandmark[]): GestureType {
        this.lastLandmarks = landmarks;
        let currentGesture: GestureType = 'none';

        if (this.isOkSign(landmarks)) {
            currentGesture = 'ok_sign';
        } else if (this.isOpenPalm(landmarks)) {
            // Wave check needs history
            if (this.checkWave(landmarks)) {
                currentGesture = 'wave';
            } else {
                currentGesture = 'open_palm';
            }
        } else if (this.isFist(landmarks)) {
            currentGesture = 'fist';
        }

        return currentGesture;
    }

    // Simple check: Index touching Thumb, others extended
    private isOkSign(landmarks: NormalizedLandmark[]): boolean {
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];

        // Distance between thumb and index tip
        const distance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
        const isPinch = distance < 0.05;

        // Check if other fingers are extended (y less than lower joints)
        // Note: y increases downwards. Tip < PIP means extended upwards
        const isMiddleExt = middleTip.y < landmarks[10].y;
        const isRingExt = ringTip.y < landmarks[14].y;
        const isPinkyExt = pinkyTip.y < landmarks[18].y;

        return isPinch && isMiddleExt && isRingExt && isPinkyExt;
    }

    private isOpenPalm(landmarks: NormalizedLandmark[]): boolean {
        // All fingers extended
        const tips = [8, 12, 16, 20];
        const pips = [6, 10, 14, 18];

        // Check thumb: compare tip x to ip x depending on hand side? 
        // Simplified: Check if tip is "far" from wrist compared to other joints?
        // Let's stick to 4 fingers for simplicity + Thumb check

        // Thumb is tricky, let's check distance from CMC(1) to TIP(4) vs IP(3)
        const thumbExt = landmarks[4].y < landmarks[2].y; // Simple vertical check

        const fingersExt = tips.every((tip, i) => {
            return landmarks[tip].y < landmarks[pips[i]].y;
        });

        return fingersExt; // && thumbExt (thumb can be flexible)
    }

    private isFist(landmarks: NormalizedLandmark[]): boolean {
        // All fingers curled
        const tips = [8, 12, 16, 20];
        const pips = [6, 10, 14, 18]; // PIP joint
        const mcp = [5, 9, 13, 17]; // MCP joint (knuckle)

        // Tip should be below PIP (y is higher value)
        const fingersCurled = tips.every((tip, i) => {
            return landmarks[tip].y > landmarks[pips[i]].y;
        });

        return fingersCurled;
    }

    private checkWave(landmarks: NormalizedLandmark[]): boolean {
        const wristX = landmarks[0].x;
        this.waveHistory.push(wristX);
        if (this.waveHistory.length > 30) this.waveHistory.shift();

        if (this.waveHistory.length < 10) return false;

        // Check for oscillation (left-right-left)
        // Simplified: Variance or simple min/max range in short time
        const min = Math.min(...this.waveHistory);
        const max = Math.max(...this.waveHistory);

        // If movement is significant
        return (max - min) > 0.2;
    }
}
