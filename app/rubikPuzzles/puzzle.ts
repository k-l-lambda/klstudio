// State model shared by every puzzle of the rubik-puzzles app: an N×N×N lattice of pieces turned in layers.
// The Mastermorphix is a 3×3×3 with different piece shapes, so it uses this same model.
// Coordinates: piece centres sit at i - (N - 1) / 2 on each axis (half-integers for even N, exact in floats).

export type Vector3 = [number, number, number];
export type Matrix3 = number[];	// 3×3 row-major, entries in {-1, 0, 1}

export type PuzzleShape = "cube" | "mastermorphix";

export interface PuzzleKind {
	id: string;
	name: string;
	order: number;
	shape: PuzzleShape;
	scrambleLength: number;
}

export const PUZZLES: PuzzleKind[] = [
	{id: "cube2", name: "2×2×2", order: 2, shape: "cube", scrambleLength: 15},
	{id: "cube3", name: "3×3×3", order: 3, shape: "cube", scrambleLength: 25},
	{id: "cube4", name: "4×4×4", order: 4, shape: "cube", scrambleLength: 40},
	{id: "mastermorphix", name: "Mastermorphix", order: 3, shape: "mastermorphix", scrambleLength: 25},
];

// A layer turn: `turns` quarter turns, right-handed about the +axis, of every layer index in `layers` (0 = the -axis side).
export interface Twist {
	axis: number;
	layers: number[];
	turns: number;
}

export interface Piece {
	home: Vector3;		// lattice position in the solved state
	matrix: Matrix3;	// current orientation (solved frame -> puzzle frame)
	stickers: {face: number; normal: Vector3}[];	// cube faces showing on this piece, in the solved frame
}


export const IDENTITY: Matrix3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];


export const multiply = (a: Matrix3, b: Matrix3): Matrix3 => {
	const result = Array(9).fill(0);
	for (let i = 0; i < 3; ++i) {
		for (let j = 0; j < 3; ++j)
			result[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
	}

	return result;
};


export const transform = (m: Matrix3, v: Vector3): Vector3 => [
	m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
	m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
	m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];


// Right-handed rotation of `turns` quarter turns about a coordinate axis.
export const axisRotation = (axis: number, turns: number): Matrix3 => {
	const q = ((turns % 4) + 4) % 4;
	const c = [1, 0, -1, 0][q];
	const s = [0, 1, 0, -1][q];
	const [u, v] = [(axis + 1) % 3, (axis + 2) % 3];
	const m = Array(9).fill(0);
	m[axis * 3 + axis] = 1;
	m[u * 3 + u] = c;
	m[u * 3 + v] = -s;
	m[v * 3 + u] = s;
	m[v * 3 + v] = c;

	return m;
};


// Face index of an axis direction: 0 +X, 1 -X, 2 +Y, 3 -Y, 4 +Z, 5 -Z.
export const faceOf = (axis: number, sign: number): number => axis * 2 + (sign > 0 ? 0 : 1);


export const normalizeTurns = (turns: number): number => {
	const q = ((turns % 4) + 4) % 4;
	return q === 3 ? -1 : q;
};


export class PuzzleState {
	kind: PuzzleKind;
	pieces: Piece[];


	constructor (kind: PuzzleKind) {
		this.kind = kind;

		const n = kind.order;
		const half = (n - 1) / 2;
		this.pieces = [];
		for (let z = 0; z < n; ++z) {
			for (let y = 0; y < n; ++y) {
				for (let x = 0; x < n; ++x) {
					const home: Vector3 = [x - half, y - half, z - half];
					// interior pieces never show
					if (home.every(c => Math.abs(c) < half))
						continue;

					const stickers = [];
					home.forEach((c, axis) => {
						if (Math.abs(c) === half) {
							const normal: Vector3 = [0, 0, 0];
							normal[axis] = Math.sign(c);
							stickers.push({face: faceOf(axis, c), normal});
						}
					});

					this.pieces.push({home, matrix: IDENTITY, stickers});
				}
			}
		}
	}


	get order (): number {
		return this.kind.order;
	}


	position (piece: Piece): Vector3 {
		return transform(piece.matrix, piece.home);
	}


	layerIndex (coordinate: number): number {
		return Math.round(coordinate + (this.order - 1) / 2);
	}


	piecesInTwist (twist: Twist): Piece[] {
		return this.pieces.filter(piece => twist.layers.includes(this.layerIndex(this.position(piece)[twist.axis])));
	}


	twist (twist: Twist): void {
		const rotation = axisRotation(twist.axis, twist.turns);
		this.piecesInTwist(twist).forEach(piece => piece.matrix = multiply(rotation, piece.matrix));
	}


	reset (): void {
		this.pieces.forEach(piece => piece.matrix = IDENTITY);
	}


	get solved (): boolean {
		if (this.kind.shape === "mastermorphix") {
			// every piece is distinct and its orientation shows, so solved = one common orientation
			const reference = this.pieces[0].matrix.join(",");
			return this.pieces.every(piece => piece.matrix.join(",") === reference);
		}

		// cubes: every face shows one colour (centres of even cubes are interchangeable, centre twists invisible)
		const directions = new Map<number, string>();
		for (const piece of this.pieces) {
			for (const sticker of piece.stickers) {
				const direction = transform(piece.matrix, sticker.normal).join(",");
				if (!directions.has(sticker.face))
					directions.set(sticker.face, direction);
				else if (directions.get(sticker.face) !== direction)
					return false;
			}
		}

		return true;
	}
}


export const inverseTwist = (twist: Twist): Twist => ({...twist, turns: normalizeTurns(-twist.turns)});


// Face turn by notation letter (R L U D F B), clockwise looking at that face; `prime` reverses it, `wide` adds the next layer in.
export const notationTwist = (order: number, letter: string, {prime = false, wide = false} = {}): Twist => {
	const index = "RLUDFB".indexOf(letter.toUpperCase());
	if (index < 0)
		return null;

	const axis = Math.floor(index / 2);
	const positive = index % 2 === 0;
	const depth = wide ? Math.min(2, order - 1) : 1;
	const layers = Array(depth).fill(0).map((_, i) => positive ? order - 1 - i : i);
	// clockwise seen from +axis is a negative right-handed turn
	const turns = (positive ? -1 : 1) * (prime ? -1 : 1);

	return {axis, layers, turns};
};


// A random sequence that never turns the same axis twice in a row (those would merge or commute).
export const scramble = (kind: PuzzleKind, random: () => number = Math.random): Twist[] => {
	const twists: Twist[] = [];
	let lastAxis = -1;
	while (twists.length < kind.scrambleLength) {
		const axis = Math.floor(random() * 3);
		if (axis === lastAxis)
			continue;

		const layer = Math.floor(random() * kind.order);
		const turns = [-1, 1, 2][Math.floor(random() * 3)];
		twists.push({axis, layers: [layer], turns});
		lastAxis = axis;
	}

	return twists;
};
