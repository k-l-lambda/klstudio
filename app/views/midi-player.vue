<template>
	<div class="midi-player"
		:class="{hover: dragHover}"
		v-resize="onResize"
		@dragover.prevent="dragHover = true"
		@dragleave="dragHover = false"
		@drop.prevent="onDrop"
	>
		<header>
			<button @click="togglePlayer" :disabled="!player"><i v-if="player">{{player.isPlaying ? "&#xf04c;" : "&#xf04b;"}}</i></button>
		</header>
		<main>
			<MidiRoll :player="player" :timeScale="viewTimeScale" :height="400" :width="windowSize.width" />
		</main>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";
	import {MidiRoll, MIDI, MidiPlayer, MidiAudio} from "@k-l-lambda/web-widgets";



	export default {
		name: "midi-player",


		directives: {
			resize,
		},


		components: {
			MidiRoll,
		},


		data () {
			return {
				dragHover: false,
				player: null,
				viewTimeScale: 4e-3,
				name: null,
				windowSize: {
					width: 800,
					height: 800,
				},
			};
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

				if (this.player) {
					this.player.dispose();
					this.player = null;
				}

				const midi = MIDI.parseMidiData(buffer);

				this.name = file.name;

				this.player = new MidiPlayer(midi, {
					onMidi: (data, timestamp) => this.onMidi(data, timestamp),
				});
				//console.log("notations:", this.notations);
			},


			onDrop () {
				this.dragHover = false;

				const file = event.dataTransfer.files[0];
				if (file && ["audio/midi", "audio/mid"].includes(file.type)) 
					this.loadMidiFile(file);
				
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

<style type="text/scss" scoped>
	@import "../assets/fonts/icon-fas.css";


	.midi-player.hover
	{
		background: #dfd;
	}

	header
	{
		padding: 1em;
		text-align: center;
	}

	i
	{
		font-family: "IconFas";
		font-style: normal;
	}
</style>
