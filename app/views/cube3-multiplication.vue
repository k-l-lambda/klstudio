<template>
	<div class="cube3-multiplication" v-resize="onResize"
		@mousemove="onMouseMove"
		@mousedown.prevent="onMouseDown"
		@mouseup="onMouseUp"
		@touchstart="onTouchStart"
		@touchmove="onTouchMove"
		@touchend="onTouchEnd"
	>
		<div class="cubes">
			<Cube3 ref="cube1" :size="cubeCanvasSize" @cubeCreated="onCubeCreated(0, $event)" />
			<span class="symbol">&times;</span>
			<Cube3 ref="cube2" :size="cubeCanvasSize" @cubeCreated="onCubeCreated(1, $event)" />
			<span class="symbol">=</span>
			<Cube3 ref="cube3" :size="cubeCanvasSize" @cubeCreated="onCubeCreated(2, $event)" />
		</div>
		<div class="formula">
			<div class="matrix">
				<Cube3Matrix v-if="cubes[0]" ref="matrix1" :cube="cubes[0]" />
			</div>
			<span class="symbol">&middot;</span>
			<div class="matrix">
				<Cube3Matrix v-if="cubes[1]" ref="matrix2" :cube="cubes[1]" />
			</div>
			<span class="symbol">=</span>
			<div class="matrix">
				<Cube3Matrix v-if="cubes[2]" ref="matrix3" :cube="cubes[2]" />
			</div>
		</div>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";

	import {msDelay} from "../delay.js";
	import {MULTIPLICATION_TABLE} from "../../inc/cube-algebra";

	import Cube3 from "../components/cube3.vue";
	import Cube3Matrix from "../components/cube3-matrix.vue";



	export default {
		name: "cube3-multiplication",


		directives: {
			resize,
		},


		components: {
			Cube3,
			Cube3Matrix,
		},


		data () {
			return {
				size: undefined,
				cubes: [],
			};
		},


		computed: {
			$cubes () {
				return [this.$refs.cube1, this.$refs.cube2, this.$refs.cube3];
			},


			$matrices () {
				return [this.$refs.matrix1, this.$refs.matrix3, this.$refs.matrix3];
			},


			cubeCanvasSize () {
				return this.size && {
					width: this.size.width * .25,
					height: this.size.height * .4,
				};
			},
		},


		methods: {
			onResize () {
				this.size = {width: this.$el.clientWidth, height: this.$el.clientHeight};
			},


			forEachViewer (handle) {
				this.$cubes.forEach(cube => cube && handle(cube));
			},


			onMouseMove (event) {
				this.forEachViewer(viewer => viewer.onMouseMove(event));
			},


			onMouseDown (event) {
				this.forEachViewer(viewer => viewer.onMouseDown(event));
			},


			onMouseUp (event) {
				this.forEachViewer(viewer => viewer.onMouseUp(event));
			},


			onTouchStart (event) {
				this.forEachViewer(viewer => viewer.onTouchStart(event));
			},


			onTouchMove (event) {
				this.forEachViewer(viewer => viewer.onTouchMove(event));
			},


			onTouchEnd (event) {
				this.forEachViewer(viewer => viewer.onTouchEnd(event));
			},


			onCubeCreated (index, cubeObj) {
				console.log("onCubeCreated:", index, cubeObj);
				this.cubes[index] = cubeObj.algebra;
			},


			async animate () {
				this.animating = true;

				while (this.animating) {
					// TODO:
					await msDelay(1e+3);
				}
			},
		},
	};
</script>

<style lang="scss" scoped>
	.cube3-multiplication
	{
		display: flex;
		flex-direction: column;
		height: 100%;
		background-color: lightblue;
		font-family: monospace;

		.cubes
		{
			flex: 1 1 auto;
			display: flex;
			flex-direction: row;
			height: 40%;

			.symbol
			{
				width: 12.5%;
				line-height: 40vh;
				text-align: center;
				font-size: 15vw;
				font-weight: bold;
				pointer-events: none;
			}
		}

		.formula
		{
			flex: 1 1 auto;
			height: 60%;
			display: flex;
			flex-direction: row;
			user-select: none;

			.matrix
			{
				flex: 1 1 auto;
				position: relative;

				.cube3-matrix
				{
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
					font-size: 1.6vh;
				}
			}

			.symbol
			{
				width: 1em;
				line-height: 60vh;
				font-size: 5vw;
				text-align: center;
			}
		}
	}
</style>

<style lang="scss">
	.cube3-multiplication
	{
		canvas
		{
			pointer-events: none;
		}
	}
</style>
