export type Point = [number, number, number];
export type PackedPoint = [number, number];

export interface Orientation {
	points: PackedPoint[];
}

export interface OrientationGraph {
	cw: number[];
	ccw: number[];
	mirror: number[];
}

export interface Block {
	id: number;
	name: string;
	color: string;
	orientations: Orientation[];
	orientationGraph: OrientationGraph;
}

export interface Placement {
	blockId: number;
	orientationId: number;
	translation: [number, number];
	indices: number[];
	points: PackedPoint[];
}

export interface Shape {
	id: string;
	name: string;
	blocks: Block[];
	board: number[][];
	boardPoints: PackedPoint[];
	boardPointIndex: Map<string, number>;
	placements: Placement[][];
}

export interface Arrangement {
	placements: Placement[];
}

export interface SolveOptions {
	maxNodes?: number;
	timeLimitMs?: number;
	random?: boolean;
	randomFn?: () => number;
	shouldCancel?: () => boolean;
	startedAt?: number;
	yieldAt?: number;
}

export type SolveStatus = "complete" | "partial" | "cancelled";

export interface SolveResult extends Arrangement {
	status: SolveStatus;
	complete: boolean;
	covered: number;
	remaining: number;
	nodes: number;
	cancelled: boolean;
	movedExisting: number;
	optimal?: boolean;
}
