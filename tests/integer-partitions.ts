
import { Cube3 } from "../inc/cube3";
import { enumPartitions, PARTITIONS_6, PARTITIONS_8, PARTITIONS_12, cubeStatePartition } from "../inc/cube3-partition";



/*const enumPartitions = (n, m) => {
	if (m <= 0)
		return [];

	if (m === 1)
		return [Array(n).fill(1)];

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
};*/


console.log("PARTITIONS_6:", PARTITIONS_6);
console.log("PARTITIONS_8:", PARTITIONS_8);
console.log("PARTITIONS_12:", PARTITIONS_12);

console.log("p0:", cubeStatePartition(new Cube3()));
console.log("p1:", cubeStatePartition(new Cube3({path: [0]})).toString(16));
console.log("p2:", cubeStatePartition(new Cube3({path: [0, 1]})).toString(16));
console.log("p3:", cubeStatePartition(new Cube3({path: Array(50).fill(null).map(() => ~~(Math.random() * 12))})).toString(16));

//Array(12).fill(null).forEach((_, i) => console.log(enumPartitions(i + 1, i + 1)));
