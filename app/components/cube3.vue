<template>
	<canvas
		ref="canvas"
		:width="size.width"
		:height="size.height"
		@mousemove="onMouseMove"
		@mousedown.prevent="onMouseDown"
		@mouseup="onMouseUp"
		@touchstart="onTouchStart"
		@touchmove="onTouchMove"
		@touchend="onTouchEnd"
	/>
</template>

<script>
	import * as THREE from "three";
	import {markRaw} from "vue";

	import {animationDelay} from "../delay";
	import CubeObject from "../cubeObject";



	// Colors from reference (Standard Rubik's Scheme)
	// Order: 0=Left(-X), 1=Right(+X), 2=Down(-Y), 3=Up(+Y), 4=Back(-Z), 5=Front(+Z), 6=Base

	// Base material (black plastic) - used for internal faces
	const baseMaterial = new THREE.MeshStandardMaterial({
		color: 0x111111,
		roughness: 0.6,
		metalness: 0.1,
	});

	// Helper to create colored face material
	const createFaceMat = (color) => new THREE.MeshStandardMaterial({
		color: color,
		roughness: 0.2,
		metalness: 0.0,
		polygonOffset: true,
		polygonOffsetFactor: -1,  // Pull forward to prevent z-fighting
	});

	const BASIC_MATERIALS = [
		createFaceMat(0xff5900),  // Left (Orange)
		createFaceMat(0xb90000),  // Right (Red)
		createFaceMat(0xffd500),  // Down (Yellow)
		createFaceMat(0xffffff),  // Up (White)
		createFaceMat(0x0045ad),  // Back (Blue)
		createFaceMat(0x009b48),  // Front (Green)
		baseMaterial,             // Base (internal plastic)
	];

	// Highlight materials
	const baseHighlightMaterial = new THREE.MeshStandardMaterial({
		color: 0x333333,
		roughness: 0.5,
		metalness: 0.1,
	});

	const createHighlightMat = (color) => new THREE.MeshStandardMaterial({
		color: color,
		roughness: 0.15,
		metalness: 0.0,
		polygonOffset: true,
		polygonOffsetFactor: -1,
	});

	const BASIC_HIGHLIGHT_MATERIALS = [
		createHighlightMat(0xff8844),  // Left highlight
		createHighlightMat(0xdd4444),  // Right highlight
		createHighlightMat(0xffee66),  // Down highlight
		createHighlightMat(0xeeeeee),  // Up highlight
		createHighlightMat(0x4477dd),  // Back highlight
		createHighlightMat(0x44bb66),  // Front highlight
		baseHighlightMaterial,         // Base highlight
	];


	const vectorToAxis = vector => {
		const absPoint = [Math.abs(vector.x), Math.abs(vector.y), Math.abs(vector.z)];
		const maxBranch = Math.max(...absPoint);
		if (absPoint[0] === maxBranch)
			return vector.x > 0 ? 1 : 0;
		else if (absPoint[1] === maxBranch)
			return vector.y > 0 ? 3 : 2;
		else
			return vector.z > 0 ? 5 : 4;
	};


	const CUBE_RADIUS = 1.5;
	const AXIS_POINTS = [
		new THREE.Vector3(-CUBE_RADIUS, 0, 0),
		new THREE.Vector3(+CUBE_RADIUS, 0, 0),
		new THREE.Vector3(0, -CUBE_RADIUS, 0),
		new THREE.Vector3(0, +CUBE_RADIUS, 0),
		new THREE.Vector3(0, 0, -CUBE_RADIUS),
		new THREE.Vector3(0, 0, +CUBE_RADIUS),
	];



	export default {
		name: "cube3",


		props: {
			size: {
				type: Object,
				default: () => ({width: 800, height: 800}),
			},
			code: String,
			meshSchema: {
				type: String,
				default: "cube",
			},
			material: {
				type: [Object, Array],
				default: () => BASIC_MATERIALS,
			},
			highlightMaterial: {
				type: [Object, Array],
				default: () => BASIC_HIGHLIGHT_MATERIALS,
			},
		},


		mounted () {
			//window.cube3 = cube3;

			this.rendererActive = true;

			this.initializeRenderer();

			this.cube = markRaw(new CubeObject({materials: this.material, onChange: algebra => this.onChange(algebra), meshSchema: this.meshSchema}));
			this.scene.add(this.cube.graph);
			//console.log("this.cube:", this.cube);

			this.$emit("cubeCreated", this.cube);

			this.raycaster = markRaw(new THREE.Raycaster());

			this.holdingAxis = null;

			// Inertia for rotation
			this.rotationVelocity = {x: 0, y: 0};

			this.$emit("sceneInitialized", this);

			this.render();
		},


		beforeUnmount () {
			this.rendererActive = false;
		},


		methods: {
			initializeRenderer () {
				// Use markRaw to prevent Vue from making Three.js objects reactive
				this.renderer = markRaw(new THREE.WebGLRenderer({antialias: true, canvas: this.$refs.canvas, alpha: true, premultipliedAlpha: false}));
				this.renderer.setClearColor(new THREE.Color("black"), 0);
				this.renderer.setSize(this.size.width, this.size.height, false);

				//this.camera = new THREE.OrthographicCamera(-0.5, 0.5, this.ratio / 2, this.ratio / -2, 0, 100);
				this.camera = markRaw(new THREE.PerspectiveCamera(60, this.size.width / this.size.height, 3, 12));
				this.camera.position.set(0, 0, 6.4);
				this.camera.lookAt(0, 0, 0);

				this.scene = markRaw(new THREE.Scene());

				// Lighting matching reference demo
				const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
				this.scene.add(ambientLight);

				const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
				dirLight.position.set(10, 20, 10);
				this.scene.add(dirLight);

				const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
				backLight.position.set(-10, -10, -10);
				this.scene.add(backLight);
			},


			async render () {
				let lastTime = performance.now();
				let lastSeconds = Math.floor(lastTime / 1000);
				let frames = 0;
				let stuck = 0;

				const DAMPING = 0.92;  // Inertia damping factor (lower = more friction)
				const MIN_VELOCITY = 0.0001;  // Stop threshold

				while (this.rendererActive) {
					this.$emit("beforeRender", this);

					// Always apply inertia rotation
					if (this.cube && (Math.abs(this.rotationVelocity.x) > MIN_VELOCITY || Math.abs(this.rotationVelocity.y) > MIN_VELOCITY)) {
						this.cube.graph.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), this.rotationVelocity.x);
						this.cube.graph.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), this.rotationVelocity.y);
						this.rotationVelocity.x *= DAMPING;
						this.rotationVelocity.y *= DAMPING;
					}

					this.renderer.render(this.scene, this.camera);

					this.$emit("afterRender", this);

					++frames;

					const now = performance.now();
					stuck = Math.max(stuck, now - lastTime);

					const seconds = Math.floor(now / 1000);
					if (seconds > lastSeconds) {
						const fps = frames / (seconds - lastSeconds);
						this.$emit("fps", {fps, stuck});
						//console.log("fps:", fps);

						frames = 0;
						stuck = 0;
						lastSeconds = seconds;
					}

					//const interval = now - lastTime;
					lastTime = now;

					await animationDelay();
				}
			},


			normalizeScreenPoint (event) {
				return new THREE.Vector3(
					(event.offsetX / this.$refs.canvas.clientWidth) * 2 - 1,
					1 - (event.offsetY / this.$refs.canvas.clientHeight) * 2,
					0);
			},


			raycastAxis (event) {
				if (this.raycaster) {
					const mouse = this.normalizeScreenPoint(event);
					this.raycaster.setFromCamera(mouse, this.camera);
					const intersects = this.raycaster.intersectObject(this.cube.graph, true);
					//console.log("intersects:", intersects);
					if (intersects[0]) {
						//console.log("intersects:", intersects[0]);
						const point = this.cube.graph.worldToLocal(intersects[0].point);
						return vectorToAxis(point);
					}
				}

				return null;
			},


			onMouseMove (event) {
				//console.log("onMouseMove:", event.button, event.buttons);
				if (this.cube) {
					if (Number.isInteger(this.holdingAxis) && event.buttons !== 4) {
						const end = this.normalizeScreenPoint(event);
						const hand = end.clone().sub(this.holdPosition.start);
						const arm = this.holdPosition.start.clone().sub(this.holdPosition.pivot).normalize();
						const angle = -arm.clone().cross(hand).z * 3;
						this.cube.twistGraph(this.holdingAxis, angle);
					}
					else {
						switch (event.buttons) {
						case 1:
						case 4:
							// Add to velocity instead of direct rotation (inertia handles rotation)
							this.rotationVelocity.x += event.movementX * 1e-3;
							this.rotationVelocity.y += event.movementY * 1e-3;

							break;
						case 0:
							// Clear all highlights
							this.cube.cubeMeshes.forEach(mesh => {
								if (mesh.setHighlight) mesh.setHighlight(false);
							});
							// Set highlight on hovered face
							const axis = this.raycastAxis(event);
							if (Number.isInteger(axis)) {
								const faceIndices = this.cube.algebra.faceIndicesFromAxis(axis);
								faceIndices.forEach(index => {
									const mesh = this.cube.cubeMeshes[index];
									if (mesh.setHighlight) mesh.setHighlight(true);
								});
							}

							break;
						}
					}
				}
			},


			onMouseDown (event) {
				switch (event.buttons) {
				case 1:
					const axis = this.raycastAxis(event);
					if (Number.isInteger(axis)) {
						const pivot = this.cube.graph.localToWorld(AXIS_POINTS[axis].clone());
						pivot.project(this.camera);
						pivot.z = 0;
						//console.log("pivot1:", axis, pivot.toArray());

						this.holdingAxis = axis;
						this.holdPosition = {
							pivot,
							start: this.normalizeScreenPoint(event),
						};
					}

					break;
				}
			},


			onMouseUp () {
				if (Number.isInteger(this.holdingAxis)) {
					this.cube.releaseGraph();
					this.holdingAxis = null;
				}
			},


			touchToOffsetPoint (touch, options = {buttons: 0}) {
				const rect = this.$el.getBoundingClientRect();

				return {
					offsetX: touch.pageX - rect.x,
					offsetY: touch.pageY - rect.y,
					...options,
				};
			},


			onTouchStart (event) {
				//console.log("onTouchStart:", event);
				if (this.rendererActive && event.touches.length === 1) {
					this.onMouseDown(this.touchToOffsetPoint(event.touches[0], {buttons: 1}));
					event.preventDefault();
				}
			},


			onTouchMove (event) {
				//console.log("onTouchMove:", event.touches.length);
				switch (event.touches.length) {
				case 1:
					const te = this.touchToOffsetPoint(event.touches[0]);
					this.onMouseMove(te);

					this.lastTouchPoint = {
						offsetX: te.offsetX,
						offsetY: te.offsetY,
					};

					event.preventDefault();

					break;
				case 2: {
						const te = this.touchToOffsetPoint(event.touches[0], {buttons: 1});
						if (this.lastTouchPoint) {
							te.movementX = te.offsetX - this.lastTouchPoint.offsetX;
							te.movementY = te.offsetY - this.lastTouchPoint.offsetY;
							//console.log("te:", te);

							this.holdingAxis = null;

							this.onMouseMove(te);
						}

						this.lastTouchPoint = {
							offsetX: te.offsetX,
							offsetY: te.offsetY,
						};
					}

					event.preventDefault();

					break;
				}
			},


			onTouchEnd () {
				//console.log("onTouchEnd:", event);
				this.onMouseUp();

				this.lastTouchPoint = null;
			},


			/*onGestureChange (event) {
				console.log("cube3.onGestureChange:", event);
			},*/


			onChange (algebra) {
				this.innerCode = algebra.encode();
				this.$emit("update:code", this.innerCode);
			},
		},


		watch: {
			size (value) {
				this.camera.aspect = value.width / value.height;
				this.camera.updateProjectionMatrix();

				this.renderer.setSize(value.width, value.height, false);
			},


			code (value) {
				//console.log("code changed:", value);
				if (this.innerCode !== value)
					this.cube.setState(value);
			},
		},
	};
</script>

<style scoped>
</style>
