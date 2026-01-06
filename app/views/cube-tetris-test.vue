<template>
	<div class="cube-tetris-test">
		<canvas ref="canvas"></canvas>
		<div class="controls">
			<div>
				<label>Test Mode:</label>
				<select v-model="testMode">
					<option value="single">Single Block (faceMask)</option>
					<option value="brick0">Brick4_0 (I-piece)</option>
					<option value="brick1">Brick4_1 (L-piece)</option>
					<option value="brick2">Brick4_2 (T-piece)</option>
					<option value="brick3">Brick4_3 (O-piece)</option>
					<option value="brick4">Brick4_4 (S-piece)</option>
					<option value="brick5">Brick4_5 (3D corner)</option>
					<option value="brick6">Brick4_6 (3D L)</option>
					<option value="brick7">Brick4_7 (3D S)</option>
				</select>
			</div>
			<div v-if="testMode === 'single'">
				<label>Face Mask:</label>
				<label><input type="checkbox" v-model="faces.posX"> +X</label>
				<label><input type="checkbox" v-model="faces.negX"> -X</label>
				<label><input type="checkbox" v-model="faces.posY"> +Y</label>
				<label><input type="checkbox" v-model="faces.negY"> -Y</label>
				<label><input type="checkbox" v-model="faces.posZ"> +Z</label>
				<label><input type="checkbox" v-model="faces.negZ"> -Z</label>
			</div>
			<div v-if="testMode === 'single'">
				<button @click="addSecondBlock = !addSecondBlock">
					{{ addSecondBlock ? 'Hide' : 'Show' }} Adjacent Block (+X)
				</button>
			</div>
			<div v-if="testMode !== 'single'">
				<label><input type="checkbox" v-model="showGhost"> Show Ghost</label>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import {markRaw} from "vue";
import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {FACE_MASK} from "../cubeTetris/constants";
import {createBlockGeometryFromMask, createUnifiedPieceGeometry} from "../cubeTetris/TetrisRenderer";

interface Point3D {
	x: number;
	y: number;
	z: number;
}

// Brick4_0 blocks (I-piece - vertical)
const BRICK0_BLOCKS: Point3D[] = [
	{x: 0, y: 0, z: 0},
	{x: 0, y: 1, z: 0},
	{x: 0, y: 2, z: 0},
	{x: 0, y: 3, z: 0},
];

// Brick4_1 blocks (L-piece)
const BRICK1_BLOCKS: Point3D[] = [
	{x: 0, y: 0, z: 0},
	{x: 1, y: 0, z: 0},
	{x: 0, y: 1, z: 0},
	{x: 0, y: 2, z: 0},
];

// Brick4_2 blocks (T-piece)
const BRICK2_BLOCKS: Point3D[] = [
	{x: 0, y: 0, z: 0},
	{x: 0, y: 1, z: 0},
	{x: 1, y: 1, z: 0},
	{x: 0, y: 2, z: 0},
];

// Brick4_3 blocks (O-piece - 2x2 square)
const BRICK3_BLOCKS: Point3D[] = [
	{x: 0, y: 0, z: 0},
	{x: 1, y: 0, z: 0},
	{x: 0, y: 1, z: 0},
	{x: 1, y: 1, z: 0},
];

// Brick4_4 blocks (S-piece - staircase)
const BRICK4_BLOCKS: Point3D[] = [
	{x: 0, y: 0, z: 0},
	{x: 1, y: 0, z: 0},
	{x: 1, y: 1, z: 0},
	{x: 2, y: 1, z: 0},
];

// Brick4_5 blocks (3D corner piece)
const BRICK5_BLOCKS: Point3D[] = [
	{x: 0, y: 0, z: 0},
	{x: 0, y: 0, z: 1},
	{x: 1, y: 0, z: 0},
	{x: 0, y: 1, z: 0},
];

// Brick4_6 blocks (3D L-piece)
const BRICK6_BLOCKS: Point3D[] = [
	{x: 0, y: 0, z: 0},
	{x: 1, y: 0, z: 0},
	{x: 1, y: 0, z: 1},
	{x: 0, y: 1, z: 0},
];

// Brick4_7 blocks (3D S-piece - mirror of Brick4_6)
const BRICK7_BLOCKS: Point3D[] = [
	{x: 0, y: 0, z: 0},
	{x: 1, y: 0, z: 0},
	{x: 0, y: 0, z: 1},
	{x: 1, y: 1, z: 0},
];

export default {
	name: "cube-tetris-test",
	data() {
		return {
			testMode: "brick0" as "single" | "brick0" | "brick1" | "brick2" | "brick3" | "brick4" | "brick5" | "brick6" | "brick7",
			faces: {
				posX: true,
				negX: true,
				posY: true,
				negY: true,
				posZ: true,
				negZ: true,
			},
			addSecondBlock: false,
			showGhost: true,
			scene: null as THREE.Scene | null,
			camera: null as THREE.PerspectiveCamera | null,
			renderer: null as THREE.WebGLRenderer | null,
			controls: null as OrbitControls | null,
			blockMesh: null as THREE.Mesh | null,
			block2Mesh: null as THREE.Mesh | null,
			ghostMesh: null as THREE.Mesh | null,
		};
	},
	computed: {
		faceMask(): number {
			let mask = 0;
			if (this.faces.posX) mask |= FACE_MASK.POS_X;
			if (this.faces.negX) mask |= FACE_MASK.NEG_X;
			if (this.faces.posY) mask |= FACE_MASK.POS_Y;
			if (this.faces.negY) mask |= FACE_MASK.NEG_Y;
			if (this.faces.posZ) mask |= FACE_MASK.POS_Z;
			if (this.faces.negZ) mask |= FACE_MASK.NEG_Z;
			return mask;
		},
		faceMask2(): number {
			return FACE_MASK.POS_X | FACE_MASK.POS_Y | FACE_MASK.NEG_Y | FACE_MASK.POS_Z | FACE_MASK.NEG_Z;
		},
	},
	watch: {
		faceMask() {
			this.updateBlock();
		},
		addSecondBlock() {
			this.updateBlock();
		},
		testMode() {
			this.updateBlock();
		},
		showGhost() {
			this.updateBlock();
		},
	},
	mounted() {
		this.initScene();
		this.updateBlock();
		this.animate();
	},
	beforeUnmount() {
		if (this.renderer) {
			this.renderer.dispose();
		}
	},
	methods: {
		initScene() {
			const canvas = this.$refs.canvas as HTMLCanvasElement;

			this.scene = markRaw(new THREE.Scene());
			this.scene.background = new THREE.Color(0x1a1a2e);

			this.camera = markRaw(new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100));
			this.camera.position.set(3, 3, 3);

			this.renderer = markRaw(new THREE.WebGLRenderer({ canvas, antialias: true }));
			this.renderer.setSize(window.innerWidth, window.innerHeight);

			this.controls = markRaw(new OrbitControls(this.camera, canvas));
			this.controls.target.set(0.5, 0.5, 0.5);
			this.controls.update();

			// Lighting
			const ambient = new THREE.AmbientLight(0xffffff, 0.4);
			this.scene.add(ambient);

			const directional = new THREE.DirectionalLight(0xffffff, 0.8);
			directional.position.set(5, 10, 5);
			this.scene.add(directional);

			// Grid
			const grid = new THREE.GridHelper(4, 4);
			grid.position.y = -0.5;
			this.scene.add(grid);

			// Axes
			const axes = new THREE.AxesHelper(2);
			this.scene.add(axes);
		},
		updateBlock() {
			if (!this.scene) return;

			// Remove old meshes
			if (this.blockMesh) {
				this.scene.remove(this.blockMesh);
				this.blockMesh.geometry.dispose();
				(this.blockMesh.material as THREE.Material).dispose();
				this.blockMesh = null;
			}
			if (this.block2Mesh) {
				this.scene.remove(this.block2Mesh);
				this.block2Mesh.geometry.dispose();
				(this.block2Mesh.material as THREE.Material).dispose();
				this.block2Mesh = null;
			}
			if (this.ghostMesh) {
				this.scene.remove(this.ghostMesh);
				this.ghostMesh.geometry.dispose();
				(this.ghostMesh.material as THREE.Material).dispose();
				this.ghostMesh = null;
			}

			// Brick type mapping: blocks and colors
			const brickMap: Record<string, {blocks: Point3D[]; color: number}> = {
				brick0: {blocks: BRICK0_BLOCKS, color: 0xff4444},  // red
				brick1: {blocks: BRICK1_BLOCKS, color: 0xff88aa},  // pink
				brick2: {blocks: BRICK2_BLOCKS, color: 0xaa6644},  // brown
				brick3: {blocks: BRICK3_BLOCKS, color: 0x4444ff},  // blue
				brick4: {blocks: BRICK4_BLOCKS, color: 0x44ff44},  // green
				brick5: {blocks: BRICK5_BLOCKS, color: 0xaa44aa},  // purple
				brick6: {blocks: BRICK6_BLOCKS, color: 0xffff44},  // yellow
				brick7: {blocks: BRICK7_BLOCKS, color: 0x44ffff},  // cyan
			};

			const brickInfo = brickMap[this.testMode];
			if (brickInfo) {
				// Create unified piece geometry for the brick
				const geometry = createUnifiedPieceGeometry(brickInfo.blocks);
				const material = new THREE.MeshStandardMaterial({
					color: brickInfo.color,
					metalness: 0.3,
					roughness: 0.4,
				});
				this.blockMesh = markRaw(new THREE.Mesh(geometry, material));
				this.scene.add(this.blockMesh);

				// Add ghost mesh if enabled
				if (this.showGhost) {
					const ghostGeometry = createUnifiedPieceGeometry(brickInfo.blocks);
					const ghostMaterial = new THREE.MeshStandardMaterial({
						color: 0xffffff,
						transparent: true,
						opacity: 0.15,
					});
					this.ghostMesh = markRaw(new THREE.Mesh(ghostGeometry, ghostMaterial));
					// Offset ghost based on brick width
					const maxX = Math.max(...brickInfo.blocks.map(b => b.x));
					this.ghostMesh.position.x = maxX + 2;
					this.scene.add(this.ghostMesh);
				}
			} else {
				// Single block mode
				const geometry = createBlockGeometryFromMask(this.faceMask);
				const material = new THREE.MeshStandardMaterial({
					color: 0x44aaff,
					metalness: 0.3,
					roughness: 0.4,
				});
				this.blockMesh = markRaw(new THREE.Mesh(geometry, material));
				this.scene.add(this.blockMesh);

				if (this.addSecondBlock) {
					const geometry2 = createBlockGeometryFromMask(this.faceMask2);
					const material2 = new THREE.MeshStandardMaterial({
						color: 0xff8844,
						metalness: 0.3,
						roughness: 0.4,
					});
					this.block2Mesh = markRaw(new THREE.Mesh(geometry2, material2));
					this.block2Mesh.position.x = 1;
					this.scene.add(this.block2Mesh);
				}
			}
		},
		animate() {
			requestAnimationFrame(() => this.animate());
			if (this.controls) this.controls.update();
			if (this.renderer && this.scene && this.camera) {
				this.renderer.render(this.scene, this.camera);
			}
		},
	},
};
</script>

<style scoped lang="scss">
.cube-tetris-test {
	width: 100vw;
	height: 100vh;
	position: relative;

	canvas {
		width: 100%;
		height: 100%;
	}

	.controls {
		position: absolute;
		top: 10px;
		left: 10px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 15px;
		border-radius: 8px;

		label {
			margin-right: 10px;
			cursor: pointer;
		}

		select {
			padding: 5px;
			margin-left: 10px;
		}

		button {
			margin-top: 10px;
			padding: 8px 16px;
			cursor: pointer;
		}

		p {
			margin: 10px 0 0 0;
			font-size: 12px;
			color: #aaa;
		}
	}
}
</style>
