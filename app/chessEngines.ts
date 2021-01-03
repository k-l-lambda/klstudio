
import {EventEmitter} from "events";



interface EngineAgent {
	postMessage (message: string): void;
	terminate (): void;

	on (name: string, handler: Function): void;
};


interface EnginePlayer extends EngineAgent {};
interface EngineAnalyzer extends EngineAgent {};


class WorkerAnalyzer extends EventEmitter implements EngineAnalyzer {
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


	onMessage (message) {
		// TODO:
	}
};


// TODO:
class WorkerPlayer extends EventEmitter implements EnginePlayer {
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
