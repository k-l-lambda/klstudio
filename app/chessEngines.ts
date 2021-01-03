
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


	onMessage (message: string): void {
		if (/^Total evaluation: [-\d.]+/.test(message)) {
			const [_, value] = message.match(/\s([-\d.]+)/);
			if (this.evalHandler)
				this.evalHandler(Number(value));
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
		}
		this.emit("log", "-< moves evaluting done.");

		const analyzation: AnalyzationItem[] = await Promise.all(branches.map(async branch => ({
			move: branch.move,
			value: await branch.value,
		})));

		if (this.analyzingFEN !== fen)
			return;

		analyzation.sort((m1, m2) => (m2.value - m1.value) * (game.turn() === "w" ? 1 : -1));

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
