import {buildShape} from "../app/hexiamond/geometry";
import {History} from "../app/hexiamond/history";
import {nearestSolution, randomSolution, validatePlacements} from "../app/hexiamond/solver";

const shape = buildShape("hexagon4_3");
console.assert(shape.boardPoints.length === 72, "hexagon board cell count mismatch");
console.assert(shape.blocks.length === 12, "block count mismatch");
console.assert(shape.blocks.every(block => block.orientations.length > 0), "missing orientations");

const first = shape.placements[0][0];
console.assert(validatePlacements(shape, [first]), "first placement should be valid");
console.assert(!validatePlacements(shape, [first, first]), "duplicate placement should be invalid");

const history = new History({placements: []});
history.push({placements: [first]});
console.assert(history.canUndo && !history.canRedo, "history push failed");
history.undo();
console.assert(history.canRedo, "history undo failed");
history.redo();
history.push({placements: []});
console.assert(!history.canRedo, "redo branch was not truncated");

const result = randomSolution(shape, []);
console.assert(validatePlacements(shape, result.placements), "solver result is invalid");

const rhombus = buildShape("rhombus");
console.assert(rhombus.boardPoints.length === 72, "rhombus board cell count mismatch");
console.assert(rhombus.placements.every(entries => entries.every(placement => placement.indices.length === 6 && new Set(placement.indices).size === 6)), "rhombus placement indices are invalid");
const rhombusResult = randomSolution(rhombus, []);
console.assert(rhombusResult.complete && rhombusResult.covered === 72 && rhombusResult.remaining === 0, "rhombus solver did not return a complete solution");
console.assert(validatePlacements(rhombus, rhombusResult.placements), "rhombus solver result is invalid");

const nearestInitial = rhombusResult.placements.slice(0, 3);
const nearestResult = nearestSolution(rhombus, nearestInitial, {timeLimitMs: 5000, maxNodes: 1000000});
console.assert(nearestResult.complete && nearestResult.covered === 72 && nearestResult.remaining === 0, "nearest solver did not return a complete solution");
console.assert(validatePlacements(rhombus, nearestResult.placements), "nearest solver result is invalid");
console.assert(nearestResult.movedExisting === 0, "nearest solver moved unchanged blocks");

const cancelledNearest = nearestSolution(rhombus, nearestInitial, {shouldCancel: () => true});
console.assert(cancelledNearest.cancelled && cancelledNearest.status === "cancelled", "nearest cancellation failed");

console.log(`Hexiamond test passed (${result.covered}/${shape.boardPoints.length} cells, ${result.nodes} nodes; rhombus ${rhombusResult.covered}/72).`);
