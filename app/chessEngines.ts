
import {EventEmitter} from "events";
import Chess from "chess.js";



interface EngineAgent {
	postMessage (message: string): void;
	terminate (): void;

	on (name: string, handler: Function): void;
};


interface EnginePlayer extends EngineAgent {};


interface EngineAnalyzer extends EngineAgent {
	evaluate (fen: string): Promise<number>;
	analyze (fen: string): void;
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


class WorkerAnalyzer extends WorkerAgent implements EngineAnalyzer {
	evalHandler: (value: number) => void;


	constructor (worker: Worker) {
		super(worker);
	}


	async evaluate (fen: string): Promise<number> {
		this.postMessage("position fen " + fen);
		this.postMessage("eval");

		return new Promise(resolve => this.evalHandler = resolve);
	}


	async analyze (fen: string) {
		const game = new Chess(fen);
		const moves = game.moves();
		//console.log("moves:", moves);

		const analyzation = [];

		for (const move of moves) {
			game.move(move);
			const value = await this.evaluate(game.fen());
			analyzation.push({move, value});

			game.undo();
		}

		analyzation.sort((m1, m2) => (m2.value - m1.value) * (game.turn() === "w" ? 1 : -1));

		this.emit("analyzation", analyzation);
	}


	onMessage (message: string): void {
		if (/^Total evaluation: [-\d.]+/.test(message)) {
			const [_, value] = message.match(/\s([-\d.]+)/);
			if (this.evalHandler)
				this.evalHandler(Number(value));
		}
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
		return new WorkerAnalyzer(new Worker("/chess/engines/stockfish.js"));
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
