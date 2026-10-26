/// <reference lib="dom" />
// Loader and glue for public/hexiamond-recognizer.wasm, the C++ port of app/hexiamond/photo-recognition.ipynb
// (sources and build script in tools/hexiamond/recognizer/). The module is a standalone wasm with no JS runtime:
// it imports only a millisecond clock, exports malloc/free and one recognize call returning JSON.
import {Placement, Shape} from "./types";

export interface RecognizerRegion {
	cells: number[];       // board point indices (buildShape's boardPoints order)
	blank: boolean;        // accepted as bare board: no block here
	insidePhoto: boolean;
	hue: number;           // degrees, saturation-weighted circular mean
	saturation: number;    // 0..255, median
	value: number;         // 0..255, histogram mode
	rgb: [number, number, number];
}

export interface RecognizerResult {
	ok: boolean;
	error?: string;
	normalized: [number, number];
	scale: number;                  // normalized px per input px
	segments: number;
	window: number;
	peak: number;
	modes: [number, number, number];
	coarse: [number, number, number];
	H: number[];                    // 3x3 row-major, board units -> normalized px
	Hsource: number[];              // 3x3 row-major, board units -> input px
	projective: boolean;
	inlierShare: number;
	edges: [number, number, number, number][];  // internal edges: cell, cell, confidence, cut (0/1)
	hueThreshold: number;
	valueThreshold: number;
	regions: RecognizerRegion[];
	timing: Record<string, number>;  // ms per stage
}

export interface RecognizeOptions {
	channels?: 3 | 4;   // bytes per pixel, default 4 (canvas RGBA)
	bgr?: boolean;      // channel order, default false (RGB)
}

// The base no-unused-vars rule reads parameter names in type signatures as unused variables.
/* eslint-disable no-unused-vars */
export interface Recognizer {
	recognize (pixels: Uint8Array | Uint8ClampedArray, width: number, height: number, board: number[][], options?: RecognizeOptions): RecognizerResult;
}

interface RecognizerExports {
	memory: WebAssembly.Memory;
	_initialize?: () => void;
	hx_alloc: (size: number) => number;
	hx_free: (pointer: number) => void;
	hx_recognize: (pixels: number, width: number, height: number, channels: number, bgr: number, board: number, rows: number, cols: number) => number;
	hx_result_length: () => number;
}
/* eslint-enable no-unused-vars */

const clock = (): number => (typeof performance !== "undefined" ? performance.now() : Date.now());

export const instantiateRecognizer = async (source: BufferSource | WebAssembly.Module): Promise<Recognizer> => {
	const module = source instanceof WebAssembly.Module ? source : await WebAssembly.compile(source);
	// Satisfy whatever the toolchain imports: the clock by name, anything else as a no-op returning 0.
	const imports: Record<string, Record<string, () => number>> = {};
	for (const entry of WebAssembly.Module.imports(module)) {
		imports[entry.module] = imports[entry.module] || {};
		imports[entry.module][entry.name] = entry.module === "env" && entry.name === "now" ? clock : () => 0;
	}
	const instance = await WebAssembly.instantiate(module, imports as WebAssembly.Imports);
	const exports = instance.exports as unknown as RecognizerExports;
	if (exports._initialize)
		exports._initialize();
	const decoder = new TextDecoder();

	return {
		recognize (pixels, width, height, board, options = {}) {
			const channels = options.channels || 4;
			if (pixels.length < width * height * channels)
				throw new Error(`expected ${width * height * channels} bytes, got ${pixels.length}`);
			const cols = board.reduce((max, row) => Math.max(max, row.length), 0);
			const pixelPointer = exports.hx_alloc(width * height * channels);
			const boardPointer = exports.hx_alloc(board.length * cols * 4);
			try {
				// Views are taken right before use: an allocation may grow (and detach) the memory buffer.
				new Uint8Array(exports.memory.buffer, pixelPointer, width * height * channels).set(pixels.subarray(0, width * height * channels));
				const boardView = new Int32Array(exports.memory.buffer, boardPointer, board.length * cols);
				board.forEach((row, y) => row.forEach((value, x) => boardView[y * cols + x] = value));
				const resultPointer = exports.hx_recognize(pixelPointer, width, height, channels, options.bgr ? 1 : 0, boardPointer, board.length, cols);
				const json = decoder.decode(new Uint8Array(exports.memory.buffer, resultPointer, exports.hx_result_length()));
				return JSON.parse(json) as RecognizerResult;
			}
			finally {
				exports.hx_free(pixelPointer);
				exports.hx_free(boardPointer);
			}
		},
	};
};

let pending: Promise<Recognizer> | null = null;

/** Fetch and instantiate the module once per page. */
export const loadRecognizer = (url: string): Promise<Recognizer> => {
	if (!pending) {
		pending = fetch(url).then(response => {
			if (!response.ok)
				throw new Error(`${url}: HTTP ${response.status}`);
			return response.arrayBuffer();
		}).then(instantiateRecognizer);
		pending.catch(() => pending = null);
	}
	return pending;
};

/** Draw an image scaled to `width` px wide (never enlarged) and recognize it. Hsource maps board units to that
 * drawn size. At 600 px wide every sample photo gave the same partition as at full resolution (the module
 * normalizes to a 1024 px long side internally); the run time is then dominated by that fixed normalized size. */
export const recognizeImage = (recognizer: Recognizer, image: CanvasImageSource & {width: number; height: number}, board: number[][], width = 600): {result: RecognizerResult; width: number; height: number} => {
	const sourceWidth = (image as HTMLImageElement).naturalWidth || image.width;
	const sourceHeight = (image as HTMLImageElement).naturalHeight || image.height;
	const scale = Math.min(1, width / sourceWidth);
	const canvas = document.createElement("canvas");
	canvas.width = Math.round(sourceWidth * scale);
	canvas.height = Math.round(sourceHeight * scale);
	const context = canvas.getContext("2d", {willReadFrequently: true}) as CanvasRenderingContext2D;
	context.imageSmoothingQuality = "high";
	context.drawImage(image, 0, 0, canvas.width, canvas.height);
	const data = context.getImageData(0, 0, canvas.width, canvas.height);
	return {result: recognizer.recognize(data.data, canvas.width, canvas.height, board), width: canvas.width, height: canvas.height};
};

/** Map recognized 6-cell regions onto the shape's placements (the same identity the saved board uses).
 * `byRegion` is aligned with `result.regions`: the placement of each region, or null (blank / no match). */
export const placementsFromResult = (shape: Shape, result: RecognizerResult): {placements: Placement[]; byRegion: (Placement | null)[]; unmatched: number} => {
	const key = (cells: number[]): string => [...cells].sort((a, b) => a - b).join(",");
	const byCells = new Map<string, Placement>();
	for (const list of shape.placements) {
		for (const placement of list)
			byCells.set(key(placement.indices), placement);
	}
	const byRegion = result.regions.map(region => (!region.blank && region.cells.length === 6 && byCells.get(key(region.cells))) || null);
	const placements = byRegion.filter(Boolean) as Placement[];
	const unmatched = result.regions.filter((region, index) => !region.blank && !byRegion[index]).length;
	return {placements, byRegion, unmatched};
};
