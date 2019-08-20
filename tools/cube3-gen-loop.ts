
import {argv} from "yargs";
import * as fs from "fs";

import {invertTwist, Cube3} from "../inc/cube3";



const DEPTH = argv.depth || 3;

const tableContent = fs.readFileSync("./static/cube3-table-6.json");
const table: { [key: string] : string; } = JSON.parse(tableContent.toString());
//const states = Object.entries(table).filter(([state, path]) => path.length <= DEPTH).map(([state, path]) => state);
const states = Object.keys(table);


const isOrigin = cube => cube.units.reduce((sum, unit) => sum + unit, 0) === 0;


const cubeLoop = cube => {
	let length = 1;
	for (let c = cube.clone(); !isOrigin(c); c = c.multiply(cube))
		++length;

	return length;
};


const loopTable: { [key: string] : number; } = {};
const loopSet = new Set();

for (let state of states) {
	if (table[state].length > DEPTH)
		break;
	//console.log("state:", state, table[state]);

	const loop = cubeLoop(new Cube3({code: state}));
	loopTable[table[state]] = loop
	//console.log(table[state], loop);

	loopSet.add(loop);
}

console.log("loopSet:", loopSet);

fs.writeFile("./cube-loop.json", JSON.stringify(loopTable), error => console.log("output file write finished:", error));



console.log("Finished.");
