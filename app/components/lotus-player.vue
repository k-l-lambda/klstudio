<template>
	<div class="lotus-player">
		<SheetSigns v-if="svgHashTable" ref="signs" v-show="false" :hashTable="svgHashTable" />
		<SheetLive v-if="sheetDocument" ref="sheet"
			:doc="sheetDocument"
			:midiNotation="midiNotation"
			:pitchContextGroup="pitchContextGroup"
			:midiPlayer.sync="midiPlayer"
			:showCursor="showCursor"
			:showMark="enablePointer"
			:enablePointer="enablePointer"
			:scheduler="scheduler"
			:noteHighlight="noteHighlight"
			:bakingMode="bakingSheet"
			:backgroundImages="bakingSheet ? bakingImages : null"
			:watermark="null"
			@midi="onMidi"
			@pointerClick="onPointerClick"
		/>
		<canvas v-show="false" ref="canvas" />
	</div>
</template>

<script>
	import * as lotus from "@k-l-lambda/lotus";
	import {MidiAudio} from "@k-l-lambda/music-widgets";

	import {animationDelay} from "../delay";



	export default {
		name: "lotus-player",


		components: {
			SheetLive: lotus.SheetLive,
			SheetSigns: lotus.SheetSigns,
		},


		props: {
			source: [String, Object],
			showCursor: Boolean,
			enablePointer: Boolean,
			noteHighlight: Boolean,
			bakingSheet: Boolean,
		},


		data () {
			return {
				sheetDocument: null,
				midiNotation: null,
				pitchContextGroup: null,
				midiPlayer: null,
				bakingImages: null,
				svgHashTable: null,
				scheduler: null,
			};
		},


		computed: {
			isPlaying () {
				return this.midiPlayer && this.midiPlayer.isPlaying;
			},
		},


		created () {
			if (this.source)
				this.loadSheet();
		},


		methods: {
			async loadSheet () {
				this.sheetDocument = null;
				this.midiNotation = null;
				this.pitchContextGroup = null;
				this.bakingImages = null;

				if (this.source) {
					const scoreBundle = typeof this.source === "string" ? lotus.ScoreBundle.fromJSON(this.source) : this.source;
					this.sheetDocument = scoreBundle.scoreJSON.doc;
					this.pitchContextGroup = scoreBundle.pitchContextGroup;
					this.midiNotation = scoreBundle.midiNotation;
					this.svgHashTable = scoreBundle.svgHashTable || scoreBundle.scoreJSON.hashTable;
					this.scheduler = scoreBundle.scheduler;

					// wait the initial frame before baking
					await this.$nextTick();

					this.bakingImages = [];
					const baker = scoreBundle.bakeSheet(this.$refs.canvas);
					for await (const url of baker)
						this.bakingImages.push(url);
				}
			},


			homePlayer () {
				if (this.midiPlayer)
					this.midiPlayer.turnCursor(0);
			},


			togglePlayer () {
				if (this.midiPlayer) {
					if (this.midiPlayer.isPlaying)
						this.midiPlayer.pause();
					else
						this.midiPlayer.play();
				}
			},


			onMidi (data, timestamp) {
				switch (data.subtype) {
				case "noteOn":
					MidiAudio.noteOn(data.channel, data.noteNumber, data.velocity, timestamp);

					break;
				case "noteOff":
					MidiAudio.noteOff(data.channel, data.noteNumber, timestamp);

					break;
				}
			},


			async onPointerClick (point) {
				if (Number.isFinite(point.tick)) {
					const isPlaying = this.midiPlayer.isPlaying;
					if (isPlaying) {
						this.midiPlayer.pause();
						await animationDelay();
					}

					this.midiPlayer.progressTicks = point.tick;

					if (isPlaying)
						this.midiPlayer.play();
				}
			},
		},


		watch: {
			source: "loadSheet",


			isPlaying (value) {
				this.$emit("update:isPlaying", value);
			},
		},
	};
</script>

<style lang="scss">
	.sheet.live
	{
		white-space: nowrap;
		display: inline-block;

		.page
		{
			display: inline-block;
			margin: 1em;
		}

		.cursor
		{
			fill: lightblue;
		}
	}
</style>
