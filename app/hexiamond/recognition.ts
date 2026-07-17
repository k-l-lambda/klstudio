import {placementCenter, triangleVertices} from "./geometry";
import {Placement, Shape} from "./types";

export interface RecognitionCandidate {
	placement: Placement;
	score: number;
}

export interface RecognitionObservation {
	id: string;
	candidates: RecognitionCandidate[];
}

export interface RecognitionMatch {
	observationId: string;
	placement: Placement;
	score: number;
}

export interface RecognitionPoint {
	x: number;
	y: number;
}

export interface RecognitionContour {
	id: string;
	polygon: RecognitionPoint[];
	centroid: RecognitionPoint;
}

export interface RecognitionImageDimensions {
	width: number;
	height: number;
}

export interface RecognitionImageTransform {
	scaleX: number;
	scaleY: number;
	translateX: number;
	translateY: number;
}

export interface RecognitionMatchedPolygon {
	observationId: string;
	placement: Placement;
	points: RecognitionPoint[];
}

export interface RecognitionResult {
	matches: RecognitionMatch[];
	unmatched: string[];
	score: number;
	legal: boolean;
	image: RecognitionImageDimensions | null;
	transform: RecognitionImageTransform | null;
	contours: RecognitionContour[];
	matchedPolygons: RecognitionMatchedPolygon[];
}

export interface RecognitionScoreParts {
	confidence?: number;
	geometry?: number;
	color?: number;
	orientation?: number;
}

/** A stable identity for a placement, independent of object identity or array order. */
export const placementKey = (placement: Placement): string =>
	`${placement.blockId}:${placement.orientationId}:${placement.translation[0]}:${placement.translation[1]}`;

const samePlacement = (a: Placement, b: Placement): boolean => placementKey(a) === placementKey(b);

export const transformPoint = (point: RecognitionPoint, transform: RecognitionImageTransform): RecognitionPoint => ({
	x: point.x * transform.scaleX + transform.translateX,
	y: point.y * transform.scaleY + transform.translateY,
});

export const matchedPolygon = (match: RecognitionMatch, transform: RecognitionImageTransform): RecognitionMatchedPolygon => ({
	observationId: match.observationId,
	placement: match.placement,
	points: match.placement.points.flatMap(point => triangleVertices(point)).map(([x, y]) => transformPoint({x, y}, transform)),
});

/** Fit the rendered board geometry into the source image coordinate space. */
export const imageTransformForShape = (shape: Shape, image: RecognitionImageDimensions): RecognitionImageTransform => {
	const points = shape.boardPoints.flatMap(point => triangleVertices(point));
	const minX = Math.min(...points.map(point => point[0]));
	const maxX = Math.max(...points.map(point => point[0]));
	const minY = Math.min(...points.map(point => point[1]));
	const maxY = Math.max(...points.map(point => point[1]));
	const scale = Math.min(image.width / (maxX - minX), image.height / (maxY - minY));
	return {
		scaleX: scale,
		scaleY: scale,
		translateX: (image.width - (maxX - minX) * scale) / 2 - minX * scale,
		translateY: (image.height - (maxY - minY) * scale) / 2 - minY * scale,
	};
};

export const transformedPlacementCenter = (placement: Placement, transform: RecognitionImageTransform): RecognitionPoint => {
	const center = placementCenter(placement);
	return transformPoint({x: center[0], y: center[1]}, transform);
};

/** Combine independently calculated evidence into one deterministic score. */
export const recognitionScore = (parts: RecognitionScoreParts): number =>
	(parts.confidence || 0) + (parts.geometry || 0) + (parts.color || 0) + (parts.orientation || 0);

const canonicalPlacement = (shape: Shape, placement: Placement): Placement | null => {
	const entries = shape.placements[placement.blockId];
	if (!entries)
		return null;
	return entries.find(candidate => samePlacement(candidate, placement)) || null;
};

/** Check that matches form one legal, non-overlapping global arrangement. */
export const validateRecognitionMatches = (shape: Shape, matches: RecognitionMatch[]): boolean => {
	const blocks = new Set<number>();
	const cells = new Set<number>();
	for (const match of matches) {
		const placement = canonicalPlacement(shape, match.placement);
		if (!placement || blocks.has(placement.blockId))
			return false;
		blocks.add(placement.blockId);
		for (const index of placement.indices) {
			if (index < 0 || index >= shape.boardPoints.length || cells.has(index))
				return false;
			cells.add(index);
		}
	}
	return true;
};

const candidateOrder = (a: RecognitionCandidate, b: RecognitionCandidate): number =>
	b.score - a.score || placementKey(a.placement).localeCompare(placementKey(b.placement));

/**
 * Globally match photo observations to legal placements.
 * Every observation may be omitted, but each selected placement must use a distinct
 * block and distinct board cells. Ties are resolved by observation order and key.
 */
export const matchRecognitions = (shape: Shape, observations: RecognitionObservation[]): RecognitionResult => {
	const normalized = observations.map(observation => ({
		...observation,
		candidates: observation.candidates
			.map(candidate => ({...candidate, placement: canonicalPlacement(shape, candidate.placement)}))
			.filter((candidate): candidate is RecognitionCandidate & {placement: Placement} => candidate.placement !== null)
			.sort(candidateOrder),
	}));
	let best: RecognitionMatch[] = [];
	let bestScore = 0;
	const search = (index: number, usedBlocks: Set<number>, usedCells: Set<number>, matches: RecognitionMatch[], score: number): void => {
		if (index === normalized.length) {
			if (score > bestScore || score === bestScore && matches.length > best.length) {
				best = matches.slice();
				bestScore = score;
			}
			return;
		}
		search(index + 1, usedBlocks, usedCells, matches, score);
		const observation = normalized[index];
		for (const candidate of observation.candidates) {
			const placement = candidate.placement;
			if (usedBlocks.has(placement.blockId) || placement.indices.some(cell => usedCells.has(cell)))
				continue;
			usedBlocks.add(placement.blockId);
			placement.indices.forEach(cell => usedCells.add(cell));
			matches.push({observationId: observation.id, placement, score: candidate.score});
			search(index + 1, usedBlocks, usedCells, matches, score + candidate.score);
			matches.pop();
			placement.indices.forEach(cell => usedCells.delete(cell));
			usedBlocks.delete(placement.blockId);
		}
	};
	search(0, new Set(), new Set(), [], 0);
	return {
		matches: best,
		unmatched: normalized.filter(observation => !best.some(match => match.observationId === observation.id)).map(observation => observation.id),
		score: bestScore,
		legal: validateRecognitionMatches(shape, best),
		image: null,
		transform: null,
		contours: [],
		matchedPolygons: [],
	};
};

export const recognizePlacements = matchRecognitions;
