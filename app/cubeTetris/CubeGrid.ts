
/**
 * Cube Tetris - 3D Grid Data Structure
 * Ported from CubeGrid.lua
 */

import type {Point3D, BlockData, Bounds} from "./types";
import {coordKey, parseCoordKey, round} from "./constants";


/**
 * CubeGrid - A sparse 3D grid for storing blocks
 * Uses a Map with "x,y,z" string keys for efficient storage
 */
export class CubeGrid {
	private blocks: Map<string, BlockData>;

	constructor() {
		this.blocks = new Map();
	}


	/**
	 * Clear all blocks from the grid
	 */
	clear(): void {
		this.blocks.clear();
	}


	/**
	 * Get block at coordinates
	 */
	get(x: number, y: number, z: number): BlockData | null {
		return this.blocks.get(coordKey(x, y, z)) ?? null;
	}


	/**
	 * Set block at coordinates
	 * Pass null to remove a block
	 */
	set(x: number, y: number, z: number, data: BlockData | null): void {
		const key = coordKey(x, y, z);
		if (data === null) {
			this.blocks.delete(key);
		} else {
			this.blocks.set(key, data);
		}
	}


	/**
	 * Check if a block exists at coordinates
	 */
	has(x: number, y: number, z: number): boolean {
		return this.blocks.has(coordKey(x, y, z));
	}


	/**
	 * Get bounds of all blocks
	 */
	getBounds(): Bounds {
		let minX = 0, maxX = 0, minY = 0, maxY = 0, minZ = 0, maxZ = 0;
		let first = true;

		for (const key of this.blocks.keys()) {
			const {x, y, z} = parseCoordKey(key);
			if (first) {
				minX = maxX = x;
				minY = maxY = y;
				minZ = maxZ = z;
				first = false;
			} else {
				minX = Math.min(minX, x);
				maxX = Math.max(maxX, x);
				minY = Math.min(minY, y);
				maxY = Math.max(maxY, y);
				minZ = Math.min(minZ, z);
				maxZ = Math.max(maxZ, z);
			}
		}

		return {minX, maxX, minY, maxY, minZ, maxZ};
	}


	/**
	 * Convert grid to list of points with data
	 */
	toPointList(): Array<{point: Point3D; data: BlockData}> {
		const points: Array<{point: Point3D; data: BlockData}> = [];

		for (const [key, data] of this.blocks) {
			points.push({
				point: parseCoordKey(key),
				data,
			});
		}

		return points;
	}


	/**
	 * Get all entries as an iterable
	 */
	entries(): IterableIterator<[string, BlockData]> {
		return this.blocks.entries();
	}


	/**
	 * Get number of blocks in grid
	 */
	get size(): number {
		return this.blocks.size;
	}


	/**
	 * Create a rotated copy of this grid
	 * Rotation is performed around (0,0,0) using 90-degree steps
	 * @param axis - Rotation axis ('x', 'y', or 'z')
	 * @param times - Number of 90-degree rotations (positive = counterclockwise when looking along axis toward origin)
	 */
	rotate(axis: "x" | "y" | "z", times: number = 1): CubeGrid {
		const rotated = new CubeGrid();

		// Normalize times to 0-3
		times = ((times % 4) + 4) % 4;
		if (times === 0) {
			// No rotation, just copy
			for (const [key, data] of this.blocks) {
				const point = parseCoordKey(key);
				rotated.set(point.x, point.y, point.z, {...data});
			}
			return rotated;
		}

		for (const [key, data] of this.blocks) {
			let {x, y, z} = parseCoordKey(key);

			// Apply rotation 'times' times
			for (let i = 0; i < times; i++) {
				let newX = x, newY = y, newZ = z;

				switch (axis) {
					case "x":
						// Rotate around X axis: (y, z) -> (-z, y)
						newY = -z;
						newZ = y;
						break;
					case "y":
						// Rotate around Y axis: (x, z) -> (z, -x)
						newX = z;
						newZ = -x;
						break;
					case "z":
						// Rotate around Z axis: (x, y) -> (-y, x)
						newX = -y;
						newY = x;
						break;
				}

				x = round(newX);
				y = round(newY);
				z = round(newZ);
			}

			rotated.set(x, y, z, {...data, position: {x, y, z}});
		}

		return rotated;
	}


	/**
	 * Clone this grid
	 */
	clone(): CubeGrid {
		const cloned = new CubeGrid();
		for (const [key, data] of this.blocks) {
			cloned.blocks.set(key, {...data});
		}
		return cloned;
	}


	/**
	 * Count blocks at a specific Y level
	 */
	countAtY(y: number): number {
		let count = 0;
		for (const key of this.blocks.keys()) {
			const point = parseCoordKey(key);
			if (point.y === y) {
				count++;
			}
		}
		return count;
	}


	/**
	 * Get all Y levels that have blocks
	 */
	getOccupiedYLevels(): number[] {
		const levels = new Set<number>();
		for (const key of this.blocks.keys()) {
			const {y} = parseCoordKey(key);
			levels.add(y);
		}
		return Array.from(levels).sort((a, b) => a - b);
	}


	/**
	 * Remove all blocks at a specific Y level and shift blocks above down
	 */
	removeLayerAndShift(y: number): void {
		// Remove blocks at this Y level
		const toRemove: string[] = [];
		const toShift: Array<{key: string; data: BlockData; point: Point3D}> = [];

		for (const [key, data] of this.blocks) {
			const point = parseCoordKey(key);
			if (point.y === y) {
				toRemove.push(key);
			} else if (point.y > y) {
				toShift.push({key, data, point});
			}
		}

		// Remove the layer
		for (const key of toRemove) {
			this.blocks.delete(key);
		}

		// Shift blocks above down by 1
		// IMPORTANT: Sort by Y ascending so we process lower blocks first
		// This prevents overwriting blocks that haven't been moved yet
		toShift.sort((a, b) => a.point.y - b.point.y);

		for (const {key, data, point} of toShift) {
			this.blocks.delete(key);
			const newY = point.y - 1;
			this.set(point.x, newY, point.z, {...data, position: {x: point.x, y: newY, z: point.z}});
		}
	}
}
