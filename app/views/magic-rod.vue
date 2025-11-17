<template>
	<div class="magic-rod" v-resize="onResize">
		<article>
			<canvas ref="canvas" :width="size.width" :height="size.height"/>
			<div class="controls">
				<div class="input-group">
					<label for="code-input">Code:</label>
					<StoreInput
						id="code-input"
						type="text"
						v-model="code"
						placeholder="Enter F, R, B, L"
						localKey="magic-rod-code"
					/>
					<span class="unit-count">Units: {{unitCount}}</span>
				</div>
				<div v-if="validationError" class="error">{{validationError}}</div>
			</div>
			<span class="status" v-show="showStatus">
				<span v-if="fps" class="fps">fps <em>{{fps}}</em></span>
			</span>
		</article>
	</div>
</template>

<script lang="ts">
	import {markRaw} from "vue";
	import resize from "vue-resize-directive";
	import * as THREE from "three";
	import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";

	import {animationDelay} from "../delay";
	import QuitClearner from "../mixins/quit-cleaner";
	import StoreInput from "../components/store-input.vue";


	interface Size {
		width: number;
		height: number;
	}


	// Create triangular prism geometry with hexagonal chamfer seams
	// sectionLength = 10, width = 14.2
	// Main faces shrink inward by chamfer distance, connected by hexagonal strips
	const createTriangularPrism = (): THREE.BufferGeometry => {
		const geometry = new THREE.BufferGeometry();

		const sectionLength = 1.0;  // normalized to 1
		const width = 1.42;          // normalized proportionally (14.2/10)
		const chamfer = 0.03;        // chamfer distance

		// Original vertices
		const v0 = [+sectionLength, 0, -width/2];  // bottom right front
		const v1 = [+sectionLength, 0, +width/2];  // bottom right back
		const v2 = [-sectionLength, 0, -width/2];  // bottom left front
		const v3 = [-sectionLength, 0, +width/2];  // bottom left back
		const v6 = [0, sectionLength, -width/2];   // top front apex
		const v7 = [0, sectionLength, +width/2];   // top back apex

		// Calculate face centers
		const centerBottom = [0, 0, 0];
		const centerRight = [(v0[0]+v1[0]+v6[0]+v7[0])/4, (v0[1]+v1[1]+v6[1]+v7[1])/4, (v0[2]+v1[2]+v6[2]+v7[2])/4];
		const centerLeft = [(v2[0]+v3[0]+v6[0]+v7[0])/4, (v2[1]+v3[1]+v6[1]+v7[1])/4, (v2[2]+v3[2]+v6[2]+v7[2])/4];
		const centerFront = [(v0[0]+v2[0]+v6[0])/3, (v0[1]+v2[1]+v6[1])/3, (v0[2]+v2[2]+v6[2])/3];
		const centerBack = [(v1[0]+v3[0]+v7[0])/3, (v1[1]+v3[1]+v7[1])/3, (v1[2]+v3[2]+v7[2])/3];

		// Helper: offset a vertex toward a center by chamfer distance
		const offsetToward = (v: number[], center: number[]) => {
			const dx = center[0] - v[0];
			const dy = center[1] - v[1];
			const dz = center[2] - v[2];
			const len = Math.sqrt(dx*dx + dy*dy + dz*dz);
			const scale = chamfer / len;
			return [
				v[0] + dx * scale,
				v[1] + dy * scale,
				v[2] + dz * scale,
			];
		};

		// Inset vertices for bottom face (toward center)
		const v0_bot = offsetToward(v0, centerBottom);
		const v1_bot = offsetToward(v1, centerBottom);
		const v2_bot = offsetToward(v2, centerBottom);
		const v3_bot = offsetToward(v3, centerBottom);

		// Inset vertices for right side face
		const v0_right = offsetToward(v0, centerRight);
		const v1_right = offsetToward(v1, centerRight);
		const v6_right = offsetToward(v6, centerRight);
		const v7_right = offsetToward(v7, centerRight);

		// Inset vertices for left side face
		const v2_left = offsetToward(v2, centerLeft);
		const v3_left = offsetToward(v3, centerLeft);
		const v6_left = offsetToward(v6, centerLeft);
		const v7_left = offsetToward(v7, centerLeft);

		// Inset vertices for front triangle
		const v0_front = offsetToward(v0, centerFront);
		const v2_front = offsetToward(v2, centerFront);
		const v6_front = offsetToward(v6, centerFront);

		// Inset vertices for back triangle
		const v1_back = offsetToward(v1, centerBack);
		const v3_back = offsetToward(v3, centerBack);
		const v7_back = offsetToward(v7, centerBack);

		// Intersection vertices (where 3+ ridges meet)
		// Interpolate between the average of offset positions and original vertex
		const avg = (...verts: number[][]) => {
			const sum = verts.reduce((acc, v) => [acc[0]+v[0], acc[1]+v[1], acc[2]+v[2]], [0, 0, 0]);
			return [sum[0]/verts.length, sum[1]/verts.length, sum[2]/verts.length];
		};
		const interpolate = (a: number[], b: number[], t: number) => [
			a[0] * t + b[0] * (1 - t),
			a[1] * t + b[1] * (1 - t),
			a[2] * t + b[2] * (1 - t),
		];

		// v0 corner: Bottom, Right, Front
		const v0_corner = interpolate(avg(v0_bot, v0_right, v0_front), v0, 0.6);

		// v1 corner: Bottom, Right, Back
		const v1_corner = interpolate(avg(v1_bot, v1_right, v1_back), v1, 0.6);

		// v2 corner: Bottom, Left, Front
		const v2_corner = interpolate(avg(v2_bot, v2_left, v2_front), v2, 0.6);

		// v3 corner: Bottom, Left, Back
		const v3_corner = interpolate(avg(v3_bot, v3_left, v3_back), v3, 0.6);

		// v6 apex: Right, Left, Front
		const v6_corner = interpolate(avg(v6_right, v6_left, v6_front), v6, 0.6);

		// v7 apex: Right, Left, Back
		const v7_corner = interpolate(avg(v7_right, v7_left, v7_back), v7, 0.6);

		const vertices: number[] = [];

		// Main inset faces
		// Bottom rectangle
		vertices.push(...v3_bot, ...v2_bot, ...v1_bot);
		vertices.push(...v1_bot, ...v2_bot, ...v0_bot);

		// Right side trapezoid
		vertices.push(...v7_right, ...v1_right, ...v6_right);
		vertices.push(...v1_right, ...v0_right, ...v6_right);

		// Left side trapezoid
		vertices.push(...v7_left, ...v6_left, ...v3_left);
		vertices.push(...v3_left, ...v6_left, ...v2_left);

		// Front triangle
		vertices.push(...v0_front, ...v2_front, ...v6_front);

		// Back triangle
		vertices.push(...v1_back, ...v7_back, ...v3_back);

		// Helper to create hexagonal strip (as 4 triangles)
		const hexStrip = (e1a: number[], e1b: number[], e2a: number[], e2b: number[], c1: number[], c2: number[]) => {
			// Hexagon vertices: e1a, c1, e2a, e2b, c2, e1b
			// Subdivide into 4 triangles forming 2 trapezoids
			// Trapezoid 1: e1a-c1-e2a-midpoint
			// Trapezoid 2: e1b-midpoint-e2b-c2
			// Trapezoid 1: 2 triangles
			vertices.push(...e1a, ...c1, ...e1b);
			vertices.push(...e1b, ...c1, ...c2);

			// Trapezoid 2: 2 triangles
			vertices.push(...e2a, ...c2, ...e2b);
			vertices.push(...e2a, ...c1, ...c2);
		};

		// Hexagonal chamfer strips (9 edges)
		// 1. Bottom-Right edge (v0-v1)
		hexStrip(v0_bot, v1_bot, v0_right, v1_right, v0_corner, v1_corner);

		// 2. Bottom-Left edge (v2-v3)
		hexStrip(v2_bot, v3_bot, v2_left, v3_left, v2_corner, v3_corner);

		// 3. Bottom-Front edge (v0-v2)
		hexStrip(v0_bot, v2_bot, v0_front, v2_front, v0_corner, v2_corner);

		// 4. Bottom-Back edge (v1-v3)
		hexStrip(v1_bot, v3_bot, v1_back, v3_back, v1_corner, v3_corner);

		// 5. Right-Front edge (v0-v6)
		hexStrip(v0_right, v6_right, v0_front, v6_front, v0_corner, v6_corner);

		// 6. Right-Back edge (v1-v7)
		hexStrip(v1_right, v7_right, v1_back, v7_back, v1_corner, v7_corner);

		// 7. Left-Front edge (v2-v6)
		hexStrip(v2_left, v6_left, v2_front, v6_front, v2_corner, v6_corner);

		// 8. Left-Back edge (v3-v7)
		hexStrip(v3_left, v7_left, v3_back, v7_back, v3_corner, v7_corner);

		// 9. Top ridge (v6-v7, connecting Right and Left)
		hexStrip(v6_right, v7_right, v6_left, v7_left, v6_corner, v7_corner);

		geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertices), 3));
		geometry.computeVertexNormals();

		return geometry;
	};



	export default {
		name: "magic-rod",


		directives: {
			resize,
		},

		components: {
			StoreInput,
		},

		mixins: [
			QuitClearner,
		],


		props: {
			showStatus: {
				type: Boolean,
				default: true,
			},
		},


		data (): {
			size: Size;
			fps: number;
			code: string;
			validationError: string;
			renderer?: THREE.WebGLRenderer;
			camera?: THREE.PerspectiveCamera;
			scene?: THREE.Scene;
			controls?: OrbitControls;
			prisms: THREE.Mesh[];
			rendererActive: boolean;
		} {
			return {
				size: {width: 800, height: 600},
				fps: 0,
				code: "",
				validationError: "",
				renderer: undefined,
				camera: undefined,
				scene: undefined,
				controls: undefined,
				prisms: [],
				rendererActive: false,
			};
		},


		computed: {
			unitCount (): number {
				return this.code.length + 1;
			},
		},


		mounted (): void {
			this.initializeRenderer();
			this.createScene();
			this.render();
		},


		beforeUnmount (): void {
			this.rendererActive = false;
			if (this.controls) {
				this.controls.dispose();
			}
		},


		methods: {
			onResize (): void {
				this.size = {width: this.$el.clientWidth, height: this.$el.clientHeight};

				if (this.camera) {
					this.camera.aspect = this.size.width / this.size.height;
					this.camera.updateProjectionMatrix();
				}

				if (this.renderer) {
					this.renderer.setSize(this.size.width, this.size.height, false);
				}
			},


			// Parse code string and validate
			parseCode (code: string): number[] | null {
				const upperCode = code.toUpperCase();
				const angles: number[] = [];

				for (let i = 0; i < upperCode.length; i++) {
					const char = upperCode[i];
					switch (char) {
						case "F":
							angles.push(0);
							break;
						case "R":
							angles.push(Math.PI / 2);
							break;
						case "B":
							angles.push(Math.PI);
							break;
						case "L":
							angles.push(-Math.PI / 2);
							break;
						default:
							this.validationError = `Invalid character '${char}' at position ${i + 1}. Use only F, R, B, L.`;
							return null;
					}
				}

				this.validationError = "";
				return angles;
			},


			// Calculate transformation for unit at given index
			calculateUnitTransform (index: number, angles: number[]): THREE.Matrix4 {
				const transform = new THREE.Matrix4();

				// If this is the first block, no transformation
				if (index === 0) {
					return transform;
				}

				// Calculate cumulative transformation
				// Each connection: rotate around (1,1,0) by angle, then translate (1,1,0), then rotate 180° around X
				for (let i = 0; i < index; i++) {
					const angle = i < angles.length ? angles[i] : 0;

					// Step 1: Rotate around normalized (1, 1, 0) axis by the angle
					const rotateAxis = new THREE.Vector3(1, 1, 0).normalize();
					const rotation1 = new THREE.Matrix4().makeRotationAxis(rotateAxis, angle);
					transform.multiply(rotation1);

					// Step 2: Translate to (sectionLength, sectionLength, 0)
					const translation = new THREE.Matrix4().makeTranslation(1, 1, 0);
					transform.multiply(translation);

					// Step 3: Rotate 180° around X axis
					const rotation2 = new THREE.Matrix4().makeRotationX(Math.PI);
					transform.multiply(rotation2);
				}

				return transform;
			},


			// Generate the rod based on current code
			generateRod (): void {
				if (!this.scene) return;

				// Parse the code
				const angles = this.parseCode(this.code);
				if (angles === null) return;

				// Clear existing prisms
				for (const prism of this.prisms) {
					this.scene.remove(prism);
					prism.geometry.dispose();
					if (Array.isArray(prism.material)) {
						prism.material.forEach(m => m.dispose());
					} else {
						prism.material.dispose();
					}
				}
				this.prisms = [];

				// Create geometry (shared by all units)
				const geometry = createTriangularPrism();

				// Calculate number of units
				const unitCount = this.code.length + 1;

				// Create each unit
				for (let i = 0; i < unitCount; i++) {
					// Create material with different color for each unit
					const hue = i * 90;
					const color = new THREE.Color().setHSL(hue / 360, 0.7, 0.5);

					const material = new THREE.MeshPhongMaterial({
						color: color,
						specular: 0x111111,
						shininess: 150,
						side: THREE.DoubleSide,
					});

					// Create mesh
					const mesh = markRaw(new THREE.Mesh(geometry, material));

					// Apply transformation
					const transform = this.calculateUnitTransform(i, angles);
					mesh.applyMatrix4(transform);

					// Add to scene
					this.scene.add(mesh);
					this.prisms.push(mesh);
				}
			},


			initializeRenderer (): void {
				const canvas = this.$refs.canvas as HTMLCanvasElement;

				this.renderer = markRaw(new THREE.WebGLRenderer({antialias: true, canvas}));
				this.renderer.setClearColor(new THREE.Color("#e0e8f0"), 1);
				this.renderer.setSize(this.size.width, this.size.height, false);

				this.camera = markRaw(new THREE.PerspectiveCamera(60, this.size.width / this.size.height, 0.1, 100));
				this.camera.position.set(2, 2, 3);

				this.scene = markRaw(new THREE.Scene());

				// Main directional light
				const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
				mainLight.position.set(5, 10, 7);
				this.scene.add(mainLight);

				// Fill light
				const fillLight = new THREE.DirectionalLight(0x8888ff, 0.4);
				fillLight.position.set(-5, 0, -5);
				this.scene.add(fillLight);

				// Ambient light
				this.scene.add(new THREE.AmbientLight(0x404040, 0.5));

				// Orbit controls
				this.controls = markRaw(new OrbitControls(this.camera, canvas));
				this.controls.enableDamping = true;
				this.controls.dampingFactor = 0.05;

				this.rendererActive = true;
			},


			createScene (): void {
				if (!this.scene) return;

				// Add axes helper
				const axesHelper = new THREE.AxesHelper(2);
				this.scene.add(axesHelper);

				// Add grid helper
				const gridHelper = new THREE.GridHelper(10, 10);
				gridHelper.position.y = 0;
				this.scene.add(gridHelper);

				// Generate initial rod (empty code = 1 unit)
				this.generateRod();
			},


			async render (): Promise<void> {
				let lastTime = performance.now();
				let lastSeconds = Math.floor(lastTime / 1000);
				let frames = 0;

				while (this.rendererActive) {
					await animationDelay();

					// Update controls
					if (this.controls) {
						this.controls.update();
					}

					// Render scene
					if (this.renderer && this.scene && this.camera) {
						this.renderer.render(this.scene, this.camera);
					}

					// Calculate FPS
					frames++;
					const now = performance.now();
					const seconds = Math.floor(now / 1000);
					if (seconds !== lastSeconds) {
						this.fps = frames;
						frames = 0;
						lastSeconds = seconds;
					}
				}
			},
		},

		watch: {
			code: "generateRod",
		},
	};
</script>

<style lang="scss">
	.magic-rod
	{
		width: 100%;
		height: 100%;

		article
		{
			position: relative;
			width: 100%;
			height: 100%;
		}

		canvas
		{
			display: block;
		}

		.controls
		{
			position: absolute;
			top: 1em;
			left: 1em;
			background: rgba(255, 255, 255, 0.9);
			padding: 1em;
			border-radius: 8px;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
			z-index: 10;

			.input-group
			{
				display: flex;
				align-items: center;
				gap: 0.5em;

				label
				{
					font-weight: bold;
					font-size: 14px;
				}

				input
				{
					padding: 0.4em 0.8em;
					border: 2px solid #4488ff;
					border-radius: 4px;
					font-size: 14px;
					text-transform: uppercase;
					font-family: monospace;
					min-width: 200px;

					&:focus
					{
						outline: none;
						border-color: #2266dd;
						box-shadow: 0 0 0 3px rgba(68, 136, 255, 0.1);
					}
				}

				.unit-count
				{
					font-size: 13px;
					color: #666;
					font-weight: 500;
					padding: 0.4em 0.8em;
					background: #f0f0f0;
					border-radius: 4px;
				}
			}

			.error
			{
				margin-top: 0.5em;
				padding: 0.5em;
				background: #ffebee;
				color: #c62828;
				border-radius: 4px;
				font-size: 13px;
			}
		}

		.status
		{
			position: absolute;
			right: 1em;
			bottom: 1em;
			display: flex;
			flex-direction: column;
			gap: 0.5em;
			font-size: 12px;
			color: #666;

			.fps
			{
				em
				{
					font-style: normal;
					font-weight: bold;
					color: #333;
				}
			}
		}
	}
</style>
