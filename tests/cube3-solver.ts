
import * as fs from "fs";

import * as cube3 from "../inc/cube3";
import {QUARTER_DISTANCES} from "../inc/cube-algebra";



const decodePath = path => path.split("").map(char => parseInt(char, 18));


const seperatedDistance = state => state.map(orientation => QUARTER_DISTANCES[orientation]).reduce((sum, distance) => sum + distance, 0);

const speciesDistance = state => new Set(state).size;

const mergeDistance = state => Array.from(new Set(state)).map((orientation: number) => QUARTER_DISTANCES[orientation]).reduce((sum, distance) => sum + distance, 0);


const tableContent = fs.readFileSync("./static/cube3-table-6.json");
const table = JSON.parse(tableContent.toString());

console.log("table6 read.");


const states = Object.keys(table);
//console.log("states:", states.length);


// table-divide test
for (let i = 0; i < 20; ++i) {
	const path = Array(12).fill(null).map(() => ~~(Math.random() * 12));
	const end = new cube3.Cube3({path});
	let solution: number[] = null;

	for (const code of states) {
		const start = new cube3.Cube3({code});
		const quotient = end.divide(start).encode();

		if (quotient in table) {
			const path = [...decodePath(table[code]), ...decodePath(table[quotient])];
			if (!solution || path.length < solution.length) {
				console.log("better solution found:", `${table[code].length}+${table[quotient].length}`);

				solution = path;

				// this maybe reasonable?
				break;
			}
		}
	}

	if (solution)
		console.log("solution found:", end.encode(), cube3.stringifyPath(solution), cube3.stringifyPath(path));
	else
		console.warn("solution not found:", end.encode(), cube3.stringifyPath(path));

	// show heuristic distance
	const cube = new cube3.Cube3();
	const distances1 = [];
	const distances2 = [];
	const distances3 = [];
	const distances4 = [];
	for (const twist of solution) {
		cube.twist(twist);

		const d1 = seperatedDistance(cube.units);
		const d2 = speciesDistance(cube.units);
		const d3 = d1 * d2;
		const d4 = mergeDistance(cube.units);

		distances1.push(d1);
		distances2.push(d2);
		distances3.push(d3);
		distances4.push(d4);
	}
	//console.log("distances:", distances1, distances3, distances4);
	console.log("distances:", distances1, distances1.map(d => (d / 9).toFixed(1)));		// heuristic function result is less or equal to real value
}
