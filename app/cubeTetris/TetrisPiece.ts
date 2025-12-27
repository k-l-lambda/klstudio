
/**
 * Cube Tetris - Tetris Piece Class
 */

import type {PieceDefinition, Point3D, BlockData} from "./types";
import {CubeGrid} from "./CubeGrid";
import {PIECE_DEFINITIONS} from "./constants";


/**
 * TetrisPiece - Represents a falling tetris piece
 */
export class TetrisPiece {
	private grid: CubeGrid;
	private _position: Point3D;
	readonly definition: PieceDefinition;

	constructor(definition: PieceDefinition, startPosition?: Point3D) {
		this.definition = definition;
		this.grid = new CubeGrid();
		this._position = startPosition ?? {x: 0, y: 0, z: 0};

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
	 * Get all world-space block positions
	 */
	getWorldBlocks(): Array<{point: Point3D; data: BlockData}> {
		const blocks: Array<{point: Point3D; data: BlockData}> = [];

		for (const {point, data} of this.grid.toPointList()) {
			blocks.push({
				point: {
					x: point.x + this._position.x,
					y: point.y + this._position.y,
					z: point.z + this._position.z,
				},
				data,
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
