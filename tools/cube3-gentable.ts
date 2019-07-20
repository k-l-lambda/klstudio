
import {argv} from "yargs";
import * as fs from "fs";

import * as cube3 from "../inc/cube3";



const DEPTH = argv.depth || 3;
const TWISTS_LEN = 12;	// 12 for quarter turn, 18 for half turn


const table: { [key: string] : string; } = {};


const genTable = (depth: number) : void => {
	for (let i = 0; i < TWISTS_LEN ** depth; ++i) {
		const path = Array(depth).fill(null).map((_, t) => Math.floor(i / (TWISTS_LEN ** t)) % TWISTS_LEN).reverse();
		const code = new cube3.Cube3({path}).encode();

		if (!(code in table))
			//table[code] = path.map(twist => cube3.TWIST_NAMES[twist]).join("");
			table[code] = path.map(twist => twist.toString(18)).join("");
	}
};


for (let depth = 0; depth <= DEPTH; ++depth) {
	genTable(depth);

	console.log("table size:", depth, Object.keys(table).length);
}


//console.log("result:", table);


if (argv.outputFile) {
	fs.writeFile(argv.outputFile, JSON.stringify(table), error => console.log("output file write finished:", error));
}
