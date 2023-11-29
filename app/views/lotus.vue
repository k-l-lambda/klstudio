<template>
	<div v-resize="onResize" class="lotus">
		<main>
			<LotusPlayer ref="player"
				:source="score"
				:showCursor="showCursor"
				:enablePointer="true"
				:noteHighlight="true"
				:bakingSheet="baking"
				:isPlaying.sync="isPlaying"
				@cursorSystemShift="onSystemShift"
			/>
		</main>
		<div class="controls" v-show="controls">
			<button @click="resetCursor">&#x23EE;</button>
			<button @click="togglePlayer">{{isPlaying ? "&#x23f8;" : "&#x23f5;"}}</button>
			<CheckButton v-model="showCursor" content="&#xa56f;" />
		</div>
	</div>
</template>

<script>
	import url from "url";
	import resize from "vue-resize-directive";
	import {MidiAudio} from "@k-l-lambda/web-widgets";

	import LotusPlayer from "../components/lotus-player.vue";
	import CheckButton from "../components/check-button.vue";



	export default {
		name: "lotus",


		directives: {
			resize,
		},


		components: {
			LotusPlayer,
			CheckButton,
		},


		data () {
			return {
				score: null,
				showCursor: false,
				baking: false,
				controls: false,
				isPlaying: false,
			};
		},


		created () {
			if (MidiAudio.WebAudio.empty())
				MidiAudio.loadPlugin({soundfontUrl: "./soundfont/", api: "webaudio"}).then(() => console.log("Soundfont loaded."));
		},


		mounted () {
			window.onhashchange = () => this.onHashChange();
			this.onHashChange();
		},


		methods: {
			onResize () {
				this.size = {width: this.$el.clientWidth, height: this.$el.clientHeight};
			},


			async onHashChange () {
				let hash = location.hash.substring(1);
				if (hash[0] === "/" && !/#/.test(hash))
					hash += "#";

				hash = hash.replace(/.*#/, "");	// ignore router path

				const hashurl = url.parse(hash, true);
				//console.log("hashurl:", hashurl);

				this.controls = !!hashurl.query.controls;
				this.showCursor = !!hashurl.query.controls;
				this.baking = !!hashurl.query.baking;

				const source = hashurl.pathname;
				const res = await fetch(source);
				this.score = await res.text();
			},


			async onSystemShift (systemIndex) {
				await this.$nextTick();
				const cursor = this.$refs.player.$el.querySelector(".cursor");
				if (cursor)
					cursor.parentElement.scrollIntoView({behavior: "smooth", block: systemIndex ? "center" : "end"});
			},


			getRouterPath () {
				const [path] = location.hash.match(/^#\/[^#]*/) || [];

				return path ? path + "#" : "";
			},


			togglePlayer () {
				if (this.$refs.player) 
					this.$refs.player.togglePlayer();
			},


			resetCursor () {
				if (this.$refs.player.midiPlayer) {
					this.$refs.player.midiPlayer.pause();
					this.$refs.player.midiPlayer.turnCursor(0);
				}
			},
		},
	};
</script>

<style lang="scss" scoped>
	.lotus
	{
		width: 100%;
		height: 100%;

		main
		{
			width: 100%;
			height: 100%;
			overflow: auto;
		}

		.controls
		{
			position: absolute;
			top: 0;
			visibility: hidden;
		}

		&:hover
		{
			.controls
			{
				visibility: visible;
			}
		}
	}
</style>

<style lang="scss">
	button.on
	{
		background-color: #efe;
	}
</style>
