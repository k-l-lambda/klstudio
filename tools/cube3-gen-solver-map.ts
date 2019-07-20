
import * as fs from "fs";

import {invertTwist} from "../inc/cube3";



const tableContent = fs.readFileSync("./static/cube3-table-6.json");
const table: { [key: string] : string; } = JSON.parse(tableContent.toString());
const entries = Object.entries(table);


const output = fs.createWriteStream("./static/cube3-solver-map.data");

const A = "A".charCodeAt(0);


for (const [code, path] of entries) {
	if (!path)
		continue;

	const units = code.split("").map(c => c.charCodeAt(0) - A);
	const states = [].concat(...units.map(unit => Array(24).fill(null).map((_, i) => unit === i ? 1 : 0)));

	const twist = invertTwist(parseInt(path[path.length - 1], 18));
	const length = path.length;

	output.write(new Uint8Array([...states, length, twist]));
}


console.log("Finished.");
