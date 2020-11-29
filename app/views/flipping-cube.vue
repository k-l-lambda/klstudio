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
				param: [],
			};
		},
	};
</script>

<style scoped>
</style>
