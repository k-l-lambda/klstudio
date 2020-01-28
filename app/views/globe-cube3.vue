<template>
	<div v-resize="onResize" class="globe-cube3">
		<Cube3 ref="cube3"
			class="viewer"
			:size="size"
			:code.sync="code"
			meshSchema="spherical"
			@fps="onFps"
			@sceneInitialized="onSceneInitialized"
		/>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";
	//import * as THREE from "three";

	import Cube3 from "../components/cube3.vue";



	const TWIST_KEYS = "LrDuBflRdUbF";



	export default {
		name: "globe-cube3",


		directives: {
			resize,
		},


		components: {
			Cube3,
		},


		data () {
			return {
				size: undefined,
				fps: null,
				code: null,
			};
		},


		mounted () {
			//window.$cube = this.$refs.viewer.cube;

			/*document.addEventListener("keydown", event => {
				//console.log("keydown:", event);

				switch (event.key) {
				case "Home":
					if (this.$refs.viewer)
						this.$refs.viewer.cube.reset();

					break;
				default:
					const twist = TWIST_KEYS.indexOf(event.key);
					if (twist >= 0 && this.$refs.viewer)
						this.$refs.viewer.cube.twist(twist);
				}
			});*/

			//window.onhashchange = () => this.onHashChange();
			//this.onHashChange();
		},


		methods: {
			onResize () {
				this.size = {width: this.$el.clientWidth, height: this.$el.clientHeight};
			},


			onFps (data) {
				//console.log("fps:", data);
				this.fps = data.fps;
			},


			onSceneInitialized (cube3) {
				cube3.camera.near = 0.1;
				cube3.camera.position.set(0, 0, 4);
			},
		},
	};
</script>

<style scoped>
	.globe-cube3
	{
		width: 100%;
		height: 100%;
	}

	/*.viewer
	{
		background-color: #444;
	}*/
</style>
