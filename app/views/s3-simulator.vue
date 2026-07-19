<template>
	<div class="s3-simulator" v-resize="onResize">
		<canvas ref="canvas" :width="size.width" :height="size.height" />
		<div class="hud">
			<h1>S<sup>3</sup> Hypersphere Simulator</h1>
			<p class="hint">Step 1 — abstract cross-shaped puppet with UV-mapped canvas texture.</p>
			<div class="controls">
				<button :class="{active: view === 'third'}" @click="setView('third')">Third Person</button>
				<button :class="{active: view === 'first'}" @click="setView('first')">First Person</button>
			</div>
			<p class="tip" v-if="view === 'third'">Drag to orbit, scroll to zoom.</p>
			<p class="tip" v-else>Drag to look around from the puppet's head.</p>
		</div>
	</div>
</template>

<script lang="ts">
	import {markRaw} from "vue";
	import * as THREE from "three";
	import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
	import resize from "vue-resize-directive";

	import {createPuppet} from "../s3/puppet";



	export default {
		name: "s3-simulator",


		directives: {
			resize,
		},


		data () {
			return {
				size: {width: 800, height: 600},
				view: "third" as "first" | "third",
			};
		},


		mounted () {
			this.initScene();
			this.animate();
		},


		beforeUnmount () {
			this.rendererActive = false;
			if (this.controls)
				this.controls.dispose();
			if (this.puppet)
				this.puppet.dispose();
			if (this.renderer)
				this.renderer.dispose();
		},


		methods: {
			onResize () {
				this.size = {width: this.$el.clientWidth, height: this.$el.clientHeight};
			},


			initScene () {
				this.onResize();

				const canvas = this.$refs.canvas as HTMLCanvasElement;

				this.renderer = markRaw(new THREE.WebGLRenderer({canvas, antialias: true}));
				this.renderer.setPixelRatio(window.devicePixelRatio || 1);
				this.renderer.setSize(this.size.width, this.size.height, false);

				const scene = markRaw(new THREE.Scene());
				scene.background = new THREE.Color(0x11151f);
				this.scene = scene;

				// Cameras: one for each view mode.
				const aspect = this.size.width / this.size.height;
				this.thirdCamera = markRaw(new THREE.PerspectiveCamera(55, aspect, 0.05, 200));
				this.thirdCamera.position.set(4, 3, 6);

				this.firstCamera = markRaw(new THREE.PerspectiveCamera(75, aspect, 0.02, 200));

				// Lighting.
				scene.add(new THREE.AmbientLight(0xffffff, 0.55));
				const key = new THREE.DirectionalLight(0xffffff, 0.9);
				key.position.set(5, 10, 7);
				scene.add(key);
				const rim = new THREE.DirectionalLight(0x88aaff, 0.4);
				rim.position.set(-6, 4, -8);
				scene.add(rim);

				// Ground reference so orientation is legible.
				const grid = markRaw(new THREE.GridHelper(20, 20, 0x3a4256, 0x262c3a));
				grid.position.y = -1.95;
				scene.add(grid);

				// The puppet.
				const puppet = markRaw(createPuppet());
				this.puppet = puppet;
				scene.add(puppet.group);

				// The first-person camera rides on the puppet's head anchor.
				puppet.head.add(this.firstCamera);
				this.firstCamera.rotation.set(0, 0, 0);

				// Orbit controls for third-person.
				this.controls = markRaw(new OrbitControls(this.thirdCamera, canvas));
				this.controls.target.set(0, 0.3, 0);
				this.controls.enableDamping = true;
				this.controls.update();

				// First-person look controls: yaw/pitch the head anchor by dragging.
				this.firstYaw = 0;
				this.firstPitch = 0;
				canvas.addEventListener("pointerdown", this.onPointerDown);
				window.addEventListener("pointermove", this.onPointerMove);
				window.addEventListener("pointerup", this.onPointerUp);

				this.rendererActive = true;
			},


			setView (view: "first" | "third") {
				this.view = view;
				this.controls.enabled = view === "third";
			},


			onPointerDown (event: PointerEvent) {
				if (this.view !== "first")
					return;
				this.dragging = true;
				this.lastPointer = {x: event.clientX, y: event.clientY};
			},


			onPointerMove (event: PointerEvent) {
				if (!this.dragging || this.view !== "first")
					return;
				const dx = event.clientX - this.lastPointer.x;
				const dy = event.clientY - this.lastPointer.y;
				this.lastPointer = {x: event.clientX, y: event.clientY};
				this.firstYaw -= dx * 0.005;
				this.firstPitch -= dy * 0.005;
				this.firstPitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.firstPitch));
			},


			onPointerUp () {
				this.dragging = false;
			},


			animate () {
				if (!this.rendererActive)
					return;
				requestAnimationFrame(() => this.animate());

				// Idle spin of the puppet so the different faces reveal themselves.
				if (this.puppet && this.view === "third")
					this.puppet.group.rotation.y += 0.004;

				if (this.view === "third") {
					this.controls.update();
					this.renderer.render(this.scene, this.thirdCamera);
				}
				else {
					this.puppet.head.rotation.set(this.firstPitch, this.firstYaw, 0);
					this.renderer.render(this.scene, this.firstCamera);
				}
			},
		},


		watch: {
			size (value: {width: number; height: number}) {
				const aspect = value.width / value.height;
				this.thirdCamera.aspect = aspect;
				this.thirdCamera.updateProjectionMatrix();
				this.firstCamera.aspect = aspect;
				this.firstCamera.updateProjectionMatrix();
				this.renderer.setSize(value.width, value.height, false);
			},
		},
	};
</script>

<style scoped>
.s3-simulator
{
	position: relative;
	width: 100%;
	height: 100%;
	overflow: hidden;
	background: #11151f;
}

canvas
{
	display: block;
	width: 100%;
	height: 100%;
}

.hud
{
	position: absolute;
	top: 0;
	left: 0;
	padding: 1rem 1.25rem;
	color: #dfe6f2;
	font-family: Arial, Helvetica, sans-serif;
	text-shadow: 0 1px 3px #000a;
	pointer-events: none;
}

.hud h1
{
	margin: 0;
	font-size: 1.4rem;
	font-weight: 700;
}

.hud .hint
{
	margin: .3rem 0 .8rem;
	font-size: .82rem;
	opacity: .8;
}

.controls
{
	pointer-events: auto;
	display: flex;
	gap: .5rem;
}

.controls button
{
	padding: .4rem .8rem;
	font: inherit;
	font-size: .82rem;
	color: #dfe6f2;
	background: #2a3346;
	border: 1px solid #3d4a63;
	border-radius: .3rem;
	cursor: pointer;
}

.controls button:hover
{
	background: #34405a;
}

.controls button.active
{
	background: #4d7bd6;
	border-color: #6a93e6;
}

.tip
{
	margin: .6rem 0 0;
	font-size: .76rem;
	opacity: .7;
}
</style>
