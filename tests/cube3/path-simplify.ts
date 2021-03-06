
import * as fs from "fs";
import * as readline from "readline";

import {stringifyPath} from "../../inc/cube3";
import {simplifyPath, loadHashes} from "../../inc/cube3-hash";



const hashLoader = depth => readline.createInterface({input: fs.createReadStream(`./static/data/cube3-hash-${depth}.txt`)});


async function main () {
	console.log("loading library...");

	for (let depth = 1; depth <= 7; ++depth)
		await loadHashes(depth, hashLoader(depth));


	for (let length = 50; length < 100; length +=10) {
		const results = Array(2).fill(null).map(() => {
			const path = Array(length).fill(null).map(() => ~~(Math.random() * 12));
			const result = simplifyPath(path);

			if (result)
				console.log(`(${path.length})`, stringifyPath(path), "->", `(${result.length})`, stringifyPath(result));

			return result;
		});

		console.log(`[${length}]:`, results.filter(s => s).length);
	}
}


main();
