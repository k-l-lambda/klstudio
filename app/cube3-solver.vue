<template>
	<body>
		<Cube3Player />
	</body>
</template>

<script>
	import * as tf from "@tensorflow/tfjs";

	import Cube3Player from "./cube3-player.vue";


	export default {
		name: "cube3-solver",


		components: {
			Cube3Player,
		},


		mounted () {
			this.loadModel();
		},


		methods: {
			async loadModel () {
				this.model = await tf.loadLayersModel("/mlmodels/cube3/length/model.json");
			},


			solve () {
				// TODO:
			},
		},
	};
</script>

<style>
	body
	{
		position: absolute;
		width: 100vw;
		height: 100vh;
		margin: 0;
		overflow: hidden;
	}
</style>
