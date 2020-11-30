<template>
	<MeshViewer class="flipping-cube" ref="viewer" v-bind="param" />
</template>

<script>
	import {GREEK_LETTERS} from "../../inc/greek-letters";
	import {MULTIPLICATION_TABLE} from "../../inc/cube-algebra";

	import MeshViewer from "./mesh-viewer";



	const GREEK_LETTER_ORDER = [
		0,
		4, 5, 6,
		7, 8, 9,
		1, 2, 3,
		10, 14, 20,
		11, 15, 21,
		12, 16, 22,
		13, 17, 23,
		18, 19,
	];



	export default {
		name: "flipping-cube",


		components: {
			MeshViewer,
		},


		data () {
			return {
				orientation: 0,
				flipping: false,
			};
		},


		created () {
			if (process.env.NODE_ENV === "development")
				window.$view = this;
		},


		computed: {
			param () {
				return {
					entities: [
						{
							label: GREEK_LETTERS[GREEK_LETTER_ORDER[this.orientation]],
							labelOffset: [0, 0, 0],
							euler: [0, -Math.PI / 2, 0],
							prototype: "cube.gltf",
						},
						{
							prototype: "coordinate-frame.gltf",
							position: [-3.6, -2, -1],
							scale: [0.4, 0.4, 0.4],
						},
					],
					cameraInit: {
						radius: 8,
						theta: Math.PI * -0.08,
						phi: Math.PI * -0.06,
					},
				};
			},
		},


		methods: {
			flip (rotation) {
				this.orientation = MULTIPLICATION_TABLE[rotation][this.orientation];
			},
		},


		watch: {
			orientation () {
				this.$refs.viewer.labels[0].content = GREEK_LETTERS[GREEK_LETTER_ORDER[this.orientation]];
			},
		},
	};
</script>

<style lang="scss">
	.flipping-cube
	{
		.label
		{
			font-size: 80px;
			font-weight: bold;
			color: white;
			text-shadow: 0 0 8px black;
		}
	}
</style>
