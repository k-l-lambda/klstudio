

const enumPartitions = (n, m) => {
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
};


Array(12).fill(null).forEach((_, i) => console.log(enumPartitions(i + 1, i + 1)));
