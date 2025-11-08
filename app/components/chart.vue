<template>
	<div class="chart-container" ref="chartContainer"></div>
</template>

<script>
	import * as echarts from "echarts";

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
				chartInstance: null,
			};
		},

		mounted () {
			this.initChart();
		},

		beforeUnmount () {
			if (this.chartInstance) {
				this.chartInstance.dispose();
				this.chartInstance = null;
			}
		},

		methods: {
			initChart () {
				if (!this.$refs.chartContainer) return;

				this.chartInstance = echarts.init(this.$refs.chartContainer);
				this.updateChart();

				// Handle window resize
				window.addEventListener("resize", this.handleResize);
			},

			handleResize () {
				if (this.chartInstance) {
					this.chartInstance.resize();
				}
			},

			updateChart () {
				if (!this.chartInstance || !this.sourceData || !this.sourceData.data) return;

				try {
					const option = this.buildOption();
					this.chartInstance.setOption(option, true);
				}
				catch (error) {
					console.error("Chart update error:", error);
				}
			},

			buildOption () {
				const {data, settings = {}, type, ...customOptions} = this.sourceData;

				if (!data || !data.rows || !data.columns) {
					return {};
				}

				const chartType = (type || this.type || "line").toLowerCase();

				// Build series from data
				const series = [];
				const {rows, columns} = data;

				// Assuming first column is x-axis labels, rest are series data
				const xAxisData = rows.map(row => row[0]);

				// Each subsequent column is a series
				for (let i = 1; i < columns.length; i++) {
					series.push({
						name: columns[i],
						type: chartType,
						data: rows.map(row => row[i]),
						smooth: chartType === "line",
					});
				}

				const option = {
					grid: customOptions.grid || {
						left: "3%",
						right: "4%",
						bottom: "3%",
						containLabel: true,
					},
					xAxis: customOptions.xAxis || {
						type: "category",
						data: xAxisData,
						boundaryGap: chartType !== "line",
					},
					yAxis: customOptions.yAxis || {
						type: "value",
					},
					series: customOptions.series || series,
					tooltip: customOptions.tooltip || {
						trigger: "axis",
						axisPointer: {
							type: chartType === "line" ? "line" : "shadow",
						},
					},
					legend: customOptions.legend !== false ? {
						data: columns.slice(1),
						...customOptions.legend,
					} : undefined,
					...customOptions,
				};

				// Apply width and height if specified
				if (this.sourceData.width) {
					this.$refs.chartContainer.style.width = `${this.sourceData.width}px`;
				}
				if (this.sourceData.height) {
					this.$refs.chartContainer.style.height = `${this.sourceData.height}px`;
				}

				return option;
			},

			getVChart () {
				// Compatibility method for existing code
				return {
					echarts: this.chartInstance,
					resize: () => this.chartInstance?.resize(),
				};
			},
		},

		watch: {
			sourceData: {
				handler () {
					this.updateChart();
				},
				deep: true,
			},
		},

		beforeUnmount () {
			window.removeEventListener("resize", this.handleResize);
			if (this.chartInstance) {
				this.chartInstance.dispose();
			}
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
</style>
