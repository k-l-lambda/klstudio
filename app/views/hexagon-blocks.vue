<template>
	<div class="hexagon-blocks">
		<header class="toolbar">
			<label>Board
				<select v-model="shapeId" @change="resetShape">
					<option v-for="shape of shapeOptions" :key="shape.id" :value="shape.id">{{ shape.name }}</option>
				</select>
			</label>
			<button :disabled="!history.canUndo" @click="undo">Undo</button>
			<button :disabled="!history.canRedo" @click="redo">Redo</button>
			<button @click="clearBoard">Clear</button>
			<button :disabled="searching" @click="runRandom">Random solution</button>
			<button :disabled="searching" @click="runNearest">Nearest solution</button>
			<button v-if="searching" @click="cancelSearch">Cancel</button>
		</header>
		<div class="workspace">
			<section class="board-panel">
				<svg ref="board" class="board" :viewBox="viewBox" role="img" aria-label="Hexagon Blocks board"
					@dragover.prevent @drop.prevent="dropOnBoard($event)"
					@pointermove="moveBlock" @pointerup="finishBlockPointer" @pointercancel="cancelBlockPointer">
					<polygon v-for="cell of boardCells" :key="cell.key" :points="cell.points"
						:class="{covered: coveredCells.has(cell.index), target: cell.index === hoverIndex}" />
					<g v-for="placement of placements" v-show="dragSource !== 'placed' || placement.blockId !== dragBlockId" :key="placement.blockId" class="placed"
						:style="{color: blockById(placement.blockId).color}"
						@pointerdown="startPlacedPointer($event, placement)" @click="removePlacementAfterClick($event, placement.blockId)">
						<polygon v-for="(point, index) of polygonsFor(placement)" :key="index" :points="point" />
					</g>
					<g v-if="dragPreview" class="drag-preview" :class="{invalid: !dragPreviewLegal}"
						:style="{color: blockById(dragBlockId).color}">
						<polygon v-for="(point, index) of polygonsFor(dragPreview)" :key="index" :points="point" />
					</g>
				</svg>
				<p class="status">{{ status }}</p>
			</section>
			<aside class="palette">
				<h2>Blocks</h2>
				<div v-for="block of availableBlocks" :key="block.id" class="block"
					:style="{borderColor: block.color}"
					@pointerdown="startPalettePointer($event, block.id)" @pointermove="moveBlock"
					@pointerup="finishBlockPointer" @pointercancel="cancelBlockPointer"
					@click="selectBlockAfterClick(block.id)">
					<svg class="thumbnail" :viewBox="thumbnailViewBox(block)" aria-hidden="true">
						<polygon v-for="(point, index) of polygonsForPoints(block.orientations[0].points)" :key="index" :points="point" :style="{fill: block.color}" />
					</svg>
					<strong>{{ block.id + 1 }}</strong> {{ block.name }}
				</div>
				<p>{{ coveredCells.size }} / {{ shape.boardPoints.length }} triangles covered</p>
				<p>Click a placed block to remove it.</p>
			</aside>
		</div>
	</div>
</template>

<script lang="ts">
	import {defineComponent, markRaw} from "vue";
	import {History} from "../hexagonBlocks/history";
	import {boardViewBox, buildShape, nearestPlacement, normalizedOrientation, pointKey, ScreenPoint, triangleVertices, viewBoxForPoints} from "../hexagonBlocks/geometry";
	import {nearestSolutionAsync, randomSolutionAsync, validatePlacements} from "../hexagonBlocks/solver";
	import {Placement, Shape} from "../hexagonBlocks/types";
	import {RAW_SHAPES} from "../hexagonBlocks/data";

	export default defineComponent({
		name: "hexagon-blocks",
		data () {
			const shape = markRaw(buildShape("std"));
			return {
				shapeId: shape.id,
				shape,
				shapeOptions: RAW_SHAPES,
				placements: [] as Placement[],
				history: new History({placements: []}),
				draggedBlock: -1,
				dragBlockId: -1,
				dragSource: "" as "" | "palette" | "placed",
				dragPointerId: -1,
				dragButton: -1,
				dragStartX: 0,
				dragStartY: 0,
				dragLastY: 0,
				dragRotationDelta: 0,
				dragOrientation: 0,
				dragPreview: null as Placement | null,
				dragPreviewLegal: false,
				dragMoved: false,
				suppressPlacedClick: false,
				selectedBlock: -1,
				hoverIndex: -1,
				searching: false,
				cancelled: false,
				status: "Select a block or drag one onto the board.",
			};
		},
		computed: {
			availableBlocks (): any[] {
				const used = new Set(this.placements.map(placement => placement.blockId));
				return (this.shape as Shape).blocks.filter(block => !used.has(block.id));
			},
			coveredCells (): Set<number> {
				return new Set(this.placements.flatMap(placement => placement.indices));
			},
			boardCells (): any[] {
				return (this.shape as Shape).boardPoints.map((point, index) => ({
					key: pointKey(point), index, points: this.cellPolygon(point),
				}));
			},
			viewBox (): string {
				const shape = this.shape as Shape;
				return boardViewBox(shape);
			},
		},
		methods: {
			blockById (id: number): any {
				return (this.shape as Shape).blocks[id]; 
			},
			cellPolygon (point: [number, number]): string {
				return triangleVertices(point).map(item => item.join(",")).join(" ");
			},
			polygonsFor (placement: Placement): string[] {
				return this.polygonsForPoints(placement.points);
			},
			polygonsForPoints (points: [number, number][]): string[] {
				return points.map(point => this.cellPolygon(point));
			},
			thumbnailViewBox (block: any): string {
				return viewBoxForPoints(block.orientations[0].points, 8);
			},
			pointerTarget (event: PointerEvent): ScreenPoint | null {
				const board = this.$refs.board as SVGSVGElement;
				const matrix = board.getScreenCTM();
				if (!matrix)
					return null;
				const point = board.createSVGPoint();
				point.x = event.clientX;
				point.y = event.clientY;
				const target = point.matrixTransform(matrix.inverse());
				return [target.x, target.y];
			},
			legalCandidates (blockId: number, orientationId: number): Placement[] {
				const others = this.placements.filter(placement => placement.blockId !== blockId);
				return (this.shape as Shape).placements[blockId].filter(placement =>
					placement.orientationId === orientationId && validatePlacements(this.shape as Shape, [...others, placement]));
			},
			updateDragPreview (event: PointerEvent): void {
				const target = this.pointerTarget(event);
				if (!target || this.dragBlockId < 0)
					return;
				const candidate = nearestPlacement(this.legalCandidates(this.dragBlockId, this.dragOrientation), target);
				this.dragPreview = candidate;
				this.dragPreviewLegal = Boolean(candidate);
			},
			startPlacedPointer (event: PointerEvent, placement: Placement): void {
				if (event.button !== 0 && event.button !== 1)
					return;
				event.preventDefault();
				(event.currentTarget as Element).setPointerCapture(event.pointerId);
				this.dragBlockId = placement.blockId;
				this.dragSource = "placed";
				this.dragPointerId = event.pointerId;
				this.dragButton = event.button;
				this.dragStartX = event.clientX;
				this.dragStartY = event.clientY;
				this.dragLastY = event.clientY;
				this.dragRotationDelta = 0;
				this.dragOrientation = placement.orientationId;
				this.dragPreview = placement;
				this.dragPreviewLegal = true;
				this.dragMoved = false;
				this.suppressPlacedClick = event.button === 1;
				this.status = event.button === 1 ? "Move vertically to rotate; release to snap." : "Drag block; release to snap.";
			},
			moveBlock (event: PointerEvent): void {
				if (event.pointerId !== this.dragPointerId)
					return;
				if (Math.hypot(event.clientX - this.dragStartX, event.clientY - this.dragStartY) >= 4) {
					this.dragMoved = true;
					this.suppressPlacedClick = true;
				}
				if (this.dragButton === 1) {
					this.dragRotationDelta += event.clientY - this.dragLastY;
					const count = this.blockById(this.dragBlockId).orientations.length;
					while (Math.abs(this.dragRotationDelta) >= 28) {
						const direction = this.dragRotationDelta > 0 ? 1 : -1;
						this.dragOrientation = normalizedOrientation(this.dragOrientation + direction, count);
						this.dragRotationDelta -= direction * 28;
					}
				}
				this.dragLastY = event.clientY;
				this.updateDragPreview(event);
			},
			finishBlockPointer (event: PointerEvent): void {
				if (event.pointerId !== this.dragPointerId)
					return;
				this.updateDragPreview(event);
				const preview = this.dragPreview;
				const original = this.placements.find(placement => placement.blockId === this.dragBlockId);
				if (preview && (this.dragMoved || this.dragButton === 1) && preview !== original) {
					this.placements = [...this.placements.filter(placement => placement.blockId !== this.dragBlockId), preview];
					this.commit(this.dragButton === 1 ? "Block rotated and snapped." : "Block moved and snapped.");
				}
				else if (this.dragMoved || this.dragButton === 1)
					this.status = preview ? "Block returned to its current position." : "No legal placement nearby; block restored.";
				this.clearBlockPointer();
			},
			cancelBlockPointer (event: PointerEvent): void {
				if (event.pointerId === this.dragPointerId) {
					this.status = "Block move cancelled.";
					this.suppressPlacedClick = true;
					this.clearBlockPointer();
				}
			},
			clearBlockPointer (): void {
				this.dragBlockId = -1;
				this.dragSource = "";
				this.dragPointerId = -1;
				this.dragButton = -1;
				this.dragPreview = null;
				this.dragPreviewLegal = false;
			},
			removePlacementAfterClick (event: MouseEvent, blockId: number): void {
				if (this.suppressPlacedClick) {
					this.suppressPlacedClick = false;
					return;
				}
				this.removePlacement(blockId);
			},
			startPalettePointer (event: PointerEvent, blockId: number): void {
				if (event.button !== 0 && event.button !== 1)
					return;
				event.preventDefault();
				(event.currentTarget as Element).setPointerCapture(event.pointerId);
				this.dragBlockId = blockId;
				this.dragSource = "palette";
				this.dragPointerId = event.pointerId;
				this.dragButton = event.button;
				this.dragStartX = event.clientX;
				this.dragStartY = event.clientY;
				this.dragLastY = event.clientY;
				this.dragRotationDelta = 0;
				this.dragOrientation = 0;
				this.dragPreview = null;
				this.dragPreviewLegal = false;
				this.dragMoved = false;
				this.suppressPlacedClick = event.button === 1;
				this.status = event.button === 1 ? "Move vertically to rotate; release over the board." : "Drag block onto the board.";
			},
			selectBlockAfterClick (id: number): void {
				if (this.suppressPlacedClick) {
					this.suppressPlacedClick = false;
					return;
				}
				this.selectBlock(id);
			},
			startDrag (id: number): void {
				this.draggedBlock = id; 
			},
			selectBlock (id: number): void {
				this.selectedBlock = id; this.status = `Block ${id + 1} selected; click a board triangle.`; 
			},
			dropOnBoard (): void {
				if (this.draggedBlock >= 0) this.placeBlock(this.draggedBlock); this.draggedBlock = -1; 
			},
			placeBlock (blockId: number): void {
				const placement = (this.shape as Shape).placements[blockId][0];
				if (!placement) return;
				if (this.placements.some(item => item.blockId === blockId)) {
					this.status = "That block is already placed."; return; 
				}
				if (this.placements.some(item => item.indices.some(index => placement.indices.includes(index)))) {
					this.status = "That placement overlaps another block."; return; 
				}
				this.placements = [...this.placements, placement];
				this.commit("Block placed.");
			},
			removePlacement (blockId: number): void {
				this.placements = this.placements.filter(placement => placement.blockId !== blockId); this.commit("Block removed."); 
			},
			commit (message: string): void {
				this.history.push({placements: this.placements}); this.status = message; 
			},
			apply (result: any): void {
				if (result.status === "cancelled") {
					this.status = "Search cancelled; current arrangement retained.";
					return;
				}
				this.placements = result.placements;
				this.commit(result.complete ? "Complete solution found." : `Partial arrangement: ${result.covered}/${this.shape.boardPoints.length} triangles covered.`);
			},
			async runRandom (): Promise<void> {
				this.searching = true; this.cancelled = false;
				await new Promise(resolve => setTimeout(resolve, 0));
				try {
					const result = await randomSolutionAsync(this.shape as Shape, [], {shouldCancel: () => this.cancelled});
					if (!this.cancelled) this.apply(result);
				}
				finally {
					this.searching = false;
				}
			},
			async runNearest (): Promise<void> {
				this.searching = true; this.cancelled = false;
				await new Promise(resolve => setTimeout(resolve, 0));
				try {
					const result = await nearestSolutionAsync(this.shape as Shape, this.placements, {shouldCancel: () => this.cancelled});
					if (!this.cancelled) this.apply(result);
				}
				finally {
					this.searching = false;
				}
			},
			cancelSearch (): void {
				this.cancelled = true; this.status = "Search cancelled."; 
			},
			undo (): void {
				this.placements = this.history.undo().placements; this.status = "Undo."; 
			},
			redo (): void {
				this.placements = this.history.redo().placements; this.status = "Redo."; 
			},
			clearBoard (): void {
				this.placements = []; this.commit("Board cleared."); 
			},
			resetShape (): void {
				this.shape = markRaw(buildShape(this.shapeId)); this.placements = []; this.history.reset({placements: []}); this.status = "Board shape changed."; 
			},
		},
	});
</script>

<style scoped>
.hexagon-blocks { min-height: 100%; padding: 1rem; color: #20232a; background: #f5f2e9; }
.toolbar { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; padding-left: 2rem; }
.toolbar h1 { flex: 1 0 100%; margin: 0 0 .5rem; }
button, select { padding: .4rem .65rem; border: 1px solid #777; border-radius: .25rem; background: #fff; cursor: pointer; }
button:disabled { cursor: default; opacity: .45; }
.workspace { display: flex; flex-wrap: wrap; gap: 1rem; max-width: 1100px; margin: 1rem auto; }
.board-panel { flex: 1 1 620px; min-width: 300px; }
.board { display: block; width: 100%; max-height: 70vh; border: 1px solid #b8b09f; background: #fffdf7; touch-action: none; }
.board polygon { fill: #fffdf7; stroke: #d5cdbc; stroke-width: .7; }
.board polygon.covered { fill: #d7d0c0; }
.board polygon.target { fill: #ffe59c; }
.placed { cursor: pointer; opacity: .9; }
.placed polygon { fill: currentColor; stroke: #32291c; stroke-width: .7; }
.drag-preview { pointer-events: none; opacity: .72; }
.drag-preview polygon { fill: currentColor; stroke: #32291c; stroke-width: 1.4; stroke-dasharray: 4 2; }
.drag-preview.invalid { opacity: .35; }
.palette { flex: 0 1 230px; padding: 1rem; background: #fffdf7; border: 1px solid #d5cdbc; }
.palette h2 { margin-top: 0; }
.block { margin: .4rem 0; padding: .55rem; border: 3px solid; border-radius: .35rem; background: #fff; cursor: grab; touch-action: none; user-select: none; }
.thumbnail { display: block; width: 100%; height: 90px; margin-bottom: .35rem; overflow: visible; }
.thumbnail polygon { stroke: #32291c; stroke-width: .7; }
.status { min-height: 1.4em; }
@media (max-width: 640px) { .hexagon-blocks { padding: .5rem; } .palette { flex-basis: 100%; } }
</style>
