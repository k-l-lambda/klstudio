
import {argv} from "yargs";
import * as fs from "fs";

import { Cube3, TWIST_PERMUTATION_48, permutate } from "../inc/cube3";



const isOrigin = cube => cube.units.reduce((sum, unit) => sum + unit, 0) === 0;


const cubeLoop = cube => {
	let length = 1;
	for (let c = cube.clone(); !isOrigin(c); c = c.multiply(cube))
		++length;

	return length;
};


const loopHash = cube => {
	const selfLoop = cubeLoop(cube);

	const neighborLoops = Array(12).fill(null).map((_, t) => {
		const c = cube.clone();
		c.twist(t);

		return cubeLoop(c);
	});

	const permutatedCodes = TWIST_PERMUTATION_48.map(permutation => permutate(permutation, neighborLoops).map(loop => String.fromCharCode(loop)).join(""));
	const minCode = permutatedCodes.reduce((min: {code: string, index: number}, code, index) => (!min || code < min.code) ? {index, code} : min, null);

	return minCode;
};


const loadHashes = depth => {
	if (depth > 0) {
		// TODO:
	}
	else
		return [loopHash(new Cube3())];
};


const deriveLoopHash = depth => {
	const parentHashes = loadHashes(depth - 1);

};


//deriveLoopHash(argv.depth || 1);
console.log("hash:", loopHash(new Cube3({path: [4]})));



console.log("Finished.");
