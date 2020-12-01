<template>
	<MeshViewer class="flipping-cube" ref="viewer"
		v-bind="param"
		@sceneReady="onSceneReady"
	/>
</template>

<script>
	import * as THREE from "three";

	import {GREEK_LETTERS} from "../../inc/greek-letters";
	import {MULTIPLICATION_TABLE, NORMAL_ORIENTATIONS} from "../../inc/cube-algebra";
	import {animationDelay, msDelay} from "../delay.js";

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

	const QUATERNIONS = NORMAL_ORIENTATIONS.map(o => o.toQuaternion());



	export default {
		name: "flipping-cube",


		components: {
			MeshViewer,
		},


		data () {
			return {
				orientation: 0,
				target: 0,
				randomFlipping: false,
			};
		},


		computed: {
			param () {
				return {
					entities: [
						{
							name: "cube",
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
						radius: 6,
						theta: Math.PI * -0.12,
						phi: Math.PI * -0.08,
					},
				};
			},
		},


		methods: {
			flip (rotation) {
				return this.flipTo(MULTIPLICATION_TABLE[rotation][this.orientation]);
			},


			async flipTo (target) {
				const STEPS = 30;

				const end = new THREE.Quaternion(...QUATERNIONS[target]);
				const start = new THREE.Quaternion(...QUATERNIONS[this.orientation]);
				this.target = target;

				for (let i = 0; i < STEPS; ++i) {
					const progress = i / STEPS;
					const smooth = 3 * progress ** 2 - 2 * progress ** 3;

					THREE.Quaternion.slerp(start, end, this.cube.quaternion, smooth);

					await animationDelay();
				}

				this.orientation = target;
			},


			async randomFlip () {
				this.randomFlipping = true;

				while (this.randomFlipping) {
					await this.flip(Math.floor(Math.random() * 6) + 1);

					await msDelay(2e+3);
				}
			},


			onSceneReady () {
				//console.log("scene:", this.$refs.viewer.scene);
				this.cube = this.$refs.viewer.scene.children.find(node => node.name === "cube");
				console.assert(this.cube, "cube not found");
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
			font-size: 30vh;
			font-weight: bold;
			color: white;
			text-shadow: 0 0 8px black;
		}
	}
</style>
