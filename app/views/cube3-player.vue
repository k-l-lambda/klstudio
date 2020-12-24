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

	import Cube3 from "../components/cube3.vue";

	import {stringifyPath, parsePath} from "../../inc/cube3.ts";
	import rollQuaternion from "../roll-quaternion";



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
					if (this.$refs.viewer)
						this.$refs.viewer.cube.reset();

					break;
				default:
					const twist = TWIST_KEYS.indexOf(event.key);
					if (twist >= 0 && this.$refs.viewer)
						this.$refs.viewer.cube.twist(twist);
				}
			});

			window.onhashchange = () => this.onHashChange();
			this.onHashChange();
		},


		methods: {
			onResize () {
				this.size = {width: this.$el.clientWidth, height: this.$el.clientHeight};
			},


			onFps (data) {
				//console.log("fps:", data);
				this.fps = data.fps;
			},


			onHashChange () {
				let hash = location.hash.substr(1);
				if (hash[0] === "/" && !/#/.test(hash))
					hash += "#";

				hash = hash.replace(/.*#/, "");	// ignore router path

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
								location.hash = `${this.getRouterPath()}${this.code}?path=${rest}`;
							});
						}
					}
				}
			},


			getRouterPath () {
				const [path] = location.hash.match(/^#\/[^#]*/) || [];

				return path ? path + "#" : "";
			},


			async roll () {
				await rollQuaternion(this.$refs.viewer.cube.graph.quaternion, {
					onSegment: () => true,
					segmentDuration: 1.2e+3,
					segmentInterval: 100,
				});
			},
		},


		watch: {
			code (value) {
				//console.log("RouterPath:", location.hash, this.getRouterPath());
				location.hash = this.getRouterPath() + value;
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
