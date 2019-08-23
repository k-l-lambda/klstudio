
import {ENCODE_UNIT_ORDER} from "./cube3";



const enumPartitions = (n, m) => {
	if (m <= 0 || n <= 0)
		return [];

	if (n < m)
		return enumPartitions(n, n);

	if (n === m)
		return [
			...enumPartitions(n, n - 1),
			[n],
		];

	const sub1 = enumPartitions(n, m - 1);
	const sub2 = enumPartitions(n - m, m);

	return [
		...sub1,
		...sub2.map(a => [...a, m]),
	];
};


const makePartitionSet = n => enumPartitions(n, n)
	.reverse()
	.map(list => list.reverse().map(c => String.fromCharCode(c)).join(""))
	.reduce((map, code, index) => (map[code] = index, map), {});


const PARTITIONS_6 = makePartitionSet(6);
const PARTITIONS_8 = makePartitionSet(8);
const PARTITIONS_12 = makePartitionSet(12);


const statesToPartition = states => states
	.reduce((counts, state) => (++counts[state], counts), Array(24).fill(0))
	.filter(count => count > 0)
	.sort((c1, c2) => c2 - c1)
	.map(c => String.fromCharCode(c))
	.join("");


const cubePartitions = cube => {
	return {
		corners: statesToPartition(ENCODE_UNIT_ORDER.slice(0, 8).map(index => cube.units[index])),
		edges: statesToPartition(ENCODE_UNIT_ORDER.slice(8, 20).map(index => cube.units[index])),
		axes: statesToPartition(ENCODE_UNIT_ORDER.slice(20, 26).map(index => cube.units[index])),
	};
};


const cubePartitionCode = cube => {
	const partitions = cubePartitions(cube);

	const indices = [PARTITIONS_6[partitions.axes], PARTITIONS_8[partitions.corners], PARTITIONS_12[partitions.edges]];

	console.assert(indices[0] >= 0, "invalid axes:", partitions.axes);
	console.assert(indices[1] >= 0, "invalid corners:", partitions.corners);
	console.assert(indices[2] >= 0, "invalid edges:", partitions.edges);

	return indices[0] + (indices[1] << 4) + (indices[2] << 9);
};


const cubePartitionComplexity = (cube, {units = 26} = {}) => {
	//const partitions = cubePartitions(cube);
	//return partitions.corners.length + partitions.edges.length;
	return ENCODE_UNIT_ORDER.slice(0, units)
		.map(index => cube.units[index])
		.reduce((counts, state) => (++counts[state], counts), Array(24).fill(0))
		.filter(count => count > 0)
		.length;
};



export {
	enumPartitions,
	PARTITIONS_6,
	PARTITIONS_8,
	PARTITIONS_12,
	cubePartitionCode,
	cubePartitionComplexity,
};
