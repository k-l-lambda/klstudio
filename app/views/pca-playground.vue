<template>
	<div class="pca-playground" v-resize="onResize">
		<svg class="canvas" :viewBox="`0 ${-size.height} ${size.width} ${size.height}`" :width="size.width" :height="size.height">

		</svg>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";

	export default {
		name: "pca-playground",


		directives: {
			resize,
		},


		data () {
			return {
				size: {
					width: 1000,
					height: 1000,
				},
			};
		},


		created () {
			if (process.env.NODE_ENV === "development")
				window.$view = this;
		},


		methods: {
			onResize () {
				this.size.width = this.$el.clientWidth;
				this.size.height = this.$el.clientHeight;
			},
		},
	};
</script>

<style scoped>
	.pca-playground
	{
		height: 100%;
	}

	.canvas
	{
		cursor: crosshair;
	}
</style>
