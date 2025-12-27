<template>
	<div class="cube-tetris" @keydown="onKeyDown" tabindex="0" ref="container">
		<canvas ref="canvas" />

		<div class="ui-overlay">
			<div class="score-panel">
				<div class="stat">
					<span class="label">Score</span>
					<span class="value">{{ state.score }}</span>
				</div>
				<div class="stat">
					<span class="label">Level</span>
					<span class="value">{{ state.level }}</span>
				</div>
				<div class="stat">
					<span class="label">Lines</span>
					<span class="value">{{ state.linesCleared }}</span>
				</div>
			</div>

			<div class="controls-hint">
				<div class="hint-section">
					<strong>Move</strong>
					<span>W/A/S/D or Arrows</span>
				</div>
				<div class="hint-section">
					<strong>Drop</strong>
					<span>Space or X</span>
				</div>
				<div class="hint-section">
					<strong>Rotate</strong>
					<span>Q/E (Y) R/F (X) Z/C (Z)</span>
				</div>
				<div class="hint-section">
					<strong>Pause</strong>
					<span>P</span>
				</div>
			</div>
		</div>

		<div v-if="state.paused && !state.gameOver" class="overlay">
			<div class="message">
				<h2>Paused</h2>
				<p>Press P to continue</p>
			</div>
		</div>

		<div v-if="state.gameOver" class="overlay">
			<div class="message game-over">
				<h2>Game Over</h2>
				<p>Score: {{ state.score }}</p>
				<button @click="restart">Play Again</button>
			</div>
		</div>
	</div>
</template>

<script>
	import {markRaw} from "vue";
	import {TetrisGame} from "../cubeTetris/TetrisGame";
	import {TetrisRenderer} from "../cubeTetris/TetrisRenderer";
	import {KEY_BINDINGS} from "../cubeTetris/constants";


	export default {
		name: "cube-tetris",


		data() {
			return {
				game: null,
				renderer: null,
				state: {
					score: 0,
					level: 1,
					linesCleared: 0,
					gameOver: false,
					paused: false,
				},
			};
		},


		mounted() {
			this.initGame();

			// Focus container for keyboard input
			this.$refs.container.focus();

			// Handle window resize
			window.addEventListener("resize", this.onResize);
			this.onResize();
		},


		beforeUnmount() {
			window.removeEventListener("resize", this.onResize);
			this.cleanup();
		},


		methods: {
			initGame() {
				// Create game (use markRaw to prevent Vue reactivity proxy issues with Three.js)
				this.game = markRaw(new TetrisGame());

				// Create renderer (use markRaw to prevent Vue reactivity proxy issues with Three.js)
				this.renderer = markRaw(new TetrisRenderer(this.$refs.canvas));

				// Listen to game events
				this.game.on("scoreChanged", () => this.updateState());
				this.game.on("pieceSpawned", () => this.updateVisuals());
				this.game.on("pieceMoved", () => this.updateVisuals());
				this.game.on("pieceRotated", () => this.updateVisuals());
				this.game.on("pieceLocked", () => this.updateVisuals());
				this.game.on("layersCleared", () => this.updateVisuals());
				this.game.on("gameOver", () => this.updateState());

				// Start game
				this.game.start();
				this.updateState();
				this.updateVisuals();

				// Start render loop
				this.renderer.startAnimationLoop((time) => {
					this.game.update(time);
				});
			},


			updateState() {
				if (!this.game) return;
				this.state = {...this.game.state};
			},


			updateVisuals() {
				if (!this.game || !this.renderer) return;

				this.renderer.updateBoard(this.game.board);
				this.renderer.updatePiece(this.game.currentPiece);
				this.renderer.updateGhost(
					this.game.currentPiece,
					this.game.getGhostPosition()
				);
			},


			onKeyDown(event) {
				if (!this.game) return;

				const code = event.code;

				// Check key bindings
				if (KEY_BINDINGS.moveLeft.includes(code)) {
					event.preventDefault();
					this.game.moveLeft();
				} else if (KEY_BINDINGS.moveRight.includes(code)) {
					event.preventDefault();
					this.game.moveRight();
				} else if (KEY_BINDINGS.moveForward.includes(code)) {
					event.preventDefault();
					this.game.moveForward();
				} else if (KEY_BINDINGS.moveBackward.includes(code)) {
					event.preventDefault();
					this.game.moveBackward();
				} else if (KEY_BINDINGS.drop.includes(code)) {
					event.preventDefault();
					this.game.hardDrop();
				} else if (KEY_BINDINGS.rotateYPos.includes(code)) {
					event.preventDefault();
					this.game.rotatePiece("y", 1);
				} else if (KEY_BINDINGS.rotateYNeg.includes(code)) {
					event.preventDefault();
					this.game.rotatePiece("y", -1);
				} else if (KEY_BINDINGS.rotateXPos.includes(code)) {
					event.preventDefault();
					this.game.rotatePiece("x", 1);
				} else if (KEY_BINDINGS.rotateXNeg.includes(code)) {
					event.preventDefault();
					this.game.rotatePiece("x", -1);
				} else if (KEY_BINDINGS.rotateZPos.includes(code)) {
					event.preventDefault();
					this.game.rotatePiece("z", 1);
				} else if (KEY_BINDINGS.rotateZNeg.includes(code)) {
					event.preventDefault();
					this.game.rotatePiece("z", -1);
				} else if (KEY_BINDINGS.pause.includes(code)) {
					event.preventDefault();
					this.game.togglePause();
					this.updateState();
				} else if (KEY_BINDINGS.restart.includes(code)) {
					event.preventDefault();
					this.restart();
				}

				this.updateVisuals();
			},


			onResize() {
				if (!this.renderer || !this.$refs.container) return;

				const rect = this.$refs.container.getBoundingClientRect();
				this.renderer.resize(rect.width, rect.height);
			},


			restart() {
				if (!this.game) return;

				this.game.start();
				this.updateState();
				this.updateVisuals();
				this.$refs.container.focus();
			},


			cleanup() {
				if (this.renderer) {
					this.renderer.dispose();
					this.renderer = null;
				}
				this.game = null;
			},
		},
	};
</script>

<style lang="scss" scoped>
	.cube-tetris {
		position: relative;
		width: 100%;
		height: 100%;
		outline: none;
		overflow: hidden;
		background: #111122;
	}

	canvas {
		display: block;
		width: 100%;
		height: 100%;
	}

	.ui-overlay {
		position: absolute;
		top: 0;
		left: 0;
		padding: 1rem;
		color: white;
		font-family: 'Consolas', 'Monaco', monospace;
		pointer-events: none;
		user-select: none;
	}

	.score-panel {
		background: rgba(0, 0, 0, 0.6);
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;

		.stat {
			display: flex;
			justify-content: space-between;
			margin-bottom: 0.5rem;

			&:last-child {
				margin-bottom: 0;
			}

			.label {
				color: #888;
				margin-right: 1rem;
			}

			.value {
				font-weight: bold;
				font-size: 1.2em;
			}
		}
	}

	.controls-hint {
		background: rgba(0, 0, 0, 0.6);
		padding: 0.75rem;
		border-radius: 8px;
		font-size: 0.75rem;

		.hint-section {
			margin-bottom: 0.25rem;

			&:last-child {
				margin-bottom: 0;
			}

			strong {
				color: #aaa;
				display: inline-block;
				width: 3.5rem;
			}

			span {
				color: #666;
			}
		}
	}

	.overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.message {
		text-align: center;
		color: white;
		font-family: 'Consolas', 'Monaco', monospace;

		h2 {
			font-size: 2rem;
			margin-bottom: 1rem;
		}

		p {
			font-size: 1rem;
			color: #aaa;
			margin-bottom: 1rem;
		}

		button {
			background: #4444ff;
			color: white;
			border: none;
			padding: 0.75rem 1.5rem;
			font-size: 1rem;
			border-radius: 4px;
			cursor: pointer;
			font-family: inherit;

			&:hover {
				background: #5555ff;
			}
		}
	}

	.game-over h2 {
		color: #ff4444;
	}
</style>
