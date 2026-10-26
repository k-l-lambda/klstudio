// Recognize a board photo with the wasm recognizer through app/hexiamond/recognizerWasm.ts; print the result and timings.
//   npx ts-node --project ./tsconfig.node.json tests/hexiamondRecognition.ts [image.jpg] [shapeId]
// Default image: footages.local/2026-07-16 23.01.03.jpg (local only, not in the repo; the test is skipped without it).
// Rebuild the module with tools/hexiamond/recognizer/build.sh after changing the C++ sources.
import * as fs from "fs";
import * as path from "path";
import * as jpeg from "jpeg-js";

import {buildShape} from "../app/hexiamond/geometry";
import {instantiateRecognizer, placementsFromResult} from "../app/hexiamond/recognizerWasm";
import {validatePlacements} from "../app/hexiamond/solver";

const ROOT = path.resolve(__dirname, "..");

const main = async (): Promise<void> => {
	const imagePath = path.resolve(process.argv[2] || path.join(ROOT, "footages.local", "2026-07-16 23.01.03.jpg"));
	const shapeId = process.argv[3] || "std";
	if (!fs.existsSync(imagePath)) {
		console.log(`Hexiamond recognition test skipped: ${imagePath} not found.`);
		return;
	}

	let started = Date.now();
	const recognizer = await instantiateRecognizer(fs.readFileSync(path.join(ROOT, "public", "hexiamond-recognizer.wasm")));
	const loadMs = Date.now() - started;

	started = Date.now();
	// jpeg-js does not apply EXIF orientation; the sample photos carry none.
	const image = jpeg.decode(fs.readFileSync(imagePath), {useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 1024});
	const decodeMs = Date.now() - started;

	const shape = buildShape(shapeId);
	started = Date.now();
	const result = recognizer.recognize(image.data, image.width, image.height, shape.board, {channels: 4});
	const recognizeMs = Date.now() - started;

	console.assert(result.ok, `recognition failed: ${result.error}`);
	// A second call on the same instance reuses malloc'd memory; it must see the same board and give the same result.
	const again = recognizer.recognize(image.data, image.width, image.height, shape.board, {channels: 4});
	console.assert(JSON.stringify(again.regions) === JSON.stringify(result.regions), "a repeated recognition gave different regions");
	const {placements, unmatched} = placementsFromResult(shape, result);
	console.assert(validatePlacements(shape, placements), "recognized placements are not a legal board");

	console.log(`image ${path.basename(imagePath)} ${image.width}x${image.height}, shape ${shapeId}`);
	console.log(`segments ${result.segments} (window ${result.window}), modes ${result.modes.map(mode => (mode % 180).toFixed(2)).join("/")}°, `
		+ `${result.projective ? "projective" : "affine"} pose, inliers ${(result.inlierShare * 100).toFixed(1)}%`);
	console.log(`H (board -> input px): [${result.Hsource.map(value => Number(value.toPrecision(6))).join(", ")}]`);
	console.log(`cuts ${result.edges.filter(edge => edge[3]).length}/${result.edges.length}, regions ${result.regions.length}, `
		+ `blank ${result.regions.filter(region => region.blank).length}, unmatched ${unmatched}`);
	for (const placement of placements) {
		const region = result.regions.find(candidate => [...candidate.cells].sort((a, b) => a - b).join(",") === [...placement.indices].sort((a, b) => a - b).join(","));
		const block = shape.blocks[placement.blockId];
		console.log(`  ${block.name.padEnd(6)} id ${String(block.id).padStart(2)}  orientation ${String(placement.orientationId).padStart(2)}  translation [${placement.translation.join(", ")}]`
			+ (region ? `  photo rgb(${region.rgb.join(", ")})` : ""));
	}
	const saved = {shapeId, placements: placements.map(placement => ({blockId: placement.blockId, orientationId: placement.orientationId, translation: placement.translation}))};
	console.log(`saved board: ${JSON.stringify(saved)}`);
	console.log(`timing: wasm load ${loadMs} ms, jpeg decode ${decodeMs} ms, recognize ${recognizeMs} ms (`
		+ Object.entries(result.timing).map(([stage, ms]) => `${stage} ${ms.toFixed(0)}`).join(", ") + ")");
	console.log(`Hexiamond recognition test ${placements.length === 12 ? "passed" : "finished"}: ${placements.length} blocks.`);
};

main().catch(error => {
	console.error(error);
	process.exit(1);
});
