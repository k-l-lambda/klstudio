// General-order cube state, built the way inc/cube3.ts is: every piece carries one of the 24 cube rotations
// (indices of cube-algebra's NORMAL_ORIENTATIONS) and its position follows from it, so states compose like
// permutation-with-orientation matrices (multiply / divide) and a twist is a table lookup per piece.
// For order 3 the units are identical to Cube3's (see fromCube3Units / toCube3Units), so its tables can be reused.
//
// On top of that sits a slot view for solvers (two-phase / COVE-3 style coordinates): pieces fall into orbits
// (corners, middle edges, wings, centres...), and for each orbit `cubies` gives which piece is in each slot and
// its orientation there, read off the U/D (then F/B) sticker like the usual cp/co/ep/eo.
//
// Conventions (same as Cube3): points are row vectors, a piece with unit u at home h sits at h × M[u];
// coordinates are doubled (2i - (N - 1)) so even orders stay integral. Faces 0..5 = L R D U B F (-X +X -Y +Y -Z +Z).
import {rotationMatrices, Cube3} from "./cube3";



type Vector3 = [number, number, number];
type Matrix = number[];	// 3×3 row-major


export interface Twist {
	axis: number;		// 0 x, 1 y, 2 z
	layers: number[];	// layer indices along the axis, 0 = negative side
	turns: number;		// quarter turns, right-handed about the +axis
}


export type PieceKind = "corner" | "edge" | "center" | "core";

export interface Orbit {
	kind: PieceKind;
	pieces: number[];	// piece indices = home slots, ascending
	orientations: number;	// distinct orientations of a piece within one slot (3 corner, 2 edge, 4 fixed centre, else 1)
}


const ROTATIONS: Matrix[] = rotationMatrices.slice(0, 24).map(m => [].concat(...m).map(v => v + 0));
const ROTATION_KEYS = ROTATIONS.map(m => m.join());

const mul = (a: Matrix, b: Matrix): Matrix => {
	const r = Array(9).fill(0);
	for (let i = 0; i < 3; ++i) {
		for (let j = 0; j < 3; ++j)
			r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
	}

	return r;
};

const apply = (p: Vector3, m: Matrix): Vector3 => [0, 1, 2].map(j => p[0] * m[j] + p[1] * m[3 + j] + p[2] * m[6 + j]) as Vector3;

// MULTIPLY[a * 24 + b] = index of M[a]·M[b]: unit a followed by rotation b
export const MULTIPLY = new Uint8Array(24 * 24);
// DIVIDE[a * 24 + c] = x with M[a]·M[x] = M[c]
export const DIVIDE = new Uint8Array(24 * 24);
// INVERSE[a] = index of M[a]⁻¹
export const INVERSE = new Uint8Array(24);
for (let a = 0; a < 24; ++a) {
	for (let b = 0; b < 24; ++b) {
		const c = ROTATION_KEYS.indexOf(mul(ROTATIONS[a], ROTATIONS[b]).join());
		MULTIPLY[a * 24 + b] = c;
		DIVIDE[a * 24 + c] = b;
		if (c === 0)
			INVERSE[a] = b;
	}
}


// Unit index of a right-handed quarter-turn rotation about an axis.
const rotationUnit = (axis: number, q: number): number => {
	const c = [1, 0, -1, 0][q], s = [0, 1, 0, -1][q];
	const [u, v] = [(axis + 1) % 3, (axis + 2) % 3];
	// column-vector rotation R; points are rows, so M = Rᵀ
	const m = Array(9).fill(0);
	m[axis * 3 + axis] = 1;
	m[u * 3 + u] = c;
	m[v * 3 + u] = -s;
	m[u * 3 + v] = s;
	m[v * 3 + v] = c;

	return ROTATION_KEYS.indexOf(m.join());
};

const AXIS_ROTATIONS = [0, 1, 2].map(axis => [0, 1, 2, 3].map(q => rotationUnit(axis, q)));

export const axisRotation = (axis: number, turns: number): number => AXIS_ROTATIONS[axis][((turns % 4) + 4) % 4];


const FACE_NORMALS: Vector3[] = [[-1, 0, 0], [1, 0, 0], [0, -1, 0], [0, 1, 0], [0, 0, -1], [0, 0, 1]];
const faceOfNormal = (n: Vector3): number => FACE_NORMALS.findIndex(f => f[0] === n[0] && f[1] === n[1] && f[2] === n[2]);

// facelet grid of each face seen from outside: [right, down]
const FACE_FRAMES: [Vector3, Vector3][] = [
	[[0, 0, 1], [0, -1, 0]],	// L
	[[0, 0, -1], [0, -1, 0]],	// R
	[[1, 0, 0], [0, 0, -1]],	// D
	[[1, 0, 0], [0, 0, 1]],		// U
	[[-1, 0, 0], [0, -1, 0]],	// B
	[[1, 0, 0], [0, -1, 0]],	// F
];

// U/D first, then F/B, then L/R: the reference sticker of a slot, as in the usual corner twist / edge flip
const AXIS_PRIORITY = [1, 2, 0];

const det = (a: Vector3, b: Vector3, c: Vector3): number =>
	a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);

const same = (a: Vector3, b: Vector3): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];


// Order-specific tables, shared by every state of that order.
export class CubeNModel {
	order: number;
	homes: Vector3[];		// doubled coordinates
	stickers: Vector3[][];		// outward normals per piece, reference sticker first (corners then counter-clockwise)
	position: Uint16Array;		// [piece * 24 + unit] -> slot
	slotLayer: Uint8Array;		// [slot * 3 + axis] -> layer index
	slotTransform: Uint16Array;	// [t * pieces + slot] -> slot, for the 48 symmetries (24 rotations, then × -I)
	orbitOf: Uint16Array;		// piece -> orbit index
	orbits: Orbit[];
	facelets: {slot: number; normal: Vector3; right: Vector3; down: Vector3}[];	// face by face, row by row, N² each; right/down: the grid seen from outside
	private indexOfKey: Map<string, number>;
	private twistMasks = new Map<number, Uint8Array>();


	constructor (order: number) {
		console.assert(Number.isInteger(order) && order >= 2, "invalid order:", order);
		this.order = order;

		const n = order, half = n - 1;
		this.homes = [];
		this.indexOfKey = new Map();
		for (let z = 0; z < n; ++z) {
			for (let y = 0; y < n; ++y) {
				for (let x = 0; x < n; ++x) {
					const home: Vector3 = [2 * x - half, 2 * y - half, 2 * z - half];
					if (home.every(c => Math.abs(c) < half))
						continue;

					this.indexOfKey.set(home.join(), this.homes.length);
					this.homes.push(home);
				}
			}
		}

		const count = this.homes.length;

		this.stickers = this.homes.map(home => {
			const normals: Vector3[] = [];
			home.forEach((c, axis) => {
				if (Math.abs(c) === half) {
					const normal: Vector3 = [0, 0, 0];
					normal[axis] = Math.sign(c);
					normals.push(normal);
				}
			});
			const reference = AXIS_PRIORITY.map(axis => normals.find(normal => normal[axis])).find(Boolean);
			const rest = normals.filter(normal => normal !== reference);
			if (rest.length === 2 && det(reference, rest[0], rest[1]) < 0)
				rest.reverse();

			return [reference, ...rest];
		});

		this.position = new Uint16Array(count * 24);
		this.homes.forEach((home, i) => ROTATIONS.forEach((m, u) => this.position[i * 24 + u] = this.slotAt(apply(home, m))));

		this.slotLayer = new Uint8Array(count * 3);
		this.homes.forEach((home, i) => home.forEach((c, axis) => this.slotLayer[i * 3 + axis] = (c + half) / 2));

		this.slotTransform = new Uint16Array(48 * count);
		for (let t = 0; t < 48; ++t) {
			const sign = t < 24 ? 1 : -1;
			this.homes.forEach((home, i) => {
				const p = apply(home, ROTATIONS[t % 24]).map(c => c * sign) as Vector3;
				this.slotTransform[t * count + i] = this.slotAt(p);
			});
		}

		// orbits under whole-cube rotations (twists never move a piece out of its orbit)
		this.orbitOf = new Uint16Array(count);
		this.orbits = [];
		const seen = new Map<number, number>();
		for (let i = 0; i < count; ++i) {
			const representative = Math.min(...Array.from(this.position.subarray(i * 24, i * 24 + 24)));
			if (!seen.has(representative)) {
				const stickers = this.stickers[i].length;
				const kind: PieceKind = (["core", "center", "edge", "corner"] as PieceKind[])[stickers];
				const images = new Set(this.position.subarray(i * 24, i * 24 + 24));
				seen.set(representative, this.orbits.length);
				this.orbits.push({kind, pieces: [], orientations: 24 / images.size});
			}
			this.orbitOf[i] = seen.get(representative);
			this.orbits[this.orbitOf[i]].pieces.push(i);
		}

		this.facelets = [];
		FACE_FRAMES.forEach(([right, down], face) => {
			const normal = FACE_NORMALS[face];
			for (let row = 0; row < n; ++row) {
				for (let col = 0; col < n; ++col) {
					const p = [0, 1, 2].map(k => normal[k] * half + right[k] * (2 * col - half) + down[k] * (2 * row - half)) as Vector3;
					this.facelets.push({slot: this.slotAt(p), normal, right, down});
				}
			}
		});
	}


	get pieceCount (): number {
		return this.homes.length;
	}


	slotAt (point: Vector3): number {
		const index = this.indexOfKey.get(point.map(c => c + 0).join());
		console.assert(index !== undefined, "no piece at", point);

		return index;
	}


	// Slots turned by a twist, as a 0/1 mask (cached).
	twistMask (axis: number, layers: number[]): Uint8Array {
		const key = layers.reduce((bits, layer) => bits + 2 ** layer, 0) * 3 + axis;
		let mask = this.twistMasks.get(key);
		if (!mask) {
			mask = new Uint8Array(this.pieceCount);
			for (let s = 0; s < mask.length; ++s)
				mask[s] = layers.includes(this.slotLayer[s * 3 + axis]) ? 1 : 0;
			this.twistMasks.set(key, mask);
		}

		return mask;
	}


	// Outer face turn by notation letter (R L U D F B), clockwise seen from that face; `depth` layers deep.
	faceTwist (letter: string, {prime = false, double = false, depth = 1} = {}): Twist {
		const index = "RLUDFB".indexOf(letter.toUpperCase());
		console.assert(index >= 0, "invalid face:", letter);

		const axis = [0, 0, 1, 1, 2, 2][index];
		const positive = index % 2 === 0;
		const layers = Array(depth).fill(0).map((_, i) => positive ? this.order - 1 - i : i);
		const turns = double ? 2 : (positive ? -1 : 1) * (prime ? -1 : 1);

		return {axis, layers, turns};
	}
}


const models = new Map<number, CubeNModel>();

export const cubeModel = (order: number): CubeNModel => {
	if (!models.has(order))
		models.set(order, new CubeNModel(order));

	return models.get(order);
};


const A = "A".charCodeAt(0);


export class CubeN {
	model: CubeNModel;
	units: Uint8Array;	// [pieces], index of piece = its home slot


	constructor (order: number, {code, twists}: {code?: string, twists?: Twist[]} = {}) {
		this.model = cubeModel(order);
		this.reset();

		if (code)
			this.decode(code);

		if (twists)
			this.twists(twists);
	}


	get order (): number {
		return this.model.order;
	}


	reset (): this {
		this.units = new Uint8Array(this.model.pieceCount);

		return this;
	}


	clone (): CubeN {
		const cube = new CubeN(this.order);
		cube.units.set(this.units);

		return cube;
	}


	equals (cube: CubeN): boolean {
		return this.units.every((unit, i) => unit === cube.units[i]);
	}


	isZero (): boolean {
		return this.units.every(unit => !unit);
	}


	// slot of each piece
	get positions (): Uint16Array {
		const position = this.model.position;
		return this.units.map((unit, i) => position[i * 24 + unit]) as unknown as Uint16Array;
	}


	// piece in each slot (inverse of positions)
	get occupants (): Uint16Array {
		const result = new Uint16Array(this.units.length);
		const position = this.model.position;
		this.units.forEach((unit, i) => result[position[i * 24 + unit]] = i);

		return result;
	}


	twist ({axis, layers, turns}: Twist): this {
		const rotation = axisRotation(axis, turns);
		const mask = this.model.twistMask(axis, layers);
		const position = this.model.position;
		for (let i = 0; i < this.units.length; ++i) {
			const unit = this.units[i];
			if (mask[position[i * 24 + unit]])
				this.units[i] = MULTIPLY[unit * 24 + rotation];
		}

		return this;
	}


	twists (twists: Twist[]): this {
		twists.forEach(twist => this.twist(twist));

		return this;
	}


	// this followed by `cube` (cube acts on whatever sits in its slots)
	multiply (cube: CubeN): CubeN {
		const position = this.model.position;
		const result = new CubeN(this.order);
		this.units.forEach((unit, i) => result.units[i] = MULTIPLY[unit * 24 + cube.units[position[i * 24 + unit]]]);

		return result;
	}


	// the state q with cube·q = this
	divide (cube: CubeN): CubeN {
		const position = cube.model.position;
		const result = new CubeN(this.order);
		cube.units.forEach((unit, i) => result.units[position[i * 24 + unit]] = DIVIDE[unit * 24 + this.units[i]]);

		return result;
	}


	inverse (): CubeN {
		return new CubeN(this.order).divide(this);
	}


	// Conjugate by one of the 48 cube symmetries (0..23 rotations, 24..47 the same × central inversion), as Cube3.transform.
	transform (transformation: number): this {
		const count = this.units.length;
		const slots = this.model.slotTransform.subarray(transformation * count, transformation * count + count);
		const rotation = transformation % 24;
		const units = new Uint8Array(count);
		this.units.forEach((unit, i) => units[slots[i]] = DIVIDE[rotation * 24 + MULTIPLY[unit * 24 + rotation]]);
		this.units = units;

		return this;
	}


	encode (): string {
		return Array.from(this.units, unit => String.fromCharCode(A + unit)).join("");
	}


	decode (code: string): this {
		console.assert(code.length === this.units.length, "invalid code, length required to be", this.units.length, code);
		code.split("").forEach((c, i) => this.units[i] = c.charCodeAt(0) - A);

		return this;
	}


	// every slot holds exactly one piece, of the slot's own orbit
	validate (): boolean {
		const occupied = new Uint8Array(this.units.length);
		const positions = this.positions;
		for (let i = 0; i < positions.length; ++i) {
			if (occupied[positions[i]]++ || this.model.orbitOf[positions[i]] !== this.model.orbitOf[i])
				return false;
		}

		return true;
	}


	// Face index (0..5, L R D U B F) shown at each facelet, face by face, row by row.
	get facelets (): Uint8Array {
		const occupants = this.occupants;

		return Uint8Array.from(this.model.facelets, ({slot, normal}) => {
			const piece = occupants[slot];
			// the piece's solved-frame normal that now points along `normal`: normal × M⁻¹
			return faceOfNormal(apply(normal, ROTATIONS[INVERSE[this.units[piece]]]));
		});
	}


	// Every face one colour: solved up to whole-cube rotation and indistinguishable pieces (centres of N ≥ 4).
	get solved (): boolean {
		const facelets = this.facelets, n2 = this.order ** 2;
		for (let f = 0; f < 6; ++f) {
			for (let k = 1; k < n2; ++k) {
				if (facelets[f * n2 + k] !== facelets[f * n2])
					return false;
			}
		}

		return true;
	}


	// Orientation of the piece in `slot`. Pieces with stickers: index of the slot's sticker (reference first) holding the
	// piece's reference sticker, i.e. corner twist (sum ≡ 0 mod 3) and edge flip (sum ≡ 0 mod 2). Centres: quarter
	// turns of the piece about the face normal relative to the slot frame (meaningful for fixed centres).
	orientationAt (slot: number, piece: number = this.occupants[slot]): number {
		const m = ROTATIONS[this.units[piece]];
		const slotStickers = this.model.stickers[slot];
		if (slotStickers.length >= 2) {
			const reference = apply(this.model.stickers[piece][0], m);
			return slotStickers.findIndex(normal => same(normal, reference));
		}

		// centre: compare a tangent of the face, U/D-first like the reference sticker
		const normal = slotStickers[0];
		const tangentOf = (n: Vector3): Vector3 => {
			const axis = AXIS_PRIORITY.find(a => !n[a]);
			const t: Vector3 = [0, 0, 0];
			t[axis] = 1;
			return t;
		};
		const home = this.model.stickers[piece][0];
		const turned = apply(tangentOf(home), m);
		let t = tangentOf(normal);
		for (let k = 0; k < 4; ++k) {
			if (same(t, turned))
				return k;
			// t ← normal × t: a right-handed quarter turn about the normal
			t = [normal[1] * t[2] - normal[2] * t[1], normal[2] * t[0] - normal[0] * t[2], normal[0] * t[1] - normal[1] * t[0]] as Vector3;
		}

		return -1;
	}


	// Slot view of one orbit: for each slot of the orbit (in `orbit.pieces` order), the occupant's index within the
	// orbit and its orientation there — cp/co (corners), ep/eo (edges) for a 3×3.
	cubies (orbitIndex: number): {permutation: number[]; orientation: number[]} {
		const orbit = this.model.orbits[orbitIndex];
		const occupants = this.occupants;
		const indexInOrbit = new Map(orbit.pieces.map((piece, i) => [piece, i]));
		const permutation = orbit.pieces.map(slot => indexInOrbit.get(occupants[slot]));
		const orientation = orbit.pieces.map(slot => this.orientationAt(slot, occupants[slot]));

		return {permutation, orientation};
	}


	// Order 3 only: Cube3 indexes all 27 cells (core included) the same way, with the same unit indices.
	toCube3Units (): Uint8Array {
		console.assert(this.order === 3, "Cube3 units need order 3");
		const units = new Uint8Array(27);
		this.model.homes.forEach((home, i) => units[((home[2] + 2) * 9 + (home[1] + 2) * 3 + home[0] + 2) / 2] = this.units[i]);

		return units;
	}


	static fromCube3 (cube: Cube3): CubeN {
		const result = new CubeN(3);
		result.model.homes.forEach((home, i) => result.units[i] = cube.units[((home[2] + 2) * 9 + (home[1] + 2) * 3 + home[0] + 2) / 2]);

		return result;
	}
}


// Lehmer-code rank of a permutation of 0..n-1 (n ≤ 18 stays exact in doubles), and its inverse.
export const rankPermutation = (p: ArrayLike<number>): number => {
	let value = 0;
	for (let i = 0; i < p.length; ++i) {
		let smaller = 0;
		for (let j = i + 1; j < p.length; ++j) {
			if (p[j] < p[i])
				++smaller;
		}
		value = value * (p.length - i) + smaller;
	}

	return value;
};

export const unrankPermutation = (value: number, size: number): number[] => {
	const digits = Array(size).fill(0);
	for (let i = size - 1; i >= 0; --i) {
		digits[i] = value % (size - i);
		value = Math.floor(value / (size - i));
	}
	const available = Array(size).fill(0).map((_, i) => i);

	return digits.map(d => available.splice(d, 1)[0]);
};
