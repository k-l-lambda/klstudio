
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

const exp3 = new Orientation([J2, K2]).normalize().toString();
console.assert(exp3 === "i2", "exp3 normalize error:", exp3);

const exp4 = new Orientation([I, J, J, I]).normalize().toString();
console.assert(exp4 === "j2", "exp2 normalize error:", exp4);


// random test
//const ROTATIONS = [I, I_, J, J_, K, K_];
const normalOrientations = new Set();
for (let i = 0; i < 1000; ++i) {
	const items = [];
	for (let ii = 0; ii < 30; ++ii)
		//items.push(ROTATIONS[~~(Math.random() * 6)]);
		items.push(new Item(~~(Math.random() * 3), ~~(Math.random() * 9) - 4));

	const o = new Orientation(items);
	//const originExp = o.toString();

	o.normalize();

	//console.log("o:", originExp, "\t\t\t", o.toString());
	normalOrientations.add(o.toString());
}
//const patterns = Array.from(normalOrientations).sort();
//console.log("patterns:", patterns, patterns.length);
console.assert(normalOrientations.size === 24, "normalOrientations count error:", normalOrientations);


console.log("cube test finished.");


setTimeout(x => x, 0x7fffffff);
