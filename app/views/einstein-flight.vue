<template>
	<div
		class="einstein-flight"
		@keydown="onKeyDown"
		@keyup="onKeyUp"
		tabindex="0"
		ref="container"
	>
		<canvas ref="canvas" />

		<button
			:class="['mode-btn', {active: mode === 'einstein'}]"
			@click="toggleMode"
		>
			{{ mode === 'einstein' ? 'Einstein' : 'Galileo' }}
		</button>

		<div class="controls-hint">
			<div class="hint-section">
				<strong>Accelerate</strong>
				<span>W / ↑</span>
			</div>
			<div class="hint-section">
				<strong>Decelerate</strong>
				<span>S / ↓</span>
			</div>
			<div class="hint-section">
				<strong>Steer</strong>
				<span>A/D / ←/→</span>
			</div>
			<div class="hint-section">
				<strong>Mode</strong>
				<span>M</span>
			</div>
		</div>
	</div>
</template>

<script>
	import {markRaw} from "vue";
	import {Game} from "../einsteinFlight/Game";
	import {Renderer} from "../einsteinFlight/Renderer";


	export default {
		name: "einstein-flight",


		data () {
			return {
				game: null,
				renderer: null,
				mode: "galilean",
				inputState: {
					accelerate: false,
					decelerate: false,
					steerLeft: false,
					steerRight: false,
				},
			};
		},


		mounted () {
			this.game = markRaw(new Game());
			this.renderer = markRaw(new Renderer(this.$refs.canvas));

			this.renderer.startLoop(this.game, this.inputState);

			this.$refs.container.focus();
			window.addEventListener("resize", this.onResize);
		},


		beforeUnmount () {
			window.removeEventListener("resize", this.onResize);
			if (this.renderer) {
				this.renderer.dispose();
			}
		},


		methods: {
			onKeyDown (e) {
				const handled = this.mapKey(e.code, true);
				if (handled) e.preventDefault();
			},


			onKeyUp (e) {
				this.mapKey(e.code, false);
			},


			mapKey (code, pressed) {
				switch (code) {
				case "KeyW":
				case "ArrowUp":
					this.inputState.accelerate = pressed;
					return true;
				case "KeyS":
				case "ArrowDown":
					this.inputState.decelerate = pressed;
					return true;
				case "KeyA":
				case "ArrowLeft":
					this.inputState.steerLeft = pressed;
					return true;
				case "KeyD":
				case "ArrowRight":
					this.inputState.steerRight = pressed;
					return true;
				case "KeyM":
					if (pressed) this.toggleMode();
					return true;
				}
				return false;
			},


			toggleMode () {
				this.mode = this.mode === "galilean" ? "einstein" : "galilean";
				if (this.game) {
					this.game.setMode(this.mode);
				}
			},


			onResize () {
				if (this.renderer) {
					this.renderer.resize();
				}
			},
		},
	};
</script>

<style scoped>
	.einstein-flight {
		position: relative;
		width: 100%;
		height: 100vh;
		background: #000;
		overflow: hidden;
		outline: none;
	}

	canvas {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	.mode-btn {
		position: absolute;
		top: 16px;
		left: 16px;
		background: rgba(60, 60, 100, 0.8);
		color: #aaa;
		border: 1px solid #446;
		border-radius: 4px;
		padding: 4px 12px;
		font-family: "Courier New", monospace;
		font-size: 13px;
		cursor: pointer;
		z-index: 1;
		transition: background 0.2s, color 0.2s;
	}

	.mode-btn:hover {
		background: rgba(80, 80, 130, 0.9);
		color: #ddd;
	}

	.mode-btn.active {
		background: rgba(0, 120, 180, 0.8);
		color: #fff;
		border-color: rgba(0, 220, 255, 0.5);
	}

	.controls-hint {
		position: absolute;
		bottom: 20px;
		left: 20px;
		display: flex;
		gap: 20px;
		font-family: "Courier New", monospace;
		font-size: 12px;
		color: rgba(0, 220, 255, 0.5);
		pointer-events: none;
	}

	.hint-section {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.hint-section strong {
		color: rgba(0, 220, 255, 0.7);
		font-weight: 600;
	}
</style>
