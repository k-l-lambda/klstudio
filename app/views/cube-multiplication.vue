<template>
	<div class="cube-multiplication"
		@mousemove="onMouseMove"
		@mousewheel.prevent="onMouseWheel"
		@touchmove.prevent="onTouchMove"
		@touchend="onTouchEnd"
	>
		<FlippingCube ref="cube1" />
		<span class="symbol">&times;</span>
		<FlippingCube ref="cube2" />
		<span class="symbol">=</span>
		<FlippingCube ref="cube3" />
	</div>
</template>

<script>
	import FlippingCube from "./flipping-cube.vue";



	export default {
		name: "cube-multiplication",


		components: {
			FlippingCube,
		},


		computed: {
			$cubes () {
				return [this.$refs.cube1, this.$refs.cube2, this.$refs.cube3];
			},
		},


		methods: {
			forEachViewer (handle) {
				this.$cubes.forEach(cube => cube && handle(cube.$refs.viewer));
			},


			onMouseMove (event) {
				this.forEachViewer(viewer => viewer.onMouseMove(event));
			},


			onMouseWheel (event) {
				this.forEachViewer(viewer => viewer.onMouseWheel(event));
			},


			onTouchMove (event) {
				this.forEachViewer(viewer => viewer.onTouchMove(event));
			},


			onTouchEnd (event) {
				this.forEachViewer(viewer => viewer.onTouchEnd(event));
			},
		},
	};
</script>

<style lang="scss" scoped>
	.cube-multiplication
	{
		display: flex;
		flex-direction: row;
		height: 100%;
		background-color: lightblue;
		font-family: monospace;

		.flipping-cube
		{
			width: 25%;

			pointer-events: none;
		}

		.symbol
		{
			width: 12.5%;
			line-height: 100vh;
			text-align: center;
			font-size: 15vw;
			font-weight: bold;
			pointer-events: none;
		}
	}
</style>
