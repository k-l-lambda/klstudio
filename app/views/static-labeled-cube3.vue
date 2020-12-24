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

				/*const SEGMENT_DURATION = 1.2e+3;

				let yaw = 0;

				while (this.animating) {
					if (this.$refs.cube) {
						yaw += (1 + (Math.random() - 0.5) * (Math.random() - 0.5) * 4) * Math.PI;

						const begin = this.$refs.cube.cubeGroup.quaternion.clone();
						const target = new THREE.Quaternion()
							.setFromEuler(new THREE.Euler((Math.random() - 0.5) * 2.4, yaw, (Math.random() - 0.5) * 0.2, "YXZ"));

						const start = Date.now();
						let now = start;
						while (now - start < SEGMENT_DURATION) {
							const progress = (now - start) / SEGMENT_DURATION;
							const t = 3 * progress ** 2 - 2 * progress ** 3;
							THREE.Quaternion.slerp(begin, target, this.$refs.cube.cubeGroup.quaternion, t);

							await animationDelay();
							now = Date.now();
						}

						await msDelay(400);
					}

					await animationDelay();
				}*/
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
