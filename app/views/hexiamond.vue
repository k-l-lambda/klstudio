<template>
	<div class="hexiamond">
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
			<label class="photo-button">Recognize photo<input type="file" accept="image/*" @change="selectPhoto" /></label>
		</header>
		<section v-if="photoUrl" class="photo-panel" aria-live="polite">
			<div class="photo-preview">
				<img :src="photoUrl" alt="Selected puzzle photo" />
				<svg v-if="photoResult && photoResult.image" class="photo-overlay"
					:viewBox="`0 0 ${photoResult.image.width} ${photoResult.image.height}`" aria-label="Recognition contour overlay">
					<g v-for="polygon of photoResult.matchedPolygons" :key="`match-${polygon.observationId}`" class="photo-match" :style="{color: blockById(polygon.placement.blockId).color}">
						<polygon :points="photoContourPoints(polygon.points)" />
					</g>
					<g v-for="contour of photoResult.contours" :key="contour.id"
						:class="['photo-contour', {matched: isMatchedContour(contour.id), unmatched: !isMatchedContour(contour.id)}]">
						<polygon :points="photoContourPoints(contour.polygon)" />
						<circle :cx="contour.centroid.x" :cy="contour.centroid.y" r="4" />
					</g>
				</svg>
			</div>
			<p v-if="recognizing" class="photo-status">Recognizing...</p>
			<p v-else-if="photoResult" class="photo-status">
				<strong>{{ photoResult.matches.length }} matched</strong>
				<span>{{ photoResult.unmatched.length }} unmatched</span>
				<span>{{ photoResult.contours.length }} retained contours</span>
			</p>
			<div class="photo-actions">
				<button :disabled="recognizing || !photoResult || !photoResult.legal" @click="applyPhoto">Apply</button>
				<button @click="discardPhoto">Discard</button>
			</div>
		</section>
		<div class="workspace">
			<section class="board-panel">
				<svg ref="board" class="board" :viewBox="viewBox" role="img" aria-label="Hexiamond board"
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
	import {History} from "../hexiamond/history";
	import {boardViewBox, buildShape, nearestPlacement, normalizedOrientation, pointKey, ScreenPoint, triangleVertices, viewBoxForPoints} from "../hexiamond/geometry";
	import {nearestSolutionAsync, randomSolutionAsync, validatePlacements} from "../hexiamond/solver";
	import {Placement, Shape} from "../hexiamond/types";
	import {RAW_SHAPES} from "../hexiamond/data";
	import {recognizePhotoCv} from "../hexiamond/recognitionCv";
	import {RecognitionPoint, RecognitionResult} from "../hexiamond/recognition";

	export default defineComponent({
		name: "hexiamond",
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
				photoUrl: "",
				photoResult: null as RecognitionResult | null,
				recognizing: false,
				photoToken: 0,
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
		beforeUnmount () {
			this.discardPhoto();
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
			apply (result: any, nearest = false): void {
				if (result.status === "cancelled") {
					this.status = "Search cancelled; current arrangement retained.";
					return;
				}
				if (nearest && !result.complete) {
					this.status = "No complete nearest solution found within the search limit; current arrangement retained.";
					return;
				}
				this.placements = result.placements;
				this.commit(nearest ? `Complete nearest solution found; moved ${result.movedExisting} existing blocks.` : result.complete ? "Complete solution found." : `Partial arrangement: ${result.covered}/${this.shape.boardPoints.length} triangles covered.`);
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
					if (!this.cancelled) this.apply(result, true);
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
			photoContourPoints (polygon: RecognitionPoint[]): string {
				return polygon.map(point => `${point.x},${point.y}`).join(" ");
			},
			isMatchedContour (id: string): boolean {
				return Boolean(this.photoResult && this.photoResult.matches.some(match => match.observationId === id));
			},
			selectPhoto (event: Event): void {
				const input = event.target as HTMLInputElement;
				const file = input.files && input.files[0];
				if (!file)
					return;
				this.discardPhoto();
				const token = this.photoToken;
				this.photoUrl = URL.createObjectURL(file);
				const image = new Image();
				image.onload = async () => {
					if (token !== this.photoToken)
						return;
					this.recognizing = true;
					this.status = "Recognizing photo...";
					try {
						const result = await recognizePhotoCv(image, this.shape as Shape);
						if (token !== this.photoToken)
							return;
						this.photoResult = result;
						this.status = "Photo recognized; review the contour overlay before applying.";
					}
					catch (error) {
						if (token === this.photoToken)
							this.status = `Photo recognition failed: ${error instanceof Error ? error.message : error}`;
					}
					finally {
						if (token === this.photoToken)
							this.recognizing = false;
					}
				};
				image.onerror = () => {
					if (token === this.photoToken) {
						this.recognizing = false;
						this.status = "Photo could not be loaded.";
					}
				};
				image.src = this.photoUrl;
				input.value = "";
			},
			applyPhoto (): void {
				if (!this.photoResult || !this.photoResult.legal)
					return;
				this.placements = this.photoResult.matches.map(match => match.placement);
				this.commit("Photo recognition applied.");
				this.discardPhoto();
			},
			discardPhoto (): void {
				this.photoToken++;
				if (this.photoUrl)
					URL.revokeObjectURL(this.photoUrl);
				this.photoUrl = "";
				this.photoResult = null;
				this.recognizing = false;
			},
			resetShape (): void {
				this.discardPhoto();
				this.shape = markRaw(buildShape(this.shapeId)); this.placements = []; this.history.reset({placements: []}); this.status = "Board shape changed.";
			},
		},
	});
</script>

<style scoped>
.hexiamond { min-height: 100%; padding: 1rem; color: #20232a; background: #f5f2e9; }
.toolbar { display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; padding-left: 2rem; }
.toolbar h1 { flex: 1 0 100%; margin: 0 0 .5rem; }
button, select { padding: .4rem .65rem; border: 1px solid #777; border-radius: .25rem; background: #fff; cursor: pointer; }
button:disabled { cursor: default; opacity: .45; }
.photo-button { padding: .4rem .65rem; border: 1px solid #777; border-radius: .25rem; background: #fff; cursor: pointer; }
.photo-button input { display: none; }
.photo-panel { max-width: 1100px; margin: 1rem auto; padding: .75rem; border: 1px solid #d5cdbc; background: #fffdf7; }
.photo-preview { position: relative; width: fit-content; max-width: 100%; margin: 0 auto; line-height: 0; }
.photo-preview img { display: block; max-width: 100%; max-height: 55vh; object-fit: contain; }
.photo-overlay { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.photo-match polygon { fill: currentColor; fill-opacity: .28; stroke: currentColor; stroke-width: 2; vector-effect: non-scaling-stroke; }
.photo-contour circle { vector-effect: non-scaling-stroke; stroke-width: 1.5; }
.photo-contour.matched polygon { fill: rgb(29 148 91 / 22%); stroke: #087443; }
.photo-contour.matched circle { fill: #fff; stroke: #087443; }
.photo-contour.unmatched polygon { fill: rgb(210 58 48 / 18%); stroke: #b42720; stroke-dasharray: 6 4; }
.photo-contour.unmatched circle { fill: #fff; stroke: #b42720; }
.photo-status { display: flex; flex-wrap: wrap; justify-content: center; gap: .4rem 1rem; margin: .75rem 0; }
.photo-actions { display: flex; justify-content: center; gap: .5rem; }
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
@media (max-width: 640px) { .hexiamond { padding: .5rem; } .palette { flex-basis: 100%; } }
</style>
