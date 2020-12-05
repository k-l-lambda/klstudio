<template>
	<div class="cube-cayley-graph" v-resize="onResize">
		<article
			@mousemove="onMouseMove"
			@mousewheel.prevent="onMouseWheel"
			@touchmove.prevent="onTouchMove"
			@touchend="onTouchEnd"
		>
			<canvas ref="canvas" :width="size.width" :height="size.height"/>
			<span class="status">
				<span v-if="fps" class="fps">fps <em>{{fps}}</em></span>
			</span>
		</article>
		<header>
			<svg class="control" width="240" height="240" viewBox="-120 -120 240 240">
				<g>
					<g v-for="i in 6" :class="`unit${i}`" :key="i">
						<line class="track" x1="0" y1="0" :x2="100 * Math.cos((i + 3.5) * Math.PI / 3)" :y2="100 * Math.sin((i + 3.5) * Math.PI / 3)" />
						<circle class="tip"
							:cx="100 * Math.cos((i + 3.5) * Math.PI / 3)"
							:cy="100 * Math.sin((i + 3.5) * Math.PI / 3)"
							@click="rotate(i)"
							@touchstart.prevent="rotate(i)"
						/>
					</g>
				</g>
				<g class="handle">
					<circle :cx="handlePosition.x" :cy="handlePosition.y" />
				</g>
			</svg>
		</header>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";
	import * as THREE from "three";

	import {animationDelay} from "../delay";
	import {MULTIPLICATION_TABLE} from "../../inc/cube-algebra";

	import QuitClearner from "../mixins/quit-cleaner";
	import Accelerometer from "../mixins/accelerometer.js";



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

	const elem = (index, label, angles, r = 1) => ({index, label, position: sphericalToCartesian(r, ...angles)});

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
		elem(22, "2i", [TSD, DEG30 * 6]), elem(23, "2i-", [TS, DEG30 * 6]),
		elem(12, "2j", [TSD, DEG30 * -2]), elem(15, "2j-", [TS, DEG30 * -2]),
		elem(21, "2k", [TSD, DEG30 * 2]), elem(18, "2k-", [TS, DEG30 * 2]),
	];
	//console.log("elementsSchema:", elementsSchema);


	const pointsCenter = points => points.reduce((sum, v) => sum.add(v), new THREE.Vector3()).multiplyScalar(1 / points.length);
	const centerElem = (index, label, indices, scalar = 1) => ({index, label, position: pointsCenter(indices.map(i => elementsSchema[i].position)).multiplyScalar(scalar)});

	// octave elements
	[
		[10, "ijk", [4, 5, 6, 10, 12, 14]],
		[19, "k-ji", [4, 5, 9, 11, 13, 14], 3],
		[16, "kj-i", [4, 8, 6, 11, 12, 15], 3],
		[13, "ij-k-", [4, 8, 9, 10, 13, 15]],
		[17, "kji-", [7, 5, 6, 10, 13, 15], 3],
		[11, "i-jk-", [7, 5, 9, 11, 12, 15]],
		[14, "i-j-k", [7, 8, 6, 11, 13, 14]],
		[20, "k-j-i-", [7, 8, 9, 10, 12, 14], 3],
	].forEach(item => elementsSchema.push(centerElem(...item)));


	const SENSOR_SENSITIVITY = .4e-3;



	export default {
		name: "cube-cayley-graph",


		directives: {
			resize,
		},


		mixins: [
			QuitClearner,
			Accelerometer,
		],


		data () {
			return {
				size: {width: 800, height: 800},
				fps: 0,
				rotationIndex: 0,
				rotationT: 0,
			};
		},


		computed: {
			handlePosition () {
				if (this.rotationIndex === 0)
					return {x: 0, y: 0};

				const angle = Math.PI * (this.rotationIndex + 3.5) / 3;
				const radius = 100;

				const p = 3 * (this.rotationT ** 2) - 2 * (this.rotationT ** 3);

				return {
					x: Math.cos(angle) * radius * p,
					y: Math.sin(angle) * radius * p,
				};
			},
		},


		mounted () {
			this.initializeRenderer();

			this.createElements();
			this.createEdges();

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

				this.camera = new THREE.PerspectiveCamera(60, this.size.width / this.size.height, 10, 1000);

				this.viewTheta = Math.PI * 0.3;
				this.viewPhi = Math.PI * 0.6;
				this.viewRadius = 300;

				this.scene = new THREE.Scene();

				this.rendererActive = true;

				this.sphere = new THREE.SphereGeometry(8, 32, 16);
				this.cone = new THREE.ConeGeometry(1, 1, 16);
			},


			async render () {
				let lastTime = performance.now();
				let lastSeconds = Math.floor(lastTime / 1000);
				let frames = 0;
				let stuck = 0;

				while (this.rendererActive) {
					//this.$emit("beforeRender");

					if (this.sensorVelocity) {
						this.viewTheta += this.sensorVelocity[1] * SENSOR_SENSITIVITY;
						this.viewPhi += this.sensorVelocity[0] * SENSOR_SENSITIVITY * 0.1;

						this.viewTheta = Math.max(Math.min(this.viewTheta, Math.PI - 0.01), 0.01);
					}

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

					if (this.rotationIndex > 0) {
						this.rotationT += (now - lastTime) * 2e-3;
						if (this.rotationT >= 1)
							this.permute(this.rotationIndex);
						else {
							this.elements.forEach((e, i) => {
								const target = MULTIPLICATION_TABLE[elementsSchema[i].index][this.rotationIndex];
								const p0 = this.elementPositions[elementsSchema[i].index];
								const p1 = this.elementPositions[target];

								const p = 3 * (this.rotationT ** 2) - 2 * (this.rotationT ** 3);

								e.position.copy(p0.clone().lerp(p1, p));
							});
						}
					}

					//const interval = now - lastTime;
					lastTime = now;

					await animationDelay();
				}
			},


			async createElements () {
				this.elements = [];

				await Promise.all(elementsSchema.map(async element => {
					const {default: tex} = await import(`../assets/cube-algebra/${element.label}.png`);

					const elemObj = new THREE.Mesh(this.sphere, new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load(tex)}));
					this.elements.push(elemObj);

					elemObj.position.copy(element.position.clone().multiplyScalar(100));

					this.scene.add(elemObj);
				}));

				this.elementPositions = this.elements.reduce((ps, e, i) => ((ps[elementsSchema[i].index] = e.position.clone()), ps), []);
			},


			createEdges () {
				const unitColors = ["red", "green", "blue"];
				const up = new THREE.Vector3(0, 1, 0);

				elementsSchema.forEach(element => {
					for (let unit = 1; unit <= 3; ++unit) {
						const target = MULTIPLICATION_TABLE[element.index][unit];

						const basis = element.position;
						const tip = elementsSchema.find(elem => elem.index === target).position;
						const direction = tip.clone().sub(basis);
						const axis = up.clone().cross(direction).normalize();
						const angle = Math.acos(direction.clone().normalize().dot(up));

						const base = new THREE.Object3D();
						base.position.copy(basis.clone().multiplyScalar(100));
						base.quaternion.setFromAxisAngle(axis, angle);
						base.scale.x = base.scale.z = 1;
						base.scale.y = direction.length() * 100;

						const edge = new THREE.Mesh(this.cone, new THREE.MeshBasicMaterial({color: new THREE.Color(unitColors[unit - 1])}));
						edge.position.y = 0.5;

						base.add(edge);
						this.scene.add(base);
					}
				});
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


			onTouchMove (event) {
				const touch = event.touches[0];

				if (this.lastTouchPoint) {
					const movementX = touch.pageX - this.lastTouchPoint.pageX;
					const movementY = touch.pageY - this.lastTouchPoint.pageY;

					this.viewPhi += movementX * 0.01;
					this.viewTheta -= movementY * 0.01;

					this.viewTheta = Math.max(Math.min(this.viewTheta, Math.PI - 0.01), 0.01);
				}

				this.lastTouchPoint = {
					pageX: touch.pageX,
					pageY: touch.pageY,
				};
			},


			onTouchEnd () {
				this.lastTouchPoint = null;
			},


			rotate (index) {
				this.rotationIndex = index;
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
		color: #0006;
		user-select: none;
	}

	.fps
	{
		font-size: 6px;
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

	.control
	{
		max-width: 36vh;
		max-height: 36vh;
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
