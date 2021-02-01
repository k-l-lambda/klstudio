
import * as fs from "fs";
import * as path from "path";
import {argv} from "yargs";
import {Chess} from "chess.js";
import * as YAML from "yaml";

import {WorkerAgent} from "../inc/chessWorkers";



interface AnalyzationBranch {
	move: string;
	value: number;
	pv: string;
};


interface Analyzation {
	fen: string;
	branches: AnalyzationBranch[];
};


const depth = argv.depth || 10;
const multiPV = argv.multiPV || 20;

const agent = new WorkerAgent(require("stockfish")());
agent.setOptions({MultiPV: multiPV});

agent.on("log", data => {
	console.log("Agent:", data);
});


const analyzeFEN = async (fen: string): Promise<Analyzation> => {
	//console.log("analyzeFEN:", fen);
	const result = await agent.go(fen, {depth});
	//console.log("result:", result);

	return {
		fen,
		branches: result.pvs.map(item => ({
			move: item.move.join(""),
			value: item.scoreCP,
			pv: item.pv.map(move => move.join("")).join(" "),
		})),
	};
};


const main = async () => {
	console.log("main.");
	await new Promise(resolve => setTimeout(resolve, 10000));
	//console.log("argv:", argv);
	let fens = null;
	const outputFilename = "0.yaml";

	const sourceFile = argv._[0];
	if (sourceFile) {
		// TODO: load source
	}
	else
		// use start position as default source
		fens = [new Chess().fen()];

	const results = await Promise.all(fens.map(analyzeFEN));

	await fs.promises.writeFile(path.resolve("./tools/", outputFilename), YAML.stringify(results));
};

main();
