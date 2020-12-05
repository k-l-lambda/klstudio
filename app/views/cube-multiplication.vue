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
	import {msDelay} from "../delay.js";
	import {MULTIPLICATION_TABLE} from "../../inc/cube-algebra";

	import FlippingCube from "./flipping-cube.vue";



	const randomOrientation = () => Math.floor(Math.random() * 6) + 1;



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


			async randomFlip () {
				this.randomFlipping = true;

				while (this.randomFlipping) {
					for (let i = 0; i < 3; ++i) {
						this.$refs.cube2.flip(randomOrientation());
						await this.updateResultCube();

						await msDelay(1e+3);
					}

					this.$refs.cube1.flip(randomOrientation());
					await this.updateResultCube();

					await msDelay(1e+3);
				}
			},


			updateResultCube () {
				const product = MULTIPLICATION_TABLE[this.$refs.cube1.target][this.$refs.cube2.target];

				return this.$refs.cube3.flipTo(product);
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

<style lang="scss">
	.flipping-cube
	{
		.label
		{
			font-size: 18vw;
		}
	}
</style>
