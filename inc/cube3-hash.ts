
import { Cube3, TWIST_PERMUTATION_48, permutate, quarterfyPath, invertPath, stringifyPath } from "../inc/cube3";
import { cubeLoop } from "../inc/cube3-loop";
import { cubePartitionCode } from "../inc/cube3-partition";



const hashLibrary = [];
const hashIndices = {};


const minCode = cube => {
	const neighborPartitions = Array(12).fill(null).map((_, t) => cubePartitionCode(cube.clone().twist(t)));

	const permutatedCodes = TWIST_PERMUTATION_48.map(permutation => permutate(permutation, neighborPartitions).map(partition => String.fromCharCode(partition)).join(""));

	return permutatedCodes.reduce((min: {code: string, index: number}, code, index) => (!min || code < min.code) ? {index, code} : min, null)
};


const hashCube = cube => {
	const selfLoop = cubeLoop(cube);
	const selfPartition = cubePartitionCode(cube);
	const min = minCode(cube);

	return {
		hash: String.fromCharCode(selfLoop) + String.fromCharCode(selfPartition) + min.code,
		index: min.index,
	};
};


const printHash = (hash: string) => hash.split("").map(c => c.charCodeAt(0).toString()).join(",");
const parseHash = (source: string) => source.split(",").map(Number).map(c => String.fromCharCode(c)).join("");


const loadHashes = async (depth: number, iterator) => {
	if (hashLibrary[depth]) {
		console.warn("hash depth load duplicated:", depth);

		return;
	}

	hashLibrary[depth] = [];

	for await (const line of iterator) {
		if (!line)
			continue;

		const [readableHash, twist, state, parentIndex] = line.split("\t");

		const hash = parseHash(readableHash);

		const item = {
			depth,
			hash,
			state,
			twist: parseInt(twist, 18),
			parentIndex: parseInt(parentIndex),
		};
		hashLibrary[depth].push(item);

		console.assert(!hashIndices[hash], "duplicated hash:", hash, hashIndices[hash], item);
		hashIndices[hash] = item;
	}
};


const solveCube = (cube: Cube3, depth: number = 0) : number[] => {
	if (depth > 26)	// stack overflow protection
		return null;

	if (cube.isZero())
		return [];

	const {hash, index} = hashCube(cube);

	if (!hashIndices[hash])
		return null;

	const twist = TWIST_PERMUTATION_48[index][hashIndices[hash].twist];

	return [twist, ...(solveCube(cube.twist(twist), depth + 1) || [])];
};


const solveCubeBinaryFixed = (cube: Cube3) : number[] => {
	for (const library of hashLibrary) {
		for (const {state, twist, parentIndex} of library) {
			const medium = new Cube3({code: state});
			const quotient = cube.divide(medium);
			const resolution = solveCube(quotient);
			if (resolution)
				return [...resolution, ...solveCube(medium)];
		}
	}

	return null;
};


const solveCubeBinary = (cube: Cube3) : number[] => {
	const unitaryResult = solveCube(cube);
	if (unitaryResult)
		return unitaryResult;

	const transformTable = Array(48).fill(null).map((_, i) => cube.clone().transform(i)).reduce((table, c, i) => (table[c.encode()] = {cube: c, transform: i}, table), {});
	const uniqueTransformed : {cube: Cube3, transform: number}[] = Object.values(transformTable);

	for (const transformed of uniqueTransformed) {
		const result = solveCubeBinaryFixed(transformed.cube);
		if (result)
			return result.map(twist => TWIST_PERMUTATION_48[transformed.transform].indexOf(twist));
	}

	return null;
};


const solveState = (state: string) : number[] => solveCube(new Cube3({code: state}));


const solvePath = (path: number[]) : number[] => solveCube(new Cube3({path}));


const simplifyQuaterPath = (path: number[]) => {
	const solution = solvePath(path);
	if (solution)
		return invertPath(solution);

	for (let sublen = path.length - 1; sublen >= hashLibrary.length; --sublen) {
		const rest = path.length - sublen;

		const solutions = Array(rest).fill(null).map((_, i) => {
			const subpath = path.slice(i, sublen + i);
			const solution = solvePath(subpath);
			if (solution) {
				if (solution.length >= hashLibrary.length)
					console.warn("invalid solution:", stringifyPath(subpath), "->", stringifyPath(solution));

				if (solution.length >= subpath.length)
					return null;

				//console.log("simplified:", stringifyPath(subpath), "->", stringifyPath(invertPath(solution)));

				return [].concat(...path.slice(0, i), invertPath(solution), ...path.slice(i + sublen));
			}

			return null;
		}).filter(solution => solution);

		if (solutions.length) {
			const refinedSolutions = solutions.map(solution => simplifyQuaterPath(solution) || solution);

			return refinedSolutions.reduce((best: number[], solution: number[]) => solution.length < best.length ? solution : best);
		} 
	}

	return null;
};


const simplifyPath = (path: number[]) => simplifyQuaterPath(quarterfyPath(path));



export {
	hashLibrary,
	hashIndices,
	hashCube,
	printHash,
	parseHash,
	loadHashes,
	solveState,
	simplifyPath,
};
