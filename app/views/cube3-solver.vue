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

	import * as cube3 from "../../inc/cube3.ts";
	import {cubeLoop} from "../../inc/cube3-loop.ts";
	import {cubePartitionComplexity, cubePartitionCode} from "../../inc/cube3-partition.ts";
	import * as cube3Hash from "../../inc/cube3-hash.ts";



	//const A = "A".charCodeAt(0);


	window.cube3 = cube3;
	window.cubeLoop = cubeLoop;
	window.cubePartitionComplexity = cubePartitionComplexity;
	window.cube3Hash = cube3Hash;
	window.cubePartitionCode = cubePartitionCode;



	export default {
		name: "cube3-solver",


		components: {
			Cube3Player,
		},


		created () {
			window.$main = this;

			this.loadHashes();
		},


		mounted () {
			//this.loadModel();
		},


		methods: {
			async loadModel () {
				this.model = await tf.loadLayersModel("/mlmodels/cube3/length/model.json");
			},


			async loadHashes () {
				const LIBRARY_SIZE = process.env.CUBE3_HASH_LIBRARY_SIZE;
				if (!LIBRARY_SIZE) {
					console.warn("CUBE3_HASH_LIBRARY_SIZE is zero, loading skipped.");
					return;
				}

				if (cube3Hash.hashLibrary.length > LIBRARY_SIZE)
					return;

				for (let depth = 1; depth <= LIBRARY_SIZE; ++depth) {
					const res = await fetch(`/data/cube3-hash-${depth}.txt`);
					const content = await res.text();

					await cube3Hash.loadHashes(depth, {* [Symbol.iterator] () {
						yield * content.split("\n");
					}});
				}
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

				console.log("cube:", cubeLoop(cube), cubePartitionComplexity(cube), cubePartitionCode(cube));
				/*Array(12).fill().forEach((_, i) => {
					const c = cube.clone();
					c.twist(i);
					console.log(cube3.TWIST_NAMES[i], cubeLoop(c));
				});*/
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
