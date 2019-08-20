<template>
	<body>
		<Cube3Player ref="player" />
		<div id="panel">
			<button @click="solve">Solve</button>
		</div>
	</body>
</template>

<script>
	import * as tf from "@tensorflow/tfjs";

	import Cube3Player from "./cube3-player.vue";

	import { TWIST_NAMES } from "../inc/cube3.ts";



	//const A = "A".charCodeAt(0);


	const isOrigin = cube => cube.units.reduce((sum, unit) => sum + unit, 0) === 0;

	const cubeLoop = cube => {
		let length = 1;
		for (let c = cube.clone(); !isOrigin(c); c = c.multiply(cube))
			++length;

		return length;
	};



	export default {
		name: "cube3-solver",


		components: {
			Cube3Player,
		},


		created () {
			window.$main = this;
		},


		mounted () {
			//this.loadModel();
		},


		methods: {
			async loadModel () {
				this.model = await tf.loadLayersModel("/mlmodels/cube3/length/model.json");
			},


			solve () {
				const cube = this.$refs.player.$refs.viewer.cube.algebra;
				/*const units = cube.encode().split("").map(c => c.charCodeAt(0) - A);
				const states = [].concat(...units.map(unit => Array(24).fill(null).map((_, i) => unit === i ? 1 : 0)));
				//console.log("states:", states);

				const result = tf.tidy(() => {
					const inputsTensor = tf.tensor2d([states]);

					const predictions = this.model.predict(inputsTensor);

					return predictions.dataSync()[0];
				});

				console.log("result:", result);*/

				console.log("cube:", cubeLoop(cube));
				Array(12).fill().forEach((_, i) => {
					const c = cube.clone();
					c.twist(i);
					console.log(TWIST_NAMES[i], cubeLoop(c));
				});
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

	#panel
	{
		position: absolute;
		right: 0;
		top: 0;
	}
</style>
