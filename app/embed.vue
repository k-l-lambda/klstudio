<template>
	<div id="embed-root">
		<router-view />
	</div>
</template>

<script>
	export default {
		name: "klstudio-embed",


		computed: {
			// TODO: added home page link for embedded document
			inIframe () {
				try {
					return window.self !== window.top;
				}
				catch (e) {
					return true;
				}
			},
		},
	};
</script>

<style>
	html, body
	{
		margin: 0;
		padding: 0;
		height: 100vh;
		overflow: hidden;
	}

	#app
	{
		height: 100%;
		overflow: hidden;
	}
</style>

<style scoped>
	#embed-root
	{
		height: 100%;
		overflow: hidden;
	}
</style>
