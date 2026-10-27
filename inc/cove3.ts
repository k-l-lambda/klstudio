// Two-phase 3×3 solver in the manner of COVE-3 (github.com/nahin333/rubikscube, compact-solver.js), written on
// top of inc/cubeN.ts. Our own implementation of the same scheme and parameters:
//	phase 1: reach the subgroup <U, D, R2, F2, L2, B2> — coordinates corner twist (3^7), edge flip (2^11) and the
//		E-slice edge positions (12 choose 4), pruned by two paired distance tables (twist × slice, flip × slice);
//	phase 2: solve within it with the 10 subgroup moves — corner permutation (8!), U/D edge permutation (8!) and
//		slice edge permutation (4!), pruned by (corners × slice) and (edges × slice) distance tables;
//	IDA* in both, the first completed solution is returned (not optimal); phase 1 ≤ 12, phase 2 ≤ 18 moves,
//	250 000 visits per phase-2 endpoint, 20 000 000 visits in all.
// COVE-3's contribution is kept as an option: phase-2 distance entries are compiled into signatures carrying the
// distance and two 10-bit masks (moves that lower it / don't raise it), so only children that pass both bounds are
// generated, while the skipped ones are still charged to the visit budgets — same moves, same counts, less work.
import {CubeN, MULTIPLY, cubeModel, rankPermutation, unrankPermutation} from "./cubeN";



export const FACES = "URFDLB";	// opposite face = (face + 3) % 6
// move index = face * 3 + q, q: 0 clockwise, 1 half, 2 counter-clockwise
export const MOVE_NAMES = Array(18).fill(null).map((_, m) => FACES[Math.floor(m / 3)] + ["", "2", "'"][m % 3]);
const PHASE2_MOVES = [0, 1, 2, 4, 7, 9, 10, 11, 13, 16];	// U U2 U' R2 F2 D D2 D' L2 B2


export const moveTwist = (move: number) => cubeModel(3).faceTwist(FACES[Math.floor(move / 3)], {prime: move % 3 === 2, double: move % 3 === 1});

export const stringifyMoves = (moves: number[]): string => moves.map(m => MOVE_NAMES[m]).join(" ");


interface Cubies {
	cp: number[];	// corner piece in each corner slot
	co: number[];	// its twist there
	ep: number[];	// edge piece in each edge slot: 8 U/D edges first, then the 4 E-slice edges
	eo: number[];	// its flip there
}


const model = cubeModel(3);
const orbitOfKind = (kind: string, stickers: number) => model.orbits.find(orbit => orbit.kind === kind && model.stickers[orbit.pieces[0]].length === stickers);
const CORNER_SLOTS = orbitOfKind("corner", 3).pieces;
const EDGE_SLOTS = [...orbitOfKind("edge", 2).pieces].sort((a, b) => Number(model.homes[a][1] === 0) - Number(model.homes[b][1] === 0));
const CENTER_SLOTS = orbitOfKind("center", 1).pieces;
const cornerIndex = new Map(CORNER_SLOTS.map((slot, i) => [slot, i]));
const edgeIndex = new Map(EDGE_SLOTS.map((slot, i) => [slot, i]));


export const toCubies = (cube: CubeN): Cubies => {
	const occupants = cube.occupants;
	return {
		cp: CORNER_SLOTS.map(slot => cornerIndex.get(occupants[slot])),
		co: CORNER_SLOTS.map(slot => cube.orientationAt(slot)),
		ep: EDGE_SLOTS.map(slot => edgeIndex.get(occupants[slot])),
		eo: EDGE_SLOTS.map(slot => cube.orientationAt(slot)),
	};
};


// The CubeN state of cubies (centres in place, unspun): per piece, the rotation putting it in its slot with that orientation.
export const fromCubies = ({cp, co, ep, eo}: Cubies): CubeN => {
	const cube = new CubeN(3);
	const place = (slots: number[], perm: number[], ori: number[]) => slots.forEach((slot, k) => {
		const piece = slots[perm[k]];
		const unit = Array.from({length: 24}, (_, u) => u).find(u => {
			if (model.position[piece * 24 + u] !== slot)
				return false;
			cube.units[piece] = u;
			return cube.orientationAt(slot, piece) === ori[k];
		});
		console.assert(unit !== undefined, "no rotation for", piece, slot, ori[k]);
	});
	place(CORNER_SLOTS, cp, co);
	place(EDGE_SLOTS, ep, eo);

	return cube;
};


// A uniformly random legal 3×3 state (centres home). `random` returns [0, 1).
export const randomCube = (random: () => number = Math.random): CubeN => {
	const shuffle = (n: number): number[] => {
		const a = Array(n).fill(0).map((_, i) => i);
		for (let i = n - 1; i > 0; --i) {
			const j = Math.floor(random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	};
	const parity = (p: number[]): number => p.reduce((acc, x, i) => acc ^ p.slice(i + 1).filter(y => y < x).length % 2, 0);
	const orientations = (n: number, base: number): number[] => {
		const a = Array(n - 1).fill(0).map(() => Math.floor(random() * base));
		return [...a, (base - a.reduce((sum, x) => sum + x, 0) % base) % base];
	};

	const cp = shuffle(8);
	let ep = shuffle(12);
	if (parity(ep) !== parity(cp))
		ep = [ep[1], ep[0], ...ep.slice(2)];

	return fromCubies({cp, co: orientations(8, 3), ep, eo: orientations(12, 2)});
};


// Applying move m to s: what was in slot m.cp[j] comes to slot j, with m.co[j] more twist.
const MOVES: Cubies[] = Array(18).fill(null).map((_, m) => toCubies(new CubeN(3, {twists: [moveTwist(m)]})));

export const turnCubies = (s: Cubies, move: number): Cubies => {
	const m = MOVES[move];
	return {
		cp: m.cp.map(i => s.cp[i]), co: m.cp.map((i, j) => (s.co[i] + m.co[j]) % 3),
		ep: m.ep.map(i => s.ep[i]), eo: m.ep.map((i, j) => (s.eo[i] + m.eo[j]) % 2),
	};
};


// coordinates
const orientationCoordinate = (a: number[], base: number): number => {
	let value = 0;
	for (let i = 0; i < a.length - 1; ++i)
		value = value * base + a[i];
	return value;
};

const orientationFromCoordinate = (value: number, n: number, base: number): number[] => {
	const a = Array(n).fill(0);
	let sum = 0;
	for (let i = n - 2; i >= 0; --i) {
		a[i] = value % base;
		sum += a[i];
		value = Math.floor(value / base);
	}
	a[n - 1] = (base - sum % base) % base;
	return a;
};

// 4-subsets of the 12 edge slots holding the E-slice edges (pieces 8..11)
const SLICE_MASKS: number[] = [];
const SLICE_INDEX = new Int16Array(4096).fill(-1);
for (let mask = 0; mask < 4096; ++mask) {
	let bits = 0;
	for (let x = mask; x; x &= x - 1)
		++bits;
	if (bits === 4) {
		SLICE_INDEX[mask] = SLICE_MASKS.length;
		SLICE_MASKS.push(mask);
	}
}
const sliceCoordinate = (ep: number[]): number => SLICE_INDEX[ep.reduce((mask, piece, slot) => piece >= 8 ? mask | (1 << slot) : mask, 0)];
const SLICE_GOAL = SLICE_INDEX[0xf00];


export interface Tables {
	co: Uint16Array; eo: Uint16Array; sl: Uint16Array;		// [coordinate * 18 + move]
	cp: Uint16Array; ep: Uint16Array; sp: Uint16Array;		// [coordinate * 10 + phase-2 move]
	coSl: Uint8Array; eoSl: Uint8Array;				// [co * 495 + slice], [eo * 495 + slice]
	// phase-2 distances [cp * 24 + sp], [ep * 24 + sp]: plain bytes, or (compiled) signature ids into a dictionary
	cpSp?: Uint8Array; epSp?: Uint8Array;
	cpSignatures?: {ids: Uint16Array; dictionary: Uint32Array};
	epSignatures?: {ids: Uint16Array; dictionary: Uint32Array};
	buildMs: number;
	bytes: number;
}


// Breadth-first distances over a pair of coordinates moved together.
const pairDistances = (a: Uint16Array, aSize: number, b: Uint16Array, bSize: number, width: number, goalA: number, goalB: number): Uint8Array => {
	const distances = new Uint8Array(aSize * bSize).fill(255);
	const queue = new Uint32Array(distances.length);
	const start = goalA * bSize + goalB;
	queue[0] = start;
	distances[start] = 0;
	let tail = 1;
	for (let head = 0; head < tail; ++head) {
		const key = queue[head], ab = Math.floor(key / bSize) * width, bb = (key % bSize) * width, depth = distances[key] + 1;
		for (let m = 0; m < width; ++m) {
			const next = a[ab + m] * bSize + b[bb + m];
			if (distances[next] === 255) {
				distances[next] = depth;
				queue[tail++] = next;
			}
		}
	}
	console.assert(tail === distances.length, "unreachable entries in a distance table");

	return distances;
};


// Per entry: distance d, moves that lower it, moves that don't raise it, as d << 20 | nonIncreasing << 10 | down,
// deduplicated into a dictionary (a 10-move unit-cost table changes by at most 1 per move).
const compileSignatures = (a: Uint16Array, b: Uint16Array, bSize: number, distances: Uint8Array) => {
	const ids = new Uint16Array(distances.length);
	const dictionary: number[] = [];
	const index = new Map<number, number>();
	let steep = false;
	for (let key = 0; key < distances.length; ++key) {
		const d = distances[key], ab = Math.floor(key / bSize) * 10, bb = (key % bSize) * 10;
		let down = 0, nonIncreasing = 0;
		for (let m = 0; m < 10; ++m) {
			const next = distances[a[ab + m] * bSize + b[bb + m]];
			steep = steep || next > d + 1 || next < d - 1;
			if (next < d)
				down |= 1 << m;
			if (next <= d)
				nonIncreasing |= 1 << m;
		}
		const signature = ((d << 20) | (nonIncreasing << 10) | down) >>> 0;
		let id = index.get(signature);
		if (id === undefined) {
			id = dictionary.length;
			index.set(signature, id);
			dictionary.push(signature);
		}
		ids[key] = id;
	}
	console.assert(!steep, "distance table step > 1");
	console.assert(dictionary.length <= 65536, "signature dictionary overflow");

	return {ids, dictionary: Uint32Array.from(dictionary)};
};


export const buildTables = ({compile = true} = {}): Tables => {
	const started = performance.now();
	const solved = toCubies(new CubeN(3));

	const co = new Uint16Array(2187 * 18), eo = new Uint16Array(2048 * 18), sl = new Uint16Array(495 * 18);
	for (let i = 0; i < 2187; ++i) {
		const s = {...solved, co: orientationFromCoordinate(i, 8, 3)};
		for (let m = 0; m < 18; ++m)
			co[i * 18 + m] = orientationCoordinate(turnCubies(s, m).co, 3);
	}
	for (let i = 0; i < 2048; ++i) {
		const s = {...solved, eo: orientationFromCoordinate(i, 12, 2)};
		for (let m = 0; m < 18; ++m)
			eo[i * 18 + m] = orientationCoordinate(turnCubies(s, m).eo, 2);
	}
	for (let i = 0; i < 495; ++i) {
		// any edges with the slice pieces where the mask says
		let next = 0, slice = 8;
		const ep = Array(12).fill(0).map((_, slot) => SLICE_MASKS[i] & (1 << slot) ? slice++ : next++);
		for (let m = 0; m < 18; ++m)
			sl[i * 18 + m] = sliceCoordinate(turnCubies({...solved, ep}, m).ep);
	}

	const cp = new Uint16Array(40320 * 10), ep = new Uint16Array(40320 * 10), sp = new Uint16Array(24 * 10);
	for (let i = 0; i < 40320; ++i) {
		const p = unrankPermutation(i, 8);
		const sc = {...solved, cp: p}, se = {...solved, ep: [...p, 8, 9, 10, 11]};
		PHASE2_MOVES.forEach((m, j) => {
			cp[i * 10 + j] = rankPermutation(turnCubies(sc, m).cp);
			ep[i * 10 + j] = rankPermutation(turnCubies(se, m).ep.slice(0, 8));
		});
	}
	for (let i = 0; i < 24; ++i) {
		const s = {...solved, ep: [0, 1, 2, 3, 4, 5, 6, 7, ...unrankPermutation(i, 4).map(x => x + 8)]};
		PHASE2_MOVES.forEach((m, j) => sp[i * 10 + j] = rankPermutation(turnCubies(s, m).ep.slice(8).map(x => x - 8)));
	}

	const coSl = pairDistances(co, 2187, sl, 495, 18, 0, SLICE_GOAL);
	const eoSl = pairDistances(eo, 2048, sl, 495, 18, 0, SLICE_GOAL);
	const cpSp = pairDistances(cp, 40320, sp, 24, 10, 0, 0);
	const epSp = pairDistances(ep, 40320, sp, 24, 10, 0, 0);

	const tables: Tables = {co, eo, sl, cp, ep, sp, coSl, eoSl, buildMs: 0, bytes: 0};
	// compiled signatures replace the phase-2 distance bytes (the distance is their top bits)
	if (compile) {
		tables.cpSignatures = compileSignatures(cp, sp, 24, cpSp);
		tables.epSignatures = compileSignatures(ep, sp, 24, epSp);
	}
	else
		Object.assign(tables, {cpSp, epSp});

	tables.bytes = [co, eo, sl, cp, ep, sp, coSl, eoSl, tables.cpSp, tables.epSp].reduce((n, t) => n + (t ? t.byteLength : 0), 0)
		+ (compile ? [tables.cpSignatures, tables.epSignatures].reduce((n, s) => n + s.ids.byteLength + s.dictionary.byteLength, 0) : 0);
	tables.buildMs = performance.now() - started;

	return tables;
};


// No two turns of one face in a row, and opposite faces only in one order (they commute).
const allowed = (face: number, last: number): boolean => face !== last && !(last >= 0 && (face + 3) % 6 === last && face < last);

const popcount = (v: number): number => {
	v -= (v >>> 1) & 0x55555555;
	v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
	return (((v + (v >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
};

// allowed phase-2 moves after the last face (index last + 1, -1 = none) as a 10-bit mask
const ALLOWED2 = Array(7).fill(0).map((_, i) => PHASE2_MOVES.reduce((mask, m, j) => allowed(Math.floor(m / 3), i - 1) ? mask | (1 << j) : mask, 0));

const PHASE1_DEPTH = 12, PHASE2_DEPTH = 18, ENDPOINT_BUDGET = 250000;


export interface SolveOptions {
	expansion?: "contour" | "scalar";	// contour needs compiled tables
	maxNodes?: number;
	timeoutMs?: number;
}

export interface Solution {
	moves: number[];
	split: number;		// phase-1 length
	nodes: number;		// logical visits (identical for both expansions)
	generated: number;	// visits actually made
	skipped: number;	// visits charged without being made (contour)
	elapsedMs: number;
}


// Turn the whole cube so the centres are home (inner-layer twists move them): every piece times one rotation.
const withCentresHome = (cube: CubeN): CubeN => {
	for (let r = 0; r < 24; ++r) {
		const candidate = cube.clone();
		candidate.units = candidate.units.map(unit => MULTIPLY[unit * 24 + r]);
		const occupants = candidate.occupants;
		if (CENTER_SLOTS.every(slot => occupants[slot] === slot))
			return candidate;
	}

	return null;
};


export const solve = (tables: Tables, cube: CubeN, options: SolveOptions = {}): Solution => {
	const started = performance.now();
	const expansion = options.expansion || (tables.cpSignatures ? "contour" : "scalar");
	console.assert(expansion === "scalar" || tables.cpSignatures, "contour expansion needs compiled tables");
	const maxNodes = options.maxNodes ?? 20000000;
	const deadline = started + (options.timeoutMs ?? 30000);

	const home = withCentresHome(cube);
	if (!home)
		throw new Error("Centres cannot be brought home.");
	const start = toCubies(home);

	const {co, eo, sl, cp, ep, sp, coSl, eoSl, cpSp, epSp} = tables;
	const path: number[] = [], path2: number[] = [];
	let nodes = 0, generated = 0, skipped = 0, endpointNodes = 0;
	let result: number[] = null, split = 0;

	const budget = () => {
		if (nodes > maxNodes)
			throw new Error("Search node budget reached.");
		if ((nodes & 2047) === 0 && performance.now() > deadline)
			throw new Error("Search time budget reached.");
	};
	const visit = () => {
		++nodes;
		++generated;
		budget();
	};

	const cpIds = tables.cpSignatures?.ids, cpDictionary = tables.cpSignatures?.dictionary;
	const epIds = tables.epSignatures?.ids, epDictionary = tables.epSignatures?.dictionary;
	const h2 = cpSp
		? (c: number, e: number, s: number): number => Math.max(cpSp[c * 24 + s], epSp[e * 24 + s])
		: (c: number, e: number, s: number): number => Math.max(cpDictionary[cpIds[c * 24 + s]] >>> 20, epDictionary[epIds[e * 24 + s]] >>> 20);

	const dfs2Scalar = (c: number, e: number, s: number, left: number, last: number): boolean => {
		visit();
		if (++endpointNodes > ENDPOINT_BUDGET)
			return false;
		if (h2(c, e, s) > left)
			return false;
		if (!left)
			return c === 0 && e === 0 && s === 0;
		for (let j = 0; j < 10; ++j) {
			const m = PHASE2_MOVES[j], face = Math.floor(m / 3);
			if (!allowed(face, last))
				continue;
			path2.push(m);
			if (dfs2Scalar(cp[c * 10 + j], ep[e * 10 + j], sp[s * 10 + j], left - 1, face))
				return true;
			path2.pop();
			if (endpointNodes > ENDPOINT_BUDGET)
				return false;
		}
		return false;
	};

	// charge `count` children the scalar search would visit and reject at once, stopping where it would stop
	const charge = (count: number) => {
		count = Math.min(count, ENDPOINT_BUDGET + 1 - endpointNodes);
		while (count > 0) {
			const step = Math.min(count, 2048 - (nodes & 2047), maxNodes + 1 - nodes);
			nodes += step;
			skipped += step;
			endpointNodes += step;
			count -= step;
			budget();
		}
	};

	// children within the bound at `left`: slack ≥ 2 any move, 1 non-increasing, 0 decreasing
	const contourMask = (signature: number, left: number): number => {
		const slack = left - (signature >>> 20);
		return slack >= 2 ? 1023 : slack === 1 ? (signature >>> 10) & 1023 : signature & 1023;
	};

	const dfs2Contour = (c: number, e: number, s: number, left: number, last: number): boolean => {
		visit();
		if (++endpointNodes > ENDPOINT_BUDGET)
			return false;
		const corner = cpDictionary[cpIds[c * 24 + s]], edge = epDictionary[epIds[e * 24 + s]];
		if ((corner >>> 20) > left || (edge >>> 20) > left)
			return false;
		if (!left)
			return c === 0 && e === 0 && s === 0;
		let uncharged = ALLOWED2[last + 1];
		let candidates = uncharged & contourMask(corner, left) & contourMask(edge, left);
		while (candidates) {
			const bit = candidates & -candidates, rejected = uncharged & (bit - 1);
			charge(popcount(rejected));
			if (endpointNodes > ENDPOINT_BUDGET)
				return false;
			uncharged &= ~(rejected | bit);
			candidates &= candidates - 1;
			const j = 31 - Math.clz32(bit), m = PHASE2_MOVES[j];
			path2.push(m);
			if (dfs2Contour(cp[c * 10 + j], ep[e * 10 + j], sp[s * 10 + j], left - 1, Math.floor(m / 3)))
				return true;
			path2.pop();
			if (endpointNodes > ENDPOINT_BUDGET)
				return false;
		}
		charge(popcount(uncharged));
		return false;
	};

	const dfs2 = expansion === "contour" ? dfs2Contour : dfs2Scalar;

	const phase2 = (): boolean => {
		let state = start;
		for (const m of path)
			state = turnCubies(state, m);
		const c = rankPermutation(state.cp), e = rankPermutation(state.ep.slice(0, 8)), s = rankPermutation(state.ep.slice(8).map(x => x - 8));
		endpointNodes = 0;
		for (let depth = h2(c, e, s); depth <= PHASE2_DEPTH; ++depth) {
			path2.length = 0;
			// the last phase-1 face also constrains the first phase-2 move
			if (dfs2(c, e, s, depth, path.length ? Math.floor(path[path.length - 1] / 3) : -1)) {
				result = [...path, ...path2];
				split = path.length;
				return true;
			}
			if (endpointNodes > ENDPOINT_BUDGET)
				break;
		}
		return false;
	};

	const h1 = (c: number, e: number, s: number): number => Math.max(coSl[c * 495 + s], eoSl[e * 495 + s]);

	const dfs1 = (c: number, e: number, s: number, left: number, last: number): boolean => {
		visit();
		if (h1(c, e, s) > left)
			return false;
		if (!left)
			return c === 0 && e === 0 && s === SLICE_GOAL && phase2();
		for (let m = 0; m < 18; ++m) {
			const face = Math.floor(m / 3);
			if (!allowed(face, last))
				continue;
			path.push(m);
			if (dfs1(co[c * 18 + m], eo[e * 18 + m], sl[s * 18 + m], left - 1, face))
				return true;
			path.pop();
		}
		return false;
	};

	const c0 = orientationCoordinate(start.co, 3), e0 = orientationCoordinate(start.eo, 2), s0 = sliceCoordinate(start.ep);
	for (let depth = h1(c0, e0, s0); depth <= PHASE1_DEPTH && !result; ++depth)
		dfs1(c0, e0, s0, depth, -1);

	if (!result)
		throw new Error("Bounded search exhausted its candidates.");

	// verify on the full state
	const check = home.clone();
	result.forEach(m => check.twist(moveTwist(m)));
	if (!check.solved)
		throw new Error("Internal solution verification failed.");

	return {moves: result, split, nodes, generated, skipped, elapsedMs: performance.now() - started};
};
