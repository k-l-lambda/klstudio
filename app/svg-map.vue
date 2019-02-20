<template>
	<svg
		:width="width"
		:height="height"
		:viewBox="`${viewBox.left} ${viewBox.top} ${viewBox.width} ${viewBox.height}`"
		@mousemove="onMouseMove"
		@mousewheel="onMouseWheel"
	>
		<g :transform="`scale(${viewScale}) translate(${-viewCenter.x}, ${-viewCenter.y})`">
			<slot></slot>
		</g>
	</svg>
</template>

<script>
	export default {
		name: "svg-map",


		props: {
			width: Number,
			height: Number,
			initViewCenter: {
				type: Object,
				default: () => ({x: 0, y: 0}),
			},
			initViewWidth: {
				type: Number,
				default: () => 1,
			},
		},


		data() {
			const aspect = this.aspect || 1;

			return {
				viewCenter: this.initViewCenter,
				viewSize: {
					width: this.initViewWidth,
					height: this.initViewWidth / aspect,
				},
				viewScale: 1,
			};
		},


		computed: {
			viewBox() {
				return {
					left: -this.viewSize.width / 2,
					top: -this.viewSize.height / 2,
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
			this.viewSize.height = this.initViewWidth / this.aspect;
		},


		methods: {
			onMouseMove(event) {
				switch (event.buttons) {
					case 1:	// left button
						//console.log("dragging:", event.movementX, event.movementY);
						const scale = this.viewBox.width / (this.width * this.viewScale);

						this.viewCenter.x -= event.movementX * scale;
						this.viewCenter.y -= event.movementY * scale;

						this.$emit("update:viewCenter", this.viewCenter);

						break;
				}

				this.$emit("mousemove", event);
			},


			onMouseWheel(event) {
				this.viewScale *= Math.exp(event.deltaY * -0.001);

				this.$emit("update:viewScale", this.viewScale);
			},


			clientToView(point) {
				return {
					x: (point.x * this.viewBox.width / this.width + this.viewBox.left) / this.viewScale + this.viewCenter.x,
					y: (point.y * this.viewBox.height / this.height + this.viewBox.top) / this.viewScale + this.viewCenter.y,
				};
			},
		},
	};
</script>

<style>
</style>
