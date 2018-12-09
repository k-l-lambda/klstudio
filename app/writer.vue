<template>
	<body>
		<section>
			<h2>
				主题： 
				<select v-model="theme">
					<option v-for="theme in themes" :key="theme.name" :value="theme.name">{{theme.title}}</option>
				</select>
			</h2>
		</section>
	</body>
</template>

<script>
	export default {
		name: "writer",


		data() {
			return {
				themes: [
					{
						name: "tang-poem",
						title: "唐诗",
					},
				],
				theme: null,
			};
		},


		mounted() {
		},
	};
</script>

<style>
</style>
