
import {argv} from "yargs";
import * as fs from "fs";

import { Cube3, TWIST_PERMUTATION_48, permutate, invertTwist } from "../inc/cube3";



const isOrigin = cube => cube.units.reduce((sum, unit) => sum + unit, 0) === 0;


const cubeLoop = cube => {
	let length = 1;
	for (let c = cube.clone(); !isOrigin(c); c = c.multiply(cube))
		++length;

	return length;
};


const minHash = cube => {
	const neighborLoops = Array(12).fill(null).map((_, t) => {
		const c = cube.clone();
		c.twist(t);

		return cubeLoop(c);
	});

	const permutatedCodes = TWIST_PERMUTATION_48.map(permutation => permutate(permutation, neighborLoops).map(loop => String.fromCharCode(loop)).join(""));

	return permutatedCodes.reduce((min: {code: string, index: number}, code, index) => (!min || code < min.code) ? {index, code} : min, null)
};


const loopHash = cube => {
	const selfLoop = cubeLoop(cube);
	const min = minHash(cube);

	return String.fromCharCode(selfLoop) + min.code;
};


const loadHashes = depth => {
	if (depth > 0) {
		// TODO:
	}

	const origin = new Cube3();

	return [{state: origin.encode(), hash: loopHash(origin)}];
};


const printHash = hash => hash.split("").map(c => c.charCodeAt(0).toString()).join(",");


const deriveLoopHash = depth => {
	const parentHashes = loadHashes(depth - 1);
	//console.log("parentHashes:", parentHashes);

	const table = {};

	parentHashes.forEach(parentHash => {
		Array(12).fill(null).forEach((_, t) => {
			const cube = new Cube3({code: parentHash.state, path: [t]});

			const selfLoop = cubeLoop(cube);
			const min = minHash(cube);

			const hash = String.fromCharCode(selfLoop) + min.code;

			const recovery = invertTwist(t);
			const twist = TWIST_PERMUTATION_48[min.index].indexOf(recovery);
			const state = cube.encode();

			if (table[hash])
				console.assert(table[hash].twist === twist, "inconsistent hash twist:", table[hash], state);
			else {
				table[hash] = {
					state,
					twist,
				};

				console.log("hash:", printHash(hash), state, twist);
			}
		});
	});
};


deriveLoopHash(argv.depth || 1);



console.log("Finished.");
