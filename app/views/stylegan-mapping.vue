<template>
	<div>
		<header>
			<fieldset>
				Shown dimensions: <span class="slice-range-text"><em>{{sliceStart * 3}}</em> - <em>{{(sliceStart + sliceCount) * 3}}</em></span>
				<input type="range" v-model.number="sliceStart" :min="0" :max="sliceTotal - 1" :step="3" title="start dimension index" />
				<input type="range" v-model.number="sliceCount" :min="1" :max="sliceCountMax" :step="1" title="shown dimension count" />
			</fieldset>
		</header>
		<main>
			<svg class="z-graph" viewBox="-120 -120 240 240">
				<g class="cycle">
					<g v-for="i of pointCount" :key="i"
						:transform="`translate(${Math.cos((i / pointCount) * 2 * Math.PI) * 100}, ${Math.sin((i / pointCount) * 2 * Math.PI) * 100})`"
						:class="{focus: i === focusPointIndex}"
					>
						<circle class="dot" />
					</g>
				</g>
			</svg>
			<div class="w-graph">
				<div class="plot-frame">
					<CirclePlot dataPath="random-1"
						:sliceStart="sliceStart"
						:sliceCount="sliceCount"
						:focusPointIndex.sync="focusPointIndex"
						@dataLoaded="onDataLoaded"
					/>
				</div>
			</div>
		</main>
	</div>
</template>

<script>
	import CirclePlot from "../components/circle-plot.vue";



	const DIMENSIONS = 512;


	export default {
		name: "stylegan-mapping",


		components: {
			CirclePlot,
		},


		data () {
			return {
				sliceCount: 4,
				sliceStart: 0,
				focusPointIndex: null,
				pointCount: 0,
			};
		},


		computed: {
			sliceTotal () {
				return Math.floor(DIMENSIONS / 3);
			},


			sliceCountMax () {
				return this.sliceTotal - this.sliceStart;
			},
		},


		methods: {
			onDataLoaded ({pointCount}) {
				this.pointCount = pointCount;
				//console.log("onDataLoaded:", pointCount);
			},
		},


		watch: {
			sliceStart () {
				this.sliceCount = Math.min(this.sliceCount, this.sliceCountMax);
			},


			/*focusPointIndex (value) {
				console.log("focusPointIndex:", value);
			},*/
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
		display: inline-block;

		.dot
		{
			r: 1;
			fill: green;
		}

		.focus .dot
		{
			r: 3;
		}
	}

	.w-graph
	{
		display: inline-block;
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

</style>
