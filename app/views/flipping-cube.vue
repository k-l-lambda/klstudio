<template>
	<MeshViewer class="flipping-cube" v-bind="param" />
</template>

<script>
	import MeshViewer from "./mesh-viewer";



	export default {
		name: "flipping-cube",


		components: {
			MeshViewer,
		},


		data () {
			return {
				label: "&alpha;",
			};
		},


		computed: {
			param () {
				return {
					entities: [
						{
							label: this.label,
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
	};
</script>

<style lang="scss">
	.flipping-cube
	{
		.label
		{
			font-size: 60px;
			font-weight: bold;
			color: white;
			text-shadow: 0 0 8px black;
		}
	}
</style>
