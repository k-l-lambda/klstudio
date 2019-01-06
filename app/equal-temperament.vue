<template>
	<div class="equal-temperament" v-resize="onResize">
		<article>
			<SvgMap class="cartesian"
				:width="cartesianWidth"
				:height="cartesianWidth * 0.7"
				:initViewWidth="24"
				:initViewCenter="{x: 6, y: -5}"
			>
				<g class="axes">
					<line x1="-100" y1="0" x2="100" y2="0" />
					<line x1="0" y1="-100" x2="0" y2="100" />
				</g>
			</SvgMap>
			<svg class="clock"
				:width="clockSize"
				:height="clockSize"
				viewBox="-400 -400 800 800"
			>
				<circle class="frame" r="380" cx="0" cy="0" />
			</svg>
		</article>
		<header>
		</header>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";

	import SvgMap from "./svg-map.vue";



	export default {
		name: "equal-temperament",


		props: {
			cartesianWidth: {
				type: Number,
				default: () => 800,
			},
			clockSize: {
				type: Number,
				default: () => 600,
			},
		},


		directives: {
			resize,
		},


		components: {
			SvgMap,
		},


		data() {
			return {
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

<style scoped>
	header
	{
		position: absolute;
		top: 0;
		width: 100%;
		text-align: center;
		font-family: Arial;
		user-select: none;
	}

	header .formations
	{
		padding: 0 2em;
		text-align: right;
		font-size: 36px;
		font-weight: bold;
		color: steelblue;
	}

	article > *
	{
		vertical-align: middle;
	}

	.axes line
	{
		stroke: black;
		stroke-width: 0.06;
	}

	.clock .frame
	{
		stroke: black;
		stroke-width: 2;
		fill: transparent;
	}
</style>
