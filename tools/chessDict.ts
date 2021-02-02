
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

/*agent.on("log", data => {
	console.debug("Agent:", data);
});*/


const analyzeFEN = async (fen: string): Promise<Analyzation> => {
	const result = await agent.go(fen, {depth});

	return {
		fen,
		branches: result.pvs.map(item => ({
			move: item.move.join(""),
			score: item.scoreCP,
			pv: item.pv.map(move => move.join("")).join(" "),
		})),
	};
};


const genStep = async (source?: Analyzation[]): Promise<Analyzation[]> => {
	let fens = null;

	if (source) {
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
		process.stdout.write(`fen: ${results.length} / ${fens.length}\r`);

		const analyzation = await analyzeFEN(fen);
		results.push(analyzation);
	}

	return results;
};


const main = async () => {
	let source = null;
	let step = 0;

	const inputFile = argv._[0];
	if (inputFile) {
		const index = Number((inputFile.match(/\d+/) || [0])[0]);
		step = index + 1;

		const sourceText = await fs.promises.readFile(inputFile);
		source = YAML.parse(sourceText.toString());
	}

	const untilStep = Number(argv.untilStep || step);
	while (step <= untilStep) {
		console.log("\nStep:", step, "/", untilStep);

		const result = await genStep(source);
		await fs.promises.writeFile(path.resolve("./tools/chess-book/", `${step}.yaml`), YAML.stringify(result));

		source = result;
		++step;
	}
};

main();
