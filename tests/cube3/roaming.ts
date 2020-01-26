
import * as fs from "fs";

import {Cube3, TWIST_PERMUTATION_48, permutate} from "../../inc/cube3";
import {cubePartitionCode} from "../../inc/cube3-partition";
import {cubeLoop} from "../../inc/cube3-loop";



const partitionMap = {};


const getCubePartitionCode = cube => {
	const cubeCode = cube.encode();
	if (!(cubeCode in partitionMap))
		partitionMap[cubeCode] = cubePartitionCode(cube);

	return partitionMap[cubeCode];
};


const minHash = cube => {
	const neighborLoops = Array(12).fill(null).map((_, t) => getCubePartitionCode(cube.clone().twist(t)));

	const permutatedCodes = TWIST_PERMUTATION_48.map(permutation => permutate(permutation, neighborLoops).map(loop => String.fromCharCode(loop)).join(""));

	return permutatedCodes.reduce((min: {code: string, index: number}, code, index) => (!min || code < min.code) ? {index, code} : min, null);
};


const printHash = hash => hash.split("").map(c => c.charCodeAt(0).toString()).join(",");


const patternSet = new Set();


const output = fs.createWriteStream("./static/data/cube3-roaming.txt");

let count = 0;
const MAX = 0x10000000;	// 256M


const traverseCubes = (cube, depth = 0) => {
	if (count >= MAX)
		return;

	const loop = cubeLoop(cube);
	const partition = cubePartitionCode(cube);
	const hash = minHash(cube);

	//const code = (loop << 4) + partition;
	const code = String.fromCharCode(loop) + String.fromCharCode(partition) + hash.code;

	if (!patternSet.has(code) && depth < 21) {
		patternSet.add(code);

		++count;
		if (count % 1000 === 0)
			process.stdout.write(`\r${count}`);

		//console.log("pattern:", depth, cube.encode(), loop, partition);
		output.write(`${depth},${cube.encode()},${loop},${partition},${printHash(hash.code)}\n`);

		if (count >= MAX) {
			process.stdout.write("\nHIT MAX!");
			return;
		}

		for (let t = 0; t < 12; ++t) 
			traverseCubes(cube.clone().twist(t), depth + 1);
		
	}
};


traverseCubes(new Cube3());


console.log("\nFinished:", count);


output.end();
