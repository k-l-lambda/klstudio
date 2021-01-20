<template>
	<canvas :width="size.width" :height="size.height"/>
</template>

<script>
	import QRCode from "qrcode";



	export default {
		name: "qrcode",


		props: {
			size: {
				type: Number,
				default: 196,
			},
			text: String,
		},


		mounted () {
			this.render();
		},


		methods: {
			render () {
				QRCode.toCanvas(this.$el, this.text, {width: this.size}, err => this.$emit("rendered", err));
			},
		},


		watch: {
			text: "render",
		},
	};
</script>
