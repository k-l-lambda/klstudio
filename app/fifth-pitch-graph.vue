<template>
	<SvgMap
		:width="size.width"
		:height="size.height"
		:viewCenter="viewCenter"
		:initViewWidth="20"
		class="svg-map"
		v-resize="onResize"
	>
		<g class="axes">
			<line :x1="-12" :x2="12" :y1="0" :y2="0" />
			<line :y1="-12" :y2="12" :x1="0" :x2="0" />
		</g>
	</SvgMap>
</template>

<script>
	import resize from "vue-resize-directive";

	import SvgMap from "./svg-map.vue";



	export default {
		name: "fifth-pitch-graph",


		directives: {
			resize,
		},


		components: {
			SvgMap,
		},


		data() {
			return {
				viewCenter: {x: 0, y: 0},
				size: {},
			};
		},


		mounted() {
			//console.log("home:", document);
		},


		methods: {
			onResize() {
				this.size = {width: this.$el.clientWidth, height: this.$el.clientHeight};
			},
		},
	};
</script>

<style>
	.svg-map
	{
		width: 100%;
		height: 100%;
	}

	.axes
	{
		stroke: black;
		stroke-width: 0.1;
	}
</style>
