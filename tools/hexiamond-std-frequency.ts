/* Exhaustively traverse every solution of the standard hexiamond board and, for each of the 12
 * blocks, count how often each distinct PLACEMENT (position = orientation + translation) is used
 * across all solutions.
 *
 * Orientation model matches the reference Python (HexagonBlocks): a piece's orientations are
 * exactly its listed patterns rotated `spin` times — NO auto-reflection. Chirality is encoded in
 * the data (flippable pieces list both chiralities as two patterns; the one-sided Bar lists one).
 * This differs from the app's geometry.ts::makeOrientations, which auto-mirrors every piece and so
 * doubles the chiral Bar's orientations (3 -> 6), doubling the solution count (5885 -> 11770).
 *
 * Run: npx ts-node --project ./tsconfig.node.json tools/hexiamond-std-frequency.ts
 * Writes: static/hexiamond-std-frequency.json
 */
import {writeFileSync, mkdirSync} from "fs";
import {resolve} from "path";
import {inBoard, packPoint, pointKey, rotatePoint} from "../app/hexiamond/geometry";
import {RAW_SHAPES} from "../app/hexiamond/data";
import {Orientation, PackedPoint, Placement, Point, Shape} from "../app/hexiamond/types";

// --- Reference-faithful shape builder: rotation only, no reflection. ---
const normalize = (points: PackedPoint[]): PackedPoint[] => {
	const minX = Math.min(...points.map(point => point[0]));
	const minY = Math.min(...points.map(point => point[1]));
	const shiftX = Math.floor(minX / 2) * 2;
	return points
		.map(point => [point[0] - shiftX, point[1] - minY] as PackedPoint)
		.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
};

const buildReferenceShape = (id: string): Shape => {
	const raw = RAW_SHAPES.find(shape => shape.id === id) || RAW_SHAPES[0];
	const boardPoints: PackedPoint[] = [];
	for (let y = 0; y < raw.board.length; ++y) {
		for (let x = 0; x < raw.board[y].length; ++x) {
			if (raw.board[y][x] > 0)
				boardPoints.push([x, y]);
		}
	}
	const boardPointIndex = new Map(boardPoints.map((point, index) => [pointKey(point), index]));
	const blocks = raw.blocks.map(block => {
		const orientations: Orientation[] = [];
		for (const pattern of block.patterns) {
			const source = pattern.map(point => point as Point);
			for (let spin = 0; spin < block.spin; ++spin) {
				const points = normalize(source.map(point => packPoint(rotatePoint(point, spin))));
				const key = points.map(pointKey).join(";");
				if (!orientations.some(orientation => orientation.points.map(pointKey).join(";") === key))
					orientations.push({points});
			}
		}
		return {id: block.id, name: block.name, color: block.color, orientations, orientationGraph: {cw: [], ccw: [], mirror: []}};
	});
	const placements = blocks.map(block => {
		const entries: Placement[] = [];
		block.orientations.forEach((orientation, orientationId) => {
			for (let x = -14; x < raw.board.reduce((max, row) => Math.max(max, row.length), 0) + 14; x += 2) {
				for (let y = -8; y < raw.board.length + 8; ++y) {
					const points = orientation.points.map(point => [point[0] + x, point[1] + y] as PackedPoint);
					if (points.every(point => inBoard(point, raw.board))) {
						entries.push({
							blockId: block.id,
							orientationId,
							translation: [x / 2, y],
							indices: points.map(point => boardPointIndex.get(pointKey(point)) as number),
							points,
						});
					}
				}
			}
		});
		return entries;
	});
	return {id: raw.id, name: raw.name, blocks, board: raw.board, boardPoints, boardPointIndex, placements};
};

const shape = buildReferenceShape("std");
const cellCount = shape.boardPoints.length; // 72
const blockCount = shape.blocks.length; // 12

// Represent each placement's cell-set as a BigInt bitmask over `cellCount` bits.
interface Cand {
	blockId: number;
	placementId: number; // index into shape.placements[blockId]
	indices: number[];
	mask: bigint;
}

const candidates: Cand[] = [];
for (let blockId = 0; blockId < blockCount; ++blockId) {
	shape.placements[blockId].forEach((placement, placementId) => {
		let mask = 0n;
		for (const index of placement.indices)
			mask |= 1n << BigInt(index);
		candidates.push({blockId, placementId, indices: placement.indices, mask});
	});
}

// For each cell, the candidate placements that cover it.
const byCell: Cand[][] = Array.from({length: cellCount}, () => []);
for (const cand of candidates) {
	for (const index of cand.indices)
		byCell[index].push(cand);
}

// Per-block per-placement usage count: freq[blockId][placementId].
const freq: number[][] = shape.placements.map(entries => new Array(entries.length).fill(0));

let solutions = 0;
let nodes = 0;
const chosen: Cand[] = [];

const fullMask = (1n << BigInt(cellCount)) - 1n;

// Choose the uncovered cell with the fewest available candidates (MRV heuristic).
const search = (occupied: bigint, usedBlocks: number): void => {
	++nodes;
	if (occupied === fullMask) {
		++solutions;
		for (const cand of chosen)
			++freq[cand.blockId][cand.placementId];
		return;
	}
	let bestCell = -1;
	let bestList: Cand[] | null = null;
	let bestLen = Infinity;
	for (let index = 0; index < cellCount; ++index) {
		if ((occupied >> BigInt(index)) & 1n)
			continue;
		let count = 0;
		const list = byCell[index];
		for (const cand of list) {
			if (!(usedBlocks & (1 << cand.blockId)) && (cand.mask & occupied) === 0n)
				++count;
		}
		if (count === 0)
			return; // dead end: an uncoverable cell.
		if (count < bestLen) {
			bestLen = count;
			bestCell = index;
			bestList = list;
			if (count === 1)
				break;
		}
	}
	if (bestCell < 0 || !bestList)
		return;
	for (const cand of bestList) {
		if ((usedBlocks & (1 << cand.blockId)) || (cand.mask & occupied) !== 0n)
			continue;
		chosen.push(cand);
		search(occupied | cand.mask, usedBlocks | (1 << cand.blockId));
		chosen.pop();
	}
};

const startedAt = Date.now();
search(0n, 0);
const elapsed = Date.now() - startedAt;

console.log(`Standard board: ${cellCount} cells, ${blockCount} blocks, ${candidates.length} candidate placements.`);
console.log(`Total solutions: ${solutions}`);
console.log(`Search nodes: ${nodes}, elapsed ${elapsed} ms.`);

// Sanity: each block is used exactly once per solution, so the sum of a block's placement
// frequencies equals the total number of solutions.
for (let blockId = 0; blockId < blockCount; ++blockId) {
	const sum = freq[blockId].reduce((a, b) => a + b, 0);
	console.assert(sum === solutions, `block ${blockId} placement-freq sum ${sum} != ${solutions}`);
}

const output = {
	shape: shape.id,
	cellCount,
	solutions,
	boardPoints: shape.boardPoints,
	blocks: shape.blocks.map(block => ({
		id: block.id,
		name: block.name,
		color: block.color,
		// One entry per candidate placement of this block: its cell indices + how many
		// solutions use it. Positions with count 0 never appear in any solution.
		placements: shape.placements[block.id].map((placement, placementId) => ({
			orientationId: placement.orientationId,
			translation: placement.translation,
			indices: placement.indices,
			points: placement.points,
			count: freq[block.id][placementId],
		})),
	})),
};

const outDir = resolve(__dirname, "../static");
mkdirSync(outDir, {recursive: true});
const outPath = resolve(outDir, "hexiamond-std-frequency.json");
writeFileSync(outPath, JSON.stringify(output));
console.log(`Wrote ${outPath}`);
