<template>
	<canvas
		ref="canvas"
		:width="size.width"
		:height="size.height"
		@mousemove="onMouseMove"
	/>
</template>

<script>
	import * as THREE from "three";

	import {animationDelay} from "../delay";
	import CubeObject from "../cubeObject";
	//window.THREE = THREE;



	const BASIC_MATERIALS = [
		//"green", "blue", "orange", "red", "white", "yellow", "black",
		"#f90", "#d00", "#ff2", "white", "blue", "#0e0", "black",
	].map(color => new THREE.MeshBasicMaterial({color: new THREE.Color(color)}));



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
		},


		mounted () {
			//window.cube3 = cube3;

			this.rendererActive = true;

			this.initializeRenderer();

			this.cube = new CubeObject({materials: BASIC_MATERIALS, onChange: algebra => this.onChange(algebra), meshSchema: this.meshSchema});
			this.scene.add(this.cube.graph);
			//console.log("this.cube:", this.cube);

			this.render();
		},


		methods: {
			initializeRenderer () {
				this.renderer = new THREE.WebGLRenderer({antialias: true, canvas: this.$refs.canvas, alpha: true});
				this.renderer.setClearColor(new THREE.Color("black"), 0);
				this.renderer.setSize(this.size.width, this.size.height, false);

				//this.camera = new THREE.OrthographicCamera(-0.5, 0.5, this.ratio / 2, this.ratio / -2, 0, 100);
				this.camera = new THREE.PerspectiveCamera(60, this.size.width / this.size.height, 3, 12);
				this.camera.position.set(0, 0, 6.4);
				this.camera.lookAt(0, 0, 0);

				this.scene = new THREE.Scene();

				this.$emit("sceneInitialized", this);
			},


			async render () {
				let lastTime = performance.now();
				let lastSeconds = Math.floor(lastTime / 1000);
				let frames = 0;
				let stuck = 0;

				while (this.rendererActive) {
					//this.$emit("beforeRender");

					this.renderer.render(this.scene, this.camera);

					//this.$emit("afterRender");

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


			onMouseMove (event) {
				//console.log("onMouseMove:", event.button, event.buttons);
				if (this.cube && event.buttons === 1) {
					this.cube.graph.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), event.movementX * 1e-2);
					this.cube.graph.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), event.movementY * 1e-2);
				}
			},


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
