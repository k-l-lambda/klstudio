import {RAW_SHAPES, RawBlock} from "./data";
import {Block, Orientation, OrientationGraph, PackedPoint, Placement, Point, Shape} from "./types";

const rotationMatrix: number[][] = [[1, 1], [-1, 0]];

const matrixMultiply = (a: number[][], b: number[][]): number[][] => [
	[
		a[0][0] * b[0][0] + a[0][1] * b[1][0],
		a[0][0] * b[0][1] + a[0][1] * b[1][1],
	],
	[
		a[1][0] * b[0][0] + a[1][1] * b[1][0],
		a[1][0] * b[0][1] + a[1][1] * b[1][1],
	],
];

const matrixPower = (n: number): number[][] => {
	let result = [[1, 0], [0, 1]];
	for (let i = 0; i < n; ++i)
		result = matrixMultiply(result, rotationMatrix);
	return result;
};

export const pointKey = (point: PackedPoint): string => `${point[0]},${point[1]}`;

export const TRIANGLE_SCALE = 42;
export const TRIANGLE_PADDING = 18;

export type ScreenPoint = [number, number];

export interface Bounds {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

export const triangleVertices = (point: PackedPoint, scale = TRIANGLE_SCALE, padding = TRIANGLE_PADDING): ScreenPoint[] => {
	const x = Math.floor(point[0] / 2);
	const y = point[1];
	const parity = ((point[0] % 2) + 2) % 2;
	const shear = (px: number, py: number): ScreenPoint => [
		(px - py / 2) * scale + padding,
		py * Math.sqrt(3) / 2 * scale + padding,
	];
	return [shear(x, y), shear(x + parity, y + 1 - parity), shear(x + 1, y + 1)];
};

export const pointsBounds = (points: PackedPoint[]): Bounds => {
	const vertices = points.flatMap(point => triangleVertices(point));
	return {
		minX: Math.min(...vertices.map(point => point[0])),
		minY: Math.min(...vertices.map(point => point[1])),
		maxX: Math.max(...vertices.map(point => point[0])),
		maxY: Math.max(...vertices.map(point => point[1])),
	};
};

export const viewBoxForPoints = (points: PackedPoint[], margin = TRIANGLE_PADDING): string => {
	const bounds = pointsBounds(points);
	return `${bounds.minX - margin} ${bounds.minY - margin} ${bounds.maxX - bounds.minX + margin * 2} ${bounds.maxY - bounds.minY + margin * 2}`;
};

export const boardViewBox = (shape: Shape): string => viewBoxForPoints(shape.boardPoints);

export const placementCenter = (placement: Placement): ScreenPoint => {
	const vertices = placement.points.flatMap(point => triangleVertices(point));
	return [
		vertices.reduce((sum, point) => sum + point[0], 0) / vertices.length,
		vertices.reduce((sum, point) => sum + point[1], 0) / vertices.length,
	];
};

export const nearestPlacement = (placements: Placement[], target: ScreenPoint): Placement | null => {
	let nearest: Placement | null = null;
	let nearestDistance = Number.POSITIVE_INFINITY;
	for (const placement of placements) {
		const center = placementCenter(placement);
		const distance = (center[0] - target[0]) ** 2 + (center[1] - target[1]) ** 2;
		if (distance < nearestDistance) {
			nearest = placement;
			nearestDistance = distance;
		}
	}
	return nearest;
};

export const normalizedOrientation = (orientation: number, count: number): number => count > 0 ? ((orientation % count) + count) % count : 0;

export const rotatePoint = (point: Point, n: number): Point => {
	const spin = ((n % 6) + 6) % 6;
	const parity = spin % 2 ? 1 - point[2] : point[2];
	const offset: Point = [
		Math.floor((spin + (point[2] ? 1 : 2)) / 3) % 2,
		Math.floor((spin + (point[2] ? 0 : 1)) / 3) % 2,
		0,
	];
	const matrix = matrixPower(spin);
	return [
		point[0] * matrix[0][0] + point[1] * matrix[1][0] - offset[0],
		point[0] * matrix[0][1] + point[1] * matrix[1][1] - offset[1],
		parity,
	];
};

export const packPoint = (point: Point): PackedPoint => [point[0] * 2 + point[2], point[1]];

/** Mirror a triangular lattice point across a vertical axis, preserving up/down parity. */
export const reflectPoint = (point: Point): Point =>
	point[2] ? [point[1] - point[0] - 1, point[1], 1] : [point[1] - point[0], point[1], 0];

const unpackPoint = (point: PackedPoint): Point => [Math.floor(point[0] / 2), point[1], ((point[0] % 2) + 2) % 2];

const normalize = (points: PackedPoint[]): PackedPoint[] => {
	const minX = Math.min(...points.map(point => point[0]));
	const minY = Math.min(...points.map(point => point[1]));
	const shiftX = Math.floor(minX / 2) * 2;
	return points
		.map(point => [point[0] - shiftX, point[1] - minY] as PackedPoint)
		.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
};

export const makeOrientations = (block: RawBlock): Orientation[] => {
	const result: Orientation[] = [];
	const add = (source: Point[]): void => {
		for (let spin = 0; spin < block.spin; ++spin) {
			const points = normalize(source.map(point => packPoint(rotatePoint(point, spin))));
			const key = points.map(pointKey).join(";");
			if (!result.some(orientation => orientation.points.map(pointKey).join(";") === key))
				result.push({points});
		}
	};
	for (const pattern of block.patterns) {
		const source = pattern.map(point => point as Point);
		// Include the reflected chirality so every physical piece can be flipped. This is a
		// no-op for achiral pieces and for pieces whose mirror is already a listed pattern.
		add(source);
		add(source.map(reflectPoint));
	}
	return result;
};

const orientationKey = (points: PackedPoint[]): string => normalize(points).map(pointKey).join(";");

/** Map each orientation to its clockwise, counter-clockwise, and mirrored sibling by index.
 * A transform that leaves the block's orientation set (no distinct sibling exists) maps to itself.
 */
export const makeOrientationGraph = (orientations: Orientation[]): OrientationGraph => {
	const keys = orientations.map(orientation => orientationKey(orientation.points));
	const find = (points: PackedPoint[], fallback: number): number => {
		const index = keys.indexOf(orientationKey(points));
		return index < 0 ? fallback : index;
	};
	return {
		cw: orientations.map((orientation, index) => find(orientation.points.map(point => packPoint(rotatePoint(unpackPoint(point), 1))), index)),
		ccw: orientations.map((orientation, index) => find(orientation.points.map(point => packPoint(rotatePoint(unpackPoint(point), 5))), index)),
		mirror: orientations.map((orientation, index) => find(orientation.points.map(point => packPoint(reflectPoint(unpackPoint(point)))), index)),
	};
};

export const inBoard = (point: PackedPoint, board: number[][]): boolean => {
	const x = point[0];
	return point[0] >= 0 && point[1] >= 0 && point[1] < board.length && x < board[point[1]].length && board[point[1]][x] > 0;
};

export const buildShape = (id: string): Shape => {
	const raw = RAW_SHAPES.find(shape => shape.id === id) || RAW_SHAPES[0];
	const boardPoints: PackedPoint[] = [];
	for (let y = 0; y < raw.board.length; ++y) {
		for (let x = 0; x < raw.board[y].length; ++x) {
			if (raw.board[y][x] > 0) 
				boardPoints.push([x, y]);
			
		}
	}
	const boardPointIndex = new Map(boardPoints.map((point, index) => [pointKey(point), index]));
	const blocks: Block[] = raw.blocks.map(block => {
		const orientations = makeOrientations(block);
		return {
			id: block.id,
			name: block.name,
			color: block.color,
			orientations,
			orientationGraph: makeOrientationGraph(orientations),
		};
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

export const shapes = RAW_SHAPES.map(shape => buildShape(shape.id));
export const shapeById = (id: string): Shape => buildShape(id);
