<template>
	<canvas :width="size.width" :height="size.height"></canvas>
</template>

<script>
	import cube3 from "../inc/cube3.ts";



	export default {
		name: "cube3",


		props: {
			size: {
				type: Object,
				default: () => ({width: 800, height: 800}),
			},
		},
	};
</script>

<style>
</style>
