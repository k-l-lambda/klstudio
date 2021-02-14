
import {EventEmitter} from "events";
import Chess from "chess.js";



type MoveTuple = [string, string, string?];


interface PVInfo {
	move: MoveTuple;
	scoreCP: number;
	scoreMate: number;
	pv: MoveTuple[];
	depth?: number;
	bmc?: number;
};


interface EngineAgent {
	postMessage (message: string): void;
	terminate (): void;

	on (name: string, handler: Function): void;
};


export interface EnginePlayer {
	movetime?: number;

	terminate (): void;
	on (name: string, handler: Function): void;

	think (fen: string): Promise<MoveTuple>;
};


export interface EngineAnalyzer extends EngineAgent {
	analyze (fen: string): void;
	evaluateFinite (fen: string, depth: number): Promise<PVInfo>;
	newGame(): Promise<void>;
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


interface AnalyzationBranch {
	move: MoveTuple;
	value: number;
	pv?: MoveTuple[];
	bmc?: number;
};


interface Worker {
	onmessage: (event: any) => void;

	postMessage (message: string): void;
	terminate (): void;
};


const msDelay = ms => new Promise(resolve => setTimeout(resolve, ms));


abstract class WorkerAgentBase extends EventEmitter implements EngineAgent {
	worker: Worker;


	constructor (worker: Worker) {
		super();

		this.worker = worker;
		this.worker.onmessage = event => {
			const data = event.data || event;
			this.log(`< ${data}`);

			this.onMessage(data);
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


export class WorkerAgent extends WorkerAgentBase {
	evalHandler: (result: EvalResult) => void;
	bestMoveHandler: (move: MoveTuple) => void;
	infoHandler: (dict: {[key: string]: any}) => void;
	readyOKHandler: (ready: boolean) => void;

	cacheDict: {[key: string]: any} = {};
	buzy: boolean = false;

	lastRequest: string;
	lastResponse: string;


	constructor (worker: Worker) {
		super(worker);
	}


	async waitReady () {
		let ready = false;
		while (!ready) {
			this.postMessage("isready");

			ready = await Promise.race([
				new Promise<boolean>(resolve => this.readyOKHandler = resolve),
				new Promise<boolean>(resolve => setTimeout(resolve, 1e+3)),
			]);
		}

		this.buzy = false;
	}


	newGame () {
		this.postMessage("ucinewgame");
		return this.waitReady();
	}


	stop () {
		this.postMessage("stop");
		return this.waitReady();
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


	async go (fen: string, {depth = null, movetime = null} = {}): Promise<SearchResult> {
		this.buzy = true;

		this.postMessage("position fen " + fen);

		let options = "";
		if (depth)
			options += ` depth ${depth}`;
		if (Number.isFinite(movetime))
			options += ` movetime ${movetime}`;

		this.postMessage("go" + options);

		const pvs: PVInfo[] = [];
		this.infoHandler = info => pvs[info.multipv - 1] = {
			move: info.pv && info.pv[0],
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


	goPonder (fen: string, onPVs: (pvs: PVInfo[]) => void) {
		this.buzy = true;
		this.postMessage("position fen " + fen);

		let pvs: PVInfo[] = [];
		this.infoHandler = info => {
			if (info.multipv === 1) {
				if (pvs.length)
					onPVs(pvs);

				pvs = [];
			}

			pvs[info.multipv - 1] = {
				move: info.pv && info.pv[0],
				scoreCP: info.scoreCP,
				scoreMate: info.scoreMate,
				pv: info.pv,
				depth: info.depth,
				bmc: info.bmc,
			};

		};

		this.postMessage("go ponder");
	}


	postMessage (message: string) {
		this.lastRequest = message;
		super.postMessage(message);
	}


	onMessage (message: string): void {
		this.lastResponse = message;

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
			const [_, bestmove] = message.match(/bestmove\s(\w+)/) || [null, null];
			if (this.bestMoveHandler)
				this.bestMoveHandler(bestmove && parseMove(bestmove));
		}
		else if (/^info depth /.test(message)) {
			const [_1, depth] = message.match(/depth\s(\d+)/);
			const pv = message.match(/[a-h][1-8][a-h][1-8][qrbn]?/g);
			const [_2, bmc] = message.match(/bmc\s([-\d.]+)/) || [null, null];
			const [_3, multipv] = message.match(/multipv\s([\d]+)/) || [null, null];
			const [_4, scoreCP = undefined] = message.match(/score cp\s([-\d]+)/) || [null];
			const [_5, scoreMate = undefined] = message.match(/score mate\s([-\d]+)/) || [null];

			if (this.infoHandler) {
				const moves = pv && pv.map(parseMove);
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
				this.readyOKHandler(true);
		}
	}
};


export class WorkerAnalyzer extends WorkerAgent implements EngineAnalyzer {
	thinkers: WorkerAgent[];
	analyzingIndex: number = 0;


	constructor (workerFactory: () => Worker, {thinkerCount = 3, multiPV = 20} = {}) {
		super(workerFactory());

		this.thinkers = Array(thinkerCount).fill(null).map(() => new WorkerAgent(workerFactory()));
		this.thinkers.forEach(thinker => thinker.setOptions({MultiPV: multiPV}));
	}


	terminate () {
		this.worker.terminate();
		this.thinkers.forEach(thinker => thinker.terminate());

		this.emit("log", "- Analyzer terminated.");
	}


	async newGame () {
		await Promise.all(this.thinkers.map(thinker => thinker.newGame()));
	}


	async getIdleThinker (): Promise<WorkerAgent> {
		while (true) {
			for (let i = 0; i < this.thinkers.length; ++i) {
				if (!this.thinkers[i].buzy) {
					this.emit("log", `< Thinker[${i}].`);
					return this.thinkers[i];
				}
			}

			await msDelay(10);
		}
	}


	async analyze (fen: string) {
		++this.analyzingIndex;
		const analyzingIndex = this.analyzingIndex;

		let onPVs = null;

		const thinker = await this.getIdleThinker();
		thinker.goPonder(fen, pvs => {
			if (onPVs)
				onPVs(pvs);
		});

		this.emit("log", "> Analyzer pondering.");

		while (true) {
			const pvs = await new Promise<PVInfo[]>(resolve => onPVs = resolve);
			if (this.analyzingIndex !== analyzingIndex)
				break;

			const bestMove = pvs[0].pv.slice(0, 2);
			this.emit("log", `< a: depth ${pvs[0].depth} score ${Number.isFinite(pvs[0].scoreCP) ? pvs[0].scoreCP : "m" + pvs[0].scoreMate} best ${bestMove.map(move => move.join("")).join(" ")}`);

			const branches: AnalyzationBranch[] = pvs.map(info => {
				const value = Number.isFinite(info.scoreCP) ? info.scoreCP * 0.01 : (MATE_VALUE * Math.sign(info.scoreMate) - info.scoreMate);

				return {
					move: info.move,
					value,
					pv: info.pv,
					bmc: info.bmc,
				};
			});
			const best = pvs[0];

			this.emit("analyzation", {fen, branches, best});
		}

		await thinker.stop();
	}


	async evaluateFinite (fen: string, depth: number): Promise<PVInfo> {
		const result = await this.go(fen, {depth});

		return result.pvs[0];
	}

	async analyzeStop () {
		++this.analyzingIndex;
	}
};


export class WorkerPlayer extends WorkerAgent implements EnginePlayer {
	movetime = null;


	constructor (worker: Worker) {
		super(worker);
	}

	async think (fen: string) {
		const result = await super.go(fen, {movetime: this.movetime});

		return result && result.bestMove;
	}
};


export class RandomPlayer implements EnginePlayer {
	terminate () {}
	on () {}


	think (fen: string) {
		const game = new Chess(fen);
		const moves = game.moves({verbose: true});
		if (moves.length) {
			const move = moves[Math.floor(moves.length * Math.random())];
			return Promise.resolve([move.from, move.to, move.promotion] as MoveTuple);
		}

		return null;
	}
};
