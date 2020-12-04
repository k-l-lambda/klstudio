<template>
	<div class="dynamic-labeled-cube3" v-resize="onResize"
		@mousemove="onMouseMove"
		@mouseup="onMouseUp"
		:style="{'--matrix-font-size': size && `${Math.min(size.width * .015, size.height * .025)}px`}"
	>
		<LabeledCube3 ref="cube"
			:size="canvasSize"
			:showRedLabels="true"
			:coloredUnderbox="true"
			@cubeCreated="onCubeCreated"
			@update:code="onCubeChanged"
		/>
		<div class="matrix-side">
			<Cube3Matrix v-if="showMatrix && cube" ref="matrix" :cube="cube" />
		</div>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";
	//import * as THREE from "three";

	//import {animationDelay, msDelay} from "../delay";

	import LabeledCube3 from "../components/labeled-cube3.vue";
	import Cube3Matrix from "../components/cube3-matrix.vue";



	export default {
		name: "dynamic-labeled-cube3",


		directives: {
			resize,
		},


		components: {
			LabeledCube3,
			Cube3Matrix,
		},


		props: {
			showMatrix: {
				type: Boolean,
				default: true,
			},
		},


		data () {
			return {
				size: undefined,
				cube: null,
			};
		},


		computed: {
			canvasSize () {
				return this.size && {width: Math.max(this.size.width * .4, this.size.height * 0.7), height: this.size.height};
			},
		},


		methods: {
			onResize () {
				this.size = {width: this.$el.clientWidth, height: this.$el.clientHeight};
			},


			onCubeCreated (cubeObj) {
				this.cube = cubeObj.algebra;
			},


			onCubeChanged () {
				if (this.$refs.matrix)
					this.$refs.matrix.updateMatrix();
			},


			async animate () {
				this.animating = true;

				//while (this.animating) {
				//}
			},


			onMouseMove (event) {
				if (this.$refs.cube)
					this.$refs.cube.onMouseMove(event);
			},


			onMouseUp (event) {
				if (this.$refs.cube)
					this.$refs.cube.onMouseUp(event);
			},
		},
	};
</script>

<style lang="scss" scoped>
	.dynamic-labeled-cube3
	{
		width: 100%;
		height: 100%;
		background-color: lightblue;

		display: flex;
		flex-direction: row;

		.labeled-cube3
		{
			flex: 0 0 auto;
			position: relative;
		}

		.matrix-side
		{
			flex: 1 1 auto;
			position: relative;

			.cube3-matrix
			{
				user-select: none;
				position: absolute;
				left: 0;
				top: 50%;
				transform: translate(0, -50%);
				font-size: var(--matrix-font-size);
			}
		}
	}
</style>
