
import {Cube3} from "../inc/cube3";
import { cubePartitionCode } from "../inc/cube3-partition";
import { cubeLoop } from "../inc/cube3-loop";



const patternSet = new Set();


const traverseCubes = cube => {
	const loop = cubeLoop(cube);
	const partition = cubePartitionCode(cube);

	const code = (loop << 4) + partition;

	if (!patternSet.has(code)) {
		patternSet.add(code);

		console.log("pattern:", cube.encode(), loop, partition);

		for (let t = 0; t < 12; ++t) {
			const child = cube.clone();
			child.twist(t);

			traverseCubes(child);
		}
	}
};


traverseCubes(new Cube3());
