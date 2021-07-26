
import * as math from "mathjs";

import * as cubeAlgebra from "./cube-algebra";



/*enum axis {
	nX,
	pX,
	nY,
	pY,
	nZ,
	pZ,
};*/


type Vector3 = [number, number, number];
type Matrix33 = [Vector3, Vector3, Vector3];


const unitaryMatrices: Matrix33[/*10*/] = [
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
];//.map(a => math.matrix(a));

const mirrorMatrix: Matrix33 = [
	[-1, 0, 0],
	[0, -1, 0],
	[0, 0, -1],
];


const unitaryItems = [
	1,
	cubeAlgebra.I, cubeAlgebra.J, cubeAlgebra.K,
	cubeAlgebra.I_, cubeAlgebra.J_, cubeAlgebra.K_,
	cubeAlgebra.I2, cubeAlgebra.J2, cubeAlgebra.K2,
];
const dualRotations: Matrix33[/*14*/] = cubeAlgebra.NORMAL_ORIENTATIONS.slice(10).map(o => o.items).map(
	([i1, i2]) => math.multiply(
		unitaryMatrices[unitaryItems.indexOf(i1)],
		unitaryMatrices[unitaryItems.indexOf(i2)]));


const normalRotationMatrices: Matrix33[/*24*/] = unitaryMatrices.concat(dualRotations);
const mirrorRotationMatrices: Matrix33[/*24*/] = normalRotationMatrices.map(mat => math.multiply(mirrorMatrix, mat));

const rotationMatrices: Matrix33[/*48*/] = normalRotationMatrices.concat(mirrorRotationMatrices);


const hashPoint = (point: Vector3): string => point.map(v => "-0+"[v + 1]).join("");
const points: Vector3[/*27*/] = Array(3 ** 3).fill(null).map((_, i) => [i % 3 - 1, Math.floor(i / 3) % 3 - 1, Math.floor(i / 9) - 1]);
const pointHashes: string[/*27*/] = points.map(hashPoint);


const pointRotationTable: number[/*48*/][/*27*/] = points.map(point => rotationMatrices.map(matrix => pointHashes.indexOf(hashPoint(math.multiply(point, matrix)))));


const pointIndices: number[/*27*/] = [...Array(3 ** 3).keys()];
const axisPointsTable: number[/*9*/][/*6*/] = Array(6).fill(null).map((_, axis) => pointIndices.filter(index => {
	const positive = axis % 2 > 0;

	return points[index][Math.floor(axis / 2)] === (positive ? 1 : -1);
}));


interface AxisRotation
{
	axis: number;
	rotation: number;
};

const twistToAxisRotation = (twist: number): AxisRotation => ({
	axis: twist % 6,
	rotation: Math.floor(twist / 2) + 1,
});


const axisRotationToTwist = (axis: number, rotation: number): number => axis % 2 + (rotation - 1) * 2;


const timesToIndex = (times: number): number => [1, 3, 2].indexOf((times % 4 + 4) % 4);
const axisTimesToTwist = (axis: number, times: number): number => axis + timesToIndex(times) * 6;


const invertTwist = (twist: number): number => twist >= 12 ? twist : (twist >= 6 ? twist - 6 : twist + 6);

const invertPath = (path: Array<number>): number[] => [...path].reverse().map(invertTwist);


const TWIST_NAMES = [
	"L'", "R", "D'", "U", "B'", "F",
	"L", "R'", "D", "U'", "B", "F'",
	"L2", "R2", "D2", "U2", "B2", "F2",
];

const stringifyPath = (path: number[]): string => path.map(twist => TWIST_NAMES[twist]).join("");
const parsePath = (source: string): number[] => source.match(/\w['2]?/g).map(word => TWIST_NAMES.indexOf(word));

const quarterfyPath = (path: number[]): number[] => [].concat(...path.map(t => t >= 12 ? [t % 6, t % 6] : [t]));


const ENCODE_UNIT_ORDER = [
	0, 2, 6, 8, 18, 20, 24, 26,						// corners
	1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25,		// edges
	4, 10, 12, 14, 16, 22,							// axes
];


const permutate = <T>(indices: Array<number>, values: ArrayLike<T>): Array<T> => indices.map(index => values[index]);
const depermutate = <T>(keys: ArrayLike<number>, values: ArrayLike<T>): Array<T> => Array.from(keys).map((k, i) => ({k, i})).sort((x1, x2) => x1.k - x2.k).map(({i}) => values[i]);



const A = "A".charCodeAt(0);


class Cube3 {
	units: Uint8Array;	// [27]


	constructor ({code, path} : {code?: string, path?: number[]} = {}) {
		this.reset();

		if (code)
			this.decode(code);

		if (path)
			this.twists(path);
	}


	get positions (): Uint8Array {
		return this.units.map((unit, index) => pointRotationTable[index][unit]);
	}


	reset () {
		this.units = new Uint8Array(3 ** 3).fill(0);
	}


	clone (): Cube3 {
		const cube = new Cube3();
		cube.units = new Uint8Array(this.units);

		return cube;
	}

	
	isZero (): boolean {
		for (const unit of this.units) {
			if (unit)
				return false;
		}

		return true;
	}


	faceIndicesFromAxis (axis: number): Array<number> {
		const movingPoints = axisPointsTable[axis];

		return Array.from(this.positions)
			.map((position, index) => ({position, index}))
			.filter(({position}) => movingPoints.includes(position))
			.map(({index}) => index);
	}


	twist (twist: number): this {
		// select a face according to axis, substitute unit states by rotation.
		const {axis, rotation} = twistToAxisRotation(twist);
		const movingIndices = this.faceIndicesFromAxis(axis);

		movingIndices.forEach(index => this.units[index] = cubeAlgebra.MULTIPLICATION_TABLE[this.units[index]][rotation]);

		return this;
	}


	twists (path: number[]): this {
		path.forEach(twist => this.twist(twist));

		return this;
	}


	multiply (cube: Cube3): Cube3 {
		const positions = this.positions;

		const result = new Cube3();
		result.units = this.units.map((state, index) => cubeAlgebra.MULTIPLICATION_TABLE[state][cube.units[positions[index]]]);

		return result;
	}


	divide (cube: Cube3): Cube3 {
		const result = new Cube3();
		const units = cube.units.map((state, index) => cubeAlgebra.DIVISION_TABLE[state][this.units[index]]);
		result.units = Uint8Array.from(depermutate(cube.positions, units));

		return result;
	}


	transform (transformation: number): this {
		const permutation = this.units.map((unit, index) => pointRotationTable[index][transformation]);

		const rotation = transformation % 24;

		this.units = new Uint8Array(depermutate(permutation, this.units)
			.map(unit => cubeAlgebra.DIVISION_TABLE
				[rotation][
					cubeAlgebra.MULTIPLICATION_TABLE
						[unit][rotation]
				],
			));

		return this;
	}


	encode () : string {
		return ENCODE_UNIT_ORDER.map(index => this.units[index]).map(state => String.fromCharCode(A + state)).join("");
	}


	decode (code: string) {
		console.assert(code.length === ENCODE_UNIT_ORDER.length, "invalid code, length required to be", ENCODE_UNIT_ORDER.length, code);

		code.split("").map(c => c.charCodeAt(0) - A).forEach((state, index) => this.units[ENCODE_UNIT_ORDER[index]] = state);
	}


	validate (): boolean {
		const positions = this.positions;

		for (let i = 0; i < this.units.length; ++i) {
			if (positions.filter(p => p === i).length !== 1)
				return false;
		}

		return true;
	}
};


// twist permutations
const unitTwistPermutation = [
	[0, 1, 11, 10, 2, 3, 6, 7, 5, 4, 8, 9],	// i
	[4, 5, 2, 3, 7, 6, 10, 11, 8, 9, 1, 0],	// j
	[9, 8, 0, 1, 4, 5, 3, 2, 6, 7, 10, 11],	// k
];
//const mirrorTwistPermutation = [6, 7, 8, 9, 10, 11, 0, 1, 2, 3, 4, 5];
const mirrorTwistPermutation = [1, 0, 3, 2, 5, 4, 7, 6, 9, 8, 11, 10];

const identityPermutation = Array(12).fill(null).map((_, i) => i);

const itemToPermutation = ({unit, exponent}) => {
	const unitP = unitTwistPermutation[unit];

	switch (exponent) {
	case 1:
		return unitP;

	case -1:
		return depermutate(unitP, identityPermutation);

	case 2:
		return permutate(unitP, unitP);

	default:
		console.assert(false, "invalid exponent:", exponent);
	}
};
const orientationToPermutation = orientation => orientation.items.reduce(
	(value, item) => depermutate(itemToPermutation(item), value), identityPermutation);

const TWIST_PERMUTATION_24 = cubeAlgebra.NORMAL_ORIENTATIONS.map(orientation => orientationToPermutation(orientation));
const TWIST_PERMUTATION_48 = [
	...TWIST_PERMUTATION_24,
	...TWIST_PERMUTATION_24.map(permutation => permutate(permutation, mirrorTwistPermutation)),
];



export {
	//pointRotationTable,
	//axisPointsTable,
	twistToAxisRotation,
	invertTwist,
	invertPath,
	axisRotationToTwist,
	axisTimesToTwist,
	//axis,
	TWIST_NAMES,
	stringifyPath,
	parsePath,
	quarterfyPath,
	ENCODE_UNIT_ORDER,
	Cube3,
	TWIST_PERMUTATION_48,
	permutate,
	depermutate,
};
