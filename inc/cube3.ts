
const math = require("mathjs");

// @ts-ignore
import * as cubeAlgebra from "./cube-algebra.ts";


const axis = {
	pX: 0,
	pY: 1,
	pZ: 2,
	nX: 3,
	nY: 4,
	nZ: 5,
};


const unitaryMatrices = [
	// 1
	[
		[1, 0, 0],
		[0, 1, 0],
		[0, 0, 1],
	],
	// i
	[
		[1, 0, 0],
		[0, 0, -1],
		[0, 1, 0],
	],
	// j
	[
		[0, 0, 1],
		[0, 1, 0],
		[-1, 0, 0],
	],
	// k
	[
		[0, -1, 0],
		[1, 0, 0],
		[0, 0, 1],
	],
	// i'
	[
		[1, 0, 0],
		[0, 0, 1],
		[0, -1, 0],
	],
	// j'
	[
		[0, 0, -1],
		[0, 1, 0],
		[1, 0, 0],
	],
	// k'
	[
		[0, 1, 0],
		[-1, 0, 0],
		[0, 0, 1],
	],
	// i2
	[
		[1, 0, 0],
		[0, -1, 0],
		[0, 0, -1],
	],
	// j2
	[
		[-1, 0, 0],
		[0, 1, 0],
		[0, 0, -1],
	],
	// k2
	[
		[-1, 0, 0],
		[0, -1, 0],
		[0, 0, 1],
	],
].map(a => math.matrix(a));


const unitaryItems = [
	1,
	cubeAlgebra.I, cubeAlgebra.J, cubeAlgebra.K,
	cubeAlgebra.I_, cubeAlgebra.J_, cubeAlgebra.K_,
	cubeAlgebra.I2, cubeAlgebra.J2, cubeAlgebra.K2,
];
const dualRotations = cubeAlgebra.NORMAL_ORIENTATIONS.slice(10).map(o => o.items).map(
	([i1, i2]) => math.multiply(
		unitaryMatrices[unitaryItems.indexOf(i1)],
		unitaryMatrices[unitaryItems.indexOf(i2)]));


const rotationMatrices = unitaryMatrices.concat(dualRotations);


const hashPoint = point => point.map(v => "-0+"[v + 1]).join("");
const points = Array(3 ** 3).fill(null).map((_, i) => [i % 3 - 1, Math.floor(i / 3) % 3 - 1, Math.floor(i / 9) - 1]);
const pointHashes = points.map(hashPoint);


const pointRotationTable = points.map(point => rotationMatrices.map(matrix => pointHashes.indexOf(hashPoint(math.multiply(point, matrix)._data))));


const pointIndices = [...Array(3 ** 3).keys()];
const axisPointsTable = Array(6).fill(null).map((_, axis) => pointIndices.filter(index => {
	const positive = axis < 3;

	return points[index][axis % 3] === (positive ? 1 : -1);
}));


const manipulationToAxisRotation = manipulation => ({
	axis: Math.floor(manipulation / 3),
	rotation: 3 * (manipulation % 3) + Math.floor(manipulation / 3) % 3 + 1,
});


const axisRotationToManipulation = (axis, rotation) => axis * 3 + Math.floor((rotation - 1) / 3);


const timesToIndex = times => [1, 3, 2].indexOf((times + 40) % 4);
const axisTimesToManipulation = (axis, times) => axis * 3 + timesToIndex(times);


const ENCODE_UNIT_ORDER = [
	0, 2, 6, 8, 18, 20, 24, 26,						// corners
	1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25,		// edges
	10, 12, 14, 16,									// axes
];


const A = "A".charCodeAt(0);


class Cube3 {
	units: Uint8Array;


	constructor (code = null) {
		this.units = new Uint8Array(3 ** 3).fill(0);

		if (code)
			this.decode(code);
	}


	get positions () {
		return this.units.map((unit, index) => pointRotationTable[index][unit]);
	}


	manipulate (manipulation) {
		// select a face according to axis, substitute unit states by rotation.
		const { axis, rotation } = manipulationToAxisRotation(manipulation);

		const movingPoints = axisPointsTable[axis];
		const movingIndices = Array.from(this.positions)
			.map((position, index) => ({ position, index }))
			.filter(({ position }) => movingPoints.includes(position))
			.map(({ index }) => index);

		movingIndices.forEach(index => this.units[index] = cubeAlgebra.MULTIPLICATION_TABLE[this.units[index]][rotation]);
	}


	encode () {
		return ENCODE_UNIT_ORDER.map(index => this.units[index]).map(state => String.fromCharCode(A + state)).join("");
	}


	decode (code) {
		console.assert(code.length === ENCODE_UNIT_ORDER.length, "invalid code, length required to be", ENCODE_UNIT_ORDER.length, code);

		code.split("").map(c => c.charCodeAt(0) - A).forEach((state, index) => this.units[ENCODE_UNIT_ORDER[index]] = state);
	}


	validate () {
		const positions = this.positions;

		for (let i = 0; i < this.units.length; ++i) {
			if (positions.filter(p => p === i).length !== 1)
				return false;
		}

		return true;
	}
};



export {
	//pointRotationTable,
	//axisPointsTable,
	manipulationToAxisRotation,
	axisRotationToManipulation,
	axisTimesToManipulation,
	axis,
	Cube3,
};
