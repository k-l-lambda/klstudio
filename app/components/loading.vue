<template>
	<div :style="`background-image: url(${imgURL})`" class="loading">
	</div>
</template>

<script>
	import imgLoading5d from "../assets/loading-5d.gif";



	export default {
		name: "loading",


		data () {
			return {
				imgURL: imgLoading5d,
			};
		},
	};
</script>

<style scoped>
	.loading
	{
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: #fffc;
		background-position: center center;
		background-repeat: no-repeat;
		background-size: 40%;
	}
</style>
