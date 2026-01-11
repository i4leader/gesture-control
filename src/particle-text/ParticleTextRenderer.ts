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

    constructor(scene: THREE.Scene, particleCount: number = 10000) {
        this.scene = scene;
        this.particleCount = particleCount;
        this.currentPositions = new Float32Array(this.particleCount * 3);
        this.targetPositions = new Float32Array(this.particleCount * 3);

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
            // Explode outwards
            const x = this.currentPositions[i * 3];
            const y = this.currentPositions[i * 3 + 1];
            const z = this.currentPositions[i * 3 + 2];

            // Add random vector away from center
            this.targetPositions[i * 3] = x * 5 + (Math.random() - 0.5) * 10;
            this.targetPositions[i * 3 + 1] = y * 5 + (Math.random() - 0.5) * 10;
            this.targetPositions[i * 3 + 2] = z * 5 + (Math.random() - 0.5) * 10;
        }
        
        this.needsUpdate = true;
    }

    public update() {
        if (!this.needsUpdate) return;
        
        const positions = this.geometry.attributes.position.array as Float32Array;
        let hasMovement = false;
        let changedParticles = 0;

        for (let i = 0; i < this.particleCount * 3; i++) {
            const diff = this.targetPositions[i] - positions[i];
            if (Math.abs(diff) > this.updateThreshold) {
                positions[i] += diff * this.transitionSpeed;
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
        
        this.needsUpdate = true;
    }
}
