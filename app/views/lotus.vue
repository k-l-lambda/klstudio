<template>
	<div v-resize="onResize" class="lotus">
		<LotusPlayer ref="player"
			:source="score"
			:showCursor="showCursor"
			:enablePointer="showCursor"
			:noteHighlight="showCursor"
			:bakingSheet="baking"
		/>
	</div>
</template>

<script>
	import url from "url";
	import resize from "vue-resize-directive";

	import LotusPlayer from "../components/lotus-player.vue";



	export default {
		name: "lotus",


		directives: {
			resize,
		},


		components: {
			LotusPlayer,
		},


		data () {
			return {
				score: null,
				showCursor: false,
				baking: false,
			};
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

				this.showCursor = !!hashurl.query.showCursor;
				this.baking = !!hashurl.query.baking;

				const source = hashurl.pathname;
				const res = await fetch(source);
				this.score = await res.text();
			},


			getRouterPath () {
				const [path] = location.hash.match(/^#\/[^#]*/) || [];

				return path ? path + "#" : "";
			},
		},
	};
</script>

<style scoped>
	.lotus
	{
		width: 100%;
		height: 100%;
	}
</style>
