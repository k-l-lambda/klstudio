<template>
	<div class="midi-player"
		:class="{hover: dragHover, empty: !player}"
		v-resize="onResize"
		@dragover.prevent="dragHover = true"
		@dragleave="dragHover = false"
		@drop.prevent="onDrop"
	>
		<header>
			<StoreInput v-show="false" v-model="source" localKey="midiPlayer.source" />
			<StoreInput v-show="false" v-model="name" localKey="midiPlayer.name" />
			<span v-if="name" v-text="name"></span>
			<button v-if="player" @click="togglePlayer"><i v-if="player">{{player.isPlaying ? "&#xf04c;" : "&#xf04b;"}}</i></button>
			<ProgressBar v-if="player && player.notation" :cursor.sync="cursorTime" :duration="player.notation.endTime" />
		</header>
		<main>
			<MidiRoll :player="player" :timeScale="viewTimeScale" :height="400" :width="windowSize.width" />
		</main>
	</div>
</template>

<script>
	import {h} from "vue";
	import resize from "vue-resize-directive";
	import {MIDI, MidiPlayer} from "@k-l-lambda/music-widgets";

	import MidiAudio from "../inc/fluidAudio";
	import ProgressBar from "../components/progress-bar.vue";
	import StoreInput from "../components/store-input.vue";
	const PADDINGS = {
		left: 3,
		right: 1,
	};
	const playFrameDelay = () => new Promise(resolve => setTimeout(resolve, 15));


	const ensureWebAudioReady = async () => {
		await MidiAudio.resume();
	};


	const renderPianoRoll = (notation, timeScale, pitchScale) => h("g", {class: "piano-roll-root midi-player-piano-roll"}, notation.notes.map((note, i) => h("g", {
		key: i,
		class: "note",
		transform: `translate(${note.start * timeScale}, ${-note.pitch * pitchScale})`,
	}, [
		h("rect", {
			width: note.duration * timeScale,
			height: pitchScale,
			class: [{on: note.on}, note.classes],
		}),
		h("line", {
			x1: 0,
			x2: 0,
			y1: 0,
			y2: pitchScale,
		}),
	])));


	const MidiRoll = {
		name: "midi-roll",


		props: {
			player: Object,
			height: {
				type: Number,
				default: 200,
			},
			width: Number,
			timeScale: {
				type: Number,
				default: 1e-3,
			},
		},


		data () {
			return {
				notation: null,
				timeScroll: 0,
			};
		},


		computed: {
			widthLimited () {
				return Number.isFinite(this.width);
			},


			aspectRatio () {
				return this.widthLimited ? this.width / this.height : 1.6;
			},


			viewHeight () {
				if (this.notation) {
					const {low, high} = this.notation.keyRange;

					return high - low + 5;
				}

				return 90;
			},


			justifyWidth () {
				const duration = this.notation ? this.notation.endTime : this.height * this.aspectRatio;
				return duration * this.timeScale + PADDINGS.left + PADDINGS.right;
			},


			viewWidth () {
				if (this.widthLimited)
					return this.width * this.viewHeight / this.height;

				return this.justifyWidth;
			},


			viewBox () {
				return `-${PADDINGS.left} ${this.notation ? -this.notation.keyRange.high - 1 : 0} ${this.viewWidth} ${this.viewHeight}`;
			},


			pitchScales () {
				if (!this.notation)
					return [];

				return Array(9).fill().map((_, i) => i * 12).filter(p => p >= this.notation.keyRange.low);
			},


			timeScales () {
				if (!this.notation)
					return [];

				return Array(Math.ceil(this.notation.endTime / 15e+3)).fill().map((_, i) => i * 15e+3);
			},


			progressTime () {
				return this.player ? this.player.progressTime : null;
			},


			visibleTimeSpan () {
				if (this.widthLimited)
					return (this.viewWidth - (PADDINGS.left + PADDINGS.right)) / this.timeScale;

				return Infinity;
			},


			xScroll () {
				return this.timeScroll * this.timeScale;
			},
		},


		created () {
			this.load();
		},


		methods: {
			load () {
				this.notation = null;

				if (this.player) {
					this.notation = this.player.notation;

					this.updateNoteStatus();
					this.$forceUpdate();
				}
			},


			updateNoteStatus () {
				if (!this.notation)
					return;

				const valid = Number.isFinite(this.progressTime);
				for (const note of this.notation.notes)
					note.on = valid && (note.start < this.progressTime) && (note.start + note.duration > this.progressTime);
			},


			onClickCanvas (event) {
				if (this.player && this.notation) {
					const docToCanvas = (this.notation.keyRange.high - this.notation.keyRange.low + 5) / this.height;
					const x = event.offsetX * docToCanvas - PADDINGS.left + this.xScroll;
					const time = x / this.timeScale;

					if (time >= 0 && time < this.notation.endTime)
						this.player.turnCursor(time);
				}
			},


			onMouseWheel (event) {
				this.timeScroll += event.deltaY * 0.4 / this.timeScale;
			},


			adjustTimeScroll () {
				if (this.progressTime - this.timeScroll > this.visibleTimeSpan * 0.6)
					this.timeScroll = Math.max(Math.min(this.progressTime - this.visibleTimeSpan * 0.6, this.notation.endTime - this.visibleTimeSpan), 0);
				else if (this.progressTime - this.timeScroll < this.visibleTimeSpan * 0.4)
					this.timeScroll = Math.max(this.progressTime - this.visibleTimeSpan * 0.4, 0);
			},
		},


		watch: {
			player: "load",


			progressTime () {
				this.updateNoteStatus();

				if (this.widthLimited)
					this.adjustTimeScroll();
			},
		},


		render () {
			const content = [];

			if (this.progressTime && this.notation) {
				content.push(h("g", {class: "progress"}, [
					h("rect", {
						x: 0,
						y: -120,
						height: 121 - this.notation.keyRange.low,
						width: this.progressTime * this.timeScale,
					}),
					h("line", {
						x1: this.progressTime * this.timeScale,
						x2: this.progressTime * this.timeScale,
						y1: -this.notation.keyRange.low + 1,
						y2: -120,
					}),
				]));
			}

			if (this.notation) {
				content.push(...this.notation.bars.map((bar, i) => h("g", {key: `b-${i}`, class: "bar measure"}, [
					bar.index === 0 ? h("line", {
						x1: bar.time * this.timeScale,
						x2: bar.time * this.timeScale,
						y1: -this.notation.keyRange.low + 1,
						y2: -120,
					}) : null,
				])));

				content.push(...this.pitchScales.map(pitch => h("g", {key: `p-${pitch}`, class: "bar pitch-group"}, [
					h("line", {
						x1: 0,
						x2: this.timeScale * this.notation.endTime,
						y1: -pitch + 1,
						y2: -pitch + 1,
					}),
				])));

				content.push(renderPianoRoll(this.notation, this.timeScale, 1));
			}

			const children = [h("g", {transform: `translate(${-this.xScroll}, 0)`}, content)];

			if (this.notation) {
				children.push(h("g", {class: "scales"}, [
					h("rect", {
						class: "pitch-padding",
						x: -10,
						y: -120,
						width: 10,
						height: -this.notation.keyRange.low + 121,
					}),
					h("line", {
						x1: 0,
						x2: 0,
						y1: -this.notation.keyRange.low + 1,
						y2: -120,
					}),
					h("line", {
						x1: 0,
						x2: this.timeScale * this.notation.endTime - this.xScroll,
						y1: -this.notation.keyRange.low + 1,
						y2: -this.notation.keyRange.low + 1,
					}),
					...this.pitchScales.map(pitch => h("g", {key: `sp-${pitch}`, class: "pitch-bar"}, [
						h("line", {x1: -.8, x2: 0, y1: -pitch + 0.5, y2: -pitch + 0.5}),
						h("text", {x: -2, y: -pitch + 1}, pitch),
					])),
					h("g", {transform: `translate(${-this.xScroll}, 0)`}, this.timeScales.map(time => h("g", {key: `t-${time}`, class: "time-bar"}, [
						h("line", {
							x1: time * this.timeScale,
							x2: time * this.timeScale,
							y1: -this.notation.keyRange.low + 1,
							y2: -this.notation.keyRange.low + 1.8,
						}),
						h("text", {x: time * this.timeScale, y: -this.notation.keyRange.low + 4}, `${time * 1e-3}s`),
					]))),
				]));
			}

			return h("svg", {
				xmlns: "http://www.w3.org/2000/svg",
				viewBox: this.viewBox,
				height: this.height,
				class: "midi-roll",
				onClick: this.onClickCanvas,
				onWheel: this.onMouseWheel,
			}, children);
		},
	};



	const encodeBuffer = buffer => {
		const arr = new Uint8Array(buffer);
		const str = [...arr].map(char => String.fromCharCode(char)).join("");

		return btoa(str);
	};


	const decodeBuffer = code => {
		const str = atob(code);
		const arr = str.split("").map(char => char.charCodeAt(0));

		return new Uint8Array(arr).buffer;
	};



	export default {
		name: "midi-player",


		directives: {
			resize,
		},


		components: {
			MidiRoll,
			ProgressBar,
			StoreInput,
		},


		data () {
			return {
				dragHover: false,
				player: null,
				viewTimeScale: 4e-3,
				name: null,
				source: null,
				windowSize: {
					width: 800,
					height: 800,
				},
			};
		},


		computed: {
			cursorTime: {
				get () {
					return this.player && this.player.progressTime;
				},

				set (value) {
					if (this.player)
						this.player.turnCursor(value);
				},
			},
		},


		created () {
			if (MidiAudio.empty())
				MidiAudio.loadPlugin().then(() => console.log("Soundfont loaded."));

			window.addEventListener("keydown", event => {
				let handled = true;

				const inputing = document.activeElement.nodeName === "INPUT";

				switch (event.key) {
				case " ":
					if (!inputing)
						this.togglePlayer();

					break;
				default:
					handled = false;
				}

				if (handled)
					event.preventDefault();
			});
		},


		mounted () {
			if (this.source)
				this.loadMidiBuffer(decodeBuffer(this.source));
		},


		beforeDestroy () {
			if (this.player)
				this.player.pause();
			MidiAudio.stopAllNotes();
		},


		methods: {
			onResize () {
				this.windowSize = {
					width: this.$el.clientWidth,
					height: this.$el.clientHeight,
				};
			},


			async loadMidiFile (file) {
				const buffer = await new Promise(resolve => {
					const fr = new FileReader();
					fr.onload = () => resolve(fr.result);
					fr.readAsArrayBuffer(file);
				});

				this.name = file.name;

				this.loadMidiBuffer(buffer);
			},


			async loadMidiBuffer (buffer) {
				if (this.player) {
					this.player.dispose();
					this.player = null;
				}

				this.source = encodeBuffer(buffer);

				const midi = MIDI.parseMidiData(buffer);
				this.updatePlayer(midi);
			},


			updatePlayer (midi) {
				console.log("midi:", midi);

				// Loading a new file acts like a pause: stop the old player and
				// silence any notes already scheduled into the synth.
				if (this.player) {
					this.player.pause();
					this.player.dispose();
				}
				MidiAudio.stopAllNotes();

				this.player = new MidiPlayer(midi, {
					onMidi: (data, timestamp) => this.onMidi(data, timestamp),
				});
			},


			async onDrop (event) {
				this.dragHover = false;

				const file = event.dataTransfer.files[0];
				if (file && ["audio/midi", "audio/mid"].includes(file.type)) 
					this.loadMidiFile(file);
				else if (file && file.type === "application/json") {
					const text = await new Promise(resolve => {
						const fr = new FileReader();
						fr.onload = () => resolve(fr.result);
						fr.readAsText(file);
					});
					this.name = file.name;
					const midi = JSON.parse(text);
					this.updatePlayer(midi);
				}
			},


			onMidi (data, timestamp) {
				//console.log("onMidi:", data.subtype, timestamp, data);

				if (MidiAudio.empty())
					return;

				switch (data.subtype) {
				case "noteOn":
					MidiAudio.noteOn(data.channel, data.noteNumber, data.velocity, timestamp);

					break;
				case "noteOff":
					MidiAudio.noteOff(data.channel, data.noteNumber, timestamp);

					break;
				case "programChange":
					MidiAudio.programChange(data.channel, data.programNumber);

					break;
				}
			},


			togglePlayer () {
				if (this.player) {
					if (this.player.isPlaying) {
						this.player.pause();
						MidiAudio.stopAllNotes();
					}
					else
						this.playMidi();
				}
			},


			async playMidi () {
				await ensureWebAudioReady();
				this.player.play({nextFrame: playFrameDelay});
			},
		},
	};
</script>

<style lang="scss" scoped>
	@import "../assets/fonts/icon-fas.css";


	.midi-player
	{
		font-family: Verdana, Arial, Helvetica, sans-serif;
	}

	.midi-player.hover
	{
		background: #dfd;
	}

	.midi-player.empty
	{
		header::before
		{
			content: "DROP MIDI FILE HERE";
			color: #0002;
		}
	}

	header
	{
		padding: 1em;
		text-align: center;
		font-size: 20px;

		& > *
		{
			margin: 0 1em;
			font-size: inherit;
			vertical-align: middle;
		}

		.progress-bar
		{
			width: 8em;
			height: 1.4em;
		}
	}

	i
	{
		font-family: "IconFas";
		font-style: normal;
	}

	:deep(.midi-roll .scales line)
	{
		stroke: black;
		stroke-width: 0.1;
	}

	:deep(.midi-roll .scales text)
	{
		font-size: 2px;
		text-anchor: middle;
		user-select: none;
	}

	:deep(.midi-roll .bar line)
	{
		stroke: black;
		stroke-width: 0.01;
	}

	:deep(.midi-roll .pitch-bar line),
	:deep(.midi-roll .time-bar line)
	{
		stroke: black;
		stroke-width: 0.06;
	}

	:deep(.midi-roll .pitch-padding)
	{
		fill: #fffc;
	}

	:deep(.midi-roll .progress rect)
	{
		fill: #afa1;
	}

	:deep(.midi-roll .progress line)
	{
		stroke: #0a0;
		stroke-width: 0.04;
	}

	:deep(.midi-player-piano-roll .note)
	{
		cursor: pointer;
		opacity: 0.6;
	}

	:deep(.midi-player-piano-roll .note:hover rect),
	:deep(.midi-player-piano-roll .note:hover line)
	{
		opacity: 0.9;
		stroke: orange;
		stroke-width: 0.08px;
	}

	:deep(.midi-player-piano-roll .note.on rect)
	{
		fill: #2a2;
	}

	:deep(.midi-player-piano-roll .note rect)
	{
		fill: #555;
	}

	:deep(.midi-player-piano-roll .note line)
	{
		stroke: #111;
		stroke-width: 0.12px;
	}
</style>
