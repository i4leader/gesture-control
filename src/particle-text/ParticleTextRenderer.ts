import * as THREE from 'three';

export class ParticleTextRenderer {
    private scene: THREE.Scene;
    private particles: THREE.Points;
    private geometry: THREE.BufferGeometry;
    private particleCount: number = 10000;
    private currentPositions: Float32Array;
    private targetPositions: Float32Array;

    // To handle smooth transitions
    private transitionSpeed: number = 0.05;
    
    // Performance optimization: track which particles need updates
    private needsUpdate: boolean = true;
    private updateThreshold: number = 0.001; // Minimum movement to trigger update
    
    // Canvas caching for text rendering optimization
    private textCache: Map<string, { points: { x: number, y: number }[], color: number }> = new Map();
    
    // Fist ball effect state
    private isFistBallActive: boolean = false;
    private fistBallRadius: number = 3.0; // Radius of the fist ball
    private fistBallCenter: { x: number, y: number, z: number } = { x: 0, y: 0, z: 0 }; // Ball center position
    private fistBallOffsets: Float32Array; // Store relative positions from center

    constructor(scene: THREE.Scene, particleCount: number = 10000) {
        this.scene = scene;
        this.particleCount = particleCount;
        this.currentPositions = new Float32Array(this.particleCount * 3);
        this.targetPositions = new Float32Array(this.particleCount * 3);
        this.fistBallOffsets = new Float32Array(this.particleCount * 3); // Initialize offsets array

        // Initialize randomly
        for (let i = 0; i < this.particleCount * 3; i++) {
            this.currentPositions[i] = (Math.random() - 0.5) * 10;
            this.targetPositions[i] = (Math.random() - 0.5) * 10;
        }

        this.geometry = new THREE.BufferGeometry();
        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.currentPositions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(this.geometry, material);
        this.scene.add(this.particles);
    }

    // Generate target positions from text
    public updateText(text: string, color: number = 0x00ffff) {
        (this.particles.material as THREE.PointsMaterial).color.setHex(color);

        // Check cache first for performance
        const cacheKey = `${text}_${color}`;
        let validPoints: { x: number, y: number }[];
        
        if (this.textCache.has(cacheKey)) {
            validPoints = this.textCache.get(cacheKey)!.points;
        } else {
            // Generate new text points
            validPoints = this.generateTextPoints(text);
            // Cache for future use (limit cache size)
            if (this.textCache.size > 10) {
                const firstKey = this.textCache.keys().next().value as string;
                this.textCache.delete(firstKey);
            }
            this.textCache.set(cacheKey, { points: validPoints, color });
        }

        // Assign targets
        for (let i = 0; i < this.particleCount; i++) {
            if (i < validPoints.length) {
                this.targetPositions[i * 3] = validPoints[i].x;
                this.targetPositions[i * 3 + 1] = validPoints[i].y;
                this.targetPositions[i * 3 + 2] = 0;
            } else {
                // Excess particles fly away / hide?
                this.targetPositions[i * 3] = (Math.random() - 0.5) * 50;
                this.targetPositions[i * 3 + 1] = (Math.random() - 0.5) * 50;
                this.targetPositions[i * 3 + 2] = (Math.random() - 0.5) * 20;
            }
        }
        
        this.needsUpdate = true;
    }

    private generateTextPoints(text: string): { x: number, y: number }[] {
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return [];

        canvas.width = 1024;
        canvas.height = 512;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 100px "Microsoft YaHei", sans-serif'; // Support Chinese
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        // Sample pixels - increased step size for better performance
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const validPoints: { x: number, y: number }[] = [];

        for (let y = 0; y < canvas.height; y += 6) { // Increased from 4 to 6 for performance
            for (let x = 0; x < canvas.width; x += 6) {
                const index = (y * canvas.width + x) * 4;
                if (data[index] > 128) { // If pixel is bright
                    // Map to 3D space
                    const px = (x - canvas.width / 2) * 0.02;
                    const py = -(y - canvas.height / 2) * 0.02; // Flip Y
                    validPoints.push({ x: px, y: py });
                }
            }
        }
        
        return validPoints;
    }

    public explode() {
        (this.particles.material as THREE.PointsMaterial).color.setHex(0xff0000);
        for (let i = 0; i < this.particleCount; i++) {
            // Explode outwards from fist ball or current positions
            const x = this.currentPositions[i * 3];
            const y = this.currentPositions[i * 3 + 1];
            const z = this.currentPositions[i * 3 + 2];

            // Add random vector away from center with more dramatic effect
            this.targetPositions[i * 3] = x * 8 + (Math.random() - 0.5) * 15;
            this.targetPositions[i * 3 + 1] = y * 8 + (Math.random() - 0.5) * 15;
            this.targetPositions[i * 3 + 2] = z * 8 + (Math.random() - 0.5) * 15;
        }
        
        this.isFistBallActive = false;
        this.needsUpdate = true;
    }

    // New method: Create fist ball effect at specific position
    public createFistBall(palmPosition?: { x: number, y: number, z: number }) {
        (this.particles.material as THREE.PointsMaterial).color.setHex(0xffaa00); // Orange color
        
        // Set ball center position (default to origin if no palm position provided)
        if (palmPosition) {
            // Convert normalized coordinates to world coordinates
            this.fistBallCenter.x = (palmPosition.x - 0.5) * 20; // Scale to world space
            this.fistBallCenter.y = -(palmPosition.y - 0.5) * 15; // Flip Y and scale
            this.fistBallCenter.z = palmPosition.z * 10; // Scale Z
        } else {
            this.fistBallCenter.x = 0;
            this.fistBallCenter.y = 0;
            this.fistBallCenter.z = 0;
        }
        
        // Arrange particles in a sphere formation and store offsets
        for (let i = 0; i < this.particleCount; i++) {
            // Generate random point on sphere surface
            const phi = Math.random() * Math.PI * 2; // Azimuth angle
            const cosTheta = Math.random() * 2 - 1; // Cosine of polar angle
            const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
            
            // Add some randomness to radius for more organic look
            const radius = this.fistBallRadius + (Math.random() - 0.5) * 0.5;
            
            // Calculate offset from center
            const offsetX = radius * sinTheta * Math.cos(phi);
            const offsetY = radius * sinTheta * Math.sin(phi);
            const offsetZ = radius * cosTheta;
            
            // Store offsets for later use
            this.fistBallOffsets[i * 3] = offsetX;
            this.fistBallOffsets[i * 3 + 1] = offsetY;
            this.fistBallOffsets[i * 3 + 2] = offsetZ;
            
            // Set target positions
            this.targetPositions[i * 3] = this.fistBallCenter.x + offsetX;
            this.targetPositions[i * 3 + 1] = this.fistBallCenter.y + offsetY;
            this.targetPositions[i * 3 + 2] = this.fistBallCenter.z + offsetZ;
        }
        
        this.isFistBallActive = true;
        this.needsUpdate = true;
    }

    // New method: Update fist ball position to follow palm
    public updateFistBallPosition(palmPosition: { x: number, y: number, z: number }) {
        if (!this.isFistBallActive) return;
        
        // Convert normalized coordinates to world coordinates
        const newCenterX = (palmPosition.x - 0.5) * 20;
        const newCenterY = -(palmPosition.y - 0.5) * 15;
        const newCenterZ = palmPosition.z * 10;
        
        // Update ball center
        this.fistBallCenter.x = newCenterX;
        this.fistBallCenter.y = newCenterY;
        this.fistBallCenter.z = newCenterZ;
        
        // Update all particle target positions using stored offsets
        for (let i = 0; i < this.particleCount; i++) {
            this.targetPositions[i * 3] = this.fistBallCenter.x + this.fistBallOffsets[i * 3];
            this.targetPositions[i * 3 + 1] = this.fistBallCenter.y + this.fistBallOffsets[i * 3 + 1];
            this.targetPositions[i * 3 + 2] = this.fistBallCenter.z + this.fistBallOffsets[i * 3 + 2];
        }
        
        this.needsUpdate = true;
    }

    public update() {
        if (!this.needsUpdate) return;
        
        const positions = this.geometry.attributes.position.array as Float32Array;
        let hasMovement = false;
        let changedParticles = 0;

        // Use faster transition for fist ball effect
        const currentTransitionSpeed = this.isFistBallActive ? 0.15 : this.transitionSpeed;

        for (let i = 0; i < this.particleCount * 3; i++) {
            const diff = this.targetPositions[i] - positions[i];
            if (Math.abs(diff) > this.updateThreshold) {
                positions[i] += diff * currentTransitionSpeed;
                hasMovement = true;
                if (i % 3 === 0) changedParticles++; // Count particles, not components
            }
        }

        if (hasMovement) {
            // Optimize: only update the range that changed
            const positionAttribute = this.geometry.attributes.position as THREE.BufferAttribute;
            if (changedParticles < this.particleCount * 0.1) {
                // If less than 10% of particles changed, use updateRanges for better performance
                positionAttribute.updateRanges = [{ start: 0, count: changedParticles * 3 }];
            }
            positionAttribute.needsUpdate = true;
        } else {
            // No significant movement, stop updating
            this.needsUpdate = false;
        }
    }

    public resetParticles() {
        (this.particles.material as THREE.PointsMaterial).color.setHex(0xaaaaaa);
        for (let i = 0; i < this.particleCount; i++) {
            // Distribute randomly across the screen space
            this.targetPositions[i * 3] = (Math.random() - 0.5) * 30;     // x range
            this.targetPositions[i * 3 + 1] = (Math.random() - 0.5) * 20; // y range
            this.targetPositions[i * 3 + 2] = (Math.random() - 0.5) * 10; // z depth
        }
        
        this.isFistBallActive = false;
        this.needsUpdate = true;
    }

    // Check if fist ball is currently active
    public isFistBallEffect(): boolean {
        return this.isFistBallActive;
    }
}
