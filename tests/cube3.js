
const cube3 = require("../inc/cube3.js");
//console.log("cube3.pointHashes:", cube3.pointHashes);
console.log("cube3.pointRotationTable:", cube3.pointRotationTable);
console.log("cube3.axisPointsTable:", cube3.axisPointsTable);


const cube = new cube3.Cube3();
console.log("cube initial positions:", cube.positions);

global.cube = cube;
global.cube3 = cube3;


setTimeout(x => x, 0x7fffffff);
