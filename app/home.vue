<template>
	<body :class="{root: atRoot, docking: !atRoot && !devoting, devoting}">
		<main>
			<router-view/>
			<div class="exit" v-show="devoting" @click="devoting = false"></div>
		</main>
		<aside v-show="!devoting">
			<header>
				<span class="title">K.L. Studio</span>
			</header>
			<section v-for="app of apps" :key="app.name" :to="app.path" class="app"
				:class="{focus: app.focus}"
				@click="onClickApp(app)"
			>
				<router-link class="cover" :to="app.focus ? '/' : app.path" @click.native.stop="">
					<img :src="app.coverURL" />
				</router-link>
				<div class="description">
					<router-link :to="app.path">
						<h2 v-html="app.title"></h2>
					</router-link>
					<article v-html="app.description"></article>
				</div>
			</section>
			<footer>
				&#xfe3e; MORE COMMING SOON &#xfe3e;
			</footer>
			<div class="fold" v-show="!atRoot" @click="devoting = true"></div>
		</aside>
		<div class="logo" @click="onClickLogo"
			:style="{
				transform: `
						translate(${atRoot ? '40vw' : 0}, ${atRoot ? (windowSize.height - windowSize.width * .6) / 2 : 0}px)
						scale(${atRoot ? 1 : 46 / (windowSize.width * .6)})
					`
			}"
		>
			<component is="globe-cube3" :rendererActive="atRoot" />
		</div>
	</body>
</template>

<script>
	import Vue from "vue";

	import {animationDelay} from "./delay";



	class App {
		constructor (router, fields) {
			this.router = router;

			Object.assign(this, fields);

			this.coverURL = null;
			this.load();
		}


		async load () {
			const {default: url} = await import(`./assets/app-covers/${this.cover}`);
			this.coverURL = url;
		}


		get focus () {
			return this.router.currentRoute.path === this.path;
		}


		get title () {
			return this._title || this.name;
		}
	};


	const apps = [
		{
			name: "StyleGAN Mapping Visualization",
			_title: "StyleGAN Mapping<wbr /> Visualization",
			path: "/documents/stylegan-mapping",
			cover: "stylegan-mapping.png",
		},
		{
			name: "Spiral Piano",
			path: "/spiral-piano",
			cover: "SpiralPiano.png",
			description: `<p>Play music by tapping screen.
This is a music visualization program which based on the <a href="https://en.wikipedia.org/wiki/Equal_temperament" target="_blank">Equal Temperament</a>.</p>
<p>Try to drop a MIDI file on the panel.</p>`,
		},
	];



	export default {
		name: "home",


		data () {
			return {
				apps: apps.map(fields => new App(this.$router, fields)),
				currentApp: null,
				windowSize: {width: window.innerWidth, height: window.innerHeight},
				devoting: false,
			};
		},


		computed: {
			atRoot () {
				return !this.currentApp;
			},
		},


		created () {
			if (process.env.NODE_ENV === "development")
				window.$main = this;

			apps.forEach(async app => {
				const {default: url} = await import(`./assets/app-covers/${app.cover}`);
				app.coverURL = url;
			});

			window.addEventListener("resize", () => this.onResize());

			Vue.component("globe-cube3", () => import("./views/globe-cube3.vue"));
		},


		mounted () {
			//console.log("currentApp:", location.hash);
			if (location.hash.length > 2)
				this.devoting = true;
		},


		methods: {
			onResize () {
				this.windowSize = {width: window.innerWidth, height: window.innerHeight};
			},


			onClickLogo () {
				if (this.devoting) {
					this.devoting = false;
					return;
				}

				if (!this.atRoot)
					this.$router.push("/");
			},


			async onClickApp (app) {
				await animationDelay();

				if (this.atRoot)
					this.$router.push(app.path);
			},
		},


		watch: {
			$route (to) {
				//console.log("$route:", from);
				this.currentApp = to.name;
				if (!this.currentApp)
					this.devoting = false;
			},
		},
	};
</script>

<style lang="scss">
	html
	{
		overflow: hidden;
		font-family: Verdana, Arial, Helvetica, sans-serif;
	}

	aside .description a
	{
		color: inherit;
		text-decoration: none;
		font-style: italic;
	}

	aside .description a:hover
	{
		text-decoration: underline;
	}
</style>

<style lang="scss" scoped>
	@import url('https://fonts.googleapis.com/css?family=Lilita+One&display=swap');


	$asideWidth: 40vw;
	$activeColor: #dfd;
	$logoSize: 46px;


	body
	{
		margin: 0;
		overflow: hidden;
	}

	main
	{
		position: absolute;
		top: 0;
		left: 0;
		width: calc(100vw - #{$asideWidth});
		height: 100%;
		padding-left: $asideWidth;

		.exit
		{
			position: absolute;
			top: 0;
			left: 0;
			width: $logoSize;
			height: $logoSize;
			border-bottom-right-radius: 80%;
			background-color: black;
			cursor: pointer;
		}
	}

	aside
	{
		position: absolute;
		top: 0;
		left: 0;
		width: calc(#{$asideWidth} - .4em);
		height: 100%;
		padding: 160px 0 0 .4em;
		overflow-x: hidden;
		overflow-y: auto;

		header
		{
			position: absolute;
			top: 0;
			left: 0;
			user-select: none;

			.title
			{
				font-family: 'Lilita One', cursive;
				font-size: 40px;
				padding-left: $logoSize;
			}
		}

		.app
		{
			padding: 1em;
			border-top-left-radius: 1em;
			border-bottom-left-radius: 1em;

			h2
			{
				//white-space: nowrap;
				font-weight: normal;
				font-style: normal;
				text-decoration: underline;
			}

			.cover img
			{
				width: 40%;
				border-radius: 20px;
			}

			.description
			{
				display: inline-block;
				width: calc(max(60% - 2em, 8em));
				padding: 0 1em;
				vertical-align: top;
			}
		}

		.app.focus
		{
			background-color: $activeColor;
			box-shadow: -1em 0 1em #0002;

			h2
			{
				font-weight: bold;
				text-decoration: none;
			}
		}

		.app:hover
		{
			box-shadow: 0 0 1em #0002;
		}

		footer
		{
			color: #eee;
			font-size: 2vw;
			margin: 2em 0;
			text-align: center;
			user-select: none;
		}

		.fold
		{
			position: absolute;
			top: 0;
			right: 0;
			width: 4vw;
			height: 4vw;
			border-bottom-left-radius: 100%;
			background-color: white;
			box-shadow: 0 0 1em $activeColor;
			cursor: pointer;
			transition: box-shadow .3s;
		}

		.fold:hover
		{
			background-color: $activeColor;
			box-shadow: 0 0 4vw #0006;
		}
	}

	.root
	{
		main
		{
			user-select: none;
		}
	}

	.docking
	{
		main > div
		{
			box-shadow: -2px 0 1em $activeColor;
			//outline: 2px $activeColor solid;
		}

		.logo
		{
			cursor: pointer;
		}
	}

	.devoting
	{
		main
		{
			padding-left: 0;
			width: 100vw;
		}

		.logo
		{
			cursor: pointer;
		}
	}

	.logo
	{
		position: absolute;
		top: 0;
		left: 0;
		width: 60vw;
		height: 60vw;
		transform-origin: left top;
		transition: transform .4s cubic-bezier(0, 0, 0.25, 1.0);
	}
</style>
