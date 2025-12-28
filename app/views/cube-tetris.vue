<template>
	<div class="cube-tetris" @keydown="onKeyDown" tabindex="0" ref="container">
		<canvas ref="canvas" />

		<div class="ui-overlay">
			<div class="score-panel">
				<div class="stat">
					<span class="label">Hi-Score</span>
					<span class="value hi-score">{{ highScore }}</span>
				</div>
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

			<div class="mode-panel">
				<button
					:class="['mode-btn', {active: aiMode}]"
					@click="toggleAiMode"
				>
					{{ aiMode ? 'AI Playing' : 'AI Demo' }}
				</button>
			</div>

			<div v-if="!aiMode" class="controls-hint">
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
	import {AiController} from "../cubeTetris/AiController";
	import {KEY_BINDINGS} from "../cubeTetris/constants";


	export default {
		name: "cube-tetris",


		data() {
			return {
				game: null,
				renderer: null,
				aiController: null,
				aiMode: true,  // Start in AI demo mode
				highScore: 0,
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

				// Create AI controller
				this.aiController = markRaw(new AiController(this.game));

				// Listen to game events
				this.game.on("scoreChanged", () => this.updateState());
				this.game.on("newHighScore", (event) => {
					this.highScore = event.data.highScore;
				});
				this.game.on("pieceSpawned", () => {
					this.updateVisuals();
					this.aiController.onPieceSpawned();
				});
				this.game.on("pieceMoved", () => this.updateVisuals());
				this.game.on("pieceRotated", () => this.updateVisuals());
				this.game.on("pieceLocked", () => this.updateVisuals());
				this.game.on("layersClearStart", (event) => {
					// Start the clearing animation
					const {blocks} = event.data;
					this.renderer.startClearingAnimation(blocks);
				});
				this.game.on("layersCleared", () => this.updateVisuals());
				this.game.on("gameOver", () => {
					this.updateState();
					// Auto restart in AI mode after delay
					if (this.aiMode) {
						setTimeout(() => {
							if (this.aiMode && this.game) {
								this.restart();
							}
						}, 2000);
					}
				});

				// Start game
				this.game.start();
				this.highScore = this.game.highScore;
				this.updateState();
				this.updateVisuals();

				// Enable AI mode by default
				this.setAiMode(true);

				// Start render loop
				this.renderer.startAnimationLoop((time) => {
					this.game.update(time);
					this.aiController.update(time);

					// Check if clearing animation finished
					if (this.game.isClearingAnimation && !this.renderer.isClearingAnimation()) {
						this.game.completeClearingAnimation();
						this.updateVisuals();
						this.updateState();
					}
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

				// Update camera height tracking
				const boardBounds = this.game.board.getBounds();
				this.renderer.setHeapMaxY(boardBounds.maxY);

				if (this.game.currentPiece) {
					const pieceBounds = this.game.currentPiece.getWorldBounds();
					this.renderer.setCurrentPieceY(pieceBounds.min.y);
				} else {
					this.renderer.setCurrentPieceY(0);
				}
			},


			toggleAiMode() {
				this.setAiMode(!this.aiMode);
			},


			setAiMode(enabled) {
				this.aiMode = enabled;
				if (this.aiController) {
					this.aiController.setEnabled(enabled);
					this.aiController.setMoveDelay(enabled ? 200 : 100);
				}
				if (this.renderer) {
					this.renderer.setAutoRotate(enabled, 0.2);
				}
				// Focus container when switching to manual mode
				if (!enabled) {
					this.$refs.container.focus();
				}
			},


			onKeyDown(event) {
				if (!this.game) return;

				// Allow pause in any mode
				const code = event.code;
				if (KEY_BINDINGS.pause.includes(code)) {
					event.preventDefault();
					this.game.togglePause();
					this.updateState();
					return;
				}

				// Skip other controls if AI mode is active
				if (this.aiMode) return;

				// Check key bindings - use camera-relative movement
				if (KEY_BINDINGS.moveLeft.includes(code)) {
					event.preventDefault();
					this.moveCameraRelative("left");
				} else if (KEY_BINDINGS.moveRight.includes(code)) {
					event.preventDefault();
					this.moveCameraRelative("right");
				} else if (KEY_BINDINGS.moveForward.includes(code)) {
					event.preventDefault();
					this.moveCameraRelative("forward");
				} else if (KEY_BINDINGS.moveBackward.includes(code)) {
					event.preventDefault();
					this.moveCameraRelative("backward");
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
				} else if (KEY_BINDINGS.restart.includes(code)) {
					event.preventDefault();
					this.restart();
				}

				this.updateVisuals();
			},


			/**
			 * Move piece relative to camera view direction
			 */
			moveCameraRelative(direction) {
				if (!this.renderer || !this.game) return;

				const camera = this.renderer.getCamera();
				const target = this.renderer.getBoardCenter();

				// Calculate camera forward direction on XZ plane
				const dx = target.x - camera.position.x;
				const dz = target.z - camera.position.z;

				// Determine which quadrant the camera is viewing from
				// and map input direction to world direction
				const angle = Math.atan2(dz, dx);  // Angle from camera to center

				// Normalize to 0-360 degrees
				const degrees = ((angle * 180 / Math.PI) + 360) % 360;

				// Determine primary viewing direction (which way is "forward" for the player)
				// 0-45 or 315-360: camera looking toward +X
				// 45-135: camera looking toward +Z
				// 135-225: camera looking toward -X
				// 225-315: camera looking toward -Z

				let forward, backward, left, right;

				if (degrees >= 315 || degrees < 45) {
					// Camera looking toward +X
					forward = () => this.game.moveRight();
					backward = () => this.game.moveLeft();
					left = () => this.game.moveForward();   // -Z when facing +X
					right = () => this.game.moveBackward(); // +Z when facing +X
				} else if (degrees >= 45 && degrees < 135) {
					// Camera looking toward +Z
					forward = () => this.game.moveBackward();
					backward = () => this.game.moveForward();
					left = () => this.game.moveRight();     // +X when facing +Z
					right = () => this.game.moveLeft();     // -X when facing +Z
				} else if (degrees >= 135 && degrees < 225) {
					// Camera looking toward -X
					forward = () => this.game.moveLeft();
					backward = () => this.game.moveRight();
					left = () => this.game.moveBackward();  // +Z when facing -X
					right = () => this.game.moveForward();  // -Z when facing -X
				} else {
					// Camera looking toward -Z (225-315)
					forward = () => this.game.moveForward();
					backward = () => this.game.moveBackward();
					left = () => this.game.moveLeft();      // -X when facing -Z
					right = () => this.game.moveRight();    // +X when facing -Z
				}

				// Execute the mapped movement
				switch (direction) {
					case "forward": forward(); break;
					case "backward": backward(); break;
					case "left": left(); break;
					case "right": right(); break;
				}
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
				if (!this.aiMode) {
					this.$refs.container.focus();
				}
			},


			cleanup() {
				if (this.renderer) {
					this.renderer.dispose();
					this.renderer = null;
				}
				this.game = null;
				this.aiController = null;
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
		background: #0a0a18;
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

				&.hi-score {
					color: #ffcc44;
				}
			}
		}
	}

	.mode-panel {
		margin-bottom: 1rem;
		pointer-events: auto;

		.mode-btn {
			background: rgba(60, 60, 100, 0.8);
			color: #aaa;
			border: 1px solid #446;
			padding: 0.5rem 1rem;
			font-size: 0.85rem;
			border-radius: 4px;
			cursor: pointer;
			font-family: inherit;
			transition: all 0.2s ease;

			&:hover {
				background: rgba(80, 80, 120, 0.9);
				color: #fff;
			}

			&.active {
				background: rgba(60, 100, 60, 0.8);
				border-color: #4a6;
				color: #8f8;
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
