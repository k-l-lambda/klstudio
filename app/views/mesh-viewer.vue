<template>
	<div class="mesh-viewer" v-resize="onResize">
		<article
			@mousemove="onMouseMove"
			@mousewheel="onMouseWheel"
		>
			<canvas ref="canvas" :width="size.width" :height="size.height"/>
			<div>
				<span class="label" v-for="(label, i) of labels" :key="i" v-html="label.content"
					:style="{left: `${label.position.x * 100}%`, top: `${label.position.y * 100}%`}"
				></span>
			</div>
			<span class="status" v-show="showStatus">
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


	class Label {
		constructor (parent, camera, {content, offset = [0, 1.2, 0]} = {}) {
			this.camera = camera;
			this.content = content;

			this.graphNode = new THREE.Object3D();
			this.graphNode.position.set(...offset);
			parent.add(this.graphNode);

			this._pos = null;
		}


		get position () {
			if (!this._pos)
				this.updatePosition();

			return this._pos;
		}


		updatePosition () {
			const p = this.graphNode.getWorldPosition(new THREE.Vector3()).project(this.camera);

			this._pos = this._pos || {};
			this._pos.x = (p.x + 1) / 2;
			this._pos.y = (-p.y + 1) / 2;
		}
	};



	export default {
		name: "mesh-viewer",


		directives: {
			resize,
		},


		props: {
			light: {
				default: "white",
			},
			entities: Array,
			showStatus: {
				default: false,
			},
			cameraInit: {
				type: Object,
				default: () => ({
					radius: 6,
					theta: 0,
					phi: 0,
				}),
			},
		},


		data () {
			return {
				size: {width: 800, height: 800},
				fps: 0,
				labels: [],
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

				this.viewTheta = this.cameraInit.theta + Math.PI * 0.5;
				this.viewPhi = this.cameraInit.phi + Math.PI * 0.5;
				this.viewRadius = this.cameraInit.radius;

				this.scene = new THREE.Scene();

				const mainLight = new THREE.DirectionalLight(this.light, 1);
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

					this.updateLabels();

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
				/*const {default: knight} = await import("../assets/chess-knight.json");
				//console.log("knight:", knight);
				const obj = await new Promise(resolve => new THREE.ObjectLoader().parse(knight, resolve));
				this.scene.add(obj);*/

				if (this.entities) {
					for (const entity of this.entities) {
						const node1 = new THREE.Object3D();
						this.scene.add(node1);

						const {default: prototype} = await import(`../assets/${entity.prototype}.json`);
						const obj = await new Promise(resolve => new THREE.ObjectLoader().parse(prototype, resolve));
						node1.add(obj);

						if (entity.position) 
							node1.position.set(...entity.position);

						if (entity.quaternion) 
							obj.quaternion.set(...entity.quaternion);
						else if (entity.euler)
							obj.quaternion.setFromEuler(new THREE.Euler(...entity.euler, "XZY"));

						//console.log("obj:", obj);

						if (entity.label) {
							const label = new Label(node1, this.camera, typeof entity.label === "object" ? entity.label : {content: entity.label});

							this.labels.push(label);
						}
					}
				}
			},


			updateLabels () {
				for (const label of this.labels) 
					label.updatePosition();

				if (this.labels.length)
					this.$forceUpdate();
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

	.label
	{
		position: absolute;
		transform: translate(-50%, -50%);
		font-weight: bold;
		font-family: Arial, Helvetica, sans-serif;
		text-shadow: 0 0 2px white;
		user-select: none;
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
