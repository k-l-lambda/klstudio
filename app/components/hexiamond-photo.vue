<template>
	<section class="hexiamond-photo" aria-live="polite">
		<div v-if="mode === 'choose'" class="photo-choose" :class="{dragging}"
			@dragenter.prevent="dragging = true" @dragover.prevent="dragging = true" @dragleave.self="dragging = false" @drop.prevent="dropFile">
			<p class="photo-hint">Drop a photo of the board here, or</p>
			<div class="photo-choices">
				<label class="photo-choice">🖼️ Choose image<input type="file" accept="image/*" @change="pickFile" /></label>
				<label v-if="coarsePointer" class="photo-choice">📷 Take photo<input type="file" accept="image/*" capture="environment" @change="pickFile" /></label>
				<button class="photo-choice" :disabled="!liveSupported" :title="liveSupported ? 'Recognize from the live camera' : 'The live camera needs HTTPS and a camera'" @click="startLive">🎥 Live camera</button>
			</div>
			<p v-if="message" class="photo-message">{{ message }}</p>
			<div class="photo-actions">
				<button @click="close">Cancel</button>
			</div>
		</div>
		<template v-else>
			<div class="photo-preview" :class="{live: mode === 'live'}">
				<img v-if="mode === 'photo'" :src="photoUrl" alt="Selected puzzle photo" />
				<video v-else ref="video" playsinline muted autoplay />
				<svg v-if="frame.width" class="photo-overlay" :viewBox="`0 0 ${frame.width} ${frame.height}`" preserveAspectRatio="xMidYMid meet" aria-label="Recognized blocks overlay">
					<path v-if="mode === 'live'" class="photo-guide" :d="guidePath" />
					<g v-for="region of regions" :key="region.key" :class="['photo-region', region.kind]" :style="{color: region.color}">
						<polygon v-for="(points, index) of region.triangles" :key="index" :points="points" />
					</g>
					<path v-if="result && result.ok" class="photo-outline" :d="outlinePath" />
					<text v-if="mode === 'live'" class="photo-hud" x="10" y="24">{{ hudText }}</text>
				</svg>
			</div>
			<p class="photo-status">
				<span v-if="busy && !result">Recognizing...</span>
				<template v-else-if="result && result.ok">
					<strong>{{ placements.length }} blocks</strong>
					<span v-if="blankCount">{{ blankCount }} blank regions</span>
					<span v-if="match && match.unmatched">{{ match.unmatched }} unmatched</span>
					<span>{{ ms }} ms</span>
				</template>
				<strong v-else-if="result">Not recognized: {{ result.error }}</strong>
				<span v-if="mode === 'live' && !result">Point the camera at the board and fit it in the guide.</span>
			</p>
			<p v-if="message" class="photo-message">{{ message }}</p>
			<div class="photo-actions">
				<button :disabled="!applicable" @click="apply">Apply</button>
				<button @click="close">Discard</button>
			</div>
		</template>
	</section>
</template>

<script lang="ts">
	import {defineComponent, markRaw, PropType} from "vue";
	import {ScreenPoint, triangleVertices} from "../hexiamond/geometry";
	import {placementsFromResult, RecognizerResult} from "../hexiamond/recognizerWasm";
	import {captureFrame, createRecognizerClient, RecognizerClient} from "../hexiamond/recognizerClient";
	import {validatePlacements} from "../hexiamond/solver";
	import {Placement, Shape} from "../hexiamond/types";

	// Pause between live recognitions, so a phone isn't kept at full load.
	const LIVE_INTERVAL_MS = 150;
	// The recognizer's pose prior: board centred, filling 0.7 of the frame. The live guide draws exactly that.
	const GUIDE_FILL = 0.7;
	// Live viewport width / height: portrait 1 : 1.5.
	const LIVE_ASPECT = 2 / 3;

	const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

	export default defineComponent({
		name: "hexiamond-photo",
		props: {
			shape: {type: Object as PropType<Shape>, required: true},
		},
		emits: ["apply", "close"],
		data () {
			return {
				mode: "choose" as "choose" | "photo" | "live",
				dragging: false,
				message: "",
				photoUrl: "",
				frame: {width: 0, height: 0},
				result: null as RecognizerResult | null,
				busy: false,
				ms: 0,
				token: 0,
			};
		},
		computed: {
			coarsePointer (): boolean {
				return typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
			},
			liveSupported (): boolean {
				return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && window.isSecureContext;
			},
			match (): ReturnType<typeof placementsFromResult> | null {
				return this.result && this.result.ok ? placementsFromResult(this.shape, this.result) : null;
			},
			placements (): Placement[] {
				return this.match ? this.match.placements : [];
			},
			blankCount (): number {
				return this.result && this.result.ok ? this.result.regions.filter(region => region.blank).length : 0;
			},
			applicable (): boolean {
				return this.placements.length > 0 && validatePlacements(this.shape, this.placements);
			},
			// Each recognized region drawn cell by cell: board units (as the module uses) through Hsource.
			regions (): any[] {
				if (!this.result || !this.result.ok || !this.match)
					return [];
				return this.result.regions.map((region, index) => {
					const placement = this.match!.byRegion[index];
					return {
						key: region.cells.join(","),
						kind: placement ? "matched" : (region.blank ? "blank" : "unmatched"),
						color: placement ? this.shape.blocks[placement.blockId].color : undefined,
						triangles: region.cells.map(cell => this.project(triangleVertices(this.shape.boardPoints[cell], 1, 0))),
					};
				});
			},
			// Board boundary in board units: triangle edges that belong to a single cell.
			boundary (): [ScreenPoint, ScreenPoint][] {
				const counts = new Map<string, [ScreenPoint, ScreenPoint, number]>();
				for (const point of this.shape.boardPoints) {
					const vertices = triangleVertices(point, 1, 0);
					vertices.forEach((a, i) => {
						const b = vertices[(i + 1) % 3];
						const key = [a, b].map(v => v.map(c => c.toFixed(4)).join(",")).sort().join(";");
						const entry = counts.get(key);
						counts.set(key, entry ? [entry[0], entry[1], entry[2] + 1] : [a, b, 1]);
					});
				}
				return [...counts.values()].filter(entry => entry[2] === 1).map(([a, b]) => [a, b]);
			},
			outlinePath (): string {
				return this.result && this.result.ok ? this.boundary.map(edge => `M${this.project(edge)}`).join(" ") : "";
			},
			// Where the recognizer expects the board: upright, centred, GUIDE_FILL of the frame.
			guidePath (): string {
				const vertices = this.shape.boardPoints.flatMap(point => triangleVertices(point, 1, 0));
				const xs = vertices.map(v => v[0]), ys = vertices.map(v => v[1]);
				const cx = xs.reduce((a, b) => a + b, 0) / xs.length, cy = ys.reduce((a, b) => a + b, 0) / ys.length;
				const scale = GUIDE_FILL * Math.min(this.frame.width / (Math.max(...xs) - Math.min(...xs)), this.frame.height / (Math.max(...ys) - Math.min(...ys)));
				const map = ([x, y]: ScreenPoint): string => `${(this.frame.width / 2 + (x - cx) * scale).toFixed(1)},${(this.frame.height / 2 + (y - cy) * scale).toFixed(1)}`;
				return this.boundary.map(([a, b]) => `M${map(a)} ${map(b)}`).join(" ");
			},
			hudText (): string {
				if (!this.result)
					return "searching…";
				if (!this.result.ok)
					return `no board (${this.ms} ms)`;
				return `${this.placements.length} blocks · ${this.ms} ms`;
			},
		},
		created () {
			// Non-reactive handles: the worker client, the camera stream.
			(this as any).workerClient = null as RecognizerClient | null;
			(this as any).cameraStream = null as MediaStream | null;
		},
		beforeUnmount () {
			this.stopCamera();
			this.revokePhoto();
			if ((this as any).workerClient)
				(this as any).workerClient.dispose();
		},
		methods: {
			getClient (): RecognizerClient {
				if (!(this as any).workerClient)
					(this as any).workerClient = createRecognizerClient();
				return (this as any).workerClient;
			},
			project (points: ScreenPoint[]): string {
				const H = (this.result as RecognizerResult).Hsource;
				return points.map(([x, y]) => {
					const w = H[6] * x + H[7] * y + H[8];
					return `${((H[0] * x + H[1] * y + H[2]) / w).toFixed(1)},${((H[3] * x + H[4] * y + H[5]) / w).toFixed(1)}`;
				}).join(" ");
			},
			async recognize (source: HTMLImageElement | HTMLVideoElement, token: number): Promise<boolean> {
				// Live frames are centre-cropped to the portrait viewport the video is shown in, so the HUD lines up.
				const image = captureFrame(source, 600, source instanceof HTMLVideoElement ? LIVE_ASPECT : 0);
				const frame = {width: image.width, height: image.height};
				const started = performance.now();
				this.busy = true;
				try {
					const result = await this.getClient().recognize(image, this.shape.board);
					if (token !== this.token)
						return false;
					this.frame = frame;
					this.ms = Math.round(performance.now() - started);
					this.result = markRaw(result);
					return true;
				}
				finally {
					if (token === this.token)
						this.busy = false;
				}
			},
			pickFile (event: Event): void {
				const input = event.target as HTMLInputElement;
				const file = input.files && input.files[0];
				input.value = "";
				if (file)
					this.openPhoto(file);
			},
			dropFile (event: DragEvent): void {
				this.dragging = false;
				const file = event.dataTransfer && [...event.dataTransfer.files].find(item => item.type.startsWith("image/"));
				if (file)
					this.openPhoto(file);
				else
					this.message = "That is not an image file.";
			},
			openPhoto (file: File): void {
				const token = ++this.token;
				this.message = "";
				this.result = null;
				this.frame = {width: 0, height: 0};
				this.revokePhoto();
				this.photoUrl = URL.createObjectURL(file);
				this.mode = "photo";
				const image = new Image();
				image.onload = () => {
					if (token === this.token)
						this.recognize(image, token).catch(error => this.message = `Recognition failed: ${error.message || error}`);
				};
				image.onerror = () => {
					if (token === this.token)
						this.message = "The image could not be loaded.";
				};
				image.src = this.photoUrl;
			},
			async startLive (): Promise<void> {
				const token = ++this.token;
				this.message = "";
				this.result = null;
				this.mode = "live";
				await this.$nextTick();
				try {
					const stream = await navigator.mediaDevices.getUserMedia({
						// Ask for a portrait stream near the viewport ratio; a landscape one (most webcams) is centre-cropped.
						video: {facingMode: {ideal: "environment"}, width: {ideal: 960}, height: {ideal: 1440}, aspectRatio: {ideal: LIVE_ASPECT}},
						audio: false,
					});
					if (token !== this.token) {
						stream.getTracks().forEach(track => track.stop());
						return;
					}
					(this as any).cameraStream = stream;
					const video = this.$refs.video as HTMLVideoElement;
					video.srcObject = stream;
					await video.play();
				}
				catch (error) {
					if (token !== this.token)
						return;
					this.stopCamera();
					this.mode = "choose";
					this.message = `Camera unavailable: ${(error as Error).message || error}`;
					return;
				}
				this.liveLoop(token);
			},
			async liveLoop (token: number): Promise<void> {
				const video = this.$refs.video as HTMLVideoElement;
				while (token === this.token && this.mode === "live") {
					if (video.readyState < 2 || !video.videoWidth) {
						await sleep(100);
						continue;
					}
					try {
						await this.recognize(video, token);
					}
					catch (error) {
						if (token === this.token)
							this.message = `Recognition failed: ${(error as Error).message || error}`;
					}
					await sleep(LIVE_INTERVAL_MS);
				}
			},
			apply (): void {
				if (!this.applicable)
					return;
				const placements = this.placements.slice();
				this.stop();
				this.$emit("apply", placements);
			},
			close (): void {
				this.stop();
				this.$emit("close");
			},
			stop (): void {
				this.token++;
				this.stopCamera();
				this.revokePhoto();
			},
			stopCamera (): void {
				const stream = (this as any).cameraStream as MediaStream | null;
				if (stream)
					stream.getTracks().forEach(track => track.stop());
				(this as any).cameraStream = null;
				const video = this.$refs.video as HTMLVideoElement | undefined;
				if (video)
					video.srcObject = null;
			},
			revokePhoto (): void {
				if (this.photoUrl)
					URL.revokeObjectURL(this.photoUrl);
				this.photoUrl = "";
			},
		},
	});
</script>

<style scoped>
.hexiamond-photo { max-width: 1100px; margin: 1rem auto; padding: .75rem; border: 1px solid #d5cdbc; background: #fffdf7; }
.photo-choose { display: flex; flex-direction: column; align-items: center; gap: .75rem; padding: 1.5rem 1rem; border: 2px dashed #c9bfa9; border-radius: .5rem; }
.photo-choose.dragging { border-color: #087443; background: rgb(29 148 91 / 8%); }
.photo-hint { margin: 0; color: #555; }
.photo-choices { display: flex; flex-wrap: wrap; justify-content: center; gap: .5rem; }
.photo-choice { padding: .5rem .8rem; border: 1px solid #777; border-radius: .25rem; background: #fff; font: inherit; cursor: pointer; }
.photo-choice input { display: none; }
.photo-choice:disabled { opacity: .5; cursor: not-allowed; }
.photo-message { margin: .25rem 0; text-align: center; color: #b42720; }
.photo-preview { position: relative; width: fit-content; max-width: 100%; margin: 0 auto; line-height: 0; }
.photo-preview img, .photo-preview video { display: block; max-width: 100%; max-height: 55vh; object-fit: contain; background: #000; }
/* Live: a fixed 2:3 portrait box, the video centre-cropped into it (object-fit: cover = captureFrame's crop). */
.photo-preview.live { width: min(100%, 70vh * 2 / 3); aspect-ratio: 2 / 3; }
.photo-preview.live video { width: 100%; height: 100%; max-height: none; object-fit: cover; }
.photo-overlay { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.photo-region polygon { stroke-width: 1; vector-effect: non-scaling-stroke; }
.photo-region.matched polygon { fill: currentColor; fill-opacity: .45; stroke: currentColor; }
.photo-region.blank polygon { fill: rgb(255 255 255 / 60%); stroke: #555; stroke-dasharray: 4 3; }
.photo-region.unmatched polygon { fill: rgb(210 58 48 / 25%); stroke: #b42720; stroke-dasharray: 6 4; }
.photo-outline { fill: none; stroke: #fff; stroke-width: 2; vector-effect: non-scaling-stroke; }
.photo-guide { fill: none; stroke: rgb(255 255 255 / 70%); stroke-width: 2; stroke-dasharray: 8 6; vector-effect: non-scaling-stroke; }
.photo-hud { fill: #fff; font: bold 18px sans-serif; paint-order: stroke; stroke: rgb(0 0 0 / 70%); stroke-width: 3px; }
.photo-status { display: flex; flex-wrap: wrap; justify-content: center; gap: .4rem 1rem; margin: .75rem 0; line-height: 1.4; }
.photo-actions { display: flex; justify-content: center; gap: .5rem; }
</style>
