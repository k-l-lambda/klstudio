<template>
	<div v-resize="onResize" class="cube3-player">
		<Cube3
			:size="size"
		/>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";

	import Cube3 from "./cube3.vue";



	export default {
		name: "cube3-player",


		directives: {
			resize,
		},


		components: {
			Cube3,
		},


		data() {
			return {
				size: undefined,
			};
		},


		methods: {
			onResize() {
				this.size = { width: this.$el.clientWidth, height: this.$el.clientHeight };
			},
		},
	};
</script>

<style>
	.cube3-player
	{
		width: 100%;
		height: 100%;
	}
</style>
