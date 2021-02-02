
import * as fs from "fs";
import * as path from "path";
import {argv} from "yargs";
import {Chess} from "chess.js";
import * as YAML from "yaml";

import {WorkerAgent} from "../inc/chessWorkers";



interface AnalyzationBranch {
	move: string;
	score: number;
	pv: string;
};


interface Analyzation {
	fen: string;
	branches: AnalyzationBranch[];
};


const depth = argv.depth || 10;
const multiPV = argv.multiPV || 20;
const scoreWidth = argv.scoreWidth || 70;

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
			score: item.scoreCP,
			pv: item.pv.map(move => move.join("")).join(" "),
		})),
	};
};


const main = async () => {
	console.log("main.");
	await new Promise(resolve => setTimeout(resolve, 10000));
	//console.log("argv:", argv);
	let fens = null;
	let outputFilename = "0.yaml";

	const sourceFile = argv._[0];
	if (sourceFile) {
		const index = Number((sourceFile.match(/\d+/) || [0])[0]);
		outputFilename = `${index + 1}.yaml`;

		const sourceText = await fs.promises.readFile(sourceFile);
		const source = YAML.parse(sourceText.toString());

		fens = [].concat(...source.map(item => {
			const game = new Chess(item.fen);
			const bestScore = item.branches[0].score;

			const fens = [];

			for (const branch of item.branches) {
				if (branch.score < bestScore - scoreWidth)
					break;

				const move = {
					from: branch.move.substr(0, 2),
					to: branch.move.substr(2, 2),
					promotion: branch.move.substr(4),
				};
				game.move(move);

				fens.push(game.fen());
				game.undo();
			}

			return fens;
		}));
	}
	else
		// use start position as default source
		fens = [new Chess().fen()];

	const results = [];
	for (const fen of fens) {
		const analyzation = await analyzeFEN(fen);
		results.push(analyzation);
	}
	//console.log("results:", outputFilename, results);

	await fs.promises.writeFile(path.resolve("./tools/chess-book/", outputFilename), YAML.stringify(results));
};

main();
