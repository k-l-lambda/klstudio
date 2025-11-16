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
	import resize from "vue-resize-directive";
	import {MidiRoll, MIDI, MidiPlayer, MidiAudio} from "@k-l-lambda/music-widgets";

	import ProgressBar from "../components/progress-bar.vue";
	import StoreInput from "../components/store-input.vue";



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
			if (MidiAudio.WebAudio.empty())
				MidiAudio.loadPlugin({soundfontUrl: "./soundfont/", api: "webaudio"}).then(() => console.log("Soundfont loaded."));

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


		beforeUnmount () {
			if (this.player)
				this.player.pause();
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

				if (!MidiAudio.WebAudio.empty()) {
					switch (data.subtype) {
					case "noteOn":
						MidiAudio.noteOn(data.channel, data.noteNumber, data.velocity, timestamp);

						break;
					case "noteOff":
						MidiAudio.noteOff(data.channel, data.noteNumber, timestamp);

						break;
					}
				}
			},


			togglePlayer () {
				if (this.player) {
					if (this.player.isPlaying)
						this.player.pause();
					else
						this.player.play();
				}
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
</style>
