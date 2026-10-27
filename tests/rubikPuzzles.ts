// Run: npx ts-node --project ./tsconfig.node.json tests/rubikPuzzles.ts
import {PUZZLES, PuzzleState, Twist, axisRotation, multiply, IDENTITY, inverseTwist, notationTwist, scramble} from "../app/rubikPuzzles/puzzle";



let failures = 0;
const check = (condition: boolean, ...message: any[]) => {
	console.assert(condition, ...message);
	if (!condition)
		++failures;
};

// deterministic random
const lcg = (seed: number) => () => (seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32;


// rotations: a quarter turn has order 4, and about +Z takes +X to +Y (right-handed)
for (let axis = 0; axis < 3; ++axis) {
	const q = axisRotation(axis, 1);
	check(multiply(multiply(q, q), multiply(q, q)).join() === IDENTITY.join(), "quarter turn order", axis);
	check(multiply(q, axisRotation(axis, -1)).join() === IDENTITY.join(), "inverse", axis);
}
check(axisRotation(2, 1).join() === [0, -1, 0, 1, 0, 0, 0, 0, 1].join(), "z rotation");


for (const kind of PUZZLES) {
	const state = new PuzzleState(kind);
	const n = kind.order;
	const expected = n ** 3 - Math.max(0, n - 2) ** 3;
	check(state.pieces.length === expected, kind.id, "piece count", state.pieces.length, expected);
	check(state.solved, kind.id, "solved at start");

	// every layer of every axis holds n² pieces, minus the hidden interior on inner layers
	for (let axis = 0; axis < 3; ++axis) {
		for (let layer = 0; layer < n; ++layer) {
			const count = state.piecesInTwist({axis, layers: [layer], turns: 0}).length;
			const outer = layer === 0 || layer === n - 1;
			check(count === (outer ? n * n : n * n - (n - 2) ** 2), kind.id, "layer size", axis, layer, count);
		}
	}

	// a face turn unsolves, four of them restore
	const twist = notationTwist(n, "R");
	state.twist(twist);
	check(!state.solved, kind.id, "R unsolves");
	for (let i = 0; i < 3; ++i)
		state.twist(twist);
	check(state.solved, kind.id, "R4 = identity");

	// sexy move has order 6
	const moves = ["R", "U", "R'", "U'"].map(m => notationTwist(n, m[0], {prime: m.length > 1}));
	for (let i = 0; i < 6; ++i)
		moves.forEach(move => state.twist(move));
	check(state.solved, kind.id, "(R U R' U')6 = identity");

	// scramble, then undo it in reverse
	const twists: Twist[] = scramble(kind, lcg(7));
	check(twists.length === kind.scrambleLength, kind.id, "scramble length");
	twists.forEach(t => state.twist(t));
	check(!state.solved, kind.id, "scrambled");
	[...twists].reverse().forEach(t => state.twist(inverseTwist(t)));
	check(state.solved, kind.id, "scramble undone");

	// turning the whole puzzle keeps it solved
	for (let layer = 0; layer < n; ++layer)
		state.twist({axis: 1, layers: [layer], turns: 1});
	check(state.solved, kind.id, "whole-puzzle rotation is solved");
	state.reset();
}


// solved check details
{
	// 3×3: a middle slice half turn moves centres
	const cube3 = new PuzzleState(PUZZLES[1]);
	cube3.twist({axis: 0, layers: [1], turns: 2});
	check(!cube3.solved, "cube3 M2 unsolves");

	// 4×4: the four centres of a face look alike, so two of them trading places is still solved
	const cube4 = new PuzzleState(PUZZLES[2]);
	const at = (x: number, y: number, z: number) => cube4.pieces.find(piece => piece.home.join() === [x, y, z].join());
	at(1.5, 0.5, 0.5).matrix = axisRotation(0, 1);		// (1.5, 0.5, 0.5) -> (1.5, -0.5, 0.5)
	at(1.5, -0.5, 0.5).matrix = axisRotation(0, -1);	// and back
	check(cube4.position(at(1.5, 0.5, 0.5)).join() === [1.5, -0.5, 0.5].join(), "cube4 centre moved");
	check(cube4.solved, "cube4 swapped centres are solved");
	cube4.twist({axis: 0, layers: [1], turns: 2});
	check(!cube4.solved, "cube4 inner slice unsolves");

	// Mastermorphix: centres are edge wedges whose orientation shows, so a centre turned in place is unsolved
	const morphix = new PuzzleState(PUZZLES[3]);
	const centre = morphix.pieces.find(piece => piece.home.join() === [1, 0, 0].join());
	centre.matrix = axisRotation(0, 2);
	check(!morphix.solved, "mastermorphix twisted centre is unsolved");
	const cube3b = new PuzzleState(PUZZLES[1]);
	cube3b.pieces.find(piece => piece.home.join() === [1, 0, 0].join()).matrix = axisRotation(0, 2);
	check(cube3b.solved, "cube3 twisted centre is solved");
}


console.log(failures ? `${failures} failures` : "all passed");
process.exit(failures ? 1 : 0);
