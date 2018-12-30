<template>
	<body>
		<Content />
	</body>
</template>

<script>
	// requirement: a component with name 'Content' registered before mount



	export default {
		name: "app-wrapper",
	};
</script>

<style>
	html
	{
		overflow: hidden;
	}

	body
	{
		margin: 0;
		height: 100vh;
	}
</style>
