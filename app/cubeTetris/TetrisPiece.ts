
/**
 * Cube Tetris - Tetris Piece Class
 */

import type {PieceDefinition, Point3D, BlockData} from "./types";
import {CubeGrid} from "./CubeGrid";
import {PIECE_DEFINITIONS, coordKey, FACE_MASK} from "./constants";


/**
 * Rotation state tracking (cumulative 90° rotations on each axis)
 */
interface RotationState {
	x: number;  // -1, 0, 1, or 2 (times 90°)
	y: number;
	z: number;
}


/**
 * TetrisPiece - Represents a falling tetris piece
 */
export class TetrisPiece {
	private grid: CubeGrid;
	private _position: Point3D;
	private _rotationState: RotationState;
	readonly definition: PieceDefinition;

	constructor(definition: PieceDefinition, startPosition?: Point3D) {
		this.definition = definition;
		this.grid = new CubeGrid();
		this._position = startPosition ?? {x: 0, y: 0, z: 0};
		this._rotationState = {x: 0, y: 0, z: 0};

		// Initialize grid with piece blocks
		this.initializeBlocks();
	}


	/**
	 * Initialize blocks from piece definition
	 */
	private initializeBlocks(): void {
		this.grid.clear();
		for (const block of this.definition.blocks) {
			this.grid.set(block.x, block.y, block.z, {
				color: this.definition.color,
				position: {...block},
			});
		}
	}


	/**
	 * Get current position
	 */
	get position(): Point3D {
		return {...this._position};
	}


	/**
	 * Set position
	 */
	set position(pos: Point3D) {
		this._position = {...pos};
	}


	/**
	 * Get piece color
	 */
	get color(): string {
		return this.definition.color;
	}


	/**
	 * Get all world-space block positions with faceMask calculated
	 * faceMask indicates which faces are exposed (no neighbor within piece)
	 */
	getWorldBlocks(): Array<{point: Point3D; data: BlockData}> {
		const blocks: Array<{point: Point3D; data: BlockData}> = [];
		const localBlocks = this.grid.toPointList();

		// Build a set for quick neighbor lookup within the piece
		const blockSet = new Set<string>();
		for (const {point} of localBlocks) {
			blockSet.add(coordKey(point.x, point.y, point.z));
		}

		for (const {point, data} of localBlocks) {
			// Calculate faceMask based on neighbors within the piece
			let faceMask = 0;
			if (!blockSet.has(coordKey(point.x + 1, point.y, point.z))) faceMask |= FACE_MASK.POS_X;
			if (!blockSet.has(coordKey(point.x - 1, point.y, point.z))) faceMask |= FACE_MASK.NEG_X;
			if (!blockSet.has(coordKey(point.x, point.y + 1, point.z))) faceMask |= FACE_MASK.POS_Y;
			if (!blockSet.has(coordKey(point.x, point.y - 1, point.z))) faceMask |= FACE_MASK.NEG_Y;
			if (!blockSet.has(coordKey(point.x, point.y, point.z + 1))) faceMask |= FACE_MASK.POS_Z;
			if (!blockSet.has(coordKey(point.x, point.y, point.z - 1))) faceMask |= FACE_MASK.NEG_Z;

			blocks.push({
				point: {
					x: point.x + this._position.x,
					y: point.y + this._position.y,
					z: point.z + this._position.z,
				},
				data: {
					...data,
					faceMask,
				},
			});
		}

		return blocks;
	}


	/**
	 * Get all local-space block positions (relative to piece origin)
	 */
	getLocalBlocks(): Point3D[] {
		return this.grid.toPointList().map(({point}) => ({...point}));
	}


	/**
	 * Get base (unrotated) block positions from definition
	 * Used for geometry caching - only 8 unique shapes
	 */
	getBaseBlocks(): Point3D[] {
		return this.definition.blocks.map(b => ({...b}));
	}


	/**
	 * Get rotation state for rendering
	 * Returns rotation angles in radians for each axis
	 */
	getRotationAngles(): {x: number; y: number; z: number} {
		const halfPi = Math.PI / 2;
		return {
			x: this._rotationState.x * halfPi,
			y: this._rotationState.y * halfPi,
			z: this._rotationState.z * halfPi,
		};
	}


	/**
	 * Move the piece
	 */
	move(dx: number, dy: number, dz: number): void {
		this._position.x += dx;
		this._position.y += dy;
		this._position.z += dz;
	}


	/**
	 * Move left (-X)
	 */
	moveLeft(): void {
		this.move(-1, 0, 0);
	}


	/**
	 * Move right (+X)
	 */
	moveRight(): void {
		this.move(1, 0, 0);
	}


	/**
	 * Move forward (-Z)
	 */
	moveForward(): void {
		this.move(0, 0, -1);
	}


	/**
	 * Move backward (+Z)
	 */
	moveBackward(): void {
		this.move(0, 0, 1);
	}


	/**
	 * Move down (-Y)
	 */
	moveDown(): void {
		this.move(0, -1, 0);
	}


	/**
	 * Rotate the piece 90 degrees around an axis
	 */
	rotate(axis: "x" | "y" | "z", times: number = 1): void {
		this.grid = this.grid.rotate(axis, times);
		// Track rotation state for rendering
		this._rotationState[axis] = (this._rotationState[axis] + times) % 4;
		if (this._rotationState[axis] < 0) this._rotationState[axis] += 4;
	}


	/**
	 * Rotate around X axis (pitch)
	 */
	rotateX(times: number = 1): void {
		this.rotate("x", times);
	}


	/**
	 * Rotate around Y axis (yaw)
	 */
	rotateY(times: number = 1): void {
		this.rotate("y", times);
	}


	/**
	 * Rotate around Z axis (roll)
	 */
	rotateZ(times: number = 1): void {
		this.rotate("z", times);
	}


	/**
	 * Get bounding box in world coordinates
	 */
	getWorldBounds(): {min: Point3D; max: Point3D} {
		const bounds = this.grid.getBounds();
		return {
			min: {
				x: bounds.minX + this._position.x,
				y: bounds.minY + this._position.y,
				z: bounds.minZ + this._position.z,
			},
			max: {
				x: bounds.maxX + this._position.x,
				y: bounds.maxY + this._position.y,
				z: bounds.maxZ + this._position.z,
			},
		};
	}


	/**
	 * Clone this piece
	 */
	clone(): TetrisPiece {
		const cloned = new TetrisPiece(this.definition, {...this._position});
		cloned.grid = this.grid.clone();
		cloned._rotationState = {...this._rotationState};
		return cloned;
	}


	/**
	 * Create a random piece
	 */
	static createRandom(startPosition?: Point3D): TetrisPiece {
		const index = Math.floor(Math.random() * PIECE_DEFINITIONS.length);
		return new TetrisPiece(PIECE_DEFINITIONS[index], startPosition);
	}


	/**
	 * Create a piece by name
	 */
	static createByName(name: string, startPosition?: Point3D): TetrisPiece | null {
		const definition = PIECE_DEFINITIONS.find(d => d.name === name);
		if (!definition) return null;
		return new TetrisPiece(definition, startPosition);
	}
}
