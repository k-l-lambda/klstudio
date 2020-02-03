<template>
	<body>
		<router-view />
	</body>
</template>

<script>
	export default {
		name: "embed",


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

<style scoped>
	html
	{
		overflow: hidden;
	}

	body
	{
		margin: 0;
		overflow: hidden;
		height: 100vh;
	}
</style>
