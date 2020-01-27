<template>
	<body>
		<h1>K.L. Studio</h1>
		<router-link to="/writer/">AI Writer</router-link>
		<main>
			<router-view/>
		</main>
	</body>
</template>

<script>
	export default {
		name: "home",


		created () {
			window.$main = this;
		},
	};
</script>

<style>
</style>
