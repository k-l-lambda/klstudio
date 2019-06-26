<template>
	<div v-resize="onResize" class="cube3-player">
		<Cube3
			:size="size"
			@fps="onFps"
		/>
		<span class="status">
			<span v-if="fps" class="fps">fps <em>{{fps}}</em></span>
		</span>
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


		data () {
			return {
				size: undefined,
				fps: null,
			};
		},


		methods: {
			onResize () {
				this.size = { width: this.$el.clientWidth, height: this.$el.clientHeight };
			},


			onFps (data) {
				//console.log("fps:", data);
				this.fps = data.fps;
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

	.status
	{
		position: absolute;
		right: 0;
		bottom: 0;
		padding: 4px;
		color: #0006;
		pointer-events: none;
	}

	.fps
	{
		font-size: 9px;
	}

	.fps em
	{
		font-weight: bold;
	}
</style>
