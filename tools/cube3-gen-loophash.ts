
import {argv} from "yargs";
import * as fs from "fs";
import * as readline from "readline";

import { Cube3, TWIST_PERMUTATION_48, permutate, invertTwist } from "../inc/cube3";



const dataFileName = depth => `./static/data/cube3-loophash-${depth}.txt`;


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


const printHash = hash => hash.split("").map(c => c.charCodeAt(0).toString()).join(",");
const parseHash = source => source.split(",").map(Number).map(c => String.fromCharCode(c)).join("");


const loadHashes = async depth => {
	if (depth > 0) {
		const inputFileName = dataFileName(depth);
		if (!fs.existsSync(inputFileName))
			throw new Error(`input file not exist: ${inputFileName}`);

		const result = [];

		const reader = readline.createInterface({input: fs.createReadStream(inputFileName)});
		reader.on("line", line => {
			const [readableHash, state, twist, recovery] = line.split("\t");
			//console.log("line:", readableHash, state, twist);

			result.push({
				hash: parseHash(readableHash),
				state,
				twist: parseInt(twist, 18),
				recovery: parseInt(recovery, 18),
			});
		});

		await new Promise(resolve => reader.on("close", resolve));

		console.log(result.length, "hashed read.");

		return result;
	}

	const origin = new Cube3();

	return [{state: origin.encode(), hash: loopHash(origin)}];
};


const deriveLoopHash = async depth => {
	console.log("Loading hashes-", depth - 1);

	const parentHashes = await loadHashes(depth - 1);
	//console.log("parentHashes:", parentHashes);

	console.log("Writing hashes-", depth);

	const table = {};

	const output = fs.createWriteStream(dataFileName(depth));

	parentHashes.forEach(parentHash => {
		Array(12).fill(null).forEach((_, t) => {
			if (parentHash.recovery === t)
				return;

			const cube = new Cube3({code: parentHash.state, path: [t]});

			const selfLoop = cubeLoop(cube);
			const min = minHash(cube);

			const hash = String.fromCharCode(selfLoop) + min.code;

			const recovery = invertTwist(t);
			const twist = TWIST_PERMUTATION_48[min.index].indexOf(recovery);
			const state = cube.encode();
			const readableHash = printHash(hash);

			if (table[hash])
				console.assert(table[hash].twist === twist, "inconsistent hash twist:", readableHash, table[hash], state, twist);
			else {
				table[hash] = {
					state,
					twist,
				};

				console.log("hash:", readableHash, state, twist, recovery);

				output.write(`${readableHash}\t${state}\t${twist.toString(18)}\t${recovery.toString(18)}\n`);
			}
		});
	});

	output.end();
};


deriveLoopHash(argv.depth || 1).then(() => console.log("Finished."));
