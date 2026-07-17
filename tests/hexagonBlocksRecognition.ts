import {buildShape} from "../app/hexagonBlocks/geometry";
import {imageTransformForShape, matchRecognitions, matchedPolygon, placementKey, recognizePlacements, recognitionScore, validateRecognitionMatches} from "../app/hexagonBlocks/recognition";
import {RecognitionObservation} from "../app/hexagonBlocks/recognition";

const shape = buildShape("hexagon4_3");
const first = shape.placements[0][0];
const second = shape.placements[1].find(placement => placement.indices.every(index => !first.indices.includes(index))) as typeof first;
console.assert(Boolean(second), "test fixture needs a non-overlapping second placement");
console.assert(placementKey(first) === placementKey({...first, points: first.points.map(point => point.slice() as [number, number])}), "placement key is not stable");
console.assert(recognitionScore({confidence: 2, geometry: 3, color: 4, orientation: 5}) === 14, "recognition score mismatch");

const observations: RecognitionObservation[] = [
	{id: "a", candidates: [{placement: first, score: 10}, {placement: second, score: 1}]},
	{id: "b", candidates: [{placement: first, score: 9}, {placement: second, score: 8}]},
];
const result = matchRecognitions(shape, observations);
console.assert(result.legal && result.matches.length === 2, "global matching did not select legal matches");
console.assert(result.matches[0].observationId === "a" && result.matches[0].placement === first, "global matching did not maximize score");
console.assert(result.score === 18, "global matching score mismatch");
console.assert(result.image === null && result.contours.length === 0 && result.matchedPolygons.length === 0, "pure recognition should not invent image overlay data");
const transform = imageTransformForShape(shape, {width: 1000, height: 800});
const polygon = matchedPolygon({observationId: "a", placement: first, score: 1}, transform);
console.assert(polygon.points.length === first.points.length * 3 && transform.scaleX > 0, "placement transform mismatch");
console.assert(validateRecognitionMatches(shape, result.matches), "recognition result is illegal");
console.assert(recognizePlacements(shape, observations).score === result.score, "recognition alias mismatch");

const conflicting = matchRecognitions(shape, [
	{id: "one", candidates: [{placement: first, score: 4}]},
	{id: "two", candidates: [{placement: first, score: 3}]},
]);
console.assert(conflicting.matches.length === 1 && conflicting.unmatched.length === 1, "conflicting observations were not globally filtered");
console.assert(conflicting.legal, "conflicting result should remain legal");
console.log("Hexagon Blocks recognition test passed.");
