
import {EventEmitter} from "events";
import Chess from "chess.js";

import {msDelay} from "./delay";



interface EngineAgent {
	postMessage (message: string): void;
	terminate (): void;

	on (name: string, handler: Function): void;
};


interface EnginePlayer extends EngineAgent {};


interface EngineAnalyzer extends EngineAgent {
	//evaluate (fen: string): Promise<number>;
	analyze (fen: string): void;
};


interface AnalyzationItem {
	move: string;
	value: number;
};


interface SearchResult {
	prediction: string[];
	bestMove: string;
};


abstract class WorkerAgent extends EventEmitter implements EngineAgent {
	worker: Worker;


	constructor (worker: Worker) {
		super();

		this.worker = worker;
		this.worker.onmessage = event => {
			this.log(`< ${event.data}`);

			this.onMessage(event.data);
		};
	}


	log (message) {
		this.emit("log", message);
	}


	postMessage (message: string): void {
		this.worker.postMessage(message);

		this.log("");
		this.log(`> ${message}`);
	}


	terminate (): void {
		this.worker.terminate();
	}


	abstract onMessage (message: string): void;
};


class WorkerEvaluator extends WorkerAgent {
	evalHandler: (value: number) => void;
	bestMoveHandler: (move: string) => void;
	infoHandler: (dict: {[key: string]: any}) => void;
	buzy: boolean = false;


	constructor (worker: Worker) {
		super(worker);
	}


	async evaluate (fen: string): Promise<number> {
		this.buzy = true;

		this.postMessage("position fen " + fen);
		this.postMessage("eval");

		const value = await new Promise<number>(resolve => this.evalHandler = resolve);
		this.buzy = false;

		return value;
	}


	async go (fen: string, {depth = 10} = {}): Promise<SearchResult> {
		this.postMessage("position fen " + fen);
		this.postMessage(`go depth ${depth}`);

		let info;
		this.infoHandler = dict => info = dict;

		const bestMove = await new Promise<string>(resolve => this.bestMoveHandler = resolve);

		return {bestMove, prediction: info.pv};
	}


	onMessage (message: string): void {
		if (/^Total evaluation: [-\d.]+/.test(message)) {
			const [_, value] = message.match(/\s([-\d.]+)/);
			if (this.evalHandler)
				this.evalHandler(Number(value));
		}
		else if (/^bestmove /.test(message)) {
			const [_, bestmove] = message.match(/bestmove\s(\w+)/);
			if (this.bestMoveHandler)
				this.bestMoveHandler(bestmove);
		}
		else if (/^info depth /.test(message)) {
			const [_, depth] = message.match(/depth\s(\d+)/);
			const pv = message.match(/[a-z][1-8][a-z][1-8]/g);
			if (this.infoHandler)
				this.infoHandler({depth: Number(depth), pv});
		}
	}
};


class WorkerAnalyzer extends WorkerAgent implements EngineAnalyzer {
	evaluators: WorkerEvaluator[];
	analyzingFEN: string;


	constructor (workerFactory: () => Worker, {evaluatorCount = 6} = {}) {
		super(workerFactory());

		this.evaluators = Array(evaluatorCount).fill(null).map(() => new WorkerEvaluator(workerFactory()));
		//this.evaluators.forEach(evaluator => evaluator.on("log", message => this.emit("log", message)));
	}


	terminate () {
		this.worker.terminate();
		this.evaluators.forEach(evaluator => evaluator.terminate());

		this.emit("log", "- Analyzer terminated.");
	}


	async getIdleEvaluator (): Promise<WorkerEvaluator> {
		while (true) {
			const tail = this.evaluators.pop();
			this.evaluators.unshift(tail);
			if (!tail.buzy)
				return tail;

			await msDelay(0);
		}
	}


	/*async evaluate (fen: string): Promise<number> {
		const evaluator = await this.getIdleEvaluator();

		return evaluator.evaluate(fen);
	}*/


	async analyze (fen: string) {
		this.analyzingFEN = fen;

		const game = new Chess(fen);
		const moves = game.moves();
		//console.log("moves:", moves);

		const reversion = game.turn() === "w" ? 1 : -1;

		const branches = moves.map(move => {
			game.move(move);
			const fen = game.fen();
			game.undo();

			return {move, fen};
		});

		this.emit("log", `-> evaluting ${branches.length} moves...`);

		for (const branch of branches) {
			const evaluator = await this.getIdleEvaluator();
			branch.value = evaluator.evaluate(branch.fen);
			//console.log("fen:", branch.fen);
		}
		this.emit("log", "-< moves evaluting done.");

		const analyzation: AnalyzationItem[] = await Promise.all(branches.map(async branch => ({
			move: branch.move,
			value: (await branch.value) * reversion,
		})));

		if (this.analyzingFEN !== fen)
			return;

		analyzation.sort((m1, m2) => m2.value - m1.value);

		this.emit("analyzation", analyzation);
	}


	onMessage (message: string): void {
		/*if (/^Total evaluation: [-\d.]+/.test(message)) {
			const [_, value] = message.match(/\s([-\d.]+)/);
			if (this.evalHandler)
				this.evalHandler(Number(value));
		}*/
	}
};


// TODO:
class WorkerPlayer extends WorkerAgent implements EnginePlayer {
	constructor (worker: Worker) {
		super(worker);
	}


	onMessage (message: string) {
		void(message);
		// TODO:
	}
};



export const analyzers: {[key: string]: () => EngineAnalyzer} = {
	Stockfish () {
		return new WorkerAnalyzer(() => new Worker("/chess/engines/stockfish.js"));
	},
};


export const players: {[key: string]: () => EnginePlayer} = {
	Stockfish () {
		return new WorkerPlayer(new Worker("/chess/engines/stockfish.js"));
	},


	Random () {
		// TODO:
		return null;
	},
};
