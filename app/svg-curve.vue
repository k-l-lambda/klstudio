<template>
	<path :d="path" />
</template>

<script>
	export default {
		name: "svg-curve",


		props: {
			segments: {
				type: Number,
				default: 100,
			},

			argRange: {
				type: Array,
				default: [0, 1],
			},

			pathAffix: {
				type: String,
				default: "",
			},

			argFunction: {
				type: Function,
				default: x => x,
			},

			xFunction: Function,
			yFunction: Function,

			dash: {
				type: Boolean,
				default: false,
			},
		},


		data() {
			return {
			};
		},


		computed: {
			arguments() {
				return [...Array(this.segments).keys()].map(i => this.argRange[0] + i * (this.argRange[1] - this.argRange[0]) / this.segments).map(this.argFunction);
			},


			path() {
				let points = this.arguments.map(a => `${this.xFunction(a).toFixed(6)} ${-this.yFunction(a).toFixed(6)}`).join(" L");
				if (this.dash)
					points = points.replace(/L([\d\s\.\e\+\-]+)L([\d\s.\e\+\-]+)/g, "L$1M$2");

				return "M"
					+ points
					+ this.pathAffix;
			},
		},
	};
</script>

<style>
</style>
