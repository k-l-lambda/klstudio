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
				<g class="alignments">
					<line x1="-100" x2="100" y1="-100" y2="100" />
					<line x1="-100" x2="100" y1="100" y2="-100" />
				</g>
				<g class="circle">
					<circle class="shape" r="1" />
				</g>
				<g class="hyperbola">
					<path class="shape" :d="hyperbolaRPath" />
					<path class="shape" :d="hyperbolaLPath" />
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
			const halfPoints = [...Array(100).keys()].map(i => (i / 40) ** 2);

			return {
				size: {},
				hyperbolaPoints: [...halfPoints, ...halfPoints.map(a => -a)].sort((x, y) => x - y),
			};
		},


		computed: {
			hyperbolaRPath() {
				return "M" + this.hyperbolaPoints.map(point => `${Math.cosh(point).toFixed(6)} ${Math.sinh(point).toFixed(6)}`).join(" L");
			},


			hyperbolaLPath() {
				return "M" + this.hyperbolaPoints.map(point => `${-Math.cosh(point).toFixed(6)} ${Math.sinh(point).toFixed(6)}`).join(" L");
			},
		},


		mounted() {
			window.__main = this;
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

	.alignments line
	{
		stroke: #0004;
		stroke-width: 0.004;
		stroke-dasharray: 0.04 0.03;
	}

	.shape
	{
		fill: transparent;
		stroke-width: 0.03;
		stroke: black;
		/*stroke-dasharray: 0.04 0.02*/;
	}
</style>
