
import {argv} from "yargs";
import * as fs from "fs";
import * as readline from "readline";

import { Cube3, TWIST_PERMUTATION_48, permutate, invertTwist } from "../inc/cube3";
import { cubeLoop } from "../inc/cube3-loop";
import { cubePartitionCode } from "../inc/cube3-partition";
import { hashCube, printHash, parseHash } from "../inc/cube3-hash";



const dataFileName = depth => `./static/data/cube3-hash-${depth}.txt`;


const _loadHashes = async depth => {
	if (depth > 0) {
		const inputFileName = dataFileName(depth);
		if (!fs.existsSync(inputFileName))
			throw new Error(`input file not exist: ${inputFileName}`);

		const result = [];

		const reader = readline.createInterface({input: fs.createReadStream(inputFileName)});
		reader.on("line", line => {
			const [readableHash, twist, state, parentIndex] = line.split("\t");
			//console.log("line:", readableHash, state, twist);

			result.push({
				hash: parseHash(readableHash),
				state,
				twist: parseInt(twist, 18),
				parentIndex: parseInt(parentIndex),
			});
		});

		await new Promise(resolve => reader.on("close", resolve));

		console.log(result.length, "hashed read.");

		return result;
	}

	if (depth === 0) {
		const origin = new Cube3();

		return [{state: origin.encode(), hash: hashCube(origin).hash}];
	}

	return [];
};


const deriveHash = async depth => {
	console.log("Loading grand parent hashes-", depth - 2);
	const grandHashes = new Set((await _loadHashes(depth - 2)).map(({hash}) => hash));
	//console.log("grandHashes:", printHash(grandHashes[0]));

	console.log("Loading parent hashes-", depth - 1);
	const parentHashes = await _loadHashes(depth - 1);
	//console.log("parentHashes:", parentHashes);

	console.log("Writing hashes-", depth);

	const table = {};

	const output = fs.createWriteStream(dataFileName(depth));

	//process.stdout.write(".".repeat(parentHashes.length));
	//process.stdout.write("\b".repeat(parentHashes.length));
	//process.stdout.write("\u001b[F");

	parentHashes.forEach((parentHash, parentIndex) => {
		Array(12).fill(null).forEach((_, t) => {
			//if (parentHash.recovery === t)
			//	return;

			const cube = new Cube3({code: parentHash.state, path: [t]});

			const selfLoop = cubeLoop(cube);
			const selfPartition = cubePartitionCode(cube);
			const {hash, index} = hashCube(cube);

			// avoid backwards
			if (grandHashes.has(hash))
				return;

			const recovery = invertTwist(t);
			const twist = TWIST_PERMUTATION_48[index].indexOf(recovery);
			const state = cube.encode();
			const readableHash = printHash(hash);

			//if (table[hash])
			//	console.assert(table[hash].twist === twist, "inconsistent hash twist:", readableHash, table[hash], state, twist);
			if (!table[hash]/* || (table[hash].state !== state && table[hash].twist !== twist)*/) {
				table[hash] = {
					state,
					twist,
				};

				//console.log("hash:", readableHash, state, twist, recovery);

				/*if (table[hash]) {
					const same = hash[twist] === hash[table[hash].twist];
					console.log("hash collision:", same ? "OOOOO" : "XXXXX");
				}*/

				output.write(`${readableHash}\t${twist.toString(18)}\t${state}\t${parentIndex}\n`);
			}
		});

		//process.stdout.write("\u25a0");
		process.stdout.write(`\r${'╌/╎\\'[parentIndex % 4]} ${(parentIndex * 100 / parentHashes.length).toFixed(0)}%`);
	});

	process.stdout.write("\n")

	output.end();
};


deriveHash(argv.depth || 1).then(() => console.log("Finished."));
