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

		methods: {
			initChart () {
				if (!this.$refs.chartContainer) return;

				this.chartInstance = echarts.init(this.$refs.chartContainer);
				this.updateChart();

				// Register events if provided
				if (this.sourceData.events) {
					Object.keys(this.sourceData.events).forEach(eventName => {
						this.chartInstance.on(eventName, this.sourceData.events[eventName]);
					});
				}

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
					// Only update if we have a valid option with series
					if (option && option.series && option.series.length > 0) {
						// Use notMerge: false (merge mode) to avoid breaking ECharts internal state
						this.chartInstance.setOption(option, false);
					}
				}
				catch (error) {
					console.error("Chart update error:", error);
				}
			},

			buildOption () {
				const {data, settings = {}, type, theme = {}, ...customOptions} = this.sourceData;

				if (!data || !data.rows || !data.columns || data.columns.length < 2 || data.rows.length === 0) {
					console.warn("Chart: Invalid or empty data", data);
					return null;
				}

				const chartType = (type || this.type || "line").toLowerCase();

				// Build series from data
				const series = [];
				const {rows, columns} = data;

				// Assuming first column is x-axis labels, rest are series data
				const xAxisData = rows.map(row => row[0]);

				// Each subsequent column is a series
				for (let i = 1; i < columns.length; i++) {
					const seriesData = {
						name: columns[i],
						type: chartType,  // Always ensure type is set
						data: rows.map(row => row[i]),
					};

					// Apply smooth setting from theme if available
					if (chartType === "line") {
						seriesData.smooth = theme.line?.smooth !== undefined ? theme.line.smooth : true;
					}

					// Apply markLine if present
					if (this.sourceData.markLine) {
						seriesData.markLine = this.sourceData.markLine;
					}

					series.push(seriesData);
				}

				// Ensure we have at least one series
				if (series.length === 0) {
					console.warn("Chart: No series data to display");
					return null;
				}

				// Build grid from theme or customOptions
				const grid = customOptions.grid || theme.grid || {
					left: "3%",
					right: "4%",
					bottom: "3%",
					containLabel: true,
				};

				// Build xAxis configuration
				const xAxisConfig = customOptions.xAxis || {
					type: settings.xAxisType || "category",
					data: xAxisData,
					boundaryGap: chartType !== "line",
				};

				// Build yAxis configuration
				const yAxisConfig = customOptions.yAxis || {
					type: "value",
				};

				// Build the option object
				const option = {
					grid,
					xAxis: xAxisConfig,
					yAxis: yAxisConfig,
					series,
					tooltip: customOptions.tooltip !== undefined ? customOptions.tooltip : {
						trigger: "axis",
						axisPointer: {
							type: chartType === "line" ? "line" : "shadow",
						},
					},
					legend: customOptions.legend !== false ? {
						data: columns.slice(1),
						...customOptions.legend,
					} : undefined,
					animation: customOptions.animation !== undefined ? customOptions.animation : true,
				};

				// Apply width and height if specified
				if (this.sourceData.width) {
					this.$refs.chartContainer.style.width = `${this.sourceData.width}px`;
				}
				if (this.sourceData.height) {
					this.$refs.chartContainer.style.height = this.sourceData.height;
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
