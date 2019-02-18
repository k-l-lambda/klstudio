<template>
	<div class="hyperbolic">
		<article>
			<SvgMap
				:width="size.width"
				:height="size.height"
				:initViewWidth="4"
				:initViewCenter="{x: 0, y: 0}"
				v-resize="onResize"
			>
				<g class="axes">
					<line x1="-100" x2="100" y1="0" y2="0" />
					<line y1="-100" y2="100" x1="0" x2="0" />
				</g>
				<g class="circle">
					<circle r="1" class="shape" />
				</g>
			</SvgMap>
		</article>
		<header>
		</header>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";

	import SvgMap from "./svg-map.vue";



	export default {
		name: "hyperbolic",


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


		computed: {
			curvePath() {
				return "M" + this.curvePoints.map(point => `${point.x} ${point.y.toFixed(6)}`).join(" L");
			},
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
		pointer-events: none;
		padding: 1em 0;
	}

	header .formations
	{
		padding: 0 2em;
		text-align: left;
		font-size: 36px;
		font-weight: bold;
		color: steelblue;
	}

	header .formations .inner
	{
		display: inline-block;
		background-color: #fffc;
		border-radius: 1em;
	}

	article
	{
		user-select: none;
	}

	article > *
	{
		vertical-align: middle;
	}

	.axes line
	{
		stroke: black;
		stroke-width: 0.01;
	}

	.shape
	{
		fill: transparent;
		stroke-width: 0.03;
		stroke: black;
	}
</style>
