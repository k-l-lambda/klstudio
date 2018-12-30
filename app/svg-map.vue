<template>
	<svg
		:width="width"
		:height="height"
		:viewBox="`${viewBox.left} ${viewBox.top} ${viewBox.width} ${viewBox.height}`"
	>
		<slot></slot>
	</svg>
</template>

<script>
	export default {
		name: "svg-map",


		props: {
			width: Number,
			height: Number,
			viewCenter: {
				validator(value) {
					return value && typeof value.x == "number" && typeof value.y == "number";
				},
			},
			initViewWidth: {
				type: Number,
				default: () => 1,
			},
		},


		data() {
			const aspect = this.aspect || 1;

			return {
				viewSize: {
					width: this.initViewWidth,
					height: this.initViewWidth / aspect,
				},
			};
		},


		computed: {
			viewBox() {
				return {
					left: this.viewCenter.x - this.viewSize.width / 2,
					top: this.viewCenter.y - this.viewSize.height / 2,
					width: this.viewSize.width,
					height: this.viewSize.height,
				};
			},


			aspect() {
				if (!this.width || !this.height)
					return 1;

				return this.width / this.height;
			},
		},


		mounted() {
		},
	};
</script>

<style>
</style>
