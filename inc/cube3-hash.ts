
import { Cube3, TWIST_PERMUTATION_48, permutate } from "../inc/cube3";
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


const loadHashes = (depth: number, iterator) => {
	if (hashLibrary[depth]) {
		console.warn("hash depth load duplicated:", depth);

		return;
	}

	hashLibrary[depth] = [];

	for (const line of iterator) {
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


const solveCube = cube => {
	if (cube.isZero())
		return [];

	const {hash, index} = hashCube(cube);

	if (!hashIndices[hash])
		return null;

	const twist = TWIST_PERMUTATION_48[index][hashIndices[hash].twist];

	return [twist, ...solveCube(cube.twist(twist))];
};


const solveState = state => solveCube(new Cube3({code: state}));



export {
	hashLibrary,
	hashIndices,
	hashCube,
	printHash,
	parseHash,
	loadHashes,
	solveState,
};
