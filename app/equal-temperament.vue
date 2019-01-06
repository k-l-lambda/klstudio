<template>
	<div class="equal-temperament" v-resize="onResize">
		<article>
			<SvgMap class="cartesian" ref="cartesian"
				:width="cartesianWidth"
				:height="cartesianWidth * 0.7"
				:initViewWidth="24"
				:initViewCenter="{x: 6, y: -7}"
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
						<line class="vertical"
							:x1="point.x" :y1="0"
							:x2="point.x" :y2="point.y"
						/>
						<line class="horizontal" v-if="point.C" :x1="0" :y1="point.y" :x2="point.x" :y2="point.y" />
						<circle
							:cx="point.x"
							:cy="point.y"
						/>
					</g>
				</g>
				<g class="band-f">
					<g v-for="f of [1, 2, 4, 8]">
						<line class="scale-line" :x1="0" :y1="f * CARTESIAN_Y_SCALE" :x2="-0.2" :y2="f * CARTESIAN_Y_SCALE" />
						<text class="label" :transform="`translate(-0.4, ${f * CARTESIAN_Y_SCALE})`">{{f}}</text>
					</g>
					<rect class="pad"
						:x="-1.6"
						:y="-100"
						:width="2.4"
						:height="100"
						@mousemove="onFPadMoving"
					/>
				</g>
				<g class="band-x">
					<rect class="pad"
						:x="-100"
						:y="-0.6"
						:width="200"
						:height="2.4"
						@mousemove="onXPadMoving"
					/>
				</g>
				<g class="focus-pionts">
					<g v-for="(point, i) of focusPoints" :key="i">
						<line :x1="0" :y1="point.y" :x2="point.x" :y2="point.y" />
						<line :x1="point.x" :y1="0" :x2="point.x" :y2="point.y" />
						<circle class="dot" :cx="point.x" :cy="point.y" />
						<text class="label" :transform="`translate(-1.6, ${point.y})`">{{(point.y / CARTESIAN_Y_SCALE).toPrecision(4)}}</text>
						<text class="label" :transform="`translate(${point.x}, 1)`">{{point.x.toFixed(1)}}</text>
					</g>
				</g>
				<circle class="cursor" v-if="cursorPoint" r="0.2" fill="red" :cx="cursorPoint.x" :cy="cursorPoint.y" />
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

	// LaTeX: f=2^{\frac{x}{12}}
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
				CARTESIAN_Y_SCALE,
				cursorPoint: null,
				focusPoints: [],
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


			onFPadMoving(event) {
				const cursorPoint = this.$refs.cartesian.clientToView({x: event.offsetX, y: event.offsetY});
				//this.cursorPoint = cursorPoint;
				//console.log("onFPadMoving:", this.cursorPoint);

				const x = Math.log2(cursorPoint.y / CARTESIAN_Y_SCALE) * 12;

				this.focusPoints = [{x, y: cursorPoint.y}];
			},


			onXPadMoving(event) {
				const cursorPoint = this.$refs.cartesian.clientToView({x: event.offsetX, y: event.offsetY});

				cursorPoint.x = Math.round(cursorPoint.x * 10) / 10;

				const y = CARTESIAN_Y_SCALE * 2 ** (cursorPoint.x / 12);

				this.focusPoints = [{x: cursorPoint.x, y}];
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

	.curve-points line.vertical
	{
		stroke: #222;
		stroke-width: 0.02;
	}

	.curve-points .bold line.vertical
	{
		stroke-width: 0.08;
	}

	.curve-points line.horizontal
	{
		stroke: #222;
		stroke-width: 0.016;
	}

	.label
	{
		font-size: 0.8px;
		font-weight: bold;
		text-anchor: middle;
	}

	.scale-line
	{
		stroke: black;
		stroke-width: 0.03;
	}

	rect.pad
	{
		fill: transparent;
		cursor: crosshair;
	}

	.focus-pionts .dot
	{
		r: 0.2;
		fill: red;
	}

	.focus-pionts line
	{
		stroke: darkred;
		stroke-width: 0.07;
	}

	.focus-pionts .label
	{
		fill: darkred;
	}

	.clock .frame
	{
		stroke: black;
		stroke-width: 2;
		fill: transparent;
	}

	.cursor
	{
		pointer-events: none;
	}
</style>
