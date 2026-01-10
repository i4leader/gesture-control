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

    constructor(scene: THREE.Scene) {
        this.scene = scene;
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

        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 1024;
        canvas.height = 512;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 100px "Microsoft YaHei", sans-serif'; // Support Chinese
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        // Sample pixels
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const validPoints: { x: number, y: number }[] = [];

        for (let y = 0; y < canvas.height; y += 4) { // Step 4 for optimization
            for (let x = 0; x < canvas.width; x += 4) {
                const index = (y * canvas.width + x) * 4;
                if (data[index] > 128) { // If pixel is bright
                    // Map to 3D space
                    const px = (x - canvas.width / 2) * 0.02;
                    const py = -(y - canvas.height / 2) * 0.02; // Flip Y
                    validPoints.push({ x: px, y: py });
                }
            }
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
    }

    public update() {
        const positions = this.geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < this.particleCount * 3; i++) {
            positions[i] += (this.targetPositions[i] - positions[i]) * this.transitionSpeed;
        }

        this.geometry.attributes.position.needsUpdate = true;
    }
}
