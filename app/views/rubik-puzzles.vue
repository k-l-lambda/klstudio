<template>
	<div class="rubik-puzzles">
		<header class="toolbar">
			<label>Puzzle
				<select :value="kindId" @change="selectKind($event.target.value)">
					<option v-for="kind of kinds" :key="kind.id" :value="kind.id">{{ kind.name }}</option>
				</select>
			</label>
			<button :disabled="!done.length" title="Undo" aria-label="Undo" @click="undo">↩️</button>
			<button :disabled="!undone.length" title="Redo" aria-label="Redo" @click="redo">↪️</button>
			<button title="Scramble" aria-label="Scramble" @click="runScramble">🎲</button>
			<button title="Reset" aria-label="Reset" @click="reset">🔄</button>
			<span class="status">
				<span>{{ done.length }} moves</span>
				<span v-if="solved" class="solved">solved</span>
			</span>
		</header>
		<div ref="stage" class="stage">
			<canvas ref="canvas"
				@pointerdown="onPointerDown"
				@pointermove="onPointerMove"
				@pointerup="onPointerUp"
				@pointercancel="onPointerUp"
			/>
		</div>
		<p class="hint desktop-hint">Drag a piece to turn its layer, drag the background to look around.
			Keys <kbd>R</kbd> <kbd>L</kbd> <kbd>U</kbd> <kbd>D</kbd> <kbd>F</kbd> <kbd>B</kbd> turn faces clockwise, with <kbd>Shift</kbd> counter-clockwise.</p>
		<p class="hint touch-hint">Drag a piece to turn its layer, drag the background to look around.</p>
	</div>
</template>

<script lang="ts">
	import {defineComponent, markRaw} from "vue";
	import * as THREE from "three";

	import {PUZZLES, Twist, inverseTwist, notationTwist, scramble} from "../rubikPuzzles/puzzle";
	import {puzzleRadius} from "../rubikPuzzles/meshes";
	import PuzzleObject from "../rubikPuzzles/puzzleObject";



	const STORAGE_KEY = "rubik-puzzles.v1";
	const FOV = 40;
	const DRAG_THRESHOLD = 8;	// px before a drag picks its layer
	const DAMPING = 0.92;

	// [axis, layers, turns], compact for storage
	type StoredTwist = [number, number[], number];
	const packTwist = (twist: Twist): StoredTwist => [twist.axis, twist.layers, twist.turns];
	const unpackTwist = ([axis, layers, turns]: StoredTwist): Twist => ({axis, layers, turns});


	// Default view: cubes show U, F and R; the Mastermorphix stands on a face with a tip up.
	const initialQuaternion = (shape: string): THREE.Quaternion => {
		if (shape === "mastermorphix") {
			const up = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 1, 1).normalize(), new THREE.Vector3(0, 1, 0));
			const face = new THREE.Vector3(1, 1, -1).normalize().applyQuaternion(up);
			const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(face.x, face.z) * -1 + Math.PI / 3);
			const tilt = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.3);

			return tilt.multiply(yaw).multiply(up);
		}

		return new THREE.Quaternion().setFromEuler(new THREE.Euler(0.5, -0.65, 0, "XYZ"));
	};


	export default defineComponent({
		name: "rubik-puzzles",


		data () {
			return {
				kinds: PUZZLES,
				kindId: PUZZLES[1].id,
				done: [] as Twist[],
				undone: [] as Twist[],
				solved: true,
			};
		},


		created () {
			this.histories = {};
			try {
				const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
				if (saved) {
					if (PUZZLES.some(kind => kind.id === saved.kindId))
						this.kindId = saved.kindId;
					Object.entries(saved.histories || {}).forEach(([id, history]: [string, any]) => {
						this.histories[id] = {scramble: (history.scramble || []).map(unpackTwist), done: history.done.map(unpackTwist), undone: history.undone.map(unpackTwist)};
					});
				}
			}
			catch (error) {
				console.warn("rubik-puzzles: failed to restore:", error);
			}
		},


		mounted () {
			this.active = true;
			this.velocity = {x: 0, y: 0};
			this.pointer = null;

			this.renderer = markRaw(new THREE.WebGLRenderer({antialias: true, canvas: this.$refs.canvas, alpha: true}));
			this.renderer.setPixelRatio(window.devicePixelRatio || 1);
			this.renderer.setClearColor(new THREE.Color("black"), 0);
			this.camera = markRaw(new THREE.PerspectiveCamera(FOV, 1, 0.1, 100));
			this.scene = markRaw(new THREE.Scene());
			this.raycaster = markRaw(new THREE.Raycaster());

			this.resizeObserver = new ResizeObserver(() => this.onResize());
			this.resizeObserver.observe(this.$refs.stage);

			this.onKeyDown = this.onKeyDown.bind(this);
			window.addEventListener("keydown", this.onKeyDown);

			this.loadKind();
			this.onResize();
			this.renderLoop();
		},


		beforeUnmount () {
			this.active = false;
			this.resizeObserver.disconnect();
			window.removeEventListener("keydown", this.onKeyDown);
			if (this.puzzle)
				this.puzzle.dispose();
			this.renderer.dispose();
		},


		computed: {
			kind () {
				return PUZZLES.find(kind => kind.id === this.kindId);
			},
		},


		methods: {
			loadKind () {
				if (this.puzzle) {
					this.scene.remove(this.puzzle.graph);
					this.puzzle.dispose();
				}

				this.puzzle = markRaw(new PuzzleObject(this.kind));
				this.puzzle.graph.quaternion.copy(initialQuaternion(this.kind.shape));
				window.$rubikPuzzle = this.puzzle;
				this.scene.add(this.puzzle.graph);

				const history = this.histories[this.kindId] || {scramble: [], done: [], undone: []};
				this.histories[this.kindId] = history;
				[...history.scramble, ...history.done].forEach(twist => this.puzzle.twist(twist, {useAnimation: false}));
				this.done = history.done;
				this.undone = history.undone;
				this.solved = this.puzzle.state.solved;

				this.frameCamera();
			},


			selectKind (id: string) {
				this.kindId = id;
				this.loadKind();
				this.save();
			},


			frameCamera () {
				if (!this.puzzle || !this.size)
					return;

				const aspect = this.size.width / this.size.height;
				const radius = puzzleRadius(this.kind) * 1.08;
				const halfFov = THREE.MathUtils.degToRad(FOV / 2);
				const distance = radius / Math.sin(halfFov) / Math.min(1, aspect);
				this.camera.aspect = aspect;
				this.camera.position.set(0, 0, distance);
				this.camera.lookAt(0, 0, 0);
				this.camera.updateProjectionMatrix();
			},


			onResize () {
				const stage = this.$refs.stage;
				this.size = {width: stage.clientWidth, height: stage.clientHeight};
				this.renderer.setSize(this.size.width, this.size.height, false);
				this.frameCamera();
			},


			async renderLoop () {
				while (this.active) {
					if (Math.abs(this.velocity.x) > 1e-4 || Math.abs(this.velocity.y) > 1e-4) {
						this.puzzle.graph.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), this.velocity.x);
						this.puzzle.graph.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), this.velocity.y);
						this.velocity.x *= DAMPING;
						this.velocity.y *= DAMPING;
					}

					this.renderer.render(this.scene, this.camera);
					await new Promise(resolve => requestAnimationFrame(resolve));
				}
			},


			save () {
				try {
					const histories = {};
					Object.entries(this.histories).forEach(([id, history]: [string, any]) => {
						histories[id] = {scramble: history.scramble.map(packTwist), done: history.done.map(packTwist), undone: history.undone.map(packTwist)};
					});
					window.localStorage.setItem(STORAGE_KEY, JSON.stringify({kindId: this.kindId, histories}));
				}
				catch (error) {
					console.warn("rubik-puzzles: failed to save:", error);
				}
			},


			// A twist made by the user: recorded, redo cleared.
			commit (twist: Twist) {
				this.done.push(twist);
				this.undone.splice(0);
				this.afterChange();
			},


			afterChange () {
				this.solved = this.puzzle.state.solved;
				this.save();
			},


			async playTwist (twist: Twist) {
				const puzzle = this.puzzle;
				await puzzle.twist(twist);
				if (puzzle === this.puzzle)
					this.commit(twist);
			},


			undo () {
				const twist = this.done.pop();
				if (twist) {
					this.undone.push(twist);
					this.puzzle.twist(inverseTwist(twist)).then(() => this.afterChange());
				}
			},


			redo () {
				const twist = this.undone.pop();
				if (twist) {
					this.done.push(twist);
					this.puzzle.twist(twist).then(() => this.afterChange());
				}
			},


			// Start over from `twists` applied to the solved puzzle, with an empty move history.
			async restart (twists: Twist[]) {
				const puzzle = this.puzzle;
				await puzzle.animation;
				if (puzzle !== this.puzzle)
					return;

				puzzle.state.reset();
				twists.forEach(twist => puzzle.state.twist(twist));
				puzzle.updateGraph();
				this.histories[this.kindId].scramble = twists;
				this.done.splice(0);
				this.undone.splice(0);
				this.afterChange();
			},


			runScramble () {
				this.restart(scramble(this.kind));
			},


			reset () {
				this.restart([]);
			},


			onKeyDown (event: KeyboardEvent) {
				if (event.ctrlKey || event.metaKey || event.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test((event.target as HTMLElement).tagName))
					return;

				const match = event.code.match(/^Key([RLUDFB])$/);
				if (match) {
					this.playTwist(notationTwist(this.kind.order, match[1], {prime: event.shiftKey}));
					event.preventDefault();
				}
			},


			screenPoint (event: PointerEvent): THREE.Vector2 {
				const rect = this.$refs.canvas.getBoundingClientRect();
				return new THREE.Vector2(event.clientX - rect.left, event.clientY - rect.top);
			},


			// pixels on screen of a point in the graph's local frame
			project (local: THREE.Vector3): THREE.Vector2 {
				const ndc = this.puzzle.graph.localToWorld(local.clone()).project(this.camera);
				return new THREE.Vector2((ndc.x + 1) / 2 * this.size.width, (1 - ndc.y) / 2 * this.size.height);
			},


			onPointerDown (event: PointerEvent) {
				if (this.pointer) {
					// a second finger: look around instead
					this.pointer.orbit = true;
					this.puzzle.releaseFree().then(twist => twist && this.commit(twist));
					return;
				}

				const start = this.screenPoint(event);
				this.pointer = {id: event.pointerId, start, last: start, orbit: true};
				this.$refs.canvas.setPointerCapture(event.pointerId);

				const ndc = new THREE.Vector2(start.x / this.size.width * 2 - 1, 1 - start.y / this.size.height * 2);
				this.raycaster.setFromCamera(ndc, this.camera);
				const [hit] = this.raycaster.intersectObjects(this.puzzle.meshes, false);
				const piece = hit && this.puzzle.pieceOfMesh(hit.object);
				if (piece) {
					// screen motion of the touched point per radian of turn about each axis
					const local = this.puzzle.graph.worldToLocal(hit.point.clone());
					const origin = this.project(local);
					const epsilon = 1e-3;
					const tangents = [0, 1, 2].map(axis => {
						const axisVector = new THREE.Vector3().setComponent(axis, 1);
						const moved = local.clone().applyAxisAngle(axisVector, epsilon);
						return this.project(moved).sub(origin).divideScalar(epsilon);
					});
					// on a flat face only the two in-plane axes turn naturally: drop the one along the surface normal
					const normal = hit.face.normal.clone().applyQuaternion(hit.object.quaternion);
					const axes = [0, 1, 2].filter(axis => Math.abs(normal.getComponent(axis)) < 0.9);
					Object.assign(this.pointer, {orbit: false, piece, tangents, axes, axis: null});
				}
			},


			onPointerMove (event: PointerEvent) {
				const pointer = this.pointer;
				if (!pointer || pointer.id !== event.pointerId)
					return;

				const point = this.screenPoint(event);
				if (pointer.orbit) {
					this.velocity.x += (point.x - pointer.last.x) * 1e-3;
					this.velocity.y += (point.y - pointer.last.y) * 1e-3;
					pointer.last = point;
					return;
				}

				const drag = point.clone().sub(pointer.start);
				if (pointer.axis === null) {
					if (drag.length() < DRAG_THRESHOLD)
						return;

					// the axis whose turn moves the touched point most along the drag
					const scores = pointer.tangents.map((tangent, axis) => pointer.axes.includes(axis) ? Math.abs(drag.dot(tangent)) : -1);
					pointer.axis = scores.indexOf(Math.max(...scores));
					const layer = this.puzzle.state.layerIndex(this.puzzle.state.position(pointer.piece)[pointer.axis]);
					this.puzzle.beginFree(pointer.axis, [layer]);
				}

				const tangent = pointer.tangents[pointer.axis];
				this.puzzle.moveFree(drag.dot(tangent) / tangent.lengthSq());
			},


			onPointerUp (event: PointerEvent) {
				if (!this.pointer || this.pointer.id !== event.pointerId)
					return;

				this.pointer = null;
				const puzzle = this.puzzle;
				puzzle.releaseFree().then(twist => {
					if (twist && puzzle === this.puzzle)
						this.commit(twist);
				});
			},
		},
	});
</script>

<style scoped>
.rubik-puzzles { box-sizing: border-box; display: flex; flex-direction: column; height: 100vh; height: 100dvh; padding: 1rem; color: #20232a; background: #f5f2e9; }
.toolbar { flex: 0 0 auto; display: flex; flex-wrap: wrap; gap: .5rem; align-items: center; padding-left: 2rem; }
.toolbar button { font-size: 1.15rem; line-height: 1; padding: .35rem .5rem; }
button, select { padding: .4rem .65rem; border: 1px solid #777; border-radius: .25rem; background: #fff; cursor: pointer; }
button:disabled { cursor: default; opacity: .45; }
.status { display: flex; gap: .6rem; margin-left: .5rem; font-size: .95rem; }
.solved { color: #087443; font-weight: bold; }
.stage { flex: 1 1 0; min-height: 0; position: relative; }
.stage canvas { position: absolute; inset: 0; width: 100%; height: 100%; touch-action: none; cursor: grab; }
.hint { flex: 0 0 auto; margin: .3rem 0 0; font-size: .8rem; color: #5a5346; text-align: center; }
.hint kbd { padding: 0 .3rem; font: inherit; font-size: .75rem; background: #efe9dc; border: 1px solid #cdc4b1; border-radius: .2rem; }
.touch-hint { display: none; }

@media (hover: none) and (pointer: coarse) {
	.rubik-puzzles { padding: .4rem; }
	.toolbar { padding-left: 0; gap: .35rem; }
	.desktop-hint { display: none; }
	.touch-hint { display: block; }
}
</style>
