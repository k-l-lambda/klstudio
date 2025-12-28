
/**
 * Cube Tetris - AI Controller
 * Based on original CubeTetris AiController.lua
 * Evaluates positions and automatically plays the game
 */

import type {Point3D} from "./types";
import {CubeGrid} from "./CubeGrid";
import {TetrisPiece} from "./TetrisPiece";
import {TetrisGame} from "./TetrisGame";
import {GAME_CONFIG} from "./constants";


/**
 * Represents a target state for AI to aim for
 */
interface TargetState {
	x: number;
	z: number;
	rotations: {axis: "x" | "y" | "z", times: number}[];
	worth: number;
}


/**
 * 24 regular orientations for 3D rotation (all unique cube orientations)
 * Each is a sequence of 90-degree rotations
 */
const REGULAR_ORIENTATIONS: {axis: "x" | "y" | "z", times: number}[][] = [
	// Identity - 1
	[],
	// Y rotations - 2,3,4
	[{axis: "y", times: 1}],
	[{axis: "y", times: 2}],
	[{axis: "y", times: -1}],
	// X then Y rotations - 5,6,7,8
	[{axis: "x", times: 1}],
	[{axis: "x", times: 1}, {axis: "y", times: 1}],
	[{axis: "x", times: 1}, {axis: "y", times: 2}],
	[{axis: "x", times: 1}, {axis: "y", times: -1}],
	// -X then Y rotations - 9,10,11,12
	[{axis: "x", times: -1}],
	[{axis: "x", times: -1}, {axis: "y", times: 1}],
	[{axis: "x", times: -1}, {axis: "y", times: 2}],
	[{axis: "x", times: -1}, {axis: "y", times: -1}],
	// Z then Y rotations - 13,14,15,16
	[{axis: "z", times: 1}],
	[{axis: "z", times: 1}, {axis: "y", times: 1}],
	[{axis: "z", times: 1}, {axis: "y", times: 2}],
	[{axis: "z", times: 1}, {axis: "y", times: -1}],
	// -Z then Y rotations - 17,18,19,20
	[{axis: "z", times: -1}],
	[{axis: "z", times: -1}, {axis: "y", times: 1}],
	[{axis: "z", times: -1}, {axis: "y", times: 2}],
	[{axis: "z", times: -1}, {axis: "y", times: -1}],
	// X*2 then Y rotations - 21,22,23,24
	[{axis: "x", times: 2}],
	[{axis: "x", times: 2}, {axis: "y", times: 1}],
	[{axis: "x", times: 2}, {axis: "y", times: 2}],
	[{axis: "x", times: 2}, {axis: "y", times: -1}],
];


/**
 * AiController - Automatically plays Tetris by evaluating and selecting optimal positions
 */
export class AiController {
	private game: TetrisGame;
	private targetState: TargetState | null = null;
	private moveDelay: number = 100; // ms between moves
	private lastMoveTime: number = 0;
	private rotationsApplied: boolean = false;
	private enabled: boolean = false;


	constructor(game: TetrisGame) {
		this.game = game;
	}


	/**
	 * Enable/disable AI control
	 */
	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
		if (enabled) {
			this.computeTarget();
		} else {
			this.targetState = null;
		}
	}


	/**
	 * Check if AI is enabled
	 */
	isEnabled(): boolean {
		return this.enabled;
	}


	/**
	 * Set move delay (lower = faster AI)
	 */
	setMoveDelay(delay: number): void {
		this.moveDelay = delay;
	}


	/**
	 * Called when a new piece spawns
	 */
	onPieceSpawned(): void {
		if (this.enabled) {
			this.computeTarget();
			this.rotationsApplied = false;
		}
	}


	/**
	 * Update AI (call from game loop)
	 */
	update(timestamp: number): void {
		if (!this.enabled || !this.targetState || !this.game.currentPiece) return;
		if (this.game.state.paused || this.game.state.gameOver) return;
		if (this.game.isClearingAnimation) return;  // Skip during layer clearing

		// Rate limit moves
		if (timestamp - this.lastMoveTime < this.moveDelay) return;

		const piece = this.game.currentPiece;
		const target = this.targetState;

		// First apply rotations if not done yet
		if (!this.rotationsApplied) {
			let rotationFailed = false;
			for (const rot of target.rotations) {
				if (!this.game.rotatePiece(rot.axis, rot.times)) {
					rotationFailed = true;
					break;
				}
			}
			this.rotationsApplied = true;
			this.lastMoveTime = timestamp;

			// If rotation failed, recompute target for new orientation
			if (rotationFailed) {
				this.computeTarget();
				this.rotationsApplied = true;  // Skip rotation for new target
			}
			return;
		}

		// Move towards target X position
		const bounds = piece.getWorldBounds();
		const currentX = bounds.min.x;
		const currentZ = bounds.min.z;

		if (currentX < target.x) {
			if (!this.game.moveRight()) {
				// Can't move right, recompute target
				this.computeTarget();
				this.rotationsApplied = true;
			}
			this.lastMoveTime = timestamp;
			return;
		} else if (currentX > target.x) {
			if (!this.game.moveLeft()) {
				// Can't move left, recompute target
				this.computeTarget();
				this.rotationsApplied = true;
			}
			this.lastMoveTime = timestamp;
			return;
		}

		// Move towards target Z position
		if (currentZ < target.z) {
			if (!this.game.moveBackward()) {
				// Can't move backward, recompute target
				this.computeTarget();
				this.rotationsApplied = true;
			}
			this.lastMoveTime = timestamp;
			return;
		} else if (currentZ > target.z) {
			if (!this.game.moveForward()) {
				// Can't move forward, recompute target
				this.computeTarget();
				this.rotationsApplied = true;
			}
			this.lastMoveTime = timestamp;
			return;
		}

		// We're at target position - drop the piece
		this.game.hardDrop();
		this.lastMoveTime = timestamp;
	}


	/**
	 * Compute optimal target state for current piece
	 */
	private computeTarget(): void {
		const piece = this.game.currentPiece;
		if (!piece) {
			this.targetState = null;
			return;
		}

		const candidates: TargetState[] = [];

		// Try all 24 orientations
		for (const rotations of REGULAR_ORIENTATIONS) {
			// Clone piece and apply rotations
			const testPiece = piece.clone();
			for (const rot of rotations) {
				testPiece.rotate(rot.axis, rot.times);
			}

			const bounds = testPiece.getWorldBounds();
			const pieceWidth = bounds.max.x - bounds.min.x + 1;
			const pieceDepth = bounds.max.z - bounds.min.z + 1;

			// Try all X positions
			for (let x = 0; x <= GAME_CONFIG.boardWidth - pieceWidth; x++) {
				// Try all Z positions
				for (let z = 0; z <= GAME_CONFIG.boardDepth - pieceDepth; z++) {
					const state: TargetState = {
						x,
						z,
						rotations: [...rotations],
						worth: 0,
					};

					// Evaluate this position
					state.worth = this.evaluatePosition(testPiece, x - bounds.min.x, z - bounds.min.z);
					candidates.push(state);
				}
			}
		}

		// Sort by worth (lower is better)
		candidates.sort((a, b) => a.worth - b.worth);

		// Select best (or random from top few for variety)
		if (candidates.length > 0) {
			// Add some randomness by sometimes picking from top 3
			const topCount = Math.min(3, candidates.length);
			const randomIndex = Math.floor(Math.random() * topCount);
			this.targetState = candidates[randomIndex];
		} else {
			this.targetState = null;
		}
	}


	/**
	 * Evaluate a position for the piece
	 * Lower score = better position
	 */
	private evaluatePosition(piece: TetrisPiece, offsetX: number, offsetZ: number): number {
		// Clone piece and position it
		const testPiece = piece.clone();
		testPiece.position = {
			x: testPiece.position.x + offsetX,
			y: testPiece.position.y,
			z: testPiece.position.z + offsetZ,
		};

		// Simulate drop to find final Y position
		let dropY = testPiece.position.y;
		while (dropY > 0) {
			testPiece.position = {...testPiece.position, y: dropY - 1};
			if (!this.isValidPosition(testPiece)) {
				testPiece.position = {...testPiece.position, y: dropY};
				break;
			}
			dropY--;
		}

		const blocks = testPiece.getWorldBlocks();
		let score = 0;

		// Height score (prefer lower positions)
		let totalHeight = 0;
		for (const {point} of blocks) {
			totalHeight += point.y;
		}
		score += (totalHeight * totalHeight) / 36;

		// Count exposed side faces
		const sideFaces = this.countSideFaces(testPiece);
		score += sideFaces;

		// Count hole space (empty spaces beneath blocks)
		const holeSpace = this.countHoleSpace(testPiece);
		score += holeSpace * 2;

		return score;
	}


	/**
	 * Check if position is valid (no collisions)
	 */
	private isValidPosition(piece: TetrisPiece): boolean {
		const blocks = piece.getWorldBlocks();

		for (const {point} of blocks) {
			// Check floor
			if (point.y < 0) return false;

			// Check walls
			if (point.x < 0 || point.x >= GAME_CONFIG.boardWidth) return false;
			if (point.z < 0 || point.z >= GAME_CONFIG.boardDepth) return false;

			// Check collision with existing blocks
			if (this.game.board.has(point.x, point.y, point.z)) return false;
		}

		return true;
	}


	/**
	 * Count exposed side faces (horizontal neighbors that are empty)
	 */
	private countSideFaces(piece: TetrisPiece): number {
		const blocks = piece.getWorldBlocks();
		const blockSet = new Set<string>();

		// Build set of piece block positions
		for (const {point} of blocks) {
			blockSet.add(`${point.x},${point.y},${point.z}`);
		}

		let count = 0;
		const directions = [
			{dx: 1, dz: 0},
			{dx: -1, dz: 0},
			{dx: 0, dz: 1},
			{dx: 0, dz: -1},
		];

		for (const {point} of blocks) {
			for (const {dx, dz} of directions) {
				const nx = point.x + dx;
				const nz = point.z + dz;
				const key = `${nx},${point.y},${nz}`;

				// Skip if it's another block of the piece
				if (blockSet.has(key)) continue;

				// Check if out of bounds (wall contact is good)
				if (nx < 0 || nx >= GAME_CONFIG.boardWidth ||
					nz < 0 || nz >= GAME_CONFIG.boardDepth) {
					count += 0.3; // Walls are slightly penalized
					continue;
				}

				// Check if there's a board block there (contact is good)
				if (this.game.board.has(nx, point.y, nz)) {
					continue;
				}

				// Empty space - penalize more if there's nothing below it
				if (point.y > 0 && !this.game.board.has(nx, point.y - 1, nz)) {
					count += 1.6;
				} else {
					count += 1;
				}
			}
		}

		return count;
	}


	/**
	 * Count hole space (empty spaces directly beneath piece blocks)
	 */
	private countHoleSpace(piece: TetrisPiece): number {
		const blocks = piece.getWorldBlocks();
		const blockSet = new Set<string>();

		// Build set of piece block positions
		for (const {point} of blocks) {
			blockSet.add(`${point.x},${point.y},${point.z}`);
		}

		let count = 0;

		for (const {point} of blocks) {
			// Check if there's a piece block below
			const belowKey = `${point.x},${point.y - 1},${point.z}`;
			if (blockSet.has(belowKey)) continue;

			// Count empty spaces below this block
			let y = point.y - 1;
			while (y >= 0 && !this.game.board.has(point.x, y, point.z)) {
				count++;
				y--;
			}

			// Extra penalty if there's space below the bottom
			if (y > 0 && !this.game.board.has(point.x, y - 1, point.z)) {
				count += 0.2;
			}
		}

		return count;
	}
}
