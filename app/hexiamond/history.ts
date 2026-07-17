import {Placement} from "./types";

export interface Snapshot {
	placements: Placement[];
}

const copy = (snapshot: Snapshot): Snapshot => ({placements: snapshot.placements.map(placement => ({
	...placement,
	translation: [...placement.translation] as [number, number],
	indices: [...placement.indices],
	points: placement.points.map(point => [...point] as [number, number]),
}))});

export class History {
	private entries: Snapshot[] = [];
	private index = -1;

	constructor (initial: Snapshot) {
		this.reset(initial);
	}

	reset (initial: Snapshot): void {
		this.entries = [copy(initial)];
		this.index = 0;
	}

	get current (): Snapshot {
		return copy(this.entries[this.index]);
	}

	get canUndo (): boolean {
		return this.index > 0;
	}

	get canRedo (): boolean {
		return this.index + 1 < this.entries.length;
	}

	push (snapshot: Snapshot): void {
		this.entries.splice(this.index + 1);
		this.entries.push(copy(snapshot));
		this.index = this.entries.length - 1;
	}

	undo (): Snapshot {
		if (this.canUndo)
			--this.index;
		return this.current;
	}

	redo (): Snapshot {
		if (this.canRedo)
			++this.index;
		return this.current;
	}
}
