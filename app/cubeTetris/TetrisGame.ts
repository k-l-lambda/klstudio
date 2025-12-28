
/**
 * Cube Tetris - Game Logic
 */

import type {GameState, GameConfig, Point3D} from "./types";
import {CubeGrid} from "./CubeGrid";
import {TetrisPiece} from "./TetrisPiece";
import {GAME_CONFIG, SCORE_PER_LINE, SCORE_MULTIPLIER} from "./constants";


export type GameEventType = "pieceSpawned" | "pieceMoved" | "pieceRotated" | "pieceLocked" | "layersClearStart" | "layersCleared" | "gameOver" | "scoreChanged";

export interface GameEvent {
	type: GameEventType;
	data?: unknown;
}


/**
 * TetrisGame - Main game logic controller
 */
export class TetrisGame {
	readonly config: GameConfig;
	readonly board: CubeGrid;

	private _currentPiece: TetrisPiece | null = null;
	private _nextPiece: TetrisPiece | null = null;
	private _state: GameState;
	private _lastDropTime: number = 0;
	private _eventListeners: Map<GameEventType, Set<(event: GameEvent) => void>> = new Map();

	// Layer clearing state
	private _clearingLayers: number[] = [];
	private _isClearingAnimation: boolean = false;

	constructor(config?: Partial<GameConfig>) {
		this.config = {...GAME_CONFIG, ...config};
		this.board = new CubeGrid();
		this._state = {
			score: 0,
			level: 1,
			linesCleared: 0,
			gameOver: false,
			paused: false,
		};
	}


	/**
	 * Get current piece
	 */
	get currentPiece(): TetrisPiece | null {
		return this._currentPiece;
	}


	/**
	 * Get next piece (for preview)
	 */
	get nextPiece(): TetrisPiece | null {
		return this._nextPiece;
	}


	/**
	 * Get game state
	 */
	get state(): GameState {
		return {...this._state};
	}


	/**
	 * Add event listener
	 */
	on(type: GameEventType, callback: (event: GameEvent) => void): void {
		if (!this._eventListeners.has(type)) {
			this._eventListeners.set(type, new Set());
		}
		this._eventListeners.get(type)!.add(callback);
	}


	/**
	 * Remove event listener
	 */
	off(type: GameEventType, callback: (event: GameEvent) => void): void {
		this._eventListeners.get(type)?.delete(callback);
	}


	/**
	 * Emit an event
	 */
	private emit(type: GameEventType, data?: unknown): void {
		const event: GameEvent = {type, data};
		this._eventListeners.get(type)?.forEach(cb => cb(event));
	}


	/**
	 * Start or restart the game
	 */
	start(): void {
		this.board.clear();
		this._state = {
			score: 0,
			level: 1,
			linesCleared: 0,
			gameOver: false,
			paused: false,
		};
		this._lastDropTime = 0;  // Will be set on first update

		// Spawn initial pieces
		this._nextPiece = this.createPiece();
		this.spawnNextPiece();
	}


	/**
	 * Pause/unpause the game
	 */
	togglePause(): void {
		if (this._state.gameOver) return;
		this._state.paused = !this._state.paused;
		if (!this._state.paused) {
			this._lastDropTime = 0;  // Reset on next update
		}
	}


	/**
	 * Create a new random piece at spawn position
	 */
	private createPiece(): TetrisPiece {
		const spawnPos: Point3D = {
			x: Math.floor(this.config.boardWidth / 2),
			y: this.config.boardHeight - 1,
			z: Math.floor(this.config.boardDepth / 2),
		};
		return TetrisPiece.createRandom(spawnPos);
	}


	/**
	 * Spawn the next piece
	 */
	private spawnNextPiece(): void {
		this._currentPiece = this._nextPiece;
		this._nextPiece = this.createPiece();

		// Center the piece
		if (this._currentPiece) {
			this.centerPiece(this._currentPiece);
		}

		// Check if spawn position is valid
		if (this._currentPiece && !this.isValidPosition(this._currentPiece)) {
			this._state.gameOver = true;
			this.emit("gameOver");
		} else {
			this.emit("pieceSpawned", {piece: this._currentPiece});
		}
	}


	/**
	 * Center piece horizontally
	 */
	private centerPiece(piece: TetrisPiece): void {
		const bounds = piece.getWorldBounds();
		const pieceWidth = bounds.max.x - bounds.min.x + 1;
		const pieceDepth = bounds.max.z - bounds.min.z + 1;

		const targetX = Math.floor((this.config.boardWidth - pieceWidth) / 2);
		const targetZ = Math.floor((this.config.boardDepth - pieceDepth) / 2);

		piece.position = {
			x: targetX - bounds.min.x + piece.position.x,
			y: piece.position.y,
			z: targetZ - bounds.min.z + piece.position.z,
		};
	}


	/**
	 * Check if piece position is valid (no collisions, within bounds)
	 */
	isValidPosition(piece: TetrisPiece): boolean {
		const blocks = piece.getWorldBlocks();

		for (const {point} of blocks) {
			// Check floor
			if (point.y < 0) return false;

			// Check walls
			if (point.x < 0 || point.x >= this.config.boardWidth) return false;
			if (point.z < 0 || point.z >= this.config.boardDepth) return false;

			// Check collision with existing blocks
			if (this.board.has(point.x, point.y, point.z)) return false;
		}

		return true;
	}


	/**
	 * Try to move the current piece
	 * Returns true if successful
	 */
	movePiece(dx: number, dy: number, dz: number): boolean {
		if (!this._currentPiece || this._state.gameOver || this._state.paused) return false;

		const testPiece = this._currentPiece.clone();
		testPiece.move(dx, dy, dz);

		if (this.isValidPosition(testPiece)) {
			this._currentPiece.move(dx, dy, dz);
			this.emit("pieceMoved", {direction: {dx, dy, dz}});
			return true;
		}

		return false;
	}


	/**
	 * Move piece left
	 */
	moveLeft(): boolean {
		return this.movePiece(-1, 0, 0);
	}


	/**
	 * Move piece right
	 */
	moveRight(): boolean {
		return this.movePiece(1, 0, 0);
	}


	/**
	 * Move piece forward
	 */
	moveForward(): boolean {
		return this.movePiece(0, 0, -1);
	}


	/**
	 * Move piece backward
	 */
	moveBackward(): boolean {
		return this.movePiece(0, 0, 1);
	}


	/**
	 * Try to rotate the current piece
	 */
	rotatePiece(axis: "x" | "y" | "z", times: number = 1): boolean {
		if (!this._currentPiece || this._state.gameOver || this._state.paused) return false;

		const testPiece = this._currentPiece.clone();
		testPiece.rotate(axis, times);

		if (this.isValidPosition(testPiece)) {
			this._currentPiece.rotate(axis, times);
			this.emit("pieceRotated", {axis, times});
			return true;
		}

		// Try wall kicks (simple version: try moving left/right/forward/backward)
		const kicks = [
			{x: -1, z: 0}, {x: 1, z: 0}, {x: 0, z: -1}, {x: 0, z: 1},
			{x: -1, z: -1}, {x: 1, z: -1}, {x: -1, z: 1}, {x: 1, z: 1},
		];

		for (const kick of kicks) {
			const kickedPiece = this._currentPiece.clone();
			kickedPiece.rotate(axis, times);
			kickedPiece.move(kick.x, 0, kick.z);

			if (this.isValidPosition(kickedPiece)) {
				this._currentPiece.rotate(axis, times);
				this._currentPiece.move(kick.x, 0, kick.z);
				this.emit("pieceRotated", {axis, times, kick});
				return true;
			}
		}

		return false;
	}


	/**
	 * Drop piece down one step
	 * Returns true if piece moved, false if it locked
	 */
	dropOne(): boolean {
		if (!this._currentPiece || this._state.gameOver || this._state.paused) return false;

		if (this.movePiece(0, -1, 0)) {
			return true;
		}

		// Piece can't move down - lock it
		this.lockPiece();
		return false;
	}


	/**
	 * Hard drop - drop piece all the way down
	 */
	hardDrop(): void {
		if (!this._currentPiece || this._state.gameOver || this._state.paused) return;

		while (this.movePiece(0, -1, 0)) {
			// Keep dropping
		}

		this.lockPiece();
	}


	/**
	 * Lock the current piece to the board
	 */
	private lockPiece(): void {
		if (!this._currentPiece) return;

		// Add piece blocks to board
		for (const {point, data} of this._currentPiece.getWorldBlocks()) {
			this.board.set(point.x, point.y, point.z, data);
		}

		this.emit("pieceLocked", {piece: this._currentPiece});

		// Check for completed layers and start animation if any
		const fullLayers = this.detectFullLayers();

		if (fullLayers.length > 0) {
			// Collect blocks that will be cleared
			const clearingBlocks: Array<{point: Point3D; color: string}> = [];
			for (const y of fullLayers) {
				for (let x = 0; x < this.config.boardWidth; x++) {
					for (let z = 0; z < this.config.boardDepth; z++) {
						const block = this.board.get(x, y, z);
						if (block) {
							clearingBlocks.push({
								point: {x, y, z},
								color: block.color,
							});
						}
					}
				}
			}

			// Store layers for later clearing
			this._clearingLayers = fullLayers;
			this._isClearingAnimation = true;

			// Emit event to start animation
			this.emit("layersClearStart", {layers: fullLayers, blocks: clearingBlocks});

			// Don't spawn next piece yet - wait for animation to complete
		} else {
			// No layers to clear, spawn next piece immediately
			this.spawnNextPiece();
		}
	}


	/**
	 * Detect completed layers (without removing them)
	 * Returns array of Y levels that are full
	 */
	private detectFullLayers(): number[] {
		const fullLayers: number[] = [];
		const blocksPerLayer = this.config.boardWidth * this.config.boardDepth;

		// Check all Y levels
		for (let y = 0; y < this.config.boardHeight; y++) {
			if (this.board.countAtY(y) === blocksPerLayer) {
				fullLayers.push(y);
			}
		}

		return fullLayers;
	}


	/**
	 * Complete the layer clearing (call after animation finishes)
	 */
	completeClearingAnimation(): void {
		if (!this._isClearingAnimation || this._clearingLayers.length === 0) {
			return;
		}

		// Sort from top to bottom for correct shifting
		this._clearingLayers.sort((a, b) => b - a);

		// Clear layers
		for (const y of this._clearingLayers) {
			this.board.removeLayerAndShift(y);
		}

		// Update score
		const lines = this._clearingLayers.length;
		const multiplier = SCORE_MULTIPLIER[Math.min(lines, SCORE_MULTIPLIER.length - 1)];
		const points = SCORE_PER_LINE * multiplier * this._state.level;

		this._state.score += points;
		this._state.linesCleared += lines;

		// Level up every 10 lines
		this._state.level = Math.floor(this._state.linesCleared / 10) + 1;

		this.emit("layersCleared", {layers: this._clearingLayers, score: points});
		this.emit("scoreChanged", {score: this._state.score, level: this._state.level});

		// Reset clearing state
		this._clearingLayers = [];
		this._isClearingAnimation = false;

		// Now spawn next piece
		this.spawnNextPiece();
	}


	/**
	 * Check if clearing animation is in progress
	 */
	get isClearingAnimation(): boolean {
		return this._isClearingAnimation;
	}


	/**
	 * Calculate where piece would land (ghost position)
	 */
	getGhostPosition(): Point3D | null {
		if (!this._currentPiece) return null;

		const ghost = this._currentPiece.clone();
		let dropY = 0;

		while (true) {
			ghost.move(0, -1, 0);
			if (!this.isValidPosition(ghost)) {
				ghost.move(0, 1, 0); // Move back up
				break;
			}
			dropY++;
		}

		return ghost.position;
	}


	/**
	 * Update game state (call in animation loop)
	 */
	update(timestamp: number): void {
		// Skip updates during clearing animation, game over, or pause
		if (this._state.gameOver || this._state.paused || this._isClearingAnimation || !this._currentPiece) return;

		// Initialize drop time on first update
		if (this._lastDropTime === 0) {
			this._lastDropTime = timestamp;
			return;
		}

		// Calculate drop interval based on level
		const dropInterval = Math.max(
			100,
			this.config.dropInterval - (this._state.level - 1) * 50
		);

		if (timestamp - this._lastDropTime >= dropInterval) {
			this.dropOne();
			this._lastDropTime = timestamp;
		}
	}


	/**
	 * Get current drop interval in ms
	 */
	get dropInterval(): number {
		return Math.max(100, this.config.dropInterval - (this._state.level - 1) * 50);
	}
}
