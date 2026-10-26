// Run public/hexiamond-recognizer.wasm through app/hexiamond/recognizerWasm.ts on raw pixels and print the result
// (plus the saved-board placements) as JSON; used by tools/hexiamond/hexiamond-recognizer-parity.py --engine wasm.
//   npx ts-node --project tsconfig.node.json tools/hexiamond/hexiamond-recognizer-run.ts <wasm> <raw> <width> <height> <channels> <bgr> <shapeId>
import * as fs from "fs";

import {buildShape} from "../../app/hexiamond/geometry";
import {instantiateRecognizer, placementsFromResult} from "../../app/hexiamond/recognizerWasm";

const main = async (): Promise<void> => {
	const [wasmPath, rawPath, width, height, channels, bgr, shapeId] = process.argv.slice(2);
	const startedLoad = Date.now();
	const recognizer = await instantiateRecognizer(fs.readFileSync(wasmPath));
	const loadMs = Date.now() - startedLoad;
	const shape = buildShape(shapeId || "std");
	const pixels = new Uint8Array(fs.readFileSync(rawPath));
	const started = Date.now();
	const result = recognizer.recognize(pixels, Number(width), Number(height), shape.board, {channels: Number(channels) as 3 | 4, bgr: bgr === "1"});
	const elapsed = Date.now() - started;
	const {placements, unmatched} = placementsFromResult(shape, result);
	const saved = placements.map(placement => ({blockId: placement.blockId, orientationId: placement.orientationId, translation: placement.translation}));
	process.stdout.write(JSON.stringify({...result, placements: saved, unmatched, loadMs, callMs: elapsed}) + "\n");
};

main().catch(error => {
	console.error(error);
	process.exit(1);
});
