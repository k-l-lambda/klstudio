<template>
	<div class="dynamic-labeled-cube3" v-resize="onResize">
		<LabeledCube3 ref="cube"
			:size="size"
			:showRedLabels="true"
			:coloredUnderbox="true"
		/>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";
	import * as THREE from "three";

	import {animationDelay, msDelay} from "../delay";

	import LabeledCube3 from "../components/labeled-cube3.vue";



	export default {
		name: "dynamic-labeled-cube3",


		directives: {
			resize,
		},


		components: {
			LabeledCube3,
		},


		data () {
			return {
				size: undefined,
			};
		},


		methods: {
			onResize () {
				this.size = {width: this.$el.clientWidth, height: this.$el.clientHeight};
			},


			async animate () {
				this.animating = true;

				//while (this.animating) {
				//}
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
	}
</style>
