<template>
	<div class="hexiamond">
		<header class="toolbar">
			<label>Board
				<select v-model="shapeId" @change="resetShape">
					<option v-for="shape of shapeOptions" :key="shape.id" :value="shape.id">{{ shape.name }}</option>
				</select>
			</label>
			<button :disabled="!history.canUndo" title="Undo" aria-label="Undo" @click="undo">↩️</button>
			<button :disabled="!history.canRedo" title="Redo" aria-label="Redo" @click="redo">↪️</button>
			<button title="Clear board" aria-label="Clear board" @click="clearBoard">🗑️</button>
			<button :disabled="searching" title="Random solution" aria-label="Random solution" @click="runRandom">🎲</button>
			<button :disabled="searching" title="Nearest solution" aria-label="Nearest solution" @click="runNearest">🧩</button>
			<button v-if="searching" title="Cancel" aria-label="Cancel" @click="cancelSearch">✖️</button>
			<label class="photo-button" title="Recognize photo" aria-label="Recognize photo">📷<input type="file" accept="image/*" @change="selectPhoto" /></label>
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
					@pointerdown="boardPointerDown"
					@pointermove="moveBlock" @pointerup="finishBlockPointer" @pointercancel="cancelBlockPointer">
					<polygon v-for="cell of boardCells" :key="cell.key" :points="cell.points"
						:class="{covered: coveredCells.has(cell.index), target: cell.index === hoverIndex}" />
					<g v-for="placement of placements" v-show="dragSource !== 'placed' || placement.blockId !== dragBlockId" :key="placement.blockId" class="placed" :class="{hovered: placement.blockId === hoverBlockId}"
						:style="{color: blockById(placement.blockId).color}"
						@pointerenter="hoverBlockId = placement.blockId" @pointerleave="clearHover(placement.blockId)"
						@pointerdown="startPlacedPointer($event, placement)" @click="removePlacementAfterClick($event, placement.blockId)">
						<path :d="outlineFor(placement)" />
					</g>
					<g v-if="dragPreview" class="drag-preview" :class="{invalid: !dragPreviewLegal}"
						:style="{color: blockById(dragBlockId).color}">
						<path :d="outlineFor(dragPreview)" />
					</g>
				</svg>
				<p class="status">{{ status }}</p>
			</section>
			<aside class="palette">
				<h2>Blocks</h2>
				<div class="palette-grid">
					<div v-for="block of availableBlocks" :key="block.id" class="block"
						:style="{borderColor: block.color}"
						@pointerdown="startPalettePointer($event, block.id)" @pointermove="moveBlock"
						@pointerup="finishBlockPointer" @pointercancel="cancelBlockPointer"
						@click="selectBlockAfterClick(block.id)">
						<svg class="thumbnail" :viewBox="thumbnailViewBox(block)" aria-hidden="true">
							<path :d="outlinePath(block.orientations[0].points)" :style="{fill: block.color}" />
						</svg>
						<span class="block-label"><strong>{{ block.id + 1 }}</strong>{{ block.name }}</span>
					</div>
				</div>
				<p class="palette-note">{{ coveredCells.size }} / {{ shape.boardPoints.length }} triangles covered</p>
				<p class="palette-note desktop-hint">Click a placed block to remove it.</p>
				<p class="palette-note desktop-hint">Hover a placed block, then press <kbd>R</kbd> to rotate (<kbd>Shift</kbd>+<kbd>R</kbd> reverse), <kbd>F</kbd> to flip.</p>
				<p class="palette-note touch-hint">Tap a placed block to remove · long-press to flip · two-finger twist to rotate.</p>
			</aside>
		</div>
	</div>
</template>

<script lang="ts">
	import {defineComponent, markRaw} from "vue";
	import {History} from "../hexiamond/history";
	import {boardViewBox, buildShape, nearestPlacement, outlinePath, placementCenter, pointKey, ScreenPoint, triangleVertices, viewBoxForPoints} from "../hexiamond/geometry";
	import {nearestSolutionAsync, randomSolutionAsync, validatePlacements} from "../hexiamond/solver";
	import {Placement, Shape} from "../hexiamond/types";
	import {RAW_SHAPES} from "../hexiamond/data";
	import {recognizePhotoCv} from "../hexiamond/recognitionCv";
	import {RecognitionPoint, RecognitionResult} from "../hexiamond/recognition";

	// Touch gesture tuning: hold this long (ms) on a placed block to flip it; accumulate this much
	// two-finger twist (radians) per rotation step.
	const LONG_PRESS_MS = 500;
	const ROTATE_STEP = Math.PI / 4;

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
				dragLastX: 0,
				dragLastY: 0,
				dragRotationDelta: 0,
				dragFlipDelta: 0,
				dragAnchor: null as ScreenPoint | null,
				dragOrientation: 0,
				dragPreview: null as Placement | null,
				dragPreviewLegal: false,
				dragMoved: false,
				suppressPlacedClick: false,
				touchPointers: markRaw(new Map<number, {x: number; y: number}>()),
				longPressTimer: 0,
				twistActive: false,
				twistPrevAngle: 0,
				twistAccum: 0,
				twistBlockId: -1,
				twistChanged: false,
				selectedBlock: -1,
				hoverIndex: -1,
				hoverBlockId: -1,
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
			window.removeEventListener("keydown", this.onKeydown);
			this.clearLongPress();
			this.discardPhoto();
		},
		mounted () {
			window.addEventListener("keydown", this.onKeydown);
		},
		methods: {
			blockById (id: number): any {
				return (this.shape as Shape).blocks[id];
			},
			cellPolygon (point: [number, number]): string {
				return triangleVertices(point).map(item => item.join(",")).join(" ");
			},
			outlinePath,
			outlineFor (placement: Placement): string {
				return outlinePath(placement.points);
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
				// Middle button anchors the block: rotate/flip in place instead of panning to the pointer.
				const target = this.dragButton === 1 && this.dragAnchor ? this.dragAnchor : this.pointerTarget(event);
				if (!target || this.dragBlockId < 0)
					return;
				const candidate = nearestPlacement(this.legalCandidates(this.dragBlockId, this.dragOrientation), target);
				this.dragPreview = candidate;
				this.dragPreviewLegal = Boolean(candidate);
			},
			startPlacedPointer (event: PointerEvent, placement: Placement): void {
				if (event.pointerType === "touch") {
					this.startPlacedTouch(event, placement);
					return;
				}
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
				this.dragLastX = event.clientX;
				this.dragLastY = event.clientY;
				this.dragRotationDelta = 0;
				this.dragFlipDelta = 0;
				this.dragAnchor = placementCenter(placement);
				this.dragOrientation = placement.orientationId;
				this.dragPreview = placement;
				this.dragPreviewLegal = true;
				this.dragMoved = false;
				this.suppressPlacedClick = event.button === 1;
				this.status = event.button === 1 ? "Move up/down to rotate, left/right to flip; release to snap." : "Drag block; release to snap.";
			},
			startPlacedTouch (event: PointerEvent, placement: Placement): void {
				// Second (or later) fingers land on the board while the block is hidden mid-drag; they
				// are picked up by boardPointerDown. Here we only bootstrap the first finger.
				if (this.touchPointers.size > 0 || this.dragBlockId >= 0)
					return;
				event.preventDefault();
				(event.currentTarget as Element).setPointerCapture(event.pointerId);
				// Single-finger touch behaves like a left-button drag (move + snap).
				this.dragBlockId = placement.blockId;
				this.dragSource = "placed";
				this.dragPointerId = event.pointerId;
				this.dragButton = 0;
				this.dragStartX = event.clientX;
				this.dragStartY = event.clientY;
				this.dragLastX = event.clientX;
				this.dragLastY = event.clientY;
				this.dragAnchor = placementCenter(placement);
				this.dragOrientation = placement.orientationId;
				this.dragPreview = placement;
				this.dragPreviewLegal = true;
				this.dragMoved = false;
				this.suppressPlacedClick = false;
				this.touchPointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
				this.twistBlockId = placement.blockId;
				this.status = "Drag to move · long-press to flip · two-finger twist to rotate.";
				this.longPressTimer = window.setTimeout(() => this.fireLongPress(), LONG_PRESS_MS);
			},
			boardPointerDown (event: PointerEvent): void {
				// A second finger arriving during a single-finger placed-block drag starts a twist.
				if (event.pointerType !== "touch")
					return;
				if (this.dragSource !== "placed" || this.twistActive)
					return;
				if (this.touchPointers.size !== 1 || this.touchPointers.has(event.pointerId))
					return;
				event.preventDefault();
				try {
					(event.currentTarget as Element).setPointerCapture(event.pointerId);
				}
				catch (error) {
					void error;
				}
				this.touchPointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
				this.beginTwist();
			},
			beginTwist (): void {
				this.clearLongPress();
				this.twistActive = true;
				this.twistAccum = 0;
				this.twistChanged = false;
				this.twistPrevAngle = this.twoFingerAngle();
				// Reveal the block and drop the drag preview so the rotation is visible in place.
				this.dragSource = "twisting";
				this.dragPreview = null;
				this.dragPreviewLegal = false;
				this.status = "Twist to rotate; lift a finger to finish.";
			},
			twoFingerAngle (): number {
				const points = [...this.touchPointers.values()];
				if (points.length < 2)
					return this.twistPrevAngle;
				return Math.atan2(points[1].y - points[0].y, points[1].x - points[0].x);
			},
			stepTwist (): void {
				const current = this.twoFingerAngle();
				let delta = current - this.twistPrevAngle;
				while (delta > Math.PI)
					delta -= 2 * Math.PI;
				while (delta < -Math.PI)
					delta += 2 * Math.PI;
				this.twistPrevAngle = current;
				this.twistAccum += delta;
				const graph = this.blockById(this.twistBlockId).orientationGraph;
				// Screen-space clockwise twist (positive angle, y down) rotates the block clockwise.
				while (this.twistAccum >= ROTATE_STEP) {
					if (this.applyReorient(this.twistBlockId, graph.cw, "rotate", true))
						this.twistChanged = true;
					this.twistAccum -= ROTATE_STEP;
				}
				while (this.twistAccum <= -ROTATE_STEP) {
					if (this.applyReorient(this.twistBlockId, graph.ccw, "rotate", true))
						this.twistChanged = true;
					this.twistAccum += ROTATE_STEP;
				}
			},
			endTwist (): void {
				this.twistActive = false;
				if (this.twistChanged)
					this.commit("Block rotated.");
				this.suppressPlacedClick = true;
				this.clearTouchState();
				this.clearBlockPointer();
			},
			fireLongPress (): void {
				this.longPressTimer = 0;
				if (this.twistActive || this.dragMoved || this.touchPointers.size !== 1 || this.twistBlockId < 0)
					return;
				const graph = this.blockById(this.twistBlockId).orientationGraph;
				if (this.applyReorient(this.twistBlockId, graph.mirror, "flip")) {
					const flipped = this.placements.find(placement => placement.blockId === this.twistBlockId);
					if (flipped) {
						this.dragPreview = flipped;
						this.dragAnchor = placementCenter(flipped);
					}
				}
				this.suppressPlacedClick = true;
			},
			clearLongPress (): void {
				if (this.longPressTimer) {
					window.clearTimeout(this.longPressTimer);
					this.longPressTimer = 0;
				}
			},
			clearTouchState (): void {
				this.touchPointers.clear();
				this.clearLongPress();
				this.twistActive = false;
				this.twistBlockId = -1;
				this.twistAccum = 0;
				this.twistChanged = false;
			},
			moveBlock (event: PointerEvent): void {
				if (event.pointerType === "touch" && this.touchPointers.has(event.pointerId)) {
					this.touchPointers.set(event.pointerId, {x: event.clientX, y: event.clientY});
					if (this.twistActive) {
						this.stepTwist();
						return;
					}
					// Single-finger touch drag: a move past the threshold cancels the pending long-press flip.
					if (Math.hypot(event.clientX - this.dragStartX, event.clientY - this.dragStartY) >= 4)
						this.clearLongPress();
				}
				if (event.pointerId !== this.dragPointerId)
					return;
				if (Math.hypot(event.clientX - this.dragStartX, event.clientY - this.dragStartY) >= 4) {
					this.dragMoved = true;
					this.suppressPlacedClick = true;
				}
				if (this.dragButton === 1) {
					// Middle button: rotate on vertical travel, flip on horizontal travel; block stays anchored.
					const graph = this.blockById(this.dragBlockId).orientationGraph;
					this.dragRotationDelta += event.clientY - this.dragLastY;
					while (Math.abs(this.dragRotationDelta) >= 28) {
						const up = this.dragRotationDelta < 0;
						this.dragOrientation = (up ? graph.ccw : graph.cw)[this.dragOrientation];
						this.dragRotationDelta -= (up ? -1 : 1) * 28;
					}
					this.dragFlipDelta += event.clientX - this.dragLastX;
					while (Math.abs(this.dragFlipDelta) >= 60) {
						this.dragOrientation = graph.mirror[this.dragOrientation];
						this.dragFlipDelta -= (this.dragFlipDelta > 0 ? 1 : -1) * 60;
					}
				}
				this.dragLastX = event.clientX;
				this.dragLastY = event.clientY;
				this.updateDragPreview(event);
			},
			finishBlockPointer (event: PointerEvent): void {
				if (event.pointerType === "touch" && this.touchPointers.has(event.pointerId)) {
					this.touchPointers.delete(event.pointerId);
					if (this.twistActive) {
						// Lifting either finger ends the twist and commits the accumulated rotation.
						this.endTwist();
						return;
					}
					// Single finger lifted with no twist: fall through to the normal move/snap, then
					// clear the long-press timer and touch bookkeeping.
					this.clearLongPress();
				}
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
				if (event.pointerType === "touch" && this.touchPointers.has(event.pointerId)) {
					this.touchPointers.delete(event.pointerId);
					if (this.twistActive) {
						this.endTwist();
						return;
					}
				}
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
				this.dragAnchor = null;
				this.dragPreview = null;
				this.dragPreviewLegal = false;
				this.clearTouchState();
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
				this.dragLastX = event.clientX;
				this.dragLastY = event.clientY;
				this.dragRotationDelta = 0;
				this.dragFlipDelta = 0;
				this.dragAnchor = event.button === 1 ? this.pointerTarget(event) : null;
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
			clearHover (blockId: number): void {
				if (this.hoverBlockId === blockId)
					this.hoverBlockId = -1;
			},
			onKeydown (event: KeyboardEvent): void {
				if (this.hoverBlockId < 0 || this.dragBlockId >= 0)
					return;
				const target = event.target as HTMLElement | null;
				if (target && (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA"))
					return;
				const key = event.key.toLowerCase();
				if (key !== "r" && key !== "f")
					return;
				event.preventDefault();
				const graph = this.blockById(this.hoverBlockId).orientationGraph;
				const map = key === "f" ? graph.mirror : event.shiftKey ? graph.ccw : graph.cw;
				this.reorientHovered(map, key === "f" ? "flip" : "rotate");
			},
			reorientHovered (map: number[], action: "rotate" | "flip"): void {
				this.applyReorient(this.hoverBlockId, map, action);
			},
			/** Reorient a placed block in place by an orientation map, snapping to the nearest legal
			 * placement at its current center. Shared by the desktop R/F keys and the touch gestures.
			 * When silent is true (live twist stepping) no history commit or status change happens;
			 * the caller commits once when the gesture ends. Returns true if the placement changed. */
			applyReorient (blockId: number, map: number[], action: "rotate" | "flip", silent = false): boolean {
				const current = this.placements.find(placement => placement.blockId === blockId);
				if (!current)
					return false;
				const orientationId = map[current.orientationId];
				if (orientationId === current.orientationId) {
					if (!silent)
						this.status = action === "flip" ? "This block's flip matches its current shape." : "This block cannot rotate further.";
					return false;
				}
				const anchor = placementCenter(current);
				const others = this.placements.filter(placement => placement.blockId !== blockId);
				const candidates = (this.shape as Shape).placements[blockId].filter(placement =>
					placement.orientationId === orientationId && validatePlacements(this.shape as Shape, [...others, placement]));
				const next = nearestPlacement(candidates, anchor);
				if (!next) {
					if (!silent)
						this.status = `No legal ${action} nearby; block unchanged.`;
					return false;
				}
				this.placements = [...others, next];
				if (silent)
					this.status = action === "flip" ? "Block flipped." : "Block rotated.";
				else
					this.commit(action === "flip" ? "Block flipped." : "Block rotated.");
				return true;
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
.toolbar button, .toolbar .photo-button { font-size: 1.15rem; line-height: 1; padding: .35rem .5rem; }
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
.placed path { fill: currentColor; stroke: #32291c; stroke-width: .7; stroke-linejoin: round; }
.placed.hovered { opacity: 1; }
.placed.hovered path { stroke: #1a1206; stroke-width: 1.4; }
.drag-preview { pointer-events: none; opacity: .72; }
.drag-preview path { fill: currentColor; stroke: #32291c; stroke-width: 1.4; stroke-dasharray: 4 2; stroke-linejoin: round; }
.drag-preview.invalid { opacity: .35; }
.palette { flex: 0 1 300px; padding: .6rem .7rem; background: #fffdf7; border: 1px solid #d5cdbc; display: flex; flex-direction: column; }
.palette h2 { margin: 0 0 .5rem; font-size: 1.05rem; }
.palette-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: .4rem; }
.block { display: flex; align-items: center; gap: .4rem; margin: 0; padding: .3rem .4rem; border: 2px solid; border-radius: .35rem; background: #fff; cursor: grab; touch-action: none; user-select: none; min-width: 0; }
.thumbnail { flex: 0 0 auto; display: block; width: 38px; height: 38px; overflow: visible; }
.thumbnail path { stroke: #32291c; stroke-width: .7; stroke-linejoin: round; }
.block-label { min-width: 0; font-size: .8rem; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.block-label strong { margin-right: .3rem; color: #20232a; }
.palette-note { margin: .5rem 0 0; font-size: .8rem; color: #5a5346; }
.palette-note kbd { padding: 0 .3rem; font: inherit; font-size: .75rem; background: #efe9dc; border: 1px solid #cdc4b1; border-radius: .2rem; }
.status { min-height: 1.4em; }
.touch-hint { display: none; }

/* Narrow desktop window: minor padding tweak only; the full mobile layout is gated on touch capability below. */
@media (max-width: 640px) { .hexiamond { padding: .5rem; } .palette { flex-basis: 100%; } }

/* Touch device (no hover, coarse pointer): fit the whole UI in the viewport with no scrolling, and
   swap the hover/keyboard hints for the touch-gesture hint. Detected by capability, not viewport width. */
@media (hover: none) and (pointer: coarse) {
	.desktop-hint { display: none; }
	.touch-hint { display: block; }
	.hexiamond { box-sizing: border-box; display: flex; flex-direction: column; height: 100vh; height: 100dvh; min-height: 0; overflow: hidden; padding: .4rem; gap: .4rem; }
	.toolbar { flex: 0 0 auto; padding-left: 0; gap: .35rem; margin: 0; }
	.toolbar button, .toolbar .photo-button { font-size: 1.05rem; padding: .3rem .4rem; }
	.workspace { flex: 1 1 auto; min-height: 0; flex-direction: column; flex-wrap: nowrap; gap: .4rem; margin: 0; max-width: none; }
	.board-panel { flex: 1 1 0; min-height: 0; min-width: 0; display: flex; flex-direction: column; }
	.board { flex: 1 1 0; min-height: 0; max-height: none; }
	.status { flex: 0 0 auto; min-height: 1.2em; margin: .2rem 0 0; font-size: .85rem; }
	.palette { flex: 0 0 auto; max-height: 34vh; overflow-y: auto; padding: .4rem .45rem; }
	.palette h2 { display: none; }
	.palette-grid { grid-template-columns: repeat(4, 1fr); gap: .3rem; }
	.block { gap: .25rem; padding: .2rem .25rem; border-width: 1.5px; }
	.thumbnail { width: 28px; height: 28px; }
	.block-label { font-size: .68rem; }
	.palette-note { margin: .3rem 0 0; font-size: .72rem; }
}
</style>
