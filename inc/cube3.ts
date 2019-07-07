
import * as math from "mathjs";

// @ts-ignore
import * as cubeAlgebra from "./cube-algebra.ts";



enum axis {
	nX,
	pX,
	nY,
	pY,
	nZ,
	pZ,
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
	const positive = axis % 2 > 0;

	return points[index][Math.floor(axis / 2)] === (positive ? 1 : -1);
}));


const twistToAxisRotation = twist => ({
	axis: twist % 6,
	rotation: Math.floor(twist / 2) + 1,
});


const axisRotationToTwist = (axis, rotation) => axis % 2 + (rotation - 1) * 2;


const timesToIndex = times => [1, 3, 2].indexOf((times + 40) % 4);
const axisTimesToTwist = (axis, times) => axis + timesToIndex(times) * 6;


const invertTwist = twist => twist >= 12 ? twist : (twist >= 6 ? twist - 6 : twist + 6);

const invertPath = (path: Array<number>) => [...path].reverse().map(invertTwist);


const TWIST_NAMES = [
	"L'", "R", "D'", "U", "B'", "F",
	"L", "R'", "D", "U'", "B", "F'",
	"L2", "R2", "D2", "U2", "B2", "F2",
];

const stringifyPath = (path: number[]) => path.map(twist => TWIST_NAMES[twist]).join("");
const parsePath = (source: string) => source.match(/\w['2]?/g).map(word => TWIST_NAMES.indexOf(word));


const ENCODE_UNIT_ORDER = [
	0, 2, 6, 8, 18, 20, 24, 26,						// corners
	1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25,		// edges
	4, 10, 12, 14, 16, 22,							// axes
];


const deorder = (keys: ArrayLike<number>, values: ArrayLike<any>) => Array.from(keys).map((k, i) => ({k, i})).sort((x1, x2) => x1.k - x2.k).map(({i}) => values[i]);


const A = "A".charCodeAt(0);


class Cube3 {
	units: Uint8Array;


	constructor ({code, path} : {code?: string, path?: number[]} = {}) {
		this.reset();

		if (code)
			this.decode(code);

		if (path)
			this.twists(path);
	}


	get positions () : Uint8Array {
		return this.units.map((unit, index) => pointRotationTable[index][unit]);
	}


	reset () {
		this.units = new Uint8Array(3 ** 3).fill(0);
	}


	faceIndicesFromAxis(axis: number) : Array<number> {
		const movingPoints = axisPointsTable[axis];

		return Array.from(this.positions)
			.map((position, index) => ({ position, index }))
			.filter(({ position }) => movingPoints.includes(position))
			.map(({ index }) => index);
	}


	twist (twist: number) {
		// select a face according to axis, substitute unit states by rotation.
		const { axis, rotation } = twistToAxisRotation(twist);
		const movingIndices = this.faceIndicesFromAxis(axis);

		movingIndices.forEach(index => this.units[index] = cubeAlgebra.MULTIPLICATION_TABLE[this.units[index]][rotation]);
	}


	twists (path: number[]) {
		path.forEach(twist => this.twist(twist));
	}


	multiply (cube: Cube3) : Cube3 {
		const positions = this.positions;

		const result = new Cube3();
		result.units = this.units.map((state, index) => cubeAlgebra.MULTIPLICATION_TABLE[state][cube.units[positions[index]]]);

		return result;
	}


	divide (cube: Cube3) : Cube3 {
		const result = new Cube3();
		const units = cube.units.map((state, index) => cubeAlgebra.DIVISION_TABLE[state][this.units[index]]);
		result.units = Uint8Array.from(deorder(cube.positions, units));

		return result;
	}


	encode () : string {
		return ENCODE_UNIT_ORDER.map(index => this.units[index]).map(state => String.fromCharCode(A + state)).join("");
	}


	decode (code: string) {
		console.assert(code.length === ENCODE_UNIT_ORDER.length, "invalid code, length required to be", ENCODE_UNIT_ORDER.length, code);

		code.split("").map(c => c.charCodeAt(0) - A).forEach((state, index) => this.units[ENCODE_UNIT_ORDER[index]] = state);
	}


	validate () : boolean {
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
	twistToAxisRotation,
	invertTwist,
	invertPath,
	axisRotationToTwist,
	axisTimesToTwist,
	axis,
	//deorder,
	TWIST_NAMES,
	stringifyPath,
	parsePath,
	Cube3,
};
