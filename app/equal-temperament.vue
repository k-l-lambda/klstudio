<template>
	<div class="equal-temperament" v-resize="onResize">
		<article>
			<SvgMap class="cartesian"
				:width="cartesianWidth"
				:height="cartesianWidth * 0.7"
				:initViewWidth="18"
				:initViewCenter="{x: 6, y: -8}"
			>
				<g class="axes">
					<line x1="-100" y1="0" x2="100" y2="0" />
					<line x1="0" y1="-100" x2="0" y2="100" />
				</g>
				<path class="curve" :d="curvePath" />
				<g class="axis-points">
					<circle v-for="point of stepPoints"
						:cx="point.x"
						:cy="0"
					/>
				</g>
				<g class="curve-points">
					<g v-for="point of stepPoints"
						:class="{bold: point.C}"
					>
						<line
							:x1="point.x" :y1="0"
							:x2="point.x" :y2="point.y"
						/>
						<circle
							:cx="point.x"
							:cy="point.y"
						/>
					</g>
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
			<div class="formations">
				<div class="inner">
					<p>
						<img :src="url12Equal" :style="{zoom: 2}" />
					</p>
				</div>
			</div>
		</header>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";

	import SvgMap from "./svg-map.vue";

	import url12Equal from "./images/f=2^x_12.svg";



	const CARTESIAN_Y_SCALE = -4;



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
				curvePoints: Array(1080).fill().map((_, i) => ({
					x: (i - 480) / 10,
					y: CARTESIAN_Y_SCALE * 2 ** ((i - 480) / 120),
				})),
				stepPoints: Array(88).fill().map((_, i) => ({
					pitch: i + 21,
					C: (i + 21) % 12 == 0,
					x: i - 39,
					y: CARTESIAN_Y_SCALE * 2 ** ((i - 39) / 12),
				})),
				url12Equal,
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

	/*svg
	{
		cursor: crosshair;
	}*/

	.axes line
	{
		stroke: black;
		stroke-width: 0.06;
	}

	.curve
	{
		fill: transparent;
		stroke: steelblue;
		stroke-width: 0.1;
	}

	.axis-points circle
	{
		r: 0.12;
		fill: black;
	}

	.curve-points circle
	{
		r: 0.12;
		fill: black;
	}

	.curve-points .bold circle
	{
		r: 0.16;
	}

	.curve-points line
	{
		stroke: #222;
		stroke-width: 0.02;
	}

	.curve-points .bold line
	{
		stroke-width: 0.08;
	}

	.clock .frame
	{
		stroke: black;
		stroke-width: 2;
		fill: transparent;
	}
</style>
