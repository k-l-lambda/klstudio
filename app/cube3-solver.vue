<template>
	<body>
	</body>
</template>

<script>
	import * as tf from "@tensorflow/tfjs";


	export default {
		name: "cube3-solver",


		mounted () {
			this.loadModel();
		},


		methods: {
			async loadModel () {
				this.model = await tf.loadLayersModel("/mlmodels/cube3/length/model.json");
			},
		},
	};
</script>

<style>
</style>
