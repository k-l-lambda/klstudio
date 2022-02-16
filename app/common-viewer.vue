<template>
	<body>
		<main>
			<router-view ref="view" />
			<h1 v-if="home">K.L. Studio</h1>
		</main>
		<header :class="{faint: !home}">
			<datalist id="route-list">
				<option v-for="route of routes" :key="route" :value="route" />
			</datalist>
			<input type="text" list="route-list" v-model.lazy="routePath" />
		</header>
	</body>
</template>

<script>
	export default {
		name: "common-viewer",


		data () {
			return {
				routePath: this.$router.currentRoute.path,
				home: !this.$router.currentRoute.name,
			};
		},


		computed: {
			routes () {
				return this.$router.options.routes.map(route => route.path);
			},
		},


		created () {
			if (process.env.NODE_ENV === "development" || process.env.VUE_APP_DORME) {
				window.$main = this;

				Object.defineProperty(window, "$view", {
					get: () => {
						return this.$refs.view;
					},
				});
			}
		},


		watch: {
			routePath (value) {
				//console.log("routePath:", value);
				if (this.routes.includes(value) && this.routePath !== this.$router.currentRoute.path)
					this.$router.push(value);
			},


			$route (to) {
				//console.log("route:", to);
				if (this.routePath !== to.path)
					this.routePath = to.path;

				this.home = !this.$router.currentRoute.name;

				document.title = to.name || "K.L. Studio X";
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
	}

	body > main
	{
		height: 100vh;
	}

	main h1
	{
		color: #eee5;
		font-size: 20vh;
		user-select: none;
		text-align: center;
	}

	header
	{
		position: absolute;
		top: 0;
		left: 0;
	}

	header.faint
	{
		opacity: 0.1;
	}

	header.faint:hover
	{
		opacity: 1;
	}
</style>
