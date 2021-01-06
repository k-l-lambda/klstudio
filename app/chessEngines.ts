
import {EventEmitter} from "events";
//import Chess from "chess.js";

//import {msDelay} from "./delay";



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


type MoveTuple = [string, string, string?];


interface PVInfo {
	move: MoveTuple;
	scoreCP: number;
	scoreMate: number;
	pv: MoveTuple[];
	depth?: number;
	bmc?: number;
};


interface SearchResult {
	bestMove: MoveTuple;
	pvs: PVInfo[];
};


interface EvalResult {
	total: number;
	totalMG: number;
	totalEG: number;
};


interface AnalyzationItem {
	move: MoveTuple;
	value: number;
	pv?: MoveTuple[];
	bmc?: number;
};


abstract class WorkerAgentBase extends EventEmitter implements EngineAgent {
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


//const BEAT_REWARD = 1e+2;
//const STEP_DECAY = 0.9;
const MATE_VALUE = 100;


const parseMove = (move: string): MoveTuple => move.match(/([a-h][1-8])([a-h][1-8])([qrbn])?/).slice(1) as MoveTuple;


class WorkerAgent extends WorkerAgentBase {
	evalHandler: (result: EvalResult) => void;
	bestMoveHandler: (move: MoveTuple) => void;
	infoHandler: (dict: {[key: string]: any}) => void;
	readyOKHandler: () => void;

	cacheDict: {[key: string]: any} = {};
	buzy: boolean = false;


	constructor (worker: Worker) {
		super(worker);
	}


	async waitReady () {
		this.postMessage("isready");
		await new Promise<void>(resolve => this.readyOKHandler = resolve);
	}


	setOptions (dict: {[key: string]: any}) {
		Object.entries(dict).forEach(([key, value]) => this.postMessage(`setoption name ${key} value ${value}`));
	}


	async evaluate (fen: string): Promise<EvalResult> {
		this.buzy = true;

		this.postMessage("position fen " + fen);
		this.postMessage("eval");

		const result = await new Promise<EvalResult>(resolve => this.evalHandler = resolve);
		this.buzy = false;

		return result;
	}


	async go (fen: string, {depth = null} = {}): Promise<SearchResult> {
		this.buzy = true;

		this.postMessage("position fen " + fen);
		if (depth)
			this.postMessage(`go depth ${depth}`);
		else
			this.postMessage("go");

		const pvs: PVInfo[] = [];
		this.infoHandler = info => pvs[info.multipv - 1] = {
			move: info.pv[0],
			scoreCP: info.scoreCP,
			scoreMate: info.scoreMate,
			pv: info.pv,
			depth: info.depth,
			bmc: info.bmc,
		};

		const bestMove = await new Promise<MoveTuple>(resolve => this.bestMoveHandler = resolve);
		this.buzy = false;

		return {bestMove, pvs};
	}


	onMessage (message: string): void {
		if (/Total \|/.test(message)) {
			const numbers = message.match(/([-\d.]+)/g);
			const [mg, eg] = numbers.slice(numbers.length - 2);
			this.cacheDict.totalMG = Number(mg);
			this.cacheDict.totalEG = Number(eg);
		}
		else if (/^Total evaluation: [-\d.]+/.test(message)) {
			const [_, value] = message.match(/\s([-\d.]+)/);
			if (this.evalHandler) {
				this.evalHandler({
					total: Number(value),
					totalMG: this.cacheDict.totalMG,
					totalEG: this.cacheDict.totalEG,
				});
			}
		}
		else if (/^bestmove /.test(message)) {
			const [_, bestmove] = message.match(/bestmove\s(\w+)/);
			if (this.bestMoveHandler)
				this.bestMoveHandler(parseMove(bestmove));
		}
		else if (/^info depth /.test(message)) {
			const [_1, depth] = message.match(/depth\s(\d+)/);
			const pv = message.match(/[a-h][1-8][a-h][1-8][qrbn]?/g);
			const [_2, bmc] = message.match(/bmc\s([-\d.]+)/);
			const [_3, multipv] = message.match(/multipv\s([\d]+)/);
			const [_4, scoreCP = undefined] = message.match(/score cp\s([-\d]+)/) || [null];
			const [_5, scoreMate = undefined] = message.match(/score mate\s([-\d]+)/) || [null];

			if (this.infoHandler) {
				const moves = pv.map(parseMove);
				this.infoHandler({
					depth: Number(depth),
					multipv: Number(multipv),
					scoreCP: Number(scoreCP),
					scoreMate: Number(scoreMate),
					pv: moves,
					bmc: Number(bmc),
				});
			}
		}
		else if (message === "readyok") {
			if (this.readyOKHandler)
				this.readyOKHandler();
		}
	}
};


class WorkerAnalyzer extends WorkerAgent implements EngineAnalyzer {
	//evaluators: WorkerAgent[];
	analyzingFEN: string;


	constructor (workerFactory: () => Worker, {/*evaluatorCount = 6*/multiPV = 10} = {}) {
		super(workerFactory());

		//this.evaluators = Array(evaluatorCount).fill(null).map(() => new WorkerAgent(workerFactory()));
		this.setOptions({MultiPV: multiPV});
	}


	terminate () {
		this.worker.terminate();
		//this.evaluators.forEach(evaluator => evaluator.terminate());

		this.emit("log", "- Analyzer terminated.");
	}


	/*async getIdleEvaluator (): Promise<WorkerAgent> {
		while (true) {
			const tail = this.evaluators.pop();
			this.evaluators.unshift(tail);
			//console.log("tail:", tail.buzy);
			if (!tail.buzy) {
				tail.buzy = true;
				//console.log("idle got");
				return tail;
			}

			await msDelay(0);
		}
	}*/


	/*async analyze (fen: string) {
		this.analyzingFEN = fen;

		const game = new Chess(fen);
		const moves = game.moves();
		//console.log("moves:", moves);

		const reversion = game.turn() === "w" ? 1 : -1;

		const branches = moves.map(move => {
			game.move(move);
			let over = null;
			if (game.game_over())
				over = game.in_draw() ? 0 : (game.turn() === "b" ? 1 : -1);

			const fen = game.fen();
			game.undo();

			return {move, fen, over};
		});

		this.emit("log", `-> evaluting ${branches.length} moves...`);

		for (const branch of branches) {
			const run = async (): Promise<AnalyzationItem> => {
				let value;

				if (Number.isFinite(branch.over))
					value = branch.over * BEAT_REWARD;
				else {
					const evaluator = await this.getIdleEvaluator();
					//console.log("evaluator got.");

					// drop obsoleted task
					if (this.analyzingFEN !== fen)
						return null;

					let targetFEN = branch.fen;
					{
						const result = await evaluator.go(targetFEN);
						//console.log("go finished.");

						branch.bmc = result.bmc;
						branch.prediction = result.prediction;

						game.move(branch.move);
						result.prediction.forEach(move => game.move({from: move[0], to: move[1], promotion: move[2]}));

						targetFEN = game.fen();
						if (game.game_over()) {
							branch.over = game.in_draw() ? 0 : (game.turn() === "b" ? 1 : -1);
							value = branch.over * BEAT_REWARD * (STEP_DECAY ** result.prediction.length);
						}

						result.prediction.forEach(() => game.undo());
						game.undo();
					}

					if (!Number.isFinite(branch.over)) {
						const evaluation = await evaluator.evaluate(targetFEN);
						//value = evaluation.totalMG;
						value = evaluation.total;
					}
					//console.log("evaluation finished.");

					evaluator.buzy = false;
				}

				return {move: branch.move, value: value * reversion, bmc: branch.bmc, prediction: branch.prediction};
			};

			branch.task = run();
			//console.log("fen:", branch.fen);
		}
		//this.emit("log", "-< moves evaluting done.");
		//console.log("branches:", branches);

		const analyzation: AnalyzationItem[] = await Promise.all(branches.map(branch => branch.task));
		this.emit("log", "-< moves evaluting done.");

		if (this.analyzingFEN !== fen)
			return;

		analyzation.sort((m1, m2) => m2.value - m1.value);

		this.emit("analyzation", analyzation);
	}*/


	async analyze (fen: string) {
		const result = await this.go(fen, {depth: 10});
		//console.log("result:", result);

		const analyzation: AnalyzationItem[] = result.pvs.map(info => {
			const value = Number.isFinite(info.scoreCP) ? info.scoreCP * 0.01 : (MATE_VALUE * Math.sign(info.scoreMate) - info.scoreMate);

			return {
				move: info.move,
				value,
				pv: info.pv,
				bmc: info.bmc,
			};
		});

		this.emit("analyzation", analyzation);
	}
};


// TODO:
class WorkerPlayer extends WorkerAgent implements EnginePlayer {
	constructor (worker: Worker) {
		super(worker);
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
