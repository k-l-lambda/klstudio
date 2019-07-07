
import * as fs from "fs";

import * as cube3 from "../inc/cube3";



const decodePath = path => path.split("").map(char => parseInt(char, 18));


const tableContent = fs.readFileSync("./static/cube3-table-6.json");
const table = JSON.parse(tableContent.toString());

console.log("table6 read.");


const states = Object.keys(table);
//console.log("states:", states.length);


// divide test
for (let i = 0; i < 20; ++i) {
	const path = Array(13).fill(null).map(() => ~~(Math.random() * 12));
	const end = new cube3.Cube3({path});
	let solution: number[] = null;

	for (const code of states) {
		const start = new cube3.Cube3({code});
		const quotient = end.divide(start).encode();

		if (quotient in table) {
			solution = [...decodePath(table[code]), ...decodePath(table[quotient])];
			break;
		}
	}

	if (solution)
		console.log("solution found:", end.encode(), cube3.stringifyPath(solution), cube3.stringifyPath(path));
	else
		console.warn("solution not found:", end.encode(), cube3.stringifyPath(path));
}
