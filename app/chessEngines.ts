
interface EngineAgent {
	postMessage (message: string): void;
	terminate (): void;

	onmessage: (event: any) => void;
};


interface EnginePlayer extends EngineAgent {};
interface EngineAnalyzer extends EngineAgent {};



export const analyzers: {[key: string]: () => EngineAnalyzer} = {
	Stockfish () {
		return new Worker("/chess/engines/stockfish.js");
	},
};


export const players: {[key: string]: () => EnginePlayer} = {
	Stockfish () {
		return new Worker("/chess/engines/stockfish.js");
	},


	Random () {
		// TODO:
		return null;
	},
};
