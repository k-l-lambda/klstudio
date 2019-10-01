<template>
	<div class="cube-cayley-graph" v-resize="onResize">
		<article
			@mousemove="onMouseMove"
			@mousewheel="onMouseWheel"
		>
			<canvas ref="canvas" :width="size.width" :height="size.height"/>
			<span class="status">
				<span v-if="fps" class="fps">fps <em>{{fps}}</em></span>
			</span>
		</article>
		<header>
		</header>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";
	import * as THREE from "three";

	import { animationDelay } from "./delay";



	/*const OCTAVE = 1 / Math.sqrt(3);
	const POLAR = 3;
	const BEYOND = 9;


	const elem = (index, position) => ({ index, position });

	const elements = [
		// identity
		elem(0, [0, 0, 0]),

		// generators & anti-generators
		elem(1, [1, 0, 0]), elem(2, [0, 1, 0]), elem(3, [0, 1, 0]),
		elem(4, [-1, 0, 0]), elem(5, [0, -1, 0]), elem(6, [0, -1, 0]),

		// squared
		elem(7, [POLAR, 0, 0]), elem(7, [-POLAR, 0, 0]),
		elem(8, [0, POLAR, 0]), elem(8, [0, -POLAR, 0]),
		elem(9, [0, 0, POLAR]), elem(9, [0, 0, -POLAR]),

		// octave
		elem(10, [+OCTAVE, +OCTAVE, +OCTAVE]), elem(19, [+OCTAVE, +OCTAVE, -OCTAVE]),
		elem(16, [+OCTAVE, -OCTAVE, +OCTAVE]), elem(13, [+OCTAVE, -OCTAVE, -OCTAVE]),
		elem(17, [-OCTAVE, +OCTAVE, +OCTAVE]), elem(11, [-OCTAVE, +OCTAVE, -OCTAVE]),
		elem(14, [-OCTAVE, -OCTAVE, +OCTAVE]), elem(20, [-OCTAVE, -OCTAVE, -OCTAVE]),

		// triad
		elem(22, [BEYOND, 0, 0]), elem(23, [-BEYOND, 0, 0]),
		elem(12, [0, BEYOND, 0]), elem(15, [0, -BEYOND, 0]),
		elem(18, [0, 0, BEYOND]), elem(21, [0, 0, -BEYOND]),
	];*/


	const DEG30 = Math.PI / 6;

	// tetrahedron theta angle
	const TT = Math.PI - Math.atan(2 * Math.sqrt(2));

	const SL = Math.sqrt(2 + Math.sqrt(3) * 2 / 9);
	const TS = 2 * Math.asin(SL / 2);
	const TSD = Math.PI * 2 - TT - TS;
	//console.log("TS:", TS);


	const sphericalToCartesian = (r, theta, phi) => new THREE.Vector3(
		r * Math.sin(theta) * Math.cos(phi),
		r * Math.cos(theta),
		r * Math.sin(theta) * Math.sin(phi),
	);

	const elem = (index, label, angles, r = 1) => ({ index, label, position: sphericalToCartesian(r, ...angles) });

	const elementsSchema = [
		// identity
		elem(0, "1", [0, 0]),

		// squared
		elem(7, "i2", [TT, 0]),
		elem(8, "j2", [TT, DEG30 * 4]),
		elem(9, "k2", [TT, DEG30 * -4]),

		// generators & anti-generators
		elem(1, "i", [TT / 2, DEG30]), elem(2, "j", [TT / 2, DEG30 * 5]), elem(3, "k", [TT / 2, DEG30 * -3]),
		elem(4, "i-", [TT / 2, -DEG30]), elem(5, "j-", [TT / 2, DEG30 * 3]), elem(6, "k-", [TT / 2, DEG30 * -5]),

		// triad
		elem(22, "2i", [TS, DEG30 * 6]), elem(23, "2i-", [TSD, DEG30 * 6]),
		elem(12, "2j", [TS, DEG30 * -2]), elem(15, "2j-", [TSD, DEG30 * -2]),
		elem(18, "2k", [TS, DEG30 * 2]), elem(21, "2k-", [TSD, DEG30 * 2]),

		// octave
		// TODO
		/*
			10, "ijk",
			19, "k-ji",
			16, "kj-i",
			13, "ij-k-",
			17, "kji-",
			11, "i-jk-",
			14, "i-j-k",
			20, "k-j-i-",
		*/
	];
	//console.log("elementsSchema:", elementsSchema);



	export default {
		name: "cube-cayley-graph",


		directives: {
			resize,
		},


		data () {
			return {
				size: { width: 800, height: 800 },
				fps: 0,
			};
		},


		created () {
			window.$main = this;
		},


		mounted () {
			this.initializeRenderer();

			this.createElements();

			this.render();
		},


		methods: {
			onResize () {
				this.size = { width: this.$el.clientWidth, height: this.$el.clientHeight };
			},


			initializeRenderer () {
				this.renderer = new THREE.WebGLRenderer({ antialias: true, canvas: this.$refs.canvas, alpha: true });
				this.renderer.setClearColor(new THREE.Color("lightblue"), 1);
				this.renderer.setSize(this.size.width, this.size.height, false);

				this.camera = new THREE.PerspectiveCamera(60, this.size.width / this.size.height, 10, 1000);
				//this.camera.position.set(0, 0, 240);
				//this.camera.lookAt(0, 0, 0);

				this.viewTheta = Math.PI * 0.3;
				this.viewPhi = 0;
				this.viewRadius = 360;

				this.scene = new THREE.Scene();

				this.rendererActive = true;

				this.sphere = new THREE.SphereGeometry(6, 32, 16);
			},


			async render () {
				let lastTime = performance.now();
				let lastSeconds = Math.floor(lastTime / 1000);
				let frames = 0;
				let stuck = 0;

				while (this.rendererActive) {
					//this.$emit("beforeRender");

					this.camera.position.copy(sphericalToCartesian(this.viewRadius, this.viewTheta, this.viewPhi));
					this.camera.lookAt(0, 0, 0);

					this.renderer.render(this.scene, this.camera);

					//this.$emit("afterRender");

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


			async createElements () {
				this.elements = [];

				return Promise.all(elementsSchema.map(async element => {
					//const elemObj = new THREE.Mesh(this.sphere, new THREE.MeshBasicMaterial({ color: new THREE.Color("#044") }));
					const { default: tex } = await import(`./images/cube-algebra/${element.label}.png`);

					const elemObj = new THREE.Mesh(this.sphere, new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load(tex) }));
					this.elements.push(elemObj);

					elemObj.position.copy(element.position.clone().multiplyScalar(100));

					this.scene.add(elemObj);
				}));
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
	.cube-cayley-graph
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
		color: #000a;
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
</style>
