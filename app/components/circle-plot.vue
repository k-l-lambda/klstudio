<template>
	<div v-resize="onResize" class="circle-plot">
		<div class="plot" ref="plot"></div>
		<div class="mask" v-show="loading" :style="{'background-image': `url(${imgLoading5d})`}"></div>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";

	import imgLoading5d from "../assets/loading-5d.gif";



	// the StyleGAN mapping geometry visualization
	export default {
		name: "circle-plot",


		directives: {
			resize,
		},


		props: {
			dataPath: String,
			mode: {
				type: String,
				default: "3d",
			},
			dimensions: {
				type: Number,
				default: 512,
			},
			sliceStart: {
				type: Number,
				default: 0,
			},
			sliceCount: Number,
			focusPointIndex: Number,
		},


		data () {
			return {
				size: {width: 800, height: 800},
				center: null,
				circle: null,
				loading: false,
				imgLoading5d,
			};
		},


		computed: {
			normalPoints () {
				if (!this.circle)
					return null;

				return this.circle.map(p => {
					const v = Array.from(p).map((x, i) => x - this.center[i]);

					return v;
				});
			},
		},


		async created () {
			const {default: plotlyUrl} = await import("../third-party/plotly.min.js?url");
			// Load as script tag to avoid ESM transformation issues
			if (!window.Plotly) {
				await new Promise((resolve, reject) => {
					const script = document.createElement('script');
					script.src = plotlyUrl;
					script.onload = resolve;
					script.onerror = reject;
					document.head.appendChild(script);
				});
			}
			const Plotly = window.Plotly;
			//console.log("Plotly:", Plotly);
			this.Plotly = Plotly;
			//console.assert(window.Plotly, "plotly is required.");

			if (this.onPlotlyLoaded)
				this.onPlotlyLoaded();
		},


		mounted () {
			this.loadData();
		},


		methods: {
			onResize () {
				this.size = {width: this.$refs.plot.clientWidth, height: this.$refs.plot.clientHeight};

				if (this.normalPoints)
					this.delayUpdatePlot();
			},


			async loadData () {
				this.center = null;
				this.circle = null;

				if (this.dataPath) {
					this.loading = true;

					const {default: dataUrl} = await import(`../assets/stylegan-mapping/${this.dataPath}/mappingSource.dat`);
					const buffer = await (await fetch(dataUrl)).arrayBuffer();
					const array = new Float32Array(buffer);
					//console.log("array:", array);
					const vectorCount = array.length / this.dimensions;
					console.assert(vectorCount === Math.floor(vectorCount), "data size is not matched:", vectorCount, array.length);

					[this.center, ...this.circle] = Array(vectorCount).fill().map((_, i) => array.slice(i * this.dimensions, (i + 1) * this.dimensions));

					this.$emit("dataLoaded", {pointCount: vectorCount - 1});
				}

				if (!this.Plotly)
					await new Promise(resolve => this.onPlotlyLoaded = resolve);

				this.updatePlot();
			},


			updatePlot () {
				if (!this.normalPoints) {
					this.$refs.plot.innerHTML = "";
					return;
				}

				if (!this.Plotly)
					return;

				const points = [...this.normalPoints, this.normalPoints[0]];	// close the cycle
				const color = points.map((_, i) => i);
				const marker = {
					size: 3.5,
					color,
					colorscale: "Greens",
					cmin: 0,
					cmax: 100,
				};

				const data = Array(this.sliceCount).fill().map((_, i) => ({
					type: "scatter3d",
					mode: "lines+markers",
					sliceIndex: i,
					x: points.map(v => v[(this.sliceStart + i) * 3]),
					y: points.map(v => v[(this.sliceStart + i) * 3 + 1]),
					z: points.map(v => v[(this.sliceStart + i) * 3 + 2]),
					line: {
						width: 6,
						color,
					},
					marker,
				}));

				this.Plotly.newPlot(this.$refs.plot, data, {
					margin: {l: 0, r: 0, t: 20, b: 0},
					width: this.size.width,
					height: this.size.height,
				});

				this.$refs.plot.on("plotly_hover", event => this.onPlotHover(event));
				this.$refs.plot.on("plotly_unhover", () => this.onPlotUnhover());

				this.loading = false;
			},


			delayUpdatePlot () {
				this.loading = true;

				this.sliceUpdateTime = Date.now();
				setTimeout(() => {
					if (Date.now() - this.sliceUpdateTime > 490)
						this.updatePlot();
				}, 500);
			},


			onPlotHover (event) {
				if (event.points[0])
					this.$emit("update:focusPointIndex", event.points[0].pointNumber);
			},


			onPlotUnhover () {
				if (!this.focusOnTime || Date.now() - this.focusOnTime > 90)
					this.$emit("update:focusPointIndex", null);
			},
		},


		watch: {
			normalPoints: "updatePlot",


			sliceStart: "delayUpdatePlot",
			sliceCount: "delayUpdatePlot",


			dataPath: "loadData",


			focusPointIndex (value) {
				//console.log("focusPointIndex:", value);
				const on = Number.isInteger(value);
				if (on)
					this.focusOnTime = Date.now();

				if (this.normalPoints) {
					const indices = [...Array(this.normalPoints.length + 1).keys()];

					this.Plotly.restyle(this.$refs.plot, {
						marker: {
							size: on ?
								indices.map(i => i === value ? 16 : 7)
								: 3.5,
							color: on ? indices.map(i => i === value ? "green" : i) : indices,
							colorscale: "Greens",
							cmin: 0,
							cmax: 100,
						},
					}, [...Array(this.sliceCount).keys()]);
				}
			},
		},
	};
</script>

<style scoped>
	.plot
	{
		width: 100%;
		height: 100%;
	}

	.mask
	{
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: #ddd3;
		background-repeat: no-repeat;
		background-position: center center;
		pointer-events: none;
	}
</style>
