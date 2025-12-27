
/**
 * Cube Tetris - Constants and Piece Definitions
 * Based on original CubeTetris game
 */

import type {PieceDefinition, GameConfig, Point3D} from "./types";


// Game configuration
export const GAME_CONFIG: GameConfig = {
	boardWidth: 4,
	boardDepth: 4,
	boardHeight: 20,
	gridSize: 1.0,
	dropInterval: 1000,		// ms between drops
	fastDropInterval: 50,	// ms when fast dropping
};


// Colors from original game (mapped from Lua color references)
export const PIECE_COLORS: Record<string, string> = {
	white: "#ffffff",
	black: "#333333",
	red: "#ff4444",
	green: "#44ff44",
	pink: "#ff88aa",
	brown: "#aa6644",
	blue: "#4444ff",
	purple: "#aa44aa",
	yellow: "#ffff44",
	cyan: "#44ffff",
};


/**
 * Piece definitions based on original Tetris.scene
 * Coordinates are relative to piece center (0,0,0)
 */
export const PIECE_DEFINITIONS: PieceDefinition[] = [
	// 1 block
	{
		name: "Brick1_0",
		color: PIECE_COLORS.white,
		blocks: [
			{x: 0, y: 0, z: 0},
		],
	},

	// 2 blocks - I-2
	{
		name: "Brick2_0",
		color: PIECE_COLORS.black,
		blocks: [
			{x: 0, y: 0, z: 0},
			{x: 1, y: 0, z: 0},
		],
	},

	// 3 blocks - I-3
	{
		name: "Brick3_0",
		color: PIECE_COLORS.red,
		blocks: [
			{x: 0, y: 0, z: 0},
			{x: 1, y: 0, z: 0},
			{x: 2, y: 0, z: 0},
		],
	},

	// 3 blocks - L-3
	{
		name: "Brick3_1",
		color: PIECE_COLORS.green,
		blocks: [
			{x: 0, y: 0, z: 0},
			{x: 1, y: 0, z: 0},
			{x: 0, y: 0, z: 1},
		],
	},

	// 4 blocks - I-4
	{
		name: "Brick4_0",
		color: PIECE_COLORS.red,
		blocks: [
			{x: 0, y: 0, z: 0},
			{x: 1, y: 0, z: 0},
			{x: 2, y: 0, z: 0},
			{x: 3, y: 0, z: 0},
		],
	},

	// 4 blocks - L-4
	{
		name: "Brick4_1",
		color: PIECE_COLORS.pink,
		blocks: [
			{x: 0, y: 0, z: 0},
			{x: 1, y: 0, z: 0},
			{x: 2, y: 0, z: 0},
			{x: 0, y: 0, z: 1},
		],
	},

	// 4 blocks - J-4
	{
		name: "Brick4_2",
		color: PIECE_COLORS.brown,
		blocks: [
			{x: 0, y: 0, z: 0},
			{x: 1, y: 0, z: 0},
			{x: 2, y: 0, z: 0},
			{x: 2, y: 0, z: 1},
		],
	},

	// 4 blocks - O (2x2)
	{
		name: "Brick4_3",
		color: PIECE_COLORS.blue,
		blocks: [
			{x: 0, y: 0, z: 0},
			{x: 1, y: 0, z: 0},
			{x: 0, y: 0, z: 1},
			{x: 1, y: 0, z: 1},
		],
	},

	// 4 blocks - S-4
	{
		name: "Brick4_4",
		color: PIECE_COLORS.green,
		blocks: [
			{x: 0, y: 0, z: 0},
			{x: 1, y: 0, z: 0},
			{x: 1, y: 0, z: 1},
			{x: 2, y: 0, z: 1},
		],
	},

	// 4 blocks - 3D corner
	{
		name: "Brick4_5",
		color: PIECE_COLORS.purple,
		blocks: [
			{x: 0, y: 0, z: 0},
			{x: 1, y: 0, z: 0},
			{x: 0, y: 0, z: 1},
			{x: 0, y: 1, z: 0},
		],
	},

	// 4 blocks - 3D-L
	{
		name: "Brick4_6",
		color: PIECE_COLORS.yellow,
		blocks: [
			{x: 0, y: 0, z: 0},
			{x: 1, y: 0, z: 0},
			{x: 0, y: 1, z: 0},
			{x: 0, y: 2, z: 0},
		],
	},

	// 4 blocks - 3D-S
	{
		name: "Brick4_7",
		color: PIECE_COLORS.cyan,
		blocks: [
			{x: 0, y: 0, z: 0},
			{x: 1, y: 0, z: 0},
			{x: 1, y: 1, z: 0},
			{x: 2, y: 1, z: 0},
		],
	},

	// 4 blocks - T
	{
		name: "Brick4_8",
		color: PIECE_COLORS.purple,
		blocks: [
			{x: 0, y: 0, z: 0},
			{x: 1, y: 0, z: 0},
			{x: 2, y: 0, z: 0},
			{x: 1, y: 0, z: 1},
		],
	},

	// 4 blocks - Z
	{
		name: "Brick4_9",
		color: PIECE_COLORS.red,
		blocks: [
			{x: 0, y: 0, z: 1},
			{x: 1, y: 0, z: 1},
			{x: 1, y: 0, z: 0},
			{x: 2, y: 0, z: 0},
		],
	},

	// 8 blocks - 2x2x2 cube
	{
		name: "Brick8_0",
		color: PIECE_COLORS.black,
		blocks: [
			{x: 0, y: 0, z: 0},
			{x: 1, y: 0, z: 0},
			{x: 0, y: 0, z: 1},
			{x: 1, y: 0, z: 1},
			{x: 0, y: 1, z: 0},
			{x: 1, y: 1, z: 0},
			{x: 0, y: 1, z: 1},
			{x: 1, y: 1, z: 1},
		],
	},
];


// Key mappings
export const KEY_BINDINGS = {
	moveLeft: ["KeyA", "ArrowLeft"],
	moveRight: ["KeyD", "ArrowRight"],
	moveForward: ["KeyW", "ArrowUp"],
	moveBackward: ["KeyS", "ArrowDown"],
	drop: ["Space", "KeyX"],
	rotateXPos: ["KeyR"],
	rotateXNeg: ["KeyF"],
	rotateYPos: ["KeyE"],
	rotateYNeg: ["KeyQ"],
	rotateZPos: ["KeyC"],
	rotateZNeg: ["KeyZ"],
	pause: ["KeyP"],
	restart: ["KeyN"],
};


// Scoring
export const SCORE_PER_LINE = 100;
export const SCORE_MULTIPLIER = [0, 1, 3, 5, 8]; // 0, 1, 2, 3, 4 lines


/**
 * Helper: Round a number (matching Lua round behavior)
 */
export function round(n: number): number {
	const result = Math.floor(Math.abs(n) + 0.5);
	return n < 0 ? -result : result;
}


/**
 * Helper: Generate a key string from coordinates
 */
export function coordKey(x: number, y: number, z: number): string {
	return `${x},${y},${z}`;
}


/**
 * Helper: Parse a coordinate key back to Point3D
 */
export function parseCoordKey(key: string): Point3D {
	const [x, y, z] = key.split(",").map(Number);
	return {x, y, z};
}
