<template>
	<SvgMap
		:width="size.width"
		:height="size.height"
		:viewCenter.sync="viewCenter"
		:initViewWidth="20"
		class="svg-map"
		v-resize="onResize"
	>
		<g class="axes">
			<line :x1="-100" :x2="100" :y1="0" :y2="0" />
			<line :y1="-100" :y2="100" :x1="0" :x2="0" />
		</g>
		<g class="band">
			<path class="bg" :d="`M-100 ${CONTOUR_SLOPE * 100} L100 ${CONTOUR_SLOPE * -100} L101 ${CONTOUR_SLOPE * -100} L-99 ${CONTOUR_SLOPE * 100} Z`" />
			<line class="contour-1" :x1="-100" :y1="CONTOUR_SLOPE * 100" :x2="100" :y2="CONTOUR_SLOPE * -100" />
			<line class="contour-2" :x1="-99" :y1="CONTOUR_SLOPE * 100" :x2="101" :y2="CONTOUR_SLOPE * -100" />
		</g>
		<g class="points">
			<g v-for="point of points" :key="`point-${point.m}-${point.n}`"
				:transform="`translate(${point.m}, ${-point.n})`"
				:class="{emphasize: point.onBand}"
			>
				<circle class="dot" :class="{axis: point.m == 0 || point.n == 0}" />
				<text class="label" v-if="point.label" :font-size="point.onBand ? 0.24 : 0.16" :transform="`translate(${point.m == 0 ? 0.14 : 0}, -0.1)`">{{point.label}}</text>
			</g>
		</g>
		<g class="steps">
			<line v-for="step of steps" :key="`step-line-${step.n}`"
				:x1="-100 + step.m" :y1="CONTOUR_SLOPE * 100 - step.n" :x2="100 + step.m" :y2="CONTOUR_SLOPE * -100 - step.n"
			/>
			<text v-for="step of steps" :key="`step-text-${step.n}`"
				:transform="`translate(${step.m - 0.2}, ${-step.n + 0.4})`"
				:font-size="0.4"
			>{{step.name}}</text>
		</g>
	</SvgMap>
</template>

<script>
	import resize from "vue-resize-directive";

	import SvgMap from "./svg-map.vue";



	const CONTOUR_SLOPE = -Math.log(2) / Math.log(3);



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
				points: [].concat(...Array(100).fill().map((_, i) => Array(100).fill()
					.map((_, j) => ({m: i - 50, n: j - 50}))
					.map(({m, n}) => ({m, n, value: (2 ** m) * (3 ** n)}))
					.map(({m, n, value}) => ({
						m, n,
						label: this.pointLabel(m, n),
						onBand: value >= 1 && value < 2,
					})))),
				CONTOUR_SLOPE,
				steps: [
					{m: 0, n: 0, name: "C"},
					{m: -1, n: 1, name: "G"},
					{m: -3, n: 2, name: "D"},
					{m: -4, n: 3, name: "A"},
					{m: -6, n: 4, name: "E"},
					{m: -7, n: 5, name: "B"},
					{m: -9, n: 6, name: "\u266fF"},
					{m: 2, n: -1, name: "F"},
					{m: 4, n: -2, name: "\u266dB"},
					{m: 5, n: -3, name: "\u266dE"},
					{m: 7, n: -4, name: "\u266dA"},
					{m: 8, n: -5, name: "\u266dD"},
					{m: 10, n: -6, name: "\u266dG"},
				],
			};
		},


		mounted() {
			//console.log("home:", document);
		},


		methods: {
			onResize() {
				this.size = {width: this.$el.clientWidth, height: this.$el.clientHeight};
			},


			pointLabel(m, n) {
				if (Math.abs(m) > 19 || Math.abs(n) > 12)
					return null;

				if (Math.max(Math.abs(m), Math.abs(n)) > 9)
					return ((2 ** m) * (3 ** n)).toPrecision(4);
				else if (m >= 0 && n >= 0)
					return (2 ** m) * (3 ** n);
				else if (m < 0 && n < 0)
					return `1 / ${(2 ** -m) * (3 ** -n)}`;
				else if (m < 0)
					return `${3 ** n} / ${(2 ** -m)}`;
				else
					return `${2 ** m} / ${(3 ** -n)}`;
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

	.svg-map text
	{
		font-family: Arial;
	}

	.axes
	{
		stroke: black;
		stroke-width: 0.04;
	}

	.points .dot
	{
		r: 0.02;
		fill: black;
	}

	.points .emphasize .dot
	{
		r: 0.04;
		fill: #fbab00;
	}

	.points .dot.axis
	{
		r: 0.06;
	}

	.points .label
	{
		text-anchor: middle;
		user-select: none;
	}

	.points .emphasize .label
	{
		font-weight: bold;
	}

	.band .bg
	{
		fill: #3362;
	}

	.band line
	{
		stroke-width: 0.03;
	}

	.contour-1
	{
		stroke: green;
	}

	.contour-2
	{
		stroke: steelblue;
	}

	.steps text
	{
		font-weight: bold;
		text-anchor: middle;
		fill: #fbab00;
		user-select: none;
	}

	.steps line
	{
		stroke: #a60;
		stroke-width: 0.001;
	}
</style>
