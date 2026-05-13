
// eslint-disable-next-line
import {EnginePlayer, EngineAnalyzer, WorkerAnalyzer, WorkerPlayer, RandomPlayer} from "../inc/chessWorkers";



const createStockfishWorker = () => new Worker(new URL("../public/chess/engines/stockfish.js", import.meta.url), {type: "classic"});


export const analyzers: {[key: string]: () => EngineAnalyzer} = {
	Stockfish () {
		return new WorkerAnalyzer(createStockfishWorker, {multiPV: 24});
	},
};


export const players: {[key: string]: () => EnginePlayer} = {
	Stockfish () {
		return new WorkerPlayer(createStockfishWorker());
	},


	Random () {
		return new RandomPlayer();
	},
};
