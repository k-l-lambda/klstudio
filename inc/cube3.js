
const math = require("mathjs");

const cubeAlgebra = require("./cube-algebra");


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
const points = Array(3 ** 3).fill().map((_, i) => [i % 3 - 1, Math.floor(i / 3) % 3 - 1, Math.floor(i / 9) - 1]);
const pointHashes = points.map(hashPoint);


const pointRotationTable = points.map(point => rotationMatrices.map(matrix => pointHashes.indexOf(hashPoint(math.multiply(point, matrix)._data))));


const pointIndices = [...Array(3 ** 3).keys()];
const axisPointsTable = Array(6).fill().map((_, axis) => pointIndices.filter(index => {
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


class Cube3 {
	constructor () {
		this.units = Array(3 ** 3).fill(0);
	}


	get positions () {
		return this.units.map((unit, index) => pointRotationTable[index][unit]);
	}


	manipulate (manipulation) {
		// select a face according to axis, substitute unit states by rotation.
		const { axis, rotation } = manipulationToAxisRotation(manipulation);

		const movingPoints = axisPointsTable[axis];
		const movingIndices = this.positions
			.map((position, index) => ({ position, index }))
			.filter(({ position }) => movingPoints.includes(position))
			.map(({ index }) => index);

		movingIndices.forEach(index => this.units[index] = cubeAlgebra.MULTIPLICATION_TABLE[this.units[index]][rotation]);
	}
};



module.exports = {
	//pointRotationTable,
	//axisPointsTable,
	manipulationToAxisRotation,
	axisRotationToManipulation,
	axisTimesToManipulation,
	axis,
	Cube3,
};
