
import * as cube3 from "../inc/cube3";



console.log("cube3.ts running.");


declare let global:any;
global.cube3 = cube3;


//console.log("cube3.pointHashes:", cube3.pointHashes);
//console.log("cube3.pointRotationTable:", cube3.pointRotationTable);
//console.log("cube3.axisPointsTable:", cube3.axisPointsTable);


const cube = new cube3.Cube3();
//console.log("cube initial positions:", cube.positions);
global.cube = cube;


for (let i = 0; i < 18; ++i) {
	const twist = i;

	const c = new cube3.Cube3();
	c.twist(twist);

	const sum = c.positions.reduce((sum, p) => sum + p, 0);
	console.assert(sum === 13 * 27, "unit twist sumcheck failed:", sum.toString(), twist, c.positions, c.units);
}


for (let i = 0; i < 1000; ++i) {
	const twist = Math.floor(Math.random() * 18);
	//console.log("twist:", twist);
	cube.twist(twist);

	const sum = cube.positions.reduce((sum, p) => sum + p, 0);
	console.assert(sum === 13 * 27, "continuous twists sumcheck failed:", sum.toString(), twist, cube.positions, cube.units);
}


console.assert(cube.validate(), "validate failed:", cube);


setTimeout(x => x, 0x7fffffff);
