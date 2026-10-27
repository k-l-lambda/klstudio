// Run: npx ts-node --project ./tsconfig.node.json tests/cubeN.ts
import {Cube3} from "../inc/cube3";
import {MULTIPLICATION_TABLE} from "../inc/cube-algebra";
import {CubeN, Twist, MULTIPLY, axisRotation, cubeModel, rankPermutation, unrankPermutation} from "../inc/cubeN";
import {PUZZLES, PuzzleState} from "../app/rubikPuzzles/puzzle";



let failures = 0;
const check = (condition: boolean, ...message: any[]) => {
	console.assert(condition, ...message);
	if (!condition)
		++failures;
};

const lcg = (seed: number) => () => (seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32;
const random = lcg(20261027);

const randomTwist = (order: number): Twist => ({
	axis: Math.floor(random() * 3),
	layers: [Math.floor(random() * order)],
	turns: [1, -1, 2][Math.floor(random() * 3)],
});
const randomTwists = (order: number, count: number): Twist[] => Array(count).fill(null).map(() => randomTwist(order));


// the rotation tables agree with cube-algebra's, so units mean the same thing as in Cube3
check(MULTIPLY.every((c, i) => c === MULTIPLICATION_TABLE[Math.floor(i / 24)][i % 24]), "MULTIPLY = cube-algebra MULTIPLICATION_TABLE");


// order 3 ≡ Cube3, twist by twist
{
	// Cube3 twist t: face t % 6 (L R D U B F) turned by unit floor(t / 2) + 1 — find our {axis, layer, turns} for it
	const cube3Twist = (t: number): Twist => {
		const face = t % 6, axis = Math.floor(face / 2), rotation = Math.floor(t / 2) + 1;
		const turns = [1, -1, 2].find(q => axisRotation(axis, q) === rotation);
		return {axis, layers: [face % 2 ? 2 : 0], turns};
	};
	for (let t = 0; t < 18; ++t)
		check(cube3Twist(t).turns !== undefined, "cube3 twist maps", t);

	for (let trial = 0; trial < 50; ++trial) {
		const reference = new Cube3(), cube = new CubeN(3);
		for (let k = 0; k < 30; ++k) {
			const t = Math.floor(random() * 18);
			reference.twist(t);
			cube.twist(cube3Twist(t));
		}
		check(cube.toCube3Units().every((u, i) => i === 13 || u === reference.units[i]), "cube3 parity", reference.encode());
		check(CubeN.fromCube3(reference).equals(cube), "fromCube3");

		for (let s = 0; s < 48; ++s) {
			const r = reference.clone().transform(s), c = cube.clone().transform(s);
			check(c.toCube3Units().every((u, i) => i === 13 || u === r.units[i]), "transform parity", s);
		}
	}
}


for (const order of [2, 3, 4, 5, 6, 7]) {
	const model = cubeModel(order);
	const count = order ** 3 - (order - 2) ** 3;
	check(model.pieceCount === count, order, "piece count");

	// orbits: 8 corners; odd: 12 middle edges, 6 fixed centres; each wing / inner-centre orbit 24 pieces
	const sizes = model.orbits.map(orbit => `${orbit.kind}${orbit.pieces.length}/${orbit.orientations}`);
	const expected = {
		corner: 1,
		edge: Math.floor((order - 2) / 2) + (order % 2),
		center: Math.max(0, (order - 2) ** 2 - (order % 2)) / 4 + (order % 2),
	};
	for (const kind of ["corner", "edge", "center"])
		check(model.orbits.filter(orbit => orbit.kind === kind).length === expected[kind], order, "orbit count", kind, sizes);
	// a piece reaches 24 / orientations slots
	check(model.orbits.every(orbit => orbit.pieces.length === 24 / orbit.orientations || (orbit.kind === "corner" && orbit.pieces.length === 8)), order, "orbit sizes", sizes);
	check(model.orbits.find(orbit => orbit.kind === "corner").pieces.length === 8, order, "8 corners");

	// group laws
	for (let trial = 0; trial < 20; ++trial) {
		const a = randomTwists(order, 25), b = randomTwists(order, 25);
		const ca = new CubeN(order, {twists: a}), cb = new CubeN(order, {twists: b});
		const cab = new CubeN(order, {twists: [...a, ...b]});
		check(ca.validate() && cab.validate(), order, "valid");
		check(ca.multiply(cb).equals(cab), order, "multiply = concatenation");
		check(cab.divide(ca).equals(cb), order, "divide");
		check(ca.multiply(ca.inverse()).isZero(), order, "inverse");
		check(new CubeN(order, {code: cab.encode()}).equals(cab), order, "encode/decode");

		const undo = ca.clone();
		[...a].reverse().forEach(t => undo.twist({...t, turns: -t.turns}));
		check(undo.isZero(), order, "twists undone");

		// a whole-cube rotation is not zero but is solved
		const whole = new CubeN(order, {twists: [{axis: 1, layers: Array(order).fill(0).map((_, i) => i), turns: 1}]});
		check(!whole.isZero() && whole.solved, order, "whole rotation solved");
	}

	// conjugation by a symmetry is a homomorphism
	for (let s = 0; s < 48; ++s) {
		const a = new CubeN(order, {twists: randomTwists(order, 15)}), b = new CubeN(order, {twists: randomTwists(order, 15)});
		check(a.multiply(b).transform(s).equals(a.clone().transform(s).multiply(b.clone().transform(s))), order, "transform homomorphism", s);
	}

	// facelets: solved faces uniform; a face turn leaves only its own face uniform... at least unsolves
	const solvedFacelets = new CubeN(order).facelets;
	check(solvedFacelets.every((f, i) => f === Math.floor(i / order ** 2)), order, "solved facelets");
	const r = model.faceTwist("R");
	const turned = new CubeN(order, {twists: [r]});
	check(!turned.solved, order, "R unsolves");
	check(new CubeN(order, {twists: [r, r, r, r]}).isZero(), order, "R4");
	// every colour still appears N² times
	const counts = Array(6).fill(0);
	new CubeN(order, {twists: randomTwists(order, 40)}).facelets.forEach(f => ++counts[f]);
	check(counts.every(c => c === order ** 2), order, "colour counts", counts);

	// agrees with the display model of the rubik-puzzles app (column matrices there, row matrices here)
	const kind = PUZZLES.find(k => k.shape === "cube" && k.order === order);
	if (kind) {
		const twists = randomTwists(order, 40);
		const display = new PuzzleState(kind);
		twists.forEach(t => display.twist(t));
		const cube = new CubeN(order, {twists});
		const agree = display.pieces.every((piece, i) => {
			const m = piece.matrix;
			const transposed = [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
			return model.slotAt(piece.home.map(c => c * 2) as [number, number, number]) === i && cube.units[i] === unitOfMatrix(transposed);
		});
		check(agree, order, "display model parity");
		check(display.solved === cube.solved, order, "solved parity");
	}
}


// unit index of a row-major row-vector rotation matrix: the unit that moves the axis points the same way
function unitOfMatrix (m: number[]): number {
	const model = cubeModel(3);
	for (let u = 0; u < 24; ++u) {
		const ok = [[2, 0, 0], [0, 2, 0], [0, 0, 2]].every((e, row) => {
			const p = model.homes[model.position[model.slotAt(e as [number, number, number]) * 24 + u]];
			return [0, 1, 2].every(k => p[k] === 2 * m[row * 3 + k]);
		});
		if (ok)
			return u;
	}

	return -1;
}


// solver view on the 3×3: Kociemba conventions
{
	const model = cubeModel(3);
	const cornerOrbit = model.orbits.findIndex(orbit => orbit.kind === "corner");
	const edgeOrbit = model.orbits.findIndex(orbit => orbit.kind === "edge");
	const centerOrbit = model.orbits.findIndex(orbit => orbit.kind === "center");

	for (const letter of "RLUDFB") {
		const cube = new CubeN(3, {twists: [model.faceTwist(letter)]});
		const corners = cube.cubies(cornerOrbit), edges = cube.cubies(edgeOrbit);
		const twisted = corners.orientation.filter(Boolean).length;
		const flipped = edges.orientation.filter(Boolean).length;
		// U and D keep corner twist; only F and B quarter turns flip edges
		check(twisted === ("UD".includes(letter) ? 0 : 4), letter, "corner twists", corners.orientation);
		check(flipped === ("FB".includes(letter) ? 4 : 0), letter, "edge flips", edges.orientation);
	}

	for (let trial = 0; trial < 200; ++trial) {
		const cube = new CubeN(3, {twists: "RLUDFB".split("").map(() => model.faceTwist("RLUDFB"[Math.floor(random() * 6)], {prime: random() < 0.5})).concat(
			Array(20).fill(null).map(() => model.faceTwist("RLUDFB"[Math.floor(random() * 6)], {double: random() < 0.3})))});
		const corners = cube.cubies(cornerOrbit), edges = cube.cubies(edgeOrbit), centers = cube.cubies(centerOrbit);
		check(corners.orientation.reduce((a, b) => a + b, 0) % 3 === 0, "twist sum");
		check(edges.orientation.reduce((a, b) => a + b, 0) % 2 === 0, "flip sum");
		check(new Set(corners.permutation).size === 8 && new Set(edges.permutation).size === 12, "permutations");
		// permutation parities of corners and edges agree
		const parity = (p: number[]) => p.reduce((acc, x, i) => acc ^ p.slice(i + 1).filter(y => y < x).length % 2, 0);
		check(parity(corners.permutation) === parity(edges.permutation), "parity");
		// face turns leave centres in place; their spin is what a supercube / Mastermorphix also has to solve
		check(centers.permutation.every((p, i) => p === i), "centres fixed");
	}

	// a centre spin: U turns the U centre a quarter
	const spun = new CubeN(3, {twists: [model.faceTwist("U")]});
	const centers = spun.cubies(centerOrbit);
	check(centers.orientation.filter(Boolean).length === 1, "one centre spun", centers.orientation);
}


// ranks
for (let i = 0; i < 40320; i += 997)
	check(rankPermutation(unrankPermutation(i, 8)) === i, "rank round trip", i);
check(rankPermutation([0, 1, 2, 3]) === 0 && rankPermutation([3, 2, 1, 0]) === 23, "rank ends");


// speed
for (const order of [3, 5]) {
	const twists = randomTwists(order, 1000);
	const cube = new CubeN(order);
	const start = process.hrtime.bigint();
	for (let k = 0; k < 200; ++k)
		cube.twists(twists);
	const ns = Number(process.hrtime.bigint() - start) / 200000;
	const a = new CubeN(order, {twists: randomTwists(order, 30)}), b = new CubeN(order, {twists: randomTwists(order, 30)});
	const start2 = process.hrtime.bigint();
	for (let k = 0; k < 100000; ++k)
		a.multiply(b);
	const ns2 = Number(process.hrtime.bigint() - start2) / 100000;
	console.log(`order ${order}: twist ${ns.toFixed(0)} ns, multiply ${ns2.toFixed(0)} ns`);
}


console.log(failures ? `${failures} failures` : "all passed");
process.exit(failures ? 1 : 0);
