<template>
	<div class="magic-rod" v-resize="onResize">
		<article>
			<canvas ref="canvas" :width="size.width" :height="size.height"/>
			<div class="controls">
				<div class="input-group">
					<label for="code-input">Code:</label>
					<input
						id="code-input"
						type="text"
						v-model="code"
						placeholder="Enter F, R, B, L"
						@input="onCodeChange"
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


	interface Size {
		width: number;
		height: number;
	}


	// Create triangular prism geometry matching MagicStick.cpp
	// sectionLength = 10, width = 14.2
	// Bottom face: rectangle from (+10, 0, -7.1) to (-10, 0, +7.1)
	// Top vertex: at (0, 10, z)
	const createTriangularPrism = (): THREE.BufferGeometry => {
		const geometry = new THREE.BufferGeometry();

		const sectionLength = 1.0;  // normalized to 1
		const width = 1.42;          // normalized proportionally (14.2/10)

		// Vertices matching MagicStick.cpp vertexBuffer
		// Bottom face (Y=0)
		const v0 = [+sectionLength, 0, -width/2];  // (+1, 0, -0.71)
		const v1 = [+sectionLength, 0, +width/2];  // (+1, 0, +0.71)
		const v2 = [-sectionLength, 0, -width/2];  // (-1, 0, -0.71)
		const v3 = [-sectionLength, 0, +width/2];  // (-1, 0, +0.71)
		// Top apex (Y=sectionLength)
		const v6 = [0, sectionLength, -width/2];   // (0, 1, -0.71)
		const v7 = [0, sectionLength, +width/2];   // (0, 1, +0.71)

		const vertices = new Float32Array([
			// Bottom face (facing -Y)
			...v3, ...v2, ...v1,
			...v1, ...v2, ...v0,
			// Right side face (from +sectionLength to apex)
			...v7, ...v1, ...v6,
			...v1, ...v0, ...v6,
			// Left side face (from -sectionLength to apex)
			...v7, ...v6, ...v3,
			...v3, ...v6, ...v2,
			// Front triangle (Z = -width/2)
			...v0, ...v2, ...v6,
			// Back triangle (Z = +width/2)
			...v1, ...v7, ...v3,
		]);

		// Calculate normals for each face
		const normals = new Float32Array([
			// Bottom face (facing -Y)
			0, -1, 0,  0, -1, 0,  0, -1, 0,
			0, -1, 0,  0, -1, 0,  0, -1, 0,
			// Right side face (normal pointing outward)
			Math.SQRT1_2, Math.SQRT1_2, 0,  Math.SQRT1_2, Math.SQRT1_2, 0,  Math.SQRT1_2, Math.SQRT1_2, 0,
			Math.SQRT1_2, Math.SQRT1_2, 0,  Math.SQRT1_2, Math.SQRT1_2, 0,  Math.SQRT1_2, Math.SQRT1_2, 0,
			// Left side face (normal pointing outward)
			-Math.SQRT1_2, Math.SQRT1_2, 0,  -Math.SQRT1_2, Math.SQRT1_2, 0,  -Math.SQRT1_2, Math.SQRT1_2, 0,
			-Math.SQRT1_2, Math.SQRT1_2, 0,  -Math.SQRT1_2, Math.SQRT1_2, 0,  -Math.SQRT1_2, Math.SQRT1_2, 0,
			// Front triangle (Z = -width/2, facing -Z)
			0, 0, -1,  0, 0, -1,  0, 0, -1,
			// Back triangle (Z = +width/2, facing +Z)
			0, 0, 1,  0, 0, 1,  0, 0, 1,
		]);

		geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
		geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));

		return geometry;
	};



	export default {
		name: "magic-rod",


		directives: {
			resize,
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


			onCodeChange (): void {
				this.generateRod();
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
					if (i < angles.length) {
						const angle = angles[i];

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
					} else {
						// No more angles, still need to position this block
						const rotateAxis = new THREE.Vector3(1, 1, 0).normalize();
						const rotation1 = new THREE.Matrix4().makeRotationAxis(rotateAxis, 0);
						transform.multiply(rotation1);

						const translation = new THREE.Matrix4().makeTranslation(1, 1, 0);
						transform.multiply(translation);

						const rotation2 = new THREE.Matrix4().makeRotationX(Math.PI);
						transform.multiply(rotation2);
					}
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
					const hue = (i / unitCount) * 360;
					const color = new THREE.Color().setHSL(hue / 360, 0.7, 0.5);

					const material = new THREE.MeshPhongMaterial({
						color: color,
						specular: 0xffffff,
						shininess: 30,
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

				// Adjust camera position based on rod length
				if (this.camera && unitCount > 1) {
					const distance = Math.max(4, unitCount * 0.8);
					this.camera.position.set(distance, distance, distance);
					if (this.controls) {
						this.controls.update();
					}
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
