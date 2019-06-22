
const cube = require("../inc/cube-algebra.js");

Object.assign(global, cube);


const exp1 = new Orientation([I, J_, K2]);
console.assert(exp1.toString() === "ij'k2", "exp1 string format error:", exp1.toString());


const name1 = new Item(0, 5).normalized().toString();
console.assert(name1 === "i", name1);

const name2 = new Item(1, -2).normalized().toString();
console.assert(name2 === "j2", name2);


const exp2 = new Orientation([I, J, K, I, J, K]).normalize().toString();
console.assert(exp2 === "1", "exp2 normalize error:", exp2);


console.log("cube test finished.");


setTimeout(x => x, 0x7fffffff);
