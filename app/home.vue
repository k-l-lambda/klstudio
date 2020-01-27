<template>
	<body>
		<header>
			<span class="logo">K.L. Studio</span>
		</header>
		<main>
			<router-view/>
		</main>
		<sider>
			<router-link to="/spiral-piano">Spiral Piano</router-link>
		</sider>
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

<style lang="scss" scoped>
	@import url('https://fonts.googleapis.com/css?family=Lilita+One&display=swap');


	html
	{
		overflow: hidden;
	}

	body
	{
		margin: 0;
		overflow: hidden;
	}

	main
	{
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		padding-left: 20vw;
	}

	sider
	{
		position: absolute;
		top: 0;
		left: 0;
		width: 20vw;
		height: 100%;
		text-align: center;
		padding-top: 160px;
	}

	.logo
	{
		font-family: 'Lilita One', cursive;
		font-size: 40px;
	}
</style>
