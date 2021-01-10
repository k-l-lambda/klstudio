<template>
	<div class="dynamic-labeled-cube3" v-resize="onResize"
		:class="{captional: showCaption}"
		@mousemove="onMouseMove"
		@mouseup="onMouseUp"
		:style="{'--matrix-font-size': size && `${Math.min(size.width * .015, size.height * .025)}px`}"
	>
		<main>
			<LabeledCube3 ref="cube"
				:size="canvasSize"
				:showRedLabels="true"
				:coloredUnderbox="true"
				:showOrientations="true"
				@cubeCreated="onCubeCreated"
				:code.sync="code"
				:highlightCubie.sync="highlightCubie"
				@sceneInitialized="onSceneInitialized"
			/>
			<div class="matrix-side">
				<Cube3Matrix v-if="showMatrix && cube" ref="matrix" :cube="cube" :highlightCubie="highlightCubie" :vector.sync="vector" />
			</div>
		</main>
		<header v-if="showCaption">
			<p v-if="twistsSeq" class="twists">
				<span v-for="(twist, i) of twistsSeq" :key="i" v-html="twist"></span>
			</p>
			<h1 v-if="vectorText" v-html="vectorText"></h1>
		</header>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";
	import * as THREE from "three";
	import url from "url";

	import {animationDelay, msDelay} from "../delay";
	import {invertPath, invertTwist, parsePath} from "../../inc/cube3";
	import {GREEK_LETTERS, ORIENTATION_GREEK_LETTER_ORDER} from "../../inc/greek-letters";

	import LabeledCube3 from "../components/labeled-cube3.vue";
	import Cube3Matrix from "../components/cube3-matrix.vue";



	const TWIST_KEYS = "LrDuBflRdUbF";

	const TWIST_NAMES = [
		"L'", "R", "D'", "U", "B'", "F",
		"L", "R'", "D", "U'", "B", "F'",
		"L<sup>2</sup>", "R<sup>2</sup>", "D<sup>2</sup>", "U<sup>2</sup>", "B<sup>2</sup>", "F<sup>2</sup>",
	];


	export default {
		name: "dynamic-labeled-cube3",


		directives: {
			resize,
		},


		components: {
			LabeledCube3,
			Cube3Matrix,
		},


		props: {
			showMatrix: {
				type: Boolean,
				default: true,
			},
			showCaption: Boolean,
			demo: Boolean,
			demoPath: String,
		},


		data () {
			return {
				size: undefined,
				cube: null,
				code: null,
				highlightCubie: null,
				vector: null,
				twistsSeq: [],
			};
		},


		computed: {
			canvasSize () {
				return this.size && {width: Math.max(this.size.width * .5, this.size.height * 0.7), height: this.size.height};
			},


			vectorText () {
				return this.vector && this.vector.map(index => GREEK_LETTERS[ORIENTATION_GREEK_LETTER_ORDER[index]]).join("");
			},
		},


		created () {
			document.addEventListener("keydown", event => {
				//console.log("keydown:", event);

				switch (event.key) {
				case "Home":
					if (this.$refs.cube)
						this.$refs.cube.reset();

					break;
				default:
					if (this.$refs.cube) {
						const twist = TWIST_KEYS.indexOf(event.key);
						if (twist >= 0)
							this.$refs.cube.twist(twist);
					}
				}
			});

			window.onhashchange = () => this.onHashChange();
		},


		methods: {
			onResize () {
				this.size = {width: this.$el.clientWidth, height: this.$el.clientHeight};
			},


			onCubeCreated (cubeObj) {
				this.cube = cubeObj.algebra;

				this.onHashChange();
			},


			onCubeChanged () {
				if (this.$refs.matrix)
					this.$refs.matrix.updateMatrix();
			},


			async onSceneInitialized () {
				if (this.demo) {
					while (!this.$refs.cube || !this.$refs.cube.cubeGroup)
						await animationDelay();
					this.$refs.cube.cubeGroup.quaternion.setFromEuler(new THREE.Euler(Math.PI * 0.16, 0, 0));

					this.animate();
				}
				else if (this.demoPath)
					this.twists(this.demoPath);
			},


			async animate (fixedLength = null) {
				this.animating = true;

				this.rotate();

				while (this.animating) {
					while (!this.$refs.cube)
						await animationDelay();

					let lastTwist = null;

					const length = fixedLength || Math.floor(Math.random() * Math.random() * 9 + 1);
					const path = Array(length).fill().map(() => {
						let twist = Math.floor(Math.random() * 12);
						while (Number.isInteger(lastTwist) && twist === invertTwist(lastTwist))
							twist = Math.floor(Math.random() * 12);

						lastTwist = twist;

						return twist;
					});
					const ipath = invertPath(path);
					//console.log("path:", path, ipath);

					for (const twist of path) {
						await this.$refs.cube.twist(twist);
						await msDelay(300);
					}

					await msDelay(1200);

					for (const twist of ipath) {
						await this.$refs.cube.twist(twist);
						await msDelay(100);
					}

					await msDelay(1600);
				}
			},


			async twists (pathText) {
				this.$refs.cube.cubeGroup.quaternion.setFromEuler(new THREE.Euler(Math.PI * 0.16, Math.PI * 0.309, 0));
				this.animating = true;

				const path = parsePath(pathText);
				this.twistsSeq = [];

				for (const twist of path) {
					this.twistsSeq.push(TWIST_NAMES[twist]);
					await this.$refs.cube.twist(twist);
				}

				this.rotate(-3e-4);
			},


			async rotate (speed = -1e-4) {
				const start = Date.now();
				let time = start;

				while (this.animating) {
					const now = Date.now();
					const elapsed = now - time;
					time = now;

					this.$refs.cube.cubeGroup.rotateOnAxis(new THREE.Vector3(0, 1, 0), elapsed * speed);
					this.$refs.cube.cubeGroup.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), Math.cos((time - start) * 1e-5) * elapsed * .4e-6);

					await animationDelay();
				}
			},


			onMouseMove (event) {
				if (this.$refs.cube)
					this.$refs.cube.onMouseMove(event);
			},


			onMouseUp (event) {
				if (this.$refs.cube)
					this.$refs.cube.onMouseUp(event);
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
						if (twist >= 0 && this.$refs.cube) {
							this.$refs.cube.twist(twist).then(() => {
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
		},


		watch: {
			code (value) {
				if (!this.animating)
					location.hash = this.getRouterPath() + value;

				this.$nextTick(() => {
					this.onCubeChanged();
				});
			},
		},
	};
</script>

<style lang="scss" scoped>
	.dynamic-labeled-cube3
	{
		width: 100%;
		height: 100%;
		background-color: lightblue;

		main
		{
			width: 100%;
			height: 100%;
			display: flex;
			flex-direction: row;

			.labeled-cube3
			{
				flex: 0 0 auto;
				position: relative;
			}

			.matrix-side
			{
				flex: 1 1 auto;
				position: relative;

				.cube3-matrix
				{
					user-select: none;
					position: absolute;
					left: 0;
					top: 50%;
					transform: translate(0, -50%);
					font-size: var(--matrix-font-size);
				}
			}
		}

		&.captional
		{
			main
			{
				padding-top: 40px;
			}
		}

		header
		{
			position: absolute;
			top: 0;
			width: 100%;
			text-align: center;
			padding: 10px 0;

			h1
			{
				font-size: 60px;
				font-family: monospace;
				color: black;
				margin: .1em 0;
			}

			.twists
			{
				padding: 0 0 0 24%;
				text-align: left;
				font-size: 40px;
				height: 1em;
				margin: 0;
				font-family: Verdana, Arial, Helvetica, sans-serif;

				span
				{
					display: inline-block;
					margin: 0 .1em;
				}
			}
		}
	}
</style>

<style lang="scss">
	.dynamic-labeled-cube3
	{
		.cube3-matrix
		{
			td, th
			{
				padding: 0;
			}
		}
	}
</style>
