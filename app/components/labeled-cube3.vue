<template>
	<div class="labeled-cube3">
		<canvas
			ref="canvas"
			:width="size.width"
			:height="size.height"
			@mousemove.stop="onMouseMove"
			@mousedown.prevent="onMouseDown"
			@mouseup="onMouseUp"
			@touchstart="onTouchStart"
			@touchmove="onTouchMove"
			@touchend="onTouchEnd"
		/>
		<canvas v-show="false" ref="textureCanvas" class="texture-canvas" :width="256" :height="256" />
		<div v-if="showOrientations">
			<span class="label" v-for="(label, i) of labels" :key="i"
				:class="{highlight: i === highlightCubie}"
				v-show="label.visible"
				v-html="label.content"
				:style="{left: `${label.position.x * 100}%`, top: `${label.position.y * 100}%`}"
			></span>
		</div>
		<Loading v-if="loading" />
	</div>
</template>

<script>
	import * as THREE from "three";

	import {animationDelay} from "../delay";
	import CubeObject from "../cubeObject";
	import {CUBE3_POSITION_LABELS} from "../../inc/latin-letters";
	import Label3D from "../label3D";
	import {GREEK_LETTERS, ORIENTATION_GREEK_LETTER_ORDER} from "../../inc/greek-letters";

	import Loading from "./loading-dots.vue";



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

	const WHITE_MATERIALS = [
		...Array(6).fill("white"), "black",
	].map(color => new THREE.MeshBasicMaterial({color: new THREE.Color(color)}));

	const COLORED_MATERIALS = [
		"#fd6", "#faa", "#efb", "#fff", "#aaf", "#8f8", "black",
	].map(color => new THREE.MeshBasicMaterial({color: new THREE.Color(color)}));

	const COLORED_HIGHLIGHT_MATERIALS = [
		"#fea", "#fcc", "#ff8", "#ddd", "#ddf", "#cfc", "#222",
	].map(color => new THREE.MeshBasicMaterial({color: new THREE.Color(color)}));


	const TWIST_DURATION = 700;



	export default {
		name: "labeled-cube3",


		components: {
			Loading,
		},


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
			showRedLabels: Boolean,
			coloredUnderbox: Boolean,
			showOrientations: Boolean,
		},


		data () {
			return {
				labels: [],
				loading: false,
				highlightCubie: null,
			};
		},


		async mounted () {
			this.rendererActive = true;
			this.loading = true;

			this.initializeRenderer();

			this.cubeGroup = new THREE.Object3D();
			this.scene.add(this.cubeGroup);

			this.cube = new CubeObject({
				materials: this.coloredUnderbox ? COLORED_MATERIALS : WHITE_MATERIALS, 
				onChange: algebra => this.onChange(algebra), 
				meshSchema: "cube",
				twistDuration: TWIST_DURATION,
			});
			this.cubeGroup.add(this.cube.graph);

			this.code && this.cube.setState(this.code);

			// labels
			this.labels = this.cube.graph.children.map(proxy => {
				const cube = proxy.children[0];
				const label = new Label3D(cube, this.camera, {offset: [0, 0, 0]});

				const cubePos = label.graphNode.parent.position;
				label.graphNode.position.set(cubePos.x * 0.5, cubePos.y * 0.5, cubePos.z * 0.5);

				return label;
			});

			this.$emit("cubeCreated", this.cube);

			const blackMaterials = await this.createLabelMaterials();
			this.cubeLB = new CubeObject({materials: blackMaterials, meshSchema: "cube26"});
			this.cubeLB.graph.scale.set(1.01, 1.01, 1.01);
			this.cubeGroup.add(this.cubeLB.graph);

			if (this.showRedLabels) {
				const redMaterials = await this.createLabelMaterials("red");
				this.cubeLR = new CubeObject({materials: redMaterials, meshSchema: "cube26", twistDuration: TWIST_DURATION});
				this.cubeLR.graph.scale.set(1.005, 1.005, 1.005);
				this.cubeGroup.add(this.cubeLR.graph);

				this.code && this.cubeLR.setState(this.code);
			}

			this.raycaster = new THREE.Raycaster();

			this.holdingAxis = null;

			this.$emit("sceneInitialized", this);

			this.render();

			this.loading = false;
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


			async createLabelMaterials (type = "black") {
				const ctx = this.$refs.textureCanvas.getContext("2d");

				const textures = [];

				for (let i = 0; i < 26; ++i) {
					const char = CUBE3_POSITION_LABELS[i];
					ctx.clearRect(0, 0, 256, 256);
					switch (type) {
					case "black":
						ctx.font = "240px monospace";
						ctx.fillStyle = "black";
						ctx.fillText(char, 60, 200);

						break;
					case "red":
						ctx.font = "160px monospace";
						ctx.fillStyle = "red";
						ctx.fillText(char, 160, 240);

						break;
					}

					const blob = await new Promise(resolve => this.$refs.textureCanvas.toBlob(resolve, "image/png"));
					const image = new Image();
					image.src = URL.createObjectURL(blob);
					await new Promise(resolve => image.onload = resolve);

					const tex = new THREE.Texture(image);
					tex.needsUpdate = true;

					textures.push(tex);
				};

				return textures.map(texture => new THREE.MeshBasicMaterial({map: texture, transparent: true, depthWrite: false}));
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

					if (this.showOrientations)
						this.updateLabels();

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


			updateLabels () {
				const localViewVector = this.cube.graph.worldToLocal(this.camera.position.clone());
				//console.log("localViewVector:", localViewVector);

				for (let i = 0; i < this.labels.length; i++) {
					const label = this.labels[i];
					label.updatePosition();

					const o = this.cube.algebra.units[i];
					label.content = GREEK_LETTERS[ORIENTATION_GREEK_LETTER_ORDER[o]];

					const cubePos = label.graphNode.parent.position.clone();
					cubePos.applyQuaternion(label.graphNode.parent.parent.quaternion);

					const sideX = Math.round(cubePos.x) * localViewVector.x > 0 && Math.abs(localViewVector.x) > 1.5;
					const sideY = Math.round(cubePos.y) * localViewVector.y > 0 && Math.abs(localViewVector.y) > 1.5;
					const sideZ = Math.round(cubePos.z) * localViewVector.z > 0 && Math.abs(localViewVector.z) > 1.5;
					label.visible = sideX || sideY || sideZ;
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


			raycastCubie () {
				if (this.raycaster) {
					const mouse = this.normalizeScreenPoint(event);
					this.raycaster.setFromCamera(mouse, this.camera);
					const intersects = this.raycaster.intersectObject(this.cube.graph, true);
					if (intersects[0]) {
						const point = this.cube.graph.worldToLocal(intersects[0].point);
						const xs = [point.x, point.y, point.z].map(x => Math.round(x) + 1);
						//console.log("xs:", xs);

						return xs[0] + xs[1] * 3 + xs[2] * 9;
					}
				}

				return null;
			},


			reset () {
				this.cube.reset();
				this.cubeLR.reset();
			},


			twist (twist) {
				return Promise.all([
					this.cube.twist(twist),
					this.cubeLR && this.cubeLR.twist(twist),
				]);
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

						if (this.cubeLR)
							this.cubeLR.twistGraph(this.holdingAxis, angle);
					}
					else {
						switch (event.buttons) {
						case 1:
						case 4:
							this.cubeGroup.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), event.movementX * 1e-2);
							this.cubeGroup.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), event.movementY * 1e-2);

							break;
						case 0:
							const positionIndex = this.raycastCubie(event);
							this.highlightCubie = this.cube.algebra.positions.indexOf(positionIndex);
							if (this.coloredUnderbox) {
								this.cube.cubeMeshes.forEach(mesh => mesh.material = COLORED_MATERIALS);
								//console.log("cubie index:", index);

								if (Number.isInteger(this.highlightCubie) && this.cube.cubeMeshes[this.highlightCubie])
									this.cube.cubeMeshes[this.highlightCubie].material = COLORED_HIGHLIGHT_MATERIALS;
							}

							break;
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
					if (this.cubeLR)
						this.cubeLR.releaseGraph();
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
				if (value && this.innerCode !== value) {
					this.cube && this.cube.setState(value);
					this.cubeLR && this.cubeLR.setState(value);
				}
			},


			highlightCubie (value) {
				this.$emit("update:highlightCubie", value);
			},
		},
	};
</script>

<style lang="scss" scoped>
	.texture-canvas
	{
		border: black 1px solid;
	}

	.label
	{
		position: absolute;
		transform: translate(-50%, -50%);
		font-weight: bold;
		font-family: monospace;
		color: white;
		font-size: 6vh;
		text-shadow: 0 0 6px black;
		user-select: none;
		white-space: nowrap;
		pointer-events: none;

		&.highlight
		{
			color: gold;
		}
	}
</style>

<style lang="scss">
	.labeled-cube3
	{
		.loading-dots
		{
			background-color: transparent;
			background-image: url(../assets/cube-placeholder.drawio.svg);
			background-repeat: no-repeat;
			background-position: center center;
			background-size: 70% 70%;

			.ellipsis
			{
				zoom: 200%;

				div
				{
					background: #000c;
				}
			}
		}
	}
</style>
