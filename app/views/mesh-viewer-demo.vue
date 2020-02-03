<template>
	<MeshViewer v-bind="param" />
</template>

<script>
	import MeshViewer from "./mesh-viewer.vue";



	export default {
		name: "mesh-viewer-demo",


		components: {
			MeshViewer,
		},


		data () {
			return {
				param: {
					entities: [
						{
							label: "1",
							prototype: "chess-knight",
							position: [-4, 4, 0],
							quaternion: [0, 0, 0, 1],
						},
					],
				},
			};
		},
	};
</script>
