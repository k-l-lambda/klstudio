<template>
	<MeshViewer v-bind="param" />
</template>

<script>
	import MeshViewer from "./mesh-viewer.vue";



	const DEG90 = Math.PI / 2;
	const EULERS = [].concat(...[
		[0, 0], [DEG90, 0], [-DEG90, 0], [0, DEG90], [0, -DEG90], [DEG90 * 2, 0],
		//[0, 0], [DEG90 * 0.1, 0], [DEG90 * 0.2, 0], [DEG90 * 0.3, 0], [DEG90 * 0.4, 0], [DEG90 * 0.5, 0], [DEG90 * 0.6, 0], [DEG90 * 0.7, 0], [DEG90 * 0.8, 0], [DEG90 * 0.9, 0], [DEG90, 0],
	].map(([x, z]) => [
		[x, 0, z], [x, DEG90, z], [x, DEG90 * 2, z], [x, DEG90 * 3, z],
	]));



	export default {
		name: "mesh-viewer-demo",


		components: {
			MeshViewer,
		},


		data () {
			return {
				param: {
					entities: EULERS.map((euler, i) => ({
						label: `${i + 1}`,
						prototype: "chess-knight",
						position: [(i % 4 - 1.5) * 5, (2.5 - Math.floor(i / 4)) * 3, 0],
						euler,
					})),
				},
			};
		},
	};
</script>
