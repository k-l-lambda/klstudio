
// eslint-disable-next-line
import {EnginePlayer, EngineAnalyzer, WorkerAnalyzer, WorkerPlayer, RandomPlayer} from "../inc/chessWorkers";



// Must stay the verbatim copy under public/, NOT a Vite-bundled worker. The emscripten loader fetches
// `stockfish.wasm` relative to its own script URL; `new URL(..., import.meta.url)` makes Vite emit the
// worker as `assets/stockfish-<hash>.js`, where no wasm sits beside it, so the fetch fails and the engine
// never answers `uci`. A runtime-built URL is opaque to Vite, so the worker runs from
// `chess/engines/`, next to its wasm (both are copied there from public/ at build time). Resolving against
// `document.baseURI` keeps it right under a subpath deployment such as GitHub Pages.
const STOCKFISH_URL = new URL("chess/engines/stockfish.js", document.baseURI).href;

const createStockfishWorker = () => new Worker(STOCKFISH_URL, {type: "classic"});


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
