import {Placement, Shape, SolveOptions, SolveResult} from "./types";

const shuffled = <T>(items: T[], options: SolveOptions): T[] => {
	if (!options.random)
		return items;
	const random = options.randomFn || Math.random;
	const result = items.slice();
	for (let i = result.length - 1; i > 0; --i) {
		const j = Math.floor(random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
};

const sameArray = (a: number[], b: number[]): boolean => a.length === b.length && a.every((value, index) => value === b[index]);
const samePlacement = (a: Placement, b: Placement): boolean => a.blockId === b.blockId && a.orientationId === b.orientationId &&
	a.translation[0] === b.translation[0] && a.translation[1] === b.translation[1] && sameArray(a.indices, b.indices);

export const validatePlacements = (shape: Shape, placements: Placement[]): boolean => {
	const used = new Set<number>();
	const occupied = new Set<number>();
	for (const placement of placements) {
		const candidates = shape.placements[placement.blockId];
		if (!candidates || used.has(placement.blockId) || !candidates.some(candidate => samePlacement(candidate, placement)))
			return false;
		used.add(placement.blockId);
		for (const index of placement.indices) {
			if (index < 0 || index >= shape.boardPoints.length || occupied.has(index))
				return false;
			occupied.add(index);
		}
	}
	return true;
};

interface SearchState {
	occupied: Set<number>;
	used: Set<number>;
	selected: Map<number, Placement>;
	best: Placement[];
	nodes: number;
	stopped: boolean;
}

const createState = (shape: Shape, initial: Placement[]): SearchState => {
	const state: SearchState = {occupied: new Set(), used: new Set(), selected: new Map(), best: [], nodes: 0, stopped: false};
	for (const placement of initial) {
		if (!validatePlacements(shape, [placement]) || state.used.has(placement.blockId) || placement.indices.some(index => state.occupied.has(index)))
			continue;
		state.used.add(placement.blockId);
		state.selected.set(placement.blockId, placement);
		placement.indices.forEach(index => state.occupied.add(index));
	}
	state.best = Array.from(state.selected.values());
	return state;
};

const updateBest = (state: SearchState): void => {
	if (state.occupied.size > state.best.reduce((sum, placement) => sum + placement.indices.length, 0))
		state.best = Array.from(state.selected.values());
};

const searchNode = (shape: Shape, state: SearchState, options: SolveOptions): boolean => {
	++state.nodes;
	updateBest(state);
	if (state.occupied.size === shape.boardPoints.length)
		return true;
	if (state.nodes >= (options.maxNodes || 250000) || Date.now() - (options.startedAt || Date.now()) > (options.timeLimitMs || 1500) || options.shouldCancel?.()) {
		state.stopped = true;
		return false;
	}
	let key = -1;
	for (let index = 0; index < shape.boardPoints.length; ++index) {
		if (!state.occupied.has(index)) {
			key = index;
			break;
		}
	}
	if (key < 0)
		return true;
	const candidates: Placement[] = [];
	for (let blockId = 0; blockId < shape.blocks.length; ++blockId) {
		if (state.used.has(blockId))
			continue;
		for (const placement of shape.placements[blockId]) {
			if (placement.indices.includes(key) && placement.indices.every(index => !state.occupied.has(index)))
				candidates.push(placement);
		}
	}
	for (const placement of shuffled(candidates, options)) {
		state.used.add(placement.blockId);
		state.selected.set(placement.blockId, placement);
		placement.indices.forEach(index => state.occupied.add(index));
		if (searchNode(shape, state, options))
			return true;
		placement.indices.forEach(index => state.occupied.delete(index));
		state.selected.delete(placement.blockId);
		state.used.delete(placement.blockId);
		if (state.stopped)
			return false;
	}
	return false;
};

const resultFrom = (shape: Shape, state: SearchState, complete: boolean, cancelled: boolean): SolveResult => {
	const placements = complete ? Array.from(state.selected.values()) : state.best;
	const covered = new Set(placements.flatMap(placement => placement.indices)).size;
	return {placements, status: complete ? "complete" : cancelled ? "cancelled" : "partial", complete, covered, remaining: shape.boardPoints.length - covered, nodes: state.nodes, cancelled};
};

export const solve = (shape: Shape, initial: Placement[] = [], options: SolveOptions = {}): SolveResult => {
	const state = createState(shape, initial);
	const complete = searchNode(shape, state, {...options, startedAt: Date.now()});
	return resultFrom(shape, state, complete, Boolean(options.shouldCancel?.()));
};

const searchNodeAsync = async (shape: Shape, state: SearchState, options: SolveOptions): Promise<boolean> => {
	++state.nodes;
	updateBest(state);
	if (state.occupied.size === shape.boardPoints.length)
		return true;
	if (state.nodes % 1000 === 0)
		await new Promise(resolve => setTimeout(resolve, 0));
	if (state.nodes >= (options.maxNodes || 250000) || Date.now() - (options.startedAt || Date.now()) > (options.timeLimitMs || 1500) || options.shouldCancel?.()) {
		state.stopped = true;
		return false;
	}
	let key = -1;
	for (let index = 0; index < shape.boardPoints.length; ++index) {
		if (!state.occupied.has(index)) {
			key = index;
			break;
		}
	}
	if (key < 0)
		return true;
	const candidates: Placement[] = [];
	for (let blockId = 0; blockId < shape.blocks.length; ++blockId) {
		if (state.used.has(blockId))
			continue;
		for (const placement of shape.placements[blockId]) {
			if (placement.indices.includes(key) && placement.indices.every(index => !state.occupied.has(index)))
				candidates.push(placement);
		}
	}
	for (const placement of shuffled(candidates, options)) {
		state.used.add(placement.blockId);
		state.selected.set(placement.blockId, placement);
		placement.indices.forEach(index => state.occupied.add(index));
		if (await searchNodeAsync(shape, state, options))
			return true;
		placement.indices.forEach(index => state.occupied.delete(index));
		state.selected.delete(placement.blockId);
		state.used.delete(placement.blockId);
		if (state.stopped)
			return false;
	}
	return false;
};

export const solveAsync = async (shape: Shape, initial: Placement[] = [], options: SolveOptions = {}): Promise<SolveResult> => {
	const state = createState(shape, initial);
	const asyncOptions = {...options, startedAt: Date.now()};
	const complete = await searchNodeAsync(shape, state, asyncOptions);
	return resultFrom(shape, state, complete, Boolean(options.shouldCancel?.()));
};

export const randomSolution = (shape: Shape, initial: Placement[] = []): SolveResult => solve(shape, initial, {random: true, timeLimitMs: 5000, maxNodes: 1000000});
export const nearestSolution = (shape: Shape, initial: Placement[] = []): SolveResult => solve(shape, initial, {timeLimitMs: 3000, maxNodes: 500000});
export const randomSolutionAsync = (shape: Shape, initial: Placement[] = [], options: SolveOptions = {}): Promise<SolveResult> => solveAsync(shape, initial, {...options, random: true, timeLimitMs: options.timeLimitMs || 5000, maxNodes: options.maxNodes || 1000000});
export const nearestSolutionAsync = (shape: Shape, initial: Placement[] = [], options: SolveOptions = {}): Promise<SolveResult> => solveAsync(shape, initial, {...options, timeLimitMs: options.timeLimitMs || 3000, maxNodes: options.maxNodes || 500000});
