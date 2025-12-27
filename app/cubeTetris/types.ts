
/**
 * Cube Tetris - Type Definitions
 */

export interface Point3D {
	x: number;
	y: number;
	z: number;
}

export interface BlockData {
	color: string;
	position: Point3D;
}

export interface PieceDefinition {
	name: string;
	blocks: Point3D[];
	color: string;
}

export interface GameState {
	score: number;
	level: number;
	linesCleared: number;
	gameOver: boolean;
	paused: boolean;
}

export interface Bounds {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
	minZ: number;
	maxZ: number;
}

export type RotationAxis = "x" | "y" | "z";

export interface GameConfig {
	boardWidth: number;
	boardDepth: number;
	boardHeight: number;
	gridSize: number;
	dropInterval: number;
	fastDropInterval: number;
}
