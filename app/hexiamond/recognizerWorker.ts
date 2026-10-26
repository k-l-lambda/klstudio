/// <reference lib="webworker" />
// Runs the wasm recognizer off the main thread, so the page (and a live camera preview) stays responsive.
// Message in: {id, wasmUrl, pixels, width, height, board}; out: {id, result} or {id, error}.
import {instantiateRecognizer, Recognizer} from "./recognizerWasm";

let recognizer: Promise<Recognizer> | null = null;

const load = (wasmUrl: string): Promise<Recognizer> => {
	if (!recognizer) {
		recognizer = fetch(wasmUrl).then(response => {
			if (!response.ok)
				throw new Error(`${wasmUrl}: HTTP ${response.status}`);
			return response.arrayBuffer();
		}).then(instantiateRecognizer);
		recognizer.catch(() => recognizer = null);
	}
	return recognizer;
};

self.onmessage = async (event: MessageEvent): Promise<void> => {
	const {id, wasmUrl, pixels, width, height, board} = event.data;
	try {
		const result = (await load(wasmUrl)).recognize(pixels, width, height, board);
		(self as unknown as DedicatedWorkerGlobalScope).postMessage({id, result});
	}
	catch (error) {
		(self as unknown as DedicatedWorkerGlobalScope).postMessage({id, error: error instanceof Error ? error.message : String(error)});
	}
};
