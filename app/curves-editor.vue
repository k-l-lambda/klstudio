<template>
	<body>
		<article>
			<SvgMap ref="cartesian"
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
			</SvgMap>
		</article>
		<header>

		</header>
	</body>
</template>

<script>
	import resize from "vue-resize-directive";

	import SvgMap from "./svg-map.vue";
	import SvgCurve from "./svg-curve.vue";



	export default {
		name: "curves-editor",


		directives: {
			resize,
		},


		components: {
			SvgMap,
			SvgCurve,
		},


		data() {
			const halfPoints = [...Array(100).keys()].map(i => (i / 40) ** 2);

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

<style>
	html
	{
		overflow: hidden;
	}

	body
	{
		margin: 0;
		height: 100vh;
	}

	header
	{
		position: absolute;
		top: 0;
		width: 100%;
		text-align: center;
		font-family: Arial;
		padding: 1em 0;
	}

	.axes line
	{
		stroke: black;
		stroke-width: 0.01;
	}
</style>
