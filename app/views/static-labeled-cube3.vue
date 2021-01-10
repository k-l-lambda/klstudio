<template>
	<div class="static-labeled-cube3" v-resize="onResize">
		<LabeledCube3 ref="cube"
			:size="size"
			:enabledTwist="false"
			@sceneInitialized="onSceneInitialized"
		/>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";

	import rollQuaternion from "../roll-quaternion";

	import LabeledCube3 from "../components/labeled-cube3.vue";



	export default {
		name: "static-labeled-cube3",


		directives: {
			resize,
		},


		components: {
			LabeledCube3,
		},


		props: {
			demo: Boolean,
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


			onSceneInitialized () {
				if (this.demo)
					this.animate();
			},


			async animate () {
				this.animating = true;

				await rollQuaternion(this.$refs.cube.cubeGroup.quaternion, {
					onSegment: () => this.animating,
					segmentDuration: 1.2e+3,
					segmentInterval: 400,
				});
			},
		},
	};
</script>

<style lang="scss" scoped>
	.static-labeled-cube3
	{
		width: 100%;
		height: 100%;
		background-color: lightblue;
	}
</style>
