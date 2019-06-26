<template>
	<canvas
		ref="canvas"
		:width="size.width"
		:height="size.height"
	/>
</template>

<script>
	//import cube3 from "../inc/cube3.ts";
	import * as THREE from "three";

	import { animationDelay } from "./delay";



	export default {
		name: "cube3",


		props: {
			size: {
				type: Object,
				default: () => ({ width: 800, height: 800 }),
			},
		},


		mounted () {
			this.rendererActive = true;

			this.initializeRenderer();

			this.render();
		},


		methods: {
			initializeRenderer () {
				this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas: this.$refs.canvas, alpha: true });

				this.camera = new THREE.OrthographicCamera(-0.5, 0.5, this.ratio / 2, this.ratio / -2, 0, 100);
				this.camera.position.z = 1;
				this.scene = new THREE.Scene();
			},


			async render () {
				let lastTime = performance.now();
				let lastSeconds = Math.floor(lastTime / 1000);
				let frames = 0;
				let stuck = 0;

				while (this.rendererActive) {
					this.$emit("beforeRender");

					this.renderer.render(this.scene, this.camera);

					this.$emit("afterRender");

					++frames;

					const now = performance.now();
					stuck = Math.max(stuck, now - lastTime);

					const seconds = Math.floor(now / 1000);
					if (seconds > lastSeconds) {
						const fps = frames / (seconds - lastSeconds);
						this.$emit("fps", { fps, stuck });
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
		},
	};
</script>

<style>
</style>
