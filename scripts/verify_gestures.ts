
import { GestureManager, GestureType } from '../src/particle-text/GestureManager';

// Mock NormalizedLandmark
interface MockLandmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
}

// Helper to create landmarks
function createLandmarks(updates: { [key: number]: Partial<MockLandmark> } = {}): MockLandmark[] {
    const landmarks: MockLandmark[] = [];
    for (let i = 0; i < 21; i++) {
        // Default: Open Palm facing camera
        // Wrist at bottom (y=1), Fingers up (y=0)
        landmarks.push({ x: 0.5, y: 0.5, z: 0 }); // Default
    }

    // Set standard Open Palm positions (fingers extended up)
    // Wrist
    landmarks[0] = { x: 0.5, y: 1.0, z: 0 };

    // Thumb (1-4)
    landmarks[1] = { x: 0.6, y: 0.9, z: 0 };
    landmarks[2] = { x: 0.7, y: 0.8, z: 0 }; // MCP
    landmarks[3] = { x: 0.8, y: 0.7, z: 0 };
    landmarks[4] = { x: 0.9, y: 0.6, z: 0 }; // Tip higher (y smaller) than MCP? No, for open palm usually tip is higher (y smaller)

    // Fingers: MCP (5,9,13,17), PIP (6,10,14,18), DIP, TIP (8,12,16,20)
    // Standard extended: Tip y < Pip y

    const fingers = [
        [5, 6, 7, 8],    // Index
        [9, 10, 11, 12], // Middle
        [13, 14, 15, 16],// Ring
        [17, 18, 19, 20] // Pinky
    ];

    fingers.forEach((ids, index) => {
        // MCP roughly fixed, others going UP (y decreasing)
        landmarks[ids[0]] = { x: 0.5 + index * 0.1, y: 0.6, z: 0 }; // MCP
        landmarks[ids[1]] = { x: 0.5 + index * 0.1, y: 0.5, z: 0 }; // PIP
        landmarks[ids[2]] = { x: 0.5 + index * 0.1, y: 0.4, z: 0 };
        landmarks[ids[3]] = { x: 0.5 + index * 0.1, y: 0.3, z: 0 }; // Tip
    });

    // Thumb specific for Open Palm: usually out to side and up
    landmarks[4] = { x: 0.9, y: 0.5, z: 0 };

    // Apply updates
    for (const idx in updates) {
        landmarks[idx] = { ...landmarks[idx], ...updates[idx] };
    }

    return landmarks;
}

function runTests() {
    const gm = new GestureManager();
    let passed = 0;
    let total = 0;

    function assert(gesture: GestureType, expected: GestureType, name: string) {
        total++;
        if (gesture === expected) {
            console.log(`[PASS] ${name}`);
            passed++;
        } else {
            console.error(`[FAIL] ${name}: Expected ${expected}, got ${gesture}`);
        }
    }

    console.log("Starting Gesture Tests...");

    // Test 1: Open Palm
    const openPalm = createLandmarks();
    assert(gm.detectGesture(openPalm as any), 'open_palm', 'Open Palm Default');

    // Test 2: Fist (All fingers curled: Tip y > Pip y)
    // AND Thumb should likely be curled or at least not extended up.
    const fistUpdates: any = {};
    [8, 12, 16, 20].forEach(tip => {
        fistUpdates[tip] = { y: 0.8 }; // Tip lower (y bigger)
    });
    // Fix Thumb for Fist: Thumb Tip should not be way above MCP.
    // Let's put Thumb Tip below MCP or near it.
    fistUpdates[4] = { x: 0.7, y: 0.85 }; // Below MCP (0.8)

    assert(gm.detectGesture(createLandmarks(fistUpdates) as any), 'fist', 'Fist (Fingers curled + Thumb not up)');

    // Test 3: Victory (Index, Middle extended. Ring, Pinky curled)
    const victoryUpdates: any = {};
    // Ring curled
    victoryUpdates[16] = { y: 0.8 };
    // Pinky curled
    victoryUpdates[20] = { y: 0.8 };

    // Index/Middle are extended by default in createLandmarks
    assert(gm.detectGesture(createLandmarks(victoryUpdates) as any), 'victory', 'Victory Sign');

    // Test 4: OK Sign (Thumb and Index touching, others extended)
    const okUpdates: any = {};
    // Thumb Tip (4) and Index Tip (8) close
    okUpdates[4] = { x: 0.5, y: 0.5 };
    okUpdates[8] = { x: 0.5, y: 0.5 }; // Touching
    // Others extended (default)
    assert(gm.detectGesture(createLandmarks(okUpdates) as any), 'ok_sign', 'OK Sign');

    // Test 5: Thumbs Up
    // Thumb extended UP (Tip y < MCP y - 0.05)
    // Others curled
    const thumbsUpUpdates: any = {};
    [8, 12, 16, 20].forEach(tip => {
        thumbsUpUpdates[tip] = { y: 0.8 }; // Curled
    });
    // Thumb MCP at 0.8
    thumbsUpUpdates[4] = { y: 0.4 }; // Well above
    assert(gm.detectGesture(createLandmarks(thumbsUpUpdates) as any), 'thumbs_up', 'Thumbs Up');

    // Test 6: Finger Heart
    const heartUpdates: any = {};
    // Thumb (4) and Index (8) close
    heartUpdates[4] = { x: 0.5, y: 0.4 };
    heartUpdates[8] = { x: 0.5, y: 0.4 };
    // Others curled
    heartUpdates[12] = { y: 0.8 };
    heartUpdates[16] = { y: 0.8 };
    heartUpdates[20] = { y: 0.8 };

    // Constraint: Index Tip < Index Pip. 
    // Index Pip is 0.5. 0.4 < 0.5 => TRUE.

    assert(gm.detectGesture(createLandmarks(heartUpdates) as any), 'finger_heart', 'Finger Heart');

    console.log(`\nTests Completed: ${passed}/${total} passed.`);
}

runTests();
