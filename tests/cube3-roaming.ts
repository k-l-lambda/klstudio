
import * as fs from "fs";

import { Cube3 } from "../inc/cube3";
import { cubePartitionCode } from "../inc/cube3-partition";
import { cubeLoop } from "../inc/cube3-loop";



const patternSet = new Set();


const output = fs.createWriteStream("./static/data/cube3-roaming.txt");


const traverseCubes = (cube, depth = 0) => {
	const loop = cubeLoop(cube);
	const partition = cubePartitionCode(cube);

	const code = (loop << 4) + partition;

	if (!patternSet.has(code) && depth < 26) {
		patternSet.add(code);

		console.log("pattern:", depth, cube.encode(), loop, partition);
		output.write(`${depth},${cube.encode()},${loop},${partition}\n`);

		for (let t = 0; t < 12; ++t) {
			const child = cube.clone();
			child.twist(t);

			traverseCubes(child, depth + 1);
		}
	}
};


traverseCubes(new Cube3());


output.end();
