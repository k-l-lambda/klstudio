// Browser-side access to the recognizer: a worker client plus frame capture. Kept apart from recognizerWasm.ts,
// which also runs under node (tests/tools) where import.meta and the DOM are unavailable.
import {RecognizerResult} from "./recognizerWasm";

// The base no-unused-vars rule reads parameter names in type signatures as unused variables.
/* eslint-disable no-unused-vars */
export interface RecognizerClient {
	recognize (image: ImageData, board: number[][]): Promise<RecognizerResult>;
	dispose (): void;
}
/* eslint-enable no-unused-vars */

const wasmUrl = (): string => new URL(`${import.meta.env.BASE_URL}hexiamond-recognizer.wasm`, window.location.href).href;

export const createRecognizerClient = (): RecognizerClient => {
	const worker = new Worker(new URL("./recognizerWorker.ts", import.meta.url), {type: "module"});
	// eslint-disable-next-line no-unused-vars
	const pending = new Map<number, {resolve: (result: RecognizerResult) => void; reject: (error: Error) => void}>();
	let nextId = 0;
	worker.onmessage = (event: MessageEvent) => {
		const {id, result, error} = event.data;
		const entry = pending.get(id);
		if (!entry)
			return;
		pending.delete(id);
		if (error)
			entry.reject(new Error(error));
		else
			entry.resolve(result);
	};
	worker.onerror = event => {
		for (const entry of pending.values())
			entry.reject(new Error(event.message || "recognizer worker failed"));
		pending.clear();
	};
	return {
		recognize (image, board) {
			const id = ++nextId;
			return new Promise((resolve, reject) => {
				pending.set(id, {resolve, reject});
				// The pixel buffer is transferred, not copied: the caller's ImageData is detached afterwards.
				worker.postMessage({id, wasmUrl: wasmUrl(), pixels: image.data, width: image.width, height: image.height, board}, [image.data.buffer]);
			});
		},
		dispose () {
			worker.terminate();
			for (const entry of pending.values())
				entry.reject(new Error("recognizer disposed"));
			pending.clear();
		},
	};
};

let canvas: HTMLCanvasElement | null = null;

/** Draw an image or the current video frame scaled to `width` px wide (never enlarged) and read its pixels.
 * 600 px wide gave the same partitions as full-resolution photos in every sample. `aspect` (width / height), when
 * given, first centre-crops the source to that ratio — the same crop as CSS `object-fit: cover` in a box of that
 * ratio, so an overlay laid over such a box lines up with the frame. */
export const captureFrame = (source: HTMLImageElement | HTMLVideoElement, width = 600, aspect = 0): ImageData => {
	const sourceWidth = (source as HTMLVideoElement).videoWidth || (source as HTMLImageElement).naturalWidth || source.width;
	const sourceHeight = (source as HTMLVideoElement).videoHeight || (source as HTMLImageElement).naturalHeight || source.height;
	let cropWidth = sourceWidth, cropHeight = sourceHeight;
	if (aspect > 0) {
		if (sourceWidth / sourceHeight > aspect)
			cropWidth = sourceHeight * aspect;
		else
			cropHeight = sourceWidth / aspect;
	}
	const scale = Math.min(1, width / cropWidth);
	canvas = canvas || document.createElement("canvas");
	canvas.width = Math.round(cropWidth * scale);
	canvas.height = Math.round(cropHeight * scale);
	const context = canvas.getContext("2d", {willReadFrequently: true}) as CanvasRenderingContext2D;
	context.imageSmoothingQuality = "high";
	context.drawImage(source, (sourceWidth - cropWidth) / 2, (sourceHeight - cropHeight) / 2, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
	return context.getImageData(0, 0, canvas.width, canvas.height);
};
