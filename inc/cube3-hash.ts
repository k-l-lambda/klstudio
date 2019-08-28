
const hashLibrary = [];
const hashIndices = {};


const printHash = hash => hash.split("").map(c => c.charCodeAt(0).toString()).join(",");
const parseHash = source => source.split(",").map(Number).map(c => String.fromCharCode(c)).join("");


const loadHashes = (depth, iterator) => {
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



export {
	printHash,
	parseHash,
	loadHashes,
	hashLibrary,
	hashIndices,
};
