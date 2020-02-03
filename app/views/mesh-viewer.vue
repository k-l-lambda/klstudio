<template>
	<div class="mesh-viewer" v-resize="onResize">
		<article
			@mousemove="onMouseMove"
			@mousewheel="onMouseWheel"
		>
			<canvas ref="canvas" :width="size.width" :height="size.height"/>
			<span class="status">
				<span v-if="fps" class="fps">fps <em>{{fps}}</em></span>
			</span>
		</article>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";
	import * as THREE from "three";

	import {animationDelay} from "../delay";
	import {MULTIPLICATION_TABLE} from "../../inc/cube-algebra";



	const sphericalToCartesian = (r, theta, phi) => new THREE.Vector3(
		r * Math.sin(theta) * Math.cos(phi),
		r * Math.cos(theta),
		r * Math.sin(theta) * Math.sin(phi),
	);



	export default {
		name: "mesh-viewer",


		directives: {
			resize,
		},


		data () {
			return {
				size: {width: 800, height: 800},
				fps: 0,
			};
		},


		created () {
			if (process.env.NODE_ENV === "development")
				window.$view = this;
		},


		mounted () {
			this.initializeRenderer();

			this.createScene();

			this.render();
		},


		beforeDestroy () {
			this.rendererActive = false;
		},


		methods: {
			onResize () {
				this.size = {width: this.$el.clientWidth, height: this.$el.clientHeight};
			},


			initializeRenderer () {
				this.renderer = new THREE.WebGLRenderer({antialias: true, canvas: this.$refs.canvas, alpha: true});
				this.renderer.setClearColor(new THREE.Color("lightblue"), 1);
				this.renderer.setSize(this.size.width, this.size.height, false);

				this.camera = new THREE.PerspectiveCamera(60, this.size.width / this.size.height, 0.1, 100);

				this.viewTheta = Math.PI * 0.3;
				this.viewPhi = Math.PI * 0.5;
				this.viewRadius = 6;

				this.scene = new THREE.Scene();

				const mainLight = new THREE.DirectionalLight(0xffffff, 1);
				mainLight.position.set(-30, 100, 60);
				mainLight.target = this.scene;
				this.scene.add(mainLight);

				const skyLight = new THREE.DirectionalLight("lightblue", 0.4);
				skyLight.position.set(0, 1000, 0);
				skyLight.target = this.scene;
				this.scene.add(skyLight);

				this.scene.add(new THREE.AmbientLight("#323f43"));

				this.rendererActive = true;
			},


			async render () {
				let lastTime = performance.now();
				let lastSeconds = Math.floor(lastTime / 1000);
				let frames = 0;
				let stuck = 0;

				while (this.rendererActive) {
					this.camera.position.copy(sphericalToCartesian(this.viewRadius, this.viewTheta, this.viewPhi));
					this.camera.lookAt(0, 0, 0);

					this.renderer.render(this.scene, this.camera);

					++frames;

					const now = performance.now();
					stuck = Math.max(stuck, now - lastTime);

					const seconds = Math.floor(now / 1000);
					if (seconds > lastSeconds) {
						this.fps = frames / (seconds - lastSeconds);
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


			async createScene () {
				const {default: knight} = await import("../assets/chess-knight.json");
				//console.log("knight:", knight);
				const obj = await new Promise(resolve => new THREE.ObjectLoader().parse(knight, resolve));
				this.scene.add(obj);
			},


			onMouseMove (event) {
				//console.log("onMouseMove:", event.button, event.buttons);
				if (event.buttons === 1) {
					this.viewPhi += event.movementX * 0.01;
					this.viewTheta -= event.movementY * 0.01;

					this.viewTheta = Math.max(Math.min(this.viewTheta, Math.PI - 0.01), 0.01);
				}
			},


			onMouseWheel (event) {
				//console.log("onMouseWheel:", events);
				this.viewRadius *= Math.exp(event.deltaY * 0.001);
			},


			permute (index) {
				//const positions = this.elements.reduce((ps, e, i) => ((ps[elementsSchema[i].index] = this.elementPositions[i]), ps), []);
				this.elements.forEach((e, i) => {
					const target = MULTIPLICATION_TABLE[elementsSchema[i].index][index];
					e.position.copy(this.elementPositions[target]);
				});
				this.elementPositions = this.elements.reduce((ps, e, i) => ((ps[elementsSchema[i].index] = e.position.clone()), ps), []);

				this.rotationIndex = 0;
				this.rotationT = 0;
			},
		},


		watch: {
			size (value) {
				this.camera.aspect = value.width / value.height;
				this.camera.updateProjectionMatrix();

				this.renderer.setSize(value.width, value.height, false);
			},
		},
	};
</script>

<style scoped>
	.mesh-viewer
	{
		position: relative;
		width: 100%;
		height: 100%;
	}

	.status
	{
		position: absolute;
		right: 0;
		bottom: 0;
		padding: 4px;
		color: #0006;
		pointer-events: none;
	}

	.fps
	{
		font-size: 9px;
	}

	.fps em
	{
		font-weight: bold;
	}

	header
	{
		position: absolute;
		right: 0;
		top: 0;
	}

	.control .handle circle
	{
		r: 8;
		stroke-width: 1;
		stroke: #000c;
		fill: #fffc;
	}

	.control .tip
	{
		r: 6;
		stroke-width: 1;
		stroke: #0004;
		cursor: pointer;
	}

	.control .tip:hover
	{
		stroke-width: 2;
		r: 12;
	}

	.control .unit1 .tip
	{
		fill: #f00a;
	}

	.control .unit2 .tip
	{
		fill: #0c0a;
	}

	.control .unit3 .tip
	{
		fill: #00fa;
	}

	.control .unit4 .tip
	{
		fill: #0dda;
	}

	.control .unit5 .tip
	{
		fill: #e0ea;
	}

	.control .unit6 .tip
	{
		fill: #dd0a;
	}

	.control .track
	{
		stroke: #0003;
		stroke-width: 1;
	}
</style>
