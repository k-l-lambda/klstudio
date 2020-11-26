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
