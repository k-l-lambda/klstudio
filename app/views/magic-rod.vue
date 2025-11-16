<template>
	<div class="magic-rod" v-resize="onResize">
		<article>
			<canvas ref="canvas" :width="size.width" :height="size.height"/>
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


	// Create triangular prism geometry
	// Base: isosceles right triangle with legs of 1, hypotenuse of sqrt(2)
	// Height: 1
	const createTriangularPrism = (): THREE.BufferGeometry => {
		const geometry = new THREE.BufferGeometry();

		// Vertices for the triangular prism
		// Bottom triangle (at z = 0): right angle at origin
		const v0: number[] = [0, 0, 0];      // Right angle vertex
		const v1: number[] = [1, 0, 0];      // Along x-axis
		const v2: number[] = [0, 1, 0];      // Along y-axis

		// Top triangle (at z = 1)
		const v3: number[] = [0, 0, 1];      // Right angle vertex
		const v4: number[] = [1, 0, 1];      // Along x-axis
		const v5: number[] = [0, 1, 1];      // Along y-axis

		const vertices = new Float32Array([
			// Bottom triangle
			...v0, ...v1, ...v2,
			// Top triangle
			...v3, ...v4, ...v5,
			// Side face 1 (v0-v1-v4-v3)
			...v0, ...v1, ...v4,
			...v0, ...v4, ...v3,
			// Side face 2 (v1-v2-v5-v4)
			...v1, ...v2, ...v5,
			...v1, ...v5, ...v4,
			// Side face 3 (v2-v0-v3-v5)
			...v2, ...v0, ...v3,
			...v2, ...v3, ...v5,
		]);

		// Calculate normals for each face
		const normals = new Float32Array([
			// Bottom triangle (facing -z)
			0, 0, -1,  0, 0, -1,  0, 0, -1,
			// Top triangle (facing +z)
			0, 0, 1,   0, 0, 1,   0, 0, 1,
			// Side face 1 (facing -y)
			0, -1, 0,  0, -1, 0,  0, -1, 0,
			0, -1, 0,  0, -1, 0,  0, -1, 0,
			// Side face 2 (hypotenuse, facing outward)
			Math.SQRT1_2, Math.SQRT1_2, 0,  Math.SQRT1_2, Math.SQRT1_2, 0,  Math.SQRT1_2, Math.SQRT1_2, 0,
			Math.SQRT1_2, Math.SQRT1_2, 0,  Math.SQRT1_2, Math.SQRT1_2, 0,  Math.SQRT1_2, Math.SQRT1_2, 0,
			// Side face 3 (facing -x)
			-1, 0, 0,  -1, 0, 0,  -1, 0, 0,
			-1, 0, 0,  -1, 0, 0,  -1, 0, 0,
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
			renderer?: THREE.WebGLRenderer;
			camera?: THREE.PerspectiveCamera;
			scene?: THREE.Scene;
			controls?: OrbitControls;
			prism?: THREE.Mesh;
			rendererActive: boolean;
		} {
			return {
				size: {width: 800, height: 600},
				fps: 0,
				renderer: undefined,
				camera: undefined,
				scene: undefined,
				controls: undefined,
				prism: undefined,
				rendererActive: false,
			};
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

				// Create the triangular prism geometry
				const geometry = createTriangularPrism();

				// Create material
				const material = new THREE.MeshPhongMaterial({
					color: 0x4488ff,
					specular: 0xffffff,
					shininess: 30,
					side: THREE.DoubleSide,
				});

				// Create mesh
				this.prism = markRaw(new THREE.Mesh(geometry, material));

				// Center the prism
				this.prism.position.set(-0.5, -0.5, -0.5);

				this.scene.add(this.prism);

				// Add axes helper
				const axesHelper = new THREE.AxesHelper(2);
				this.scene.add(axesHelper);

				// Add grid helper
				const gridHelper = new THREE.GridHelper(10, 10);
				gridHelper.position.y = -0.5;
				this.scene.add(gridHelper);
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
