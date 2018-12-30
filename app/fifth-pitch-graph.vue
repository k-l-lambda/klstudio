<template>
	<SvgMap>
		<g class="axes">
			<line :x1="-12" :x2="12" :y1="0" :y2="0" />
			<line :y1="-12" :y2="12" :x1="0" :x2="0" />
		</g>
	</SvgMap>
</template>

<script>
	import SvgMap from "./svg-map.vue";



	export default {
		name: "home",


		components: {
			SvgMap,
		},


		mounted() {
			//console.log("home:", document);
		},
	};
</script>

<style>
	.axes
	{
		stroke: black;
		stroke-width: 0.1;
	}
</style>
