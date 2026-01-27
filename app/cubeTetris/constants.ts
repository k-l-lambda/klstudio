
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
	hardDropSpeed: 25,		// units per second for hard drop animation
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
 * 8 Standard Tetromino Piece Definitions from original CubeTetris
 * Based on AiController.lua s_BrickLattices
 * All pieces have exactly 4 cubes
 * Coordinates are relative to piece origin (0,0,0)
 */
export const PIECE_DEFINITIONS: PieceDefinition[] = [
	// Brick4_0: I-piece (4 blocks vertical along Y axis)
	{
		name: "Brick4_0",
		color: PIECE_COLORS.red,
		blocks: [
			{x: 0, y: 0, z: 0},
			{x: 0, y: 1, z: 0},
			{x: 0, y: 2, z: 0},
			{x: 0, y: 3, z: 0},
		],
	},

	// Brick4_1: L-piece (vertical stem with foot)
	{
		name: "Brick4_1",
		color: PIECE_COLORS.pink,
		blocks: [
			{x: 0, y: 0, z: 0},
			{x: 1, y: 0, z: 0},
			{x: 0, y: 1, z: 0},
			{x: 0, y: 2, z: 0},
		],
	},

	// Brick4_2: T-piece (vertical stem with branch)
	{
		name: "Brick4_2",
		color: PIECE_COLORS.brown,
		blocks: [
			{x: 0, y: 0, z: 0},
			{x: 0, y: 1, z: 0},
			{x: 1, y: 1, z: 0},
			{x: 0, y: 2, z: 0},
		],
	},

	// Brick4_3: O-piece (2x2 square in XY plane)
	{
		name: "Brick4_3",
		color: PIECE_COLORS.blue,
		blocks: [
			{x: 0, y: 0, z: 0},
			{x: 1, y: 0, z: 0},
			{x: 0, y: 1, z: 0},
			{x: 1, y: 1, z: 0},
		],
	},

	// Brick4_4: S-piece (staircase in XY plane)
	{
		name: "Brick4_4",
		color: PIECE_COLORS.green,
		blocks: [
			{x: 0, y: 0, z: 0},
			{x: 1, y: 0, z: 0},
			{x: 1, y: 1, z: 0},
			{x: 2, y: 1, z: 0},
		],
	},

	// Brick4_5: 3D corner piece (extends into Z axis)
	{
		name: "Brick4_5",
		color: PIECE_COLORS.purple,
		blocks: [
			{x: 0, y: 0, z: 0},
			{x: 0, y: 0, z: 1},
			{x: 1, y: 0, z: 0},
			{x: 0, y: 1, z: 0},
		],
	},

	// Brick4_6: 3D L-piece (extends into Z axis)
	{
		name: "Brick4_6",
		color: PIECE_COLORS.yellow,
		blocks: [
			{x: 0, y: 0, z: 0},
			{x: 1, y: 0, z: 0},
			{x: 1, y: 0, z: 1},
			{x: 0, y: 1, z: 0},
		],
	},

	// Brick4_7: 3D S-piece (mirror of Brick4_6)
	{
		name: "Brick4_7",
		color: PIECE_COLORS.cyan,
		blocks: [
			{x: 0, y: 0, z: 0},
			{x: 1, y: 0, z: 0},
			{x: 0, y: 0, z: 1},
			{x: 1, y: 1, z: 0},
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


// Scoring - direct scores for 0, 1, 2, 3, 4+ lines cleared
export const LINE_SCORES = [0, 1, 4, 9, 25];


/**
 * Helper: Round a number (matching Lua round behavior)
 */
export function round (n: number): number {
	const result = Math.floor(Math.abs(n) + 0.5);
	return n < 0 ? -result : result;
}


/**
 * Helper: Generate a key string from coordinates
 */
export function coordKey (x: number, y: number, z: number): string {
	return `${x},${y},${z}`;
}


/**
 * Helper: Parse a coordinate key back to Point3D
 */
export function parseCoordKey (key: string): Point3D {
	const [x, y, z] = key.split(",").map(Number);
	return {x, y, z};
}


/**
 * Face mask bits for block geometry
 * Each bit represents whether a face is exposed (no neighbor)
 */
export const FACE_MASK = {
	POS_X: 1,   // +x face exposed
	NEG_X: 2,   // -x face exposed
	POS_Y: 4,   // +y face exposed
	NEG_Y: 8,   // -y face exposed
	POS_Z: 16,  // +z face exposed
	NEG_Z: 32,  // -z face exposed
	ALL: 63,    // all faces exposed (isolated cube)
};
