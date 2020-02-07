<template>
	<div>
		<header>
			<fieldset>
				Shown dimensions: <span class="slice-range-text"><em>{{sliceStart * 3}}</em> - <em>{{(sliceStart + sliceCount) * 3}}</em></span>
				<input type="range" v-model.number="sliceStart" :min="0" :max="sliceTotal - 1" :step="3" title="start dimension index" />
				<input type="range" v-model.number="sliceCount" :min="1" :max="sliceCountMax" :step="1" title="shown dimension count" />
			</fieldset>
		</header>
		<div class="plot-frame">
			<CirclePlot dataPath="random-1" :sliceStart="sliceStart" :sliceCount="sliceCount" />
		</div>
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


		watch: {
			/*sliceCount () {
				this.sliceStart = Math.floor(this.sliceStart / this.sliceCount) * this.sliceCount;
			},*/


			sliceStart () {
				this.sliceCount = Math.min(this.sliceCount, this.sliceCountMax);
			},
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

	.plot-frame
	{
		position: relative;
		width: 80%;
		padding-top: 64%;

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
