
// eslint-disable-next-line
import {EnginePlayer, EngineAnalyzer, WorkerAnalyzer, WorkerPlayer, RandomPlayer} from "../inc/chessWorkers";



export const analyzers: {[key: string]: () => EngineAnalyzer} = {
	Stockfish () {
		return new WorkerAnalyzer(() => new Worker("chess/engines/stockfish.js"));
	},
};


export const players: {[key: string]: () => EnginePlayer} = {
	Stockfish () {
		return new WorkerPlayer(new Worker("chess/engines/stockfish.js"));
	},


	Random () {
		return new RandomPlayer();
	},
};
