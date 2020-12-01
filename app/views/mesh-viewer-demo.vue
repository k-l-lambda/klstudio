<template>
	<MeshViewer class="mesh-viewer-demo" v-bind="param" />
</template>

<script>
	import {GREEK_LETTERS} from "../../inc/greek-letters";

	import MeshViewer from "./mesh-viewer.vue";



	const DEG90 = Math.PI / 2;

	const EULERS_4x6 = [].concat(...[
		[0, 0], [DEG90, 0], [-DEG90, 0], [0, DEG90], [0, -DEG90], [DEG90 * 2, 0],
	].map(([x, z]) => [
		[x, 0, z], [x, DEG90, z], [x, DEG90 * 2, z], [x, DEG90 * 3, z],
	]));

	const config4x6 = {
		entities: EULERS_4x6.map((euler, i) => ({
			label: `${i + 1}`,
			prototype: "chess-knight",
			position: [(i % 4 - 1.5) * 5, (2.5 - Math.floor(i / 4)) * 3, 0],
			euler,
		})),
		cameraInit: {
			radius: 18,
			theta: 0,
			phi: 0,
		},
	};


	const EULER4X6_INDICES = [
		0, 8, 2, 5,
		7, 17, 18, 16,
		4, 12, 19, 13,
		9, 11, 22, 14,
		6, 15, 23, 10,
		1, 20, 3, 21,
	];

	const config4x6_greek = {
		entities: EULERS_4x6.map((euler, i) => ({
			label: GREEK_LETTERS[EULER4X6_INDICES[i]],
			prototype: "chess-knight",
			position: [(i % 4 - 1.5) * 5, (2.5 - Math.floor(i / 4)) * 3, 0],
			euler,
		})),
		cameraInit: {
			radius: 18,
			theta: 0,
			phi: 0,
		},
	};



	const SQRT_HALF = Math.sqrt(0.5);

	const categoriesList = [
		[
			{
				label: "1",
				quaternion: [0, 0, 0, 1],
			},
		],
		[
			{
				label: "i<sup>1/2</sup>",
				quaternion: [SQRT_HALF, 0, 0, SQRT_HALF],
			},
			{
				label: "i<sup>-1/2</sup>",
				quaternion: [-SQRT_HALF, 0, 0, SQRT_HALF],
			},
			{
				label: "j<sup>1/2</sup>",
				quaternion: [0, SQRT_HALF, 0, SQRT_HALF],
			},
			{
				label: "j<sup>-1/2</sup>",
				quaternion: [0, -SQRT_HALF, 0, SQRT_HALF],
			},
			{
				label: "k<sup>1/2</sup>",
				quaternion: [0, 0, SQRT_HALF, SQRT_HALF],
			},
			{
				label: "k<sup>-1/2</sup>",
				quaternion: [0, 0, -SQRT_HALF, SQRT_HALF],
			},
		],
		[
			{
				label: "i",
				quaternion: [1, 0, 0, 0],
			},
			{
				label: "j",
				quaternion: [0, 1, 0, 0],
			},
			{
				label: "k",
				quaternion: [0, 0, 1, 0],
			},
		],
		[
			{
				label: "i<sup>1/2</sup>j<sup>1/2</sup>",
				quaternion: [0.5, 0.5, 0.5, 0.5],
			},
			{
				label: "i<sup>1/2</sup>j<sup>-1/2</sup>",
				quaternion: [0.5, -0.5, -0.5, 0.5],
			},
			{
				label: "i<sup>-1/2</sup>j<sup>1/2</sup>",
				quaternion: [-0.5, 0.5, -0.5, 0.5],
			},
			{
				label: "i<sup>-1/2</sup>j<sup>-1/2</sup>",
				quaternion: [-0.5, -0.5, 0.5, 0.5],
			},
			{
				label: "i<sup>1/2</sup>k<sup>1/2</sup>",
				quaternion: [0.5, -0.5, 0.5, 0.5],
			},
			{
				label: "i<sup>1/2</sup>k<sup>-1/2</sup>",
				quaternion: [0.5, 0.5, -0.5, 0.5],
			},
			{
				label: "i<sup>-1/2</sup>k<sup>1/2</sup>",
				quaternion: [-0.5, 0.5, 0.5, 0.5],
			},
			{
				label: "i<sup>-1/2</sup>k<sup>-1/2</sup>",
				quaternion: [-0.5, -0.5, -0.5, 0.5],
			},
		],
		[
			{
				label: "i<sup>1/2</sup>j",
				quaternion: [0, SQRT_HALF, SQRT_HALF, 0],
			},
			{
				label: "i<sup>-1/2</sup>j",
				quaternion: [0, SQRT_HALF, -SQRT_HALF, 0],
			},
			{
				label: "ij<sup>1/2</sup>",
				quaternion: [SQRT_HALF, 0, SQRT_HALF, 0],
			},
			{
				label: "ij<sup>-1/2</sup>",
				quaternion: [SQRT_HALF, 0, -SQRT_HALF, 0],
			},
			{
				label: "ik<sup>1/2</sup>",
				quaternion: [SQRT_HALF, SQRT_HALF, 0, 0],
			},
			{
				label: "ik<sup>-1/2</sup>",
				quaternion: [SQRT_HALF, -SQRT_HALF, 0, 0],
			},
		],
	];

	const configCategories = {
		entities: [].concat(...categoriesList.map((line, row) => line.map(({label, quaternion}, index) => ({
			label,
			prototype: "chess-knight",
			position: [(index - (line.length - 1) / 2) * 4, (2 - row) * 4, 0],
			quaternion,
		})))),
		cameraInit: {
			radius: 20,
			theta: 0,
			phi: 0,
		},
	};


	const configs = {
		"quarter-array-4x6": config4x6,
		"quarter-array-4x6-greek": config4x6_greek,
		"quarter-categories": configCategories,
	};



	export default {
		name: "mesh-viewer-demo",


		props: {
			config: String,
		},


		components: {
			MeshViewer,
		},


		data () {
			return {
				param: configs[this.config],
			};
		},
	};
</script>

<style lang="scss">
	.mesh-viewer-demo
	{
		.label
		{
			font-size: 18px;
		}
	}
</style>
