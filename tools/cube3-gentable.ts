
import {argv} from "yargs";
import * as fs from "fs";

import * as cube3 from "../inc/cube3";



const DEEP = argv.deep || 3;
const TWISTS_LEN = 12;	// 12 for quarter turn, 18 for half turn


const table: { [key: string] : string; } = {};


const genTable = (deep: number) : void => {
	for (let i = 0; i < TWISTS_LEN ** deep; ++i) {
		const path = Array(deep).fill(null).map((_, t) => Math.floor(i / (TWISTS_LEN ** t)) % TWISTS_LEN).reverse();
		const code = new cube3.Cube3({path}).encode();

		if (!(code in table))
			//table[code] = path.map(twist => cube3.TWIST_NAMES[twist]).join("");
			table[code] = path.map(twist => twist.toString(18)).join("");
	}
};


for (let deep = 0; deep <= DEEP; ++deep) {
	genTable(deep);

	console.log("table size:", deep, Object.keys(table).length);
}


//console.log("result:", table);


if (argv.outputFile) {
	fs.writeFile(argv.outputFile, JSON.stringify(table), error => console.log("output file write finished:", error));
}
