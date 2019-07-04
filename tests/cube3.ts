
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


// multiplication & divide
for (let i = 0; i < 100; ++i) {
	const cube1 = new cube3.Cube3();
	const cube2 = new cube3.Cube3();

	for (let ii = 0; ii < 30; ++ii) {
		cube1.twist(~~(Math.random() * 18));
		cube2.twist(~~(Math.random() * 18));
	}

	console.assert(cube1.validate() && cube2.validate(), "random twists validation failed:", cube1, cube2);

	const production = cube1.multiply(cube2);
	console.assert(production.validate(), "multiplication validation failed:", production);

	const quotient = production.divide(cube1);
	console.assert(quotient.validate(), "divide validation failed:", quotient);

	const code2 = cube2.encode();
	const codeq = quotient.encode();
	//console.log("test:", code2, codeq);
	console.assert(codeq === code2, "multiplication - divide inversibility failed:", code2, codeq);
}


// path inverse
const codeZero = new cube3.Cube3().encode();
for (let i = 0; i < 100; ++i) {
	const cube1 = new cube3.Cube3();
	const cube2 = new cube3.Cube3();

	const path = Array(30).fill(0).map(() => ~~(Math.random() * 18));
	const invertPath = cube3.invertPath(path);

	path.forEach(twist => cube1.twist(twist));
	invertPath.forEach(twist => cube2.twist(twist));

	const production1 = cube1.multiply(cube2);
	const production2 = cube2.multiply(cube1);
	//console.log("production:", production1.encode(), production2.encode(), path, invertPath);

	console.assert(production1.encode() === codeZero && production2.encode() === codeZero, "path inverse failed.");
}


console.log("cube3 test finished.");


setTimeout(x => x, 0x7fffffff);
