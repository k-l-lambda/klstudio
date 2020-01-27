<template>
	<body>
		<header>
			<datalist id="route-list">
				<option v-for="route of routes" :key="route" :value="route" />
			</datalist>
			<input type="text" list="route-list" v-model.lazy="routePath" />
		</header>
		<main>
			<router-view/>
		</main>
	</body>
</template>

<script>
	export default {
		name: "common-viewer",


		data () {
			return {
				routePath: this.$router.currentRoute.path,
			};
		},


		computed: {
			routes () {
				return this.$router.options.routes.map(route => route.path);
			},
		},


		created () {
			if (process.env.NODE_ENV === "development")
				window.$main = this;
		},


		watch: {
			routePath (value) {
				//console.log("routePath:", value);
				if (this.routes.includes(value) && this.routePath !== this.$router.currentRoute.path)
					this.$router.push(value);
			},


			$route (to) {
				//console.log("route:", to);
				if (this.routePath !== to.fullPath)
					this.routePath = to.fullPath;
			},
		},
	};
</script>

<style>
</style>
