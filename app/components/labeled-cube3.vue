<template>
	<div>
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
		<canvas v-show="false" ref="textureCanvas" class="texture-canvas" :width="256" :height="256" />
	</div>
</template>

<script>
	import * as THREE from "three";

	import {animationDelay} from "../delay";
	import CubeObject from "../cubeObject";



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

	const BASIC_MATERIALS = [
		...Array(6).fill("white"), "black",
	].map(color => new THREE.MeshBasicMaterial({color: new THREE.Color(color)}));



	export default {
		name: "cube3",


		props: {
			size: {
				type: Object,
				default: () => ({width: 800, height: 800}),
			},
			code: String,
			enabledTwist: {
				type: Boolean,
				default: true,
			},
		},


		async mounted () {
			this.rendererActive = true;

			this.initializeRenderer();

			this.cubeGroup = new THREE.Object3D();
			this.scene.add(this.cubeGroup);

			this.cube = new CubeObject({materials: BASIC_MATERIALS, onChange: algebra => this.onChange(algebra), meshSchema: "cube"});
			this.cubeGroup.add(this.cube.graph);

			const blackMaterials = await this.createLabelMaterials();
			this.cubeLB = new CubeObject({materials: blackMaterials, meshSchema: "cube26"});
			this.cubeLB.graph.scale.set(1.01, 1.01, 1.01);
			this.cubeGroup.add(this.cubeLB.graph);

			this.raycaster = new THREE.Raycaster();

			this.holdingAxis = null;

			this.$emit("sceneInitialized", this);

			this.render();
		},


		beforeDestroy () {
			this.rendererActive = false;
		},


		methods: {
			initializeRenderer () {
				this.renderer = new THREE.WebGLRenderer({antialias: true, canvas: this.$refs.canvas, alpha: true});
				this.renderer.setClearColor(new THREE.Color("black"), 0);
				this.renderer.setSize(this.size.width, this.size.height, false);

				this.camera = new THREE.PerspectiveCamera(60, this.size.width / this.size.height, 3, 12);
				this.camera.position.set(0, 0, 6.4);
				this.camera.lookAt(0, 0, 0);

				this.scene = new THREE.Scene();
			},


			async createLabelMaterials () {
				const ctx = this.$refs.textureCanvas.getContext("2d");
				ctx.font = "240px monospace";

				const A = "A".charCodeAt(0);

				const textures = [];

				for (let char = A; char < A + 26; ++char) {
					ctx.clearRect(0, 0, 256, 256);
					ctx.fillText(String.fromCharCode(char), 60, 200);

					const blob = await new Promise(resolve => this.$refs.textureCanvas.toBlob(resolve, "image/png"));
					const image = new Image();
					image.src = URL.createObjectURL(blob);
					await new Promise(resolve => image.onload = resolve);

					const tex = new THREE.Texture(image);
					tex.needsUpdate = true;

					textures.push(tex);
				};

				return textures.map(texture => new THREE.MeshBasicMaterial({map: texture, transparent: true}));
			},


			async render () {
				let lastTime = performance.now();
				let lastSeconds = Math.floor(lastTime / 1000);
				let frames = 0;
				let stuck = 0;

				while (this.rendererActive) {
					this.$emit("beforeRender", this);

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
							this.cubeGroup.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), event.movementX * 1e-2);
							this.cubeGroup.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), event.movementY * 1e-2);

							break;
						/*case 0:
							this.cube.cubeMeshes.forEach(mesh => mesh.material = this.material);
							const axis = this.raycastAxis(event);
							if (Number.isInteger(axis)) {
								const faceIndices = this.cube.algebra.faceIndicesFromAxis(axis);
								faceIndices.forEach(index => this.cube.cubeMeshes[index].material = this.highlightMaterial);
							}

							break;*/
						}
					}
				}
			},


			onMouseDown (event) {
				switch (event.buttons) {
				case 1:
					if (this.enabledTwist) {
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
	.texture-canvas
	{
		border: black 1px solid;
	}
</style>
