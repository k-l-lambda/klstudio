<template>
	<div class="chart-container" ref="chartContainer" :style="containerStyle">
		<svg class="chart-svg" :viewBox="`0 0 ${viewWidth} ${viewHeight}`" @click="onClick">
			<rect class="plot-background" :x="plotLeft" :y="plotTop" :width="plotWidth" :height="plotHeight" />
			<g class="split-lines">
				<line v-for="tick of yTicks" :key="tick"
					:x1="plotLeft" :x2="plotLeft + plotWidth"
					:y1="yToSvg(tick)" :y2="yToSvg(tick)"
				/>
			</g>
			<g class="mark-lines">
				<line v-for="(mark, i) of markLines" :key="i"
					:x1="xToSvg(mark.xAxis)" :x2="xToSvg(mark.xAxis)"
					:y1="plotTop" :y2="plotTop + plotHeight"
				/>
			</g>
			<polyline v-if="points.length > 1" class="line" :points="polylinePoints" />
			<g class="points">
				<circle v-for="point of points" :key="point.index" :cx="point.x" :cy="point.y" r="2.4" />
			</g>
			<g class="axes">
				<line :x1="plotLeft" :x2="plotLeft + plotWidth" :y1="yToSvg(0)" :y2="yToSvg(0)" />
				<line :x1="plotLeft" :x2="plotLeft" :y1="plotTop" :y2="plotTop + plotHeight" />
			</g>
		</svg>
	</div>
</template>

<script>
	export default {
		name: "chart",


		props: {
			type: {
				type: String,
				default: "line",
			},
			sourceData: Object,
		},


		data () {
			return {
				viewWidth: 320,
				viewHeight: 240,
			};
		},


		computed: {
			containerStyle () {
				return {
					width: this.sourceData?.width ? `${this.sourceData.width}px` : null,
					height: this.sourceData?.height || null,
				};
			},


			rows () {
				return this.sourceData?.data?.rows || [];
			},


			xValues () {
				return this.rows.map(row => Number(row.step ?? row[0])).filter(Number.isFinite);
			},


			yValues () {
				return this.rows.map(row => Number(row.rate ?? row[1])).filter(Number.isFinite);
			},


			xMin () {
				return Math.min(0, ...this.xValues);
			},


			xMax () {
				const max = Math.max(1, ...this.xValues, ...this.markLines.map(mark => mark.xAxis || 0));
				return max === this.xMin ? this.xMin + 1 : max;
			},


			yMin () {
				return Number.isFinite(this.sourceData?.yAxis?.min) ? this.sourceData.yAxis.min : Math.min(-1, ...this.yValues);
			},


			yMax () {
				const max = Number.isFinite(this.sourceData?.yAxis?.max) ? this.sourceData.yAxis.max : Math.max(1, ...this.yValues);
				return max === this.yMin ? this.yMin + 1 : max;
			},


			plotLeft () {
				return 8;
			},


			plotTop () {
				return 8;
			},


			plotWidth () {
				return this.viewWidth - this.plotLeft - 8;
			},


			plotHeight () {
				return this.viewHeight - this.plotTop - 8;
			},


			points () {
				return this.rows
					.map((row, index) => ({
						index,
						xValue: Number(row.step ?? row[0]),
						yValue: Number(row.rate ?? row[1]),
						data: row,
					}))
					.filter(point => Number.isFinite(point.xValue) && Number.isFinite(point.yValue))
					.map(point => ({
						...point,
						x: this.xToSvg(point.xValue),
						y: this.yToSvg(point.yValue),
					}));
			},


			polylinePoints () {
				return this.points.map(point => `${point.x},${point.y}`).join(" ");
			},


			markLines () {
				return (this.sourceData?.markLine?.data || []).filter(mark => mark && Number.isFinite(mark.xAxis));
			},


			yTicks () {
				return [-1, -0.5, 0, 0.5, 1].filter(value => value >= this.yMin && value <= this.yMax);
			},
		},


		mounted () {
			this.resize();
			window.addEventListener("resize", this.resize);
		},


		beforeUnmount () {
			window.removeEventListener("resize", this.resize);
		},


		methods: {
			resize () {
				const el = this.$refs.chartContainer;
				if (!el)
					return;

				this.viewWidth = Math.max(el.clientWidth || 320, 1);
				this.viewHeight = Math.max(el.clientHeight || 240, 1);
			},


			xToSvg (value) {
				return this.plotLeft + (value - this.xMin) / (this.xMax - this.xMin) * this.plotWidth;
			},


			yToSvg (value) {
				return this.plotTop + (this.yMax - value) / (this.yMax - this.yMin) * this.plotHeight;
			},


			onClick (event) {
				const clickHandler = this.sourceData?.events?.click;
				if (!clickHandler || !this.points.length)
					return;

				const rect = event.currentTarget.getBoundingClientRect();
				const x = (event.clientX - rect.left) * this.viewWidth / rect.width;
				const xValue = this.xMin + (x - this.plotLeft) / this.plotWidth * (this.xMax - this.xMin);
				const point = this.points.reduce((best, item) => Math.abs(item.xValue - xValue) < Math.abs(best.xValue - xValue) ? item : best, this.points[0]);

				clickHandler({
					componentType: "series",
					seriesType: "line",
					dataIndex: point.index,
					data: point.data,
					value: [point.xValue, point.yValue],
				});
			},


			getVChart () {
				return {
					resize: this.resize,
				};
			},
		},
	};
</script>

<style scoped>
	.chart-container
	{
		width: 100%;
		height: 100%;
		min-height: 240px;
	}

	.chart-svg
	{
		display: block;
		width: 100%;
		height: 100%;
		cursor: pointer;
	}

	.plot-background
	{
		fill: #fff;
	}

	.split-lines line
	{
		stroke: #ddd;
		stroke-width: 1;
	}

	.axes line
	{
		stroke: #888;
		stroke-width: 1;
	}

	.mark-lines line
	{
		stroke: #666;
		stroke-width: 1;
		stroke-dasharray: 4 3;
	}

	.line
	{
		fill: none;
		stroke: #5470c6;
		stroke-width: 2;
	}

	.points circle
	{
		fill: #5470c6;
		stroke: white;
		stroke-width: 1;
	}
</style>
