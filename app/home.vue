<template>
	<body>
		<header>
			<span class="logo">K.L. Studio</span>
		</header>
		<main>
			<router-view/>
		</main>
		<aside>
			<section v-for="app of apps" :key="app.name" :to="app.path" class="app" :class="{focus: $router.currentRoute.path === app.path}">
				<router-link :to="app.path">
					<img :src="app.coverURL" />
				</router-link>
				<div class="description">
					<router-link :to="app.path">
						<h2>{{app.name}}</h2>
					</router-link>
					<article v-html="app.description"></article>
				</div>
			</section>
		</aside>
	</body>
</template>

<script>
	const apps = [
		{
			name: "Spiral Piano",
			path: "/spiral-piano",
			cover: "SpiralPiano.png",
			coverURL: null,
			description: `<p>Play music by tapping screen.
This is a music visualization program which based on the <a href="https://en.wikipedia.org/wiki/Equal_temperament" target="_blank">Equal Temperament</a>.</p>
<p>Try to drop a MIDI file on the panel.</p>`,
		},
	];



	export default {
		name: "home",


		data () {
			return {
				apps,
			};
		},


		created () {
			if (process.env.NODE_ENV === "development")
				window.$main = this;

			apps.forEach(async app => {
				const {default: url} = await import(`./assets/app-covers/${app.cover}`);
				app.coverURL = url;
			});
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
		width: 100%;
		height: 100%;
		padding-left: $asideWidth;
	}

	aside
	{
		position: absolute;
		top: 0;
		left: 0;
		width: $asideWidth;
		height: 100%;
		padding: 160px .4em 0;

		.app
		{
			padding: 1em;
			border-radius: 1em;

			h2
			{
				white-space: nowrap;
				font-weight: normal;
				font-style: normal;
				text-decoration: underline;
			}

			img
			{
				width: 40%;
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
			background-color: #efe;
			box-shadow: 0 0 1em #0002;

			h2
			{
				font-weight: bold;
				text-decoration: none;
			}
		}
	}

	.logo
	{
		font-family: 'Lilita One', cursive;
		font-size: 40px;
	}
</style>
