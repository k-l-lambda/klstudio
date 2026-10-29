<template>
	<div class="rubik-samples">
		<header class="toolbar">
			<label>Seed
				<input v-model.number="seedInput" type="number" min="1" @change="generate(seedInput)" />
			</label>
			<button title="New random scene" aria-label="New random scene" @click="generate(randomSeed())">🎲</button>
			<label>Size
				<select v-model="sizeId" @change="generate(seed)">
					<option v-for="size of sizes" :key="size.id" :value="size.id">{{ size.width }}×{{ size.height }}</option>
				</select>
			</label>
			<label>Colours
				<select v-model="schemes" @change="generate(seed)">
					<option value="standard">standard</option>
					<option value="nonstandard">non-standard</option>
					<option value="all">all</option>
				</select>
			</label>
			<label>Build
				<select v-model="builds" @change="generate(seed)">
					<option value="classic">classic</option>
					<option value="antipop">anti-pop</option>
					<option value="all">all</option>
				</select>
			</label>
			<label class="check" title="Phone-photo realism: imaging (blur, noise, white balance, JPEG), a desk behind, gloss, smaller off-centre framing"><input v-model="realism" type="checkbox" @change="generate(seed)" /> Real</label>
			<label class="check"><input v-model="overlay" type="checkbox" /> Labels</label>
			<button :disabled="!images.length" title="Download images and labels (zip)" aria-label="Download" @click="download">⬇️</button>
			<button :disabled="!sample" title="Test video: the cube turned by hand to show four corners (5 fps)" aria-label="Video" @click="makeVideo">🎬</button>
			<button v-if="videoFrames.length" title="Download the video frames and labels (zip)" aria-label="Download video" @click="downloadVideo">⬇️🎬</button>
			<span class="status">{{ status }}</span>
		</header>

		<section class="views">
			<figure v-for="(view, i) of views" :key="i" class="view">
				<div class="frame" :style="{aspectRatio: `${sample.image.width} / ${sample.image.height}`}">
					<img v-if="images[i]" :src="images[i]" :alt="`view ${i + 1}: faces ${view.visibleFaces}`" />
					<svg v-if="overlay" class="overlay" :viewBox="`0 0 ${sample.image.width} ${sample.image.height}`" aria-hidden="true">
						<g v-for="sticker of view.stickers.filter(s => s.visible)" :key="sticker.index">
							<polygon :points="sticker.corners.map(p => p.join(',')).join(' ')" />
							<text :x="sticker.center[0]" :y="sticker.center[1]">{{ sticker.color }}</text>
						</g>
					</svg>
				</div>
				<figcaption>
					<strong>{{ i + 1 }}</strong> corner {{ view.corner }} · faces {{ view.visibleFaces }} · fill {{ view.fill.toFixed(2) }}
					· angles {{ Object.entries(view.faceAngles).map(([face, angle]) => `${face} ${angle.toFixed(0)}°`).join(" ") }}
				</figcaption>
			</figure>
		</section>

		<section v-if="videoFrames.length" class="video">
			<figure class="view">
				<div class="frame" :style="{aspectRatio: `${sample.image.width} / ${sample.image.height}`}">
					<img :src="videoFrames[videoIndex]" :alt="`video frame ${videoIndex + 1}`" />
					<svg v-if="overlay" class="overlay" :viewBox="`0 0 ${sample.image.width} ${sample.image.height}`" aria-hidden="true">
						<g v-for="sticker of videoLabel.stickers.filter(s => s.visible)" :key="sticker.index">
							<polygon :points="sticker.corners.map(p => p.join(',')).join(' ')" />
							<text :x="sticker.center[0]" :y="sticker.center[1]">{{ sticker.color }}</text>
						</g>
					</svg>
				</div>
				<figcaption>
					<button :aria-label="videoTimer ? 'Pause' : 'Play'" @click="toggleVideo">{{ videoTimer ? "⏸️" : "▶️" }}</button>
					<input v-model.number="videoIndex" type="range" min="0" :max="videoFrames.length - 1" aria-label="Frame" />
					frame {{ videoIndex + 1 }}/{{ videoFrames.length }} · {{ videoLabel.time.toFixed(1) }} s · {{ videoLabel.phase }} {{ videoLabel.hold + 1 }}
					<template v-if="videoLabel.twist">· {{ videoLabel.twist.move }}</template>
					<template v-if="videoLabel.step">· {{ videoLabel.step }} turns done</template>
					· faces {{ videoLabel.visibleFaces }}
				</figcaption>
			</figure>
		</section>

		<section v-if="sample" class="labels">
			<div class="net" aria-label="Cube state">
				<div v-for="face of netFaces" :key="face.letter" class="net-face" :style="{gridArea: face.letter}">
					<span v-for="k of 9" :key="k" class="net-cell" :style="{background: sample.cube.colors[sample.cube.facelets[face.offset + k - 1]]}">
						{{ sample.cube.facelets[face.offset + k - 1] }}
					</span>
				</div>
			</div>
			<dl class="summary">
				<dt>State</dt><dd><code>{{ sample.cube.facelets }}</code></dd>
				<dt>Scheme</dt><dd>{{ sample.cube.scheme }}, hue gap {{ sample.cube.hueGap.toFixed(0) }}°, body <span class="swatch" :style="{background: sample.cube.body}" /> {{ sample.cube.body }}</dd>
				<dt>Camera</dt><dd>fovY {{ sample.intrinsics.fovY.toFixed(1) }}°, f {{ sample.intrinsics.fx.toFixed(1) }} px</dd>
				<dt>Build</dt><dd>gap {{ fixed(sample.render.gap) }}, cubie radius {{ fixed(sample.render.cubieRadius) }}, border {{ fixed(sample.render.border) }}, sticker radius {{ fixed(sample.render.stickerRadius) }}</dd>
				<dt>Material</dt><dd>roughness sticker {{ fixed(sample.render.stickerRoughness) }}, body {{ fixed(sample.render.bodyRoughness) }}</dd>
				<dt>Lights</dt>
				<dd>
					main <span class="swatch" :style="{background: sample.render.main.color}" /> {{ fixed(sample.render.main.intensity) }},
					ambient <span class="swatch" :style="{background: sample.render.ambient.color}" /> {{ fixed(sample.render.ambient.intensity) }},
					{{ sample.render.points.length }} point
					<span v-for="(point, i) of sample.render.points" :key="i" class="swatch" :style="{background: point.color}" />
				</dd>
			</dl>
			<details>
				<summary>labels.json</summary>
				<pre>{{ labelsJson }}</pre>
			</details>
		</section>
	</div>
</template>

<script lang="ts">
	import {defineComponent, markRaw} from "vue";
	import JSZip from "jszip";

	import {BuildSet, FACE_LETTERS, Sample, SchemeSet, generateSample} from "../rubikSamples/sampler";
	import SampleRenderer from "../rubikSamples/sampleRenderer";
	import {VideoSample, generateVideo} from "../rubikSamples/video";



	const SIZES = [
		{id: "640x480", width: 640, height: 480},
		{id: "480x640", width: 480, height: 640},
		{id: "512x512", width: 512, height: 512},
		{id: "1024x768", width: 1024, height: 768},
		{id: "768x1024", width: 768, height: 1024},
		{id: "1280x720", width: 1280, height: 720},
		{id: "720x1280", width: 720, height: 1280},
	];


	export default defineComponent({
		name: "rubik-samples",


		data () {
			return {
				sizes: SIZES,
				sizeId: SIZES[0].id,
				schemes: "standard" as SchemeSet,
				builds: "classic" as BuildSet,
				realism: false,
				seed: 1,
				seedInput: 1,
				sample: null as Sample,
				images: [] as string[],
				overlay: true,
				status: "",
				video: null as VideoSample,
				videoFrames: [] as string[],
				videoIndex: 0,
				videoTimer: 0,
			};
		},


		computed: {
			views () {
				return this.sample ? this.sample.views : [];
			},


			// unfolded cube: U on top, L F R B in a row, D below
			netFaces () {
				return "ULFRBD".split("").map(letter => ({letter, offset: FACE_LETTERS.indexOf(letter) * 9}));
			},


			labelsJson () {
				return JSON.stringify(this.sample, null, "\t");
			},


			videoLabel () {
				return this.video ? this.video.views[this.videoIndex] : null;
			},
		},


		mounted () {
			this.renderer = markRaw(new SampleRenderer());
			// console / test access
			window["$rubikSamples"] = this;
			const seed = Number(this.$route.query.seed);
			const size = SIZES.find(size => size.id === this.$route.query.size);
			if (size)
				this.sizeId = size.id;
			if (["standard", "nonstandard", "all"].includes(this.$route.query.schemes as string))
				this.schemes = this.$route.query.schemes as SchemeSet;
			if (["classic", "antipop", "all"].includes(this.$route.query.builds as string))
				this.builds = this.$route.query.builds as BuildSet;
			this.realism = this.$route.query.realism === "1";
			this.generate(seed > 0 ? seed : this.randomSeed());
		},


		beforeUnmount () {
			this.stopVideo();
			this.renderer.dispose();
		},


		methods: {
			randomSeed (): number {
				return 1 + Math.floor(Math.random() * 0x7fffffff);
			},


			fixed (value: number): string {
				return value.toFixed(3);
			},


			generate (seed: number) {
				if (!(seed > 0))
					return;

				const size = SIZES.find(size => size.id === this.sizeId);
				const started = performance.now();
				this.seed = this.seedInput = seed;
				this.stopVideo();
				this.video = null;
				this.videoFrames = [];
				this.sample = markRaw(generateSample(seed, {width: size.width, height: size.height, schemes: this.schemes, builds: this.builds, realism: this.realism}));
				this.renderer.load(this.sample);
				this.images = this.renderer.renderAll();
				this.status = `${(performance.now() - started).toFixed(0)} ms`;

				if (Number(this.$route.query.seed) !== seed || this.$route.query.size !== size.id || (this.$route.query.schemes || "standard") !== this.schemes
					|| (this.$route.query.builds || "classic") !== this.builds || (this.$route.query.realism === "1") !== this.realism) {
					this.$router.replace({query: {...this.$route.query, seed: String(seed), size: size.id, schemes: this.schemes, builds: this.builds,
						...this.realism ? {realism: "1"} : {realism: undefined}}});
				}
			},


			// the scene's test video: frames rendered with the same renderer (a video is a sample whose views are frames)
			makeVideo () {
				const started = performance.now();
				this.stopVideo();
				// ?videoFps=&videoHold=&videoTurn= (seconds) override the defaults (5 fps, 2 s holds, 1.2 s turns);
				// ?videoTwists=N adds N random face turns after the holds (?videoTwistHold=, ?videoTwistTime=, ?videoReorient=: seconds)
				const option = (name: string) => Number(this.$route.query[name]) > 0 ? Number(this.$route.query[name]) : undefined;
				// ?videoHandheld=1: a hand-held phone shot (wander, flicks, early quick twists, motion blur)
				this.video = markRaw(generateVideo(this.sample, {fps: option("videoFps"), hold: option("videoHold"), turn: option("videoTurn"),
					twists: option("videoTwists"), twistHold: option("videoTwistHold"), twistTime: option("videoTwistTime"), reorient: option("videoReorient"),
					handheld: this.$route.query.videoHandheld === "1"}));
				this.renderer.load(this.video as unknown as Sample);
				this.videoFrames = markRaw(this.renderer.renderAll());
				this.renderer.load(this.sample);
				this.videoIndex = 0;
				this.status = `video: ${this.videoFrames.length} frames at ${this.video.video.fps} fps in ${(performance.now() - started).toFixed(0)} ms`;
				this.toggleVideo();
			},


			toggleVideo () {
				if (this.videoTimer)
					return this.stopVideo();
				this.videoTimer = window.setInterval(() => this.videoIndex = (this.videoIndex + 1) % this.videoFrames.length, 1000 / this.video.video.fps);
			},


			stopVideo () {
				if (this.videoTimer)
					window.clearInterval(this.videoTimer);
				this.videoTimer = 0;
			},


			async downloadVideo () {
				const zip = new JSZip();
				const name = `rubik-video-${this.seed}`;
				const ext = (url: string) => url.startsWith("data:image/jpeg") ? "jpg" : "png";
				this.videoFrames.forEach((url, i) => zip.file(`${name}/frame${String(i + 1).padStart(4, "0")}.${ext(url)}`, url.split(",")[1], {base64: true}));
				zip.file(`${name}/labels.json`, JSON.stringify(this.video, null, "\t"));
				const blob = await zip.generateAsync({type: "blob"});
				const link = document.createElement("a");
				link.href = URL.createObjectURL(blob);
				link.download = `${name}.zip`;
				link.click();
				setTimeout(() => URL.revokeObjectURL(link.href), 1000);
			},


			async download () {
				const zip = new JSZip();
				const name = `rubik-sample-${this.seed}`;
				this.images.forEach((url, i) => zip.file(`${name}/view${i + 1}.${url.startsWith("data:image/jpeg") ? "jpg" : "png"}`, url.split(",")[1], {base64: true}));
				zip.file(`${name}/labels.json`, this.labelsJson);
				const blob = await zip.generateAsync({type: "blob"});
				const link = document.createElement("a");
				link.href = URL.createObjectURL(blob);
				link.download = `${name}.zip`;
				link.click();
				setTimeout(() => URL.revokeObjectURL(link.href), 1000);
			},
		},
	});
</script>

<style scoped>
.rubik-samples { box-sizing: border-box; min-height: 100vh; padding: 1rem; color: #20232a; background: #f5f2e9; }
.toolbar { display: flex; flex-wrap: wrap; gap: .6rem; align-items: center; padding-left: 2rem; }
.toolbar input[type=number] { width: 8rem; }
.toolbar button { font-size: 1.15rem; line-height: 1; padding: .35rem .5rem; }
button, select, input[type=number] { padding: .4rem .55rem; border: 1px solid #777; border-radius: .25rem; background: #fff; }
button { cursor: pointer; }
button:disabled { cursor: default; opacity: .45; }
.check { display: flex; align-items: center; gap: .3rem; }
.status { color: #5a5346; font-size: .9rem; }
.views { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; margin: 1rem 0; }
.view { margin: 0; }
.video { max-width: 760px; margin: 1rem 0; }
.video figcaption { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; }
.frame { position: relative; width: 100%; border: 1px solid #b8b09f; background: #ddd; }
.frame img, .overlay { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
.overlay polygon { fill: none; stroke: #fff; stroke-width: 1.2; mix-blend-mode: difference; }
.overlay text { font: bold 11px sans-serif; fill: #fff; text-anchor: middle; dominant-baseline: central; paint-order: stroke; stroke: #000; stroke-width: 2px; }
figcaption { margin-top: .3rem; font-size: .8rem; color: #5a5346; }
.labels { display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-start; }
.net { display: grid; grid-template-areas: ". U . ." "L F R B" ". D . ."; gap: 4px; }
.net-face { display: grid; grid-template-columns: repeat(3, 22px); grid-template-rows: repeat(3, 22px); gap: 2px; }
.net-cell { display: flex; align-items: center; justify-content: center; font: bold 10px sans-serif; color: #000a; border-radius: 3px; border: 1px solid #0003; }
.summary { display: grid; grid-template-columns: auto 1fr; gap: .25rem .8rem; margin: 0; font-size: .85rem; flex: 1 1 320px; }
.summary dt { color: #5a5346; }
.summary dd { margin: 0; }
.summary code { word-break: break-all; }
.swatch { display: inline-block; width: .9em; height: .9em; vertical-align: -.1em; border: 1px solid #0004; border-radius: 2px; }
details { flex: 1 1 100%; }
pre { max-height: 40vh; overflow: auto; padding: .6rem; font-size: .75rem; background: #fffdf7; border: 1px solid #d5cdbc; }

@media (max-width: 640px) {
	.rubik-samples { padding: .5rem; }
	.toolbar { padding-left: 0; }
}
</style>
