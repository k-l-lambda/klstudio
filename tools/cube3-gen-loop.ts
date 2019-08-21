
import {argv} from "yargs";
import * as fs from "fs";

import {invertTwist, Cube3} from "../inc/cube3";



const DEPTH = argv.depth || 3;

const tableContent = fs.readFileSync("./static/data/cube3-table-6.json");
const table: { [key: string] : string; } = JSON.parse(tableContent.toString());
//const states = Object.entries(table).filter(([state, path]) => path.length <= DEPTH).map(([state, path]) => state);
const states = Object.keys(table);

console.log("table-6 loaded.");


const isOrigin = cube => cube.units.reduce((sum, unit) => sum + unit, 0) === 0;


const cubeLoop = cube => {
	let length = 1;
	for (let c = cube.clone(); !isOrigin(c); c = c.multiply(cube))
		++length;

	return length;
};


const loopTable: { [key: string] : number; } = {};
//const loopSet = new Set();

for (let state of states) {
	if (table[state].length > DEPTH)
		break;
	//console.log("state:", state, table[state]);

	const loop = cubeLoop(new Cube3({code: state}));
	loopTable[table[state]] = loop
	//console.log(table[state], loop);

	//loopSet.add(loop);
}

//console.log("loopSet:", loopSet);
console.log("loopTable finished.");


const loopStatistics = loopTable => {
	const loopEntries = Object.entries(loopTable);

	/*const loops = Array.from(new Set(Object.values(loopTable)));

	return loops.reduce((stats, loop: number) => {
		stats[loop] = loopEntries.filter(([path, l]) => l === loop).reduce((t, [path,]) => {
			t[path.length] = t[path.length] || 0;
			++t[path.length];

			return t;
		}, {});

		return stats;
	}, {});*/
	return loopEntries.reduce((stats, [path, loop]) => {
		const pathLen = path.length;

		stats[pathLen] = stats[pathLen] || {};
		stats[pathLen][loop] = stats[pathLen][loop] || 0;
		++stats[pathLen][loop];

		return stats;
	}, {});
};

const loopStats = loopStatistics(loopTable);


fs.writeFile("./static/cube-loop.json", JSON.stringify(loopTable), error => console.log("output file write finished:", error));
fs.writeFile("./static/cube-loop-stats.json", JSON.stringify(loopStats), error => console.log("output file write finished:", error));



console.log("Finished.");
