
import * as fs from "fs";
import * as readline from "readline";

import {Cube3, stringifyPath} from "../../inc/cube3";
import {solveCubeBinary, loadHashes} from "../../inc/cube3-hash";



const hashLoader = depth => readline.createInterface({input: fs.createReadStream(`./static/data/cube3-hash-${depth}.txt`)});


const randomPath = length => Array(length).fill(null).map(() => ~~(Math.random() * 12));


async function main() {
	console.log("loading library...");

	for (let depth = 1; depth <= 7; ++depth)
		await loadHashes(depth, hashLoader(depth));


	for (let i = 0; i < 10; ++i) {
		const path = randomPath(7);
		const cube = new Cube3({path: path});
		const solution = solveCubeBinary(cube);

		console.log("solution:", cube.encode(), stringifyPath(path), stringifyPath(solution));
	}
}


main();
