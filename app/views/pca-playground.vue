<template>
	<div class="pca-playground" v-resize="onResize">
		<svg class="canvas"
			:viewBox="`0 ${-size.height} ${size.width} ${size.height}`"
			:width="size.width"
			:height="size.height"
			@click="onClickCanvas"
		>
			<g class="points">
				<circle v-for="(point, i) of points" :key="i"
					:cx="point[0]"
					:cy="-point[1]"
				/>
			</g>
			<g v-if="center" class="center" :transform="`translate(${center[0]}, ${-center[1]})`">
				<line x1="-12" x2="12" y1="0" y2="0" />
				<line y1="-12" y2="12" x1="0" x2="0" />
			</g>
		</svg>
		<header class="controls">
			<button @click="reset">Reset</button>
		</header>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";

	export default {
		name: "pca-playground",


		directives: {
			resize,
		},


		data () {
			return {
				size: {
					width: 1000,
					height: 1000,
				},
				points: [],
			};
		},


		computed: {
			center () {
				if (!this.points.length)
					return null;

				const sum = this.points.reduce(([cx, cy], [x, y]) => [cx + x, cy + y], [0, 0]);

				return [sum[0] / this.points.length, sum[1] / this.points.length];
			},
		},


		created () {
			if (process.env.NODE_ENV === "development")
				window.$view = this;
		},


		methods: {
			onResize () {
				this.size.width = this.$el.clientWidth;
				this.size.height = this.$el.clientHeight;
			},


			onClickCanvas (event) {
				//console.log("onClickCanvas:", event.offsetX, this.size.height - event.offsetY);
				this.points.push([event.offsetX, this.size.height - event.offsetY]);
			},


			reset () {
				this.points = [];
			},
		},
	};
</script>

<style lang="scss" scoped>
	.pca-playground
	{
		height: 100%;

		.canvas
		{
			cursor: crosshair;

			.points
			{
				circle
				{
					fill: steelblue;
					r: 8;
				}
			}

			.center
			{
				line
				{
					stroke: black;
					stroke-width: 2;
				}
			}
		}

		.controls
		{
			position: absolute;
			right: 0;
			top: 0;
			padding: 1em;
		}
	}
</style>
