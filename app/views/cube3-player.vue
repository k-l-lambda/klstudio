<template>
	<div v-resize="onResize" class="cube3-player">
		<Cube3 ref="viewer"
			class="viewer"
			:size="size"
			:code.sync="code"
			@fps="onFps"
		/>
		<span class="status">
			<span v-if="fps" class="fps">fps <em>{{fps}}</em></span>
		</span>
	</div>
</template>

<script>
	import url from "url";
	import resize from "vue-resize-directive";

	import Cube3 from "./cube3.vue";

	import { stringifyPath, parsePath } from "../inc/cube3.ts";



	const TWIST_KEYS = "LrDuBflRdUbF";



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
				code: null,
			};
		},


		mounted () {
			window.$cube = this.$refs.viewer.cube;

			document.addEventListener("keydown", event => {
				//console.log("keydown:", event);

				switch (event.key) {
				case "Home":
					this.$refs.viewer.cube.reset();

					break;
				default:
					const twist = TWIST_KEYS.indexOf(event.key);
					if (twist >= 0)
						this.$refs.viewer.cube.twist(twist);
				}
			});

			window.onhashchange = () => this.onHashChange();
			this.onHashChange();
		},


		methods: {
			onResize () {
				this.size = { width: this.$el.clientWidth, height: this.$el.clientHeight };
			},


			onFps (data) {
				//console.log("fps:", data);
				this.fps = data.fps;
			},


			onHashChange () {
				const hash = location.hash.substr(1);
				//console.log("url:", hash, url.parse("abc?a=1", true));
				const hashurl = url.parse(hash, true);

				const code = hashurl.pathname;
				if (code)
					this.code = code;

				if (hashurl.query.path) {
					//console.log("path:", hashurl.query.path);
					const twists = parsePath(hashurl.query.path);
					if (twists.length) {
						const twist = twists[0];
						if (twist >= 0) {
							this.$refs.viewer.cube.twist(twist).then(() => {
								const rest = stringifyPath(twists.slice(1));
								location.hash = `${this.code}?path=${rest}`;
							});
						}
					}
				}
			},
		},


		watch: {
			code (value) {
				location.hash = value;
			},
		},
	};
</script>

<style scoped>
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
		color: #fffc;
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

	.viewer
	{
		background-color: #444;
	}
</style>
