<template>
	<MeshViewer v-bind="param" />
</template>

<script>
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


	const configs = {
		"4x6": config4x6,
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
