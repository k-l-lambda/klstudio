// Run: npx ts-node --project ./tsconfig.node.json tests/cove3.ts [count]
import {CubeN} from "../inc/cubeN";
import {MOVE_NAMES, buildTables, fromCubies, moveTwist, randomCube as randomCubeOf, solve, stringifyMoves, toCubies, turnCubies} from "../inc/cove3";



let failures = 0;
const check = (condition: boolean, ...message: any[]) => {
	console.assert(condition, ...message);
	if (!condition)
		++failures;
};

const lcg = (seed: number) => () => (seed = (seed * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32;
const random = lcg(0x913b5e);

const randomCube = () => randomCubeOf(random);

const median = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];


// cubie moves compose exactly like the full state
for (let trial = 0; trial < 200; ++trial) {
	const moves = Array(25).fill(0).map(() => Math.floor(random() * 18));
	const cube = new CubeN(3, {twists: moves.map(moveTwist)});
	const composed = moves.reduce((s, m) => turnCubies(s, m), toCubies(new CubeN(3)));
	check(JSON.stringify(composed) === JSON.stringify(toCubies(cube)), "cubie composition", stringifyMoves(moves));
	check(JSON.stringify(toCubies(fromCubies(composed))) === JSON.stringify(composed), "fromCubies round trip");
}


const scalarTables = buildTables({compile: false});
console.log(`tables (scalar): ${scalarTables.buildMs.toFixed(0)} ms, ${(scalarTables.bytes / 2 ** 20).toFixed(2)} MiB`);
const tables = buildTables();
console.log(`tables (compiled): ${tables.buildMs.toFixed(0)} ms, ${(tables.bytes / 2 ** 20).toFixed(2)} MiB, signatures ${tables.cpSignatures.dictionary.length} + ${tables.epSignatures.dictionary.length}`);


// one random state, solved and timed
{
	const cube = randomCube();
	check(cube.validate(), "random state valid");
	const solution = solve(tables, cube);
	console.log("\nrandom state:", cube.encode());
	console.log(`solution (${solution.moves.length} = ${solution.split} + ${solution.moves.length - solution.split}): ${stringifyMoves(solution.moves)}`);
	console.log(`${solution.elapsedMs.toFixed(2)} ms, ${solution.nodes} logical visits (${solution.generated} made, ${solution.skipped} charged)`);
	const replay = cube.clone().twists(solution.moves.map(moveTwist));
	check(replay.solved, "solution replays to solved");
}


// a scramble with slice moves: centres moved, brought home by a whole-cube turn
{
	const twists = Array(30).fill(0).map(() => ({axis: Math.floor(random() * 3), layers: [Math.floor(random() * 3)], turns: [1, -1, 2][Math.floor(random() * 3)]}));
	const cube = new CubeN(3, {twists});
	const solution = solve(tables, cube);
	check(solution.moves.length <= 30, "slice scramble solved", solution.moves.length);
	console.log(`\nslice scramble: ${solution.moves.length} moves, ${solution.elapsedMs.toFixed(2)} ms`);
}


// scalar and contour expansion: same moves, same logical visits
{
	const count = Number(process.argv[2]) || 30;
	const times = {scalar: [], contour: []}, lengths = [];
	let generated = {scalar: 0, contour: 0};
	for (let i = 0; i < count; ++i) {
		const cube = randomCube();
		const a = solve(scalarTables, cube, {expansion: "scalar"});
		const b = solve(tables, cube, {expansion: "contour"});
		check(a.moves.join() === b.moves.join() && a.nodes === b.nodes, "identical output", i, a.nodes, b.nodes);
		times.scalar.push(a.elapsedMs);
		times.contour.push(b.elapsedMs);
		generated = {scalar: generated.scalar + a.generated, contour: generated.contour + b.generated};
		lengths.push(b.moves.length);
	}
	console.log(`\n${count} random states: mean length ${(lengths.reduce((s, x) => s + x, 0) / count).toFixed(2)}, longest ${Math.max(...lengths)}`);
	console.log(`median ms: scalar ${median(times.scalar).toFixed(2)}, contour ${median(times.contour).toFixed(2)}; visits made: scalar ${generated.scalar}, contour ${generated.contour}`);
}


check(MOVE_NAMES.length === 18, "move names");
console.log(failures ? `\n${failures} failures` : "\nall passed");
process.exit(failures ? 1 : 0);
