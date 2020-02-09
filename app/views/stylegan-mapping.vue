<template>
	<div v-resize="onResize">
		<header>
			<fieldset>
				Sample:
				<select v-model="chosenSource">
					<option v-for="source of SOURCE_LIST" :key="source" :value="source">{{source}}</option>
				</select>
			</fieldset>
			<fieldset>
				Shown dimensions: <span class="slice-range-text"><em>{{sliceStart * 3}}</em> - <em>{{(sliceStart + sliceCount) * 3}}</em></span>
				<input type="range" v-model.number="sliceStart" :min="0" :max="sliceTotal - 1" :step="3" title="start dimension index" />
				<input type="range" v-model.number="sliceCountLog2" :min="0" :max="sliceCountMax" :step="1" title="shown dimension count" />
			</fieldset>
		</header>
		<main :style="{zoom: `${viewZoom * 100}%`}">
			<figure class="z-graph">
				<svg viewBox="-200 -200 400 400">
					<g class="circle">
						<g v-for="(_, i) of pointCount" :key="i"
							:transform="`translate(${Math.cos((i / pointCount) * 2 * Math.PI) * 120}, ${Math.sin((i / pointCount) * 2 * Math.PI) * 120})`"
							:class="{focus: i === focusPointIndex}"
							@mouseenter="focusPointIndex = i"
						>
							<circle class="pad" />
							<circle class="dot" />
							<image v-if="i % imagesIndexInterval === 0"
								:xlink:href="images[i / imagesIndexInterval]"
								:transform="`translate(${Math.cos((i / pointCount) * 2 * Math.PI) * 50}, ${Math.sin((i / pointCount) * 2 * Math.PI) * 50})`"
							/>
						</g>
					</g>
					<image class="center" v-if="focusImageIndex !== null"
						:xlink:href="images[focusImageIndex]"
					/>
				</svg>
				<figcaption>a circle in Z space & generated images (&psi; = 1)</figcaption>
			</figure>
			<span>&#x2192;</span>
			<figure class="w-graph">
				<div class="plot-frame">
					<CirclePlot :dataPath="chosenSource"
						:sliceStart="sliceStart"
						:sliceCount="sliceCount"
						:focusPointIndex.sync="focusPointIndex"
						@dataLoaded="onDataLoaded"
					/>
				</div>
				<figcaption>W space slices</figcaption>
			</figure>
		</main>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";

	import CirclePlot from "../components/circle-plot.vue";



	const DIMENSIONS = 512;
	const IMAGES_INTERVAL = 4;

	const PAGE_STANDARD_WIDTH = 1025;


	const SOURCE_LIST = [
		"plane0,1",
		"random-1",
		"random-2",
		"random-3",
		"random-4",
		"random-5",
	];



	export default {
		name: "stylegan-mapping",


		directives: {
			resize,
		},


		components: {
			CirclePlot,
		},


		data () {
			return {
				size: {width: PAGE_STANDARD_WIDTH, height: 800},
				sliceCount: 4,
				sliceStart: 0,
				focusPointIndex: null,
				pointCount: 0,
				images: [],
				imagesIndexInterval: IMAGES_INTERVAL,
				SOURCE_LIST,
				chosenSource: "random-2",
			};
		},


		computed: {
			sliceTotal () {
				return Math.floor(DIMENSIONS / 3);
			},


			sliceCountMax () {
				return Math.floor(Math.log2(this.sliceTotal - this.sliceStart));
			},

			
			sliceCountLog2: {
				get () {
					return Math.floor(Math.log2(this.sliceCount));
				},

				set (value) {
					this.sliceCount = 2 ** value;
				},
			},


			focusImageIndex () {
				if (Number.isInteger(this.focusPointIndex))
					return Math.min(Math.round(this.focusPointIndex / this.imagesIndexInterval), this.images.length - 1);

				return null;
			},


			viewZoom () {
				return Math.min(this.size.width, PAGE_STANDARD_WIDTH) / PAGE_STANDARD_WIDTH;
			},
		},


		methods: {
			onResize () {
				this.size = {width: this.$el.clientWidth, height: this.$el.clientHeight};
			},


			onDataLoaded ({pointCount}) {
				this.pointCount = pointCount;
				//console.log("onDataLoaded:", pointCount);
			},


			async loadImages () {
				this.images = [];

				if (this.pointCount > 0) {
					const indices = Array(this.pointCount).fill().map((_, i) => i).filter(i => i % this.imagesIndexInterval === 0);
					this.images = await Promise.all(indices.map(async i => {
						const {default: url} = await import(`../assets/stylegan-mapping/${this.chosenSource}/${i}.webp`);
						return url;
					}));
				}
			},
		},


		watch: {
			sliceStart () {
				this.sliceCount = Math.min(this.sliceCount, 2 ** this.sliceCountMax);
			},


			chosenSource () {
				this.pointCount = null;
			},


			pointCount: "loadImages",
		},
	};
</script>

<style lang="scss" scoped>
	header
	{
		margin: 1em 0;
	}

	fieldset
	{
		display: inline-block;
		margin: 0 .6em;
		border: 0;
		padding: 0;
	}

	.z-graph
	{
		width: 400px;

		> svg
		{
			width: 100%;
		}

		.pad
		{
			r: 6;
			fill: transparent;
		}

		.dot
		{
			r: 1;
			fill: green;
		}

		.focus .dot
		{
			r: 3;
		}

		.circle
		{
			image
			{
				x: -20;
				y: -20;
				width: 40px;
			}

			.focus image
			{
				x: -30;
				y: -30;
				width: 60px;
			}
		}

		image.center
		{
			x: -80;
			y: -80;
			width: 160px;
		}
	}

	.w-graph
	{
		position: relative;
		width: 600px;
	}

	.plot-frame
	{
		width: 100%;
		padding-top: 80%;

		> *
		{
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
		}
	}

	header
	{
		span
		{
			display: inline-block;
		}

		.slice-range-text
		{
			width: 5em;
		}
	}

	main
	{
		padding-bottom: 2em;
		white-space: nowrap;

		> *
		{
			vertical-align: middle;
		}

		figure
		{
			position: relative;
			margin: 0;
			display: inline-block;

			figcaption
			{
				position: absolute;
				bottom: -1.6em;
				left: 0;
				width: 100%;
				text-align: center;
				color: #555;
			}
		}
	}
</style>
