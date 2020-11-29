<template>
	<MeshViewer v-bind="param" />
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
					entities: [{
						label: this.label,
						labelOffset: [0, 0, 0],
						prototype: "cube.gltf",
					}],
					cameraInit: {
						radius: 16,
						theta: Math.PI * -0.2,
						phi: Math.PI * -0.12,
					},
				};
			},
		},
	};
</script>

<style lang="scss">
	.mesh-viewer
	{
		.label
		{
			font-size: 48px;
			font-weight: bold;
			color: white;
			text-shadow: 0 0 6px black;
		}
	}
</style>
