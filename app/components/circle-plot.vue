<template>
	<div v-resize="onResize" class="circle-plot">
	</div>
</template>

<script>
	import resize from "vue-resize-directive";



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
		},


		data () {
			return {
				size: {width: 800, height: 800},
				center: null,
				circle: null,
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
			const {default: Plotly} = await import("../plotly.min.js") ;
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
				this.size = {width: this.$el.clientWidth, height: this.$el.clientHeight};
			},


			async loadData () {
				this.center = null;
				this.circle = null;

				if (this.dataPath) {
					const {default: dataUrl} = await import(`../assets/stylegan-mapping/${this.dataPath}/mappingSource.dat`);
					const buffer = await (await fetch(dataUrl)).arrayBuffer();
					const array = new Float32Array(buffer);
					//console.log("array:", array);
					const vectorCount = array.length / this.dimensions;
					console.assert(vectorCount === Math.floor(vectorCount), "data size is not matched:", vectorCount, array.length);

					[this.center, ...this.circle] = Array(vectorCount).fill().map((_, i) => array.slice(i * this.dimensions, (i + 1) * this.dimensions));
				}

				await new Promise(resolve => this.onPlotlyLoaded = resolve);

				this.updatePlot();
			},


			updatePlot () {
				if (!this.normalPoints) {
					this.$el.innerHTML = "";
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
					cmin: -20,
					cmax: 50,
				};

				const data = this.mode === "2d" ? Array(this.sliceCount).fill().map((_, i) => ({
					type: "scatter3d",
					mode: "lines+markers",
					x: points.map(v => v[(this.sliceStart + i) * 2]),
					y: points.map(v => v[(this.sliceStart + i) * 2 + 1]),
					z: points.map(() => 0),
					line: {
						width: 6,
						color,
					},
					marker,
				})) : Array(this.sliceCount).fill().map((_, i) => ({
					type: "scatter3d",
					mode: "lines+markers",
					x: points.map(v => v[(this.sliceStart + i) * 3]),
					y: points.map(v => v[(this.sliceStart + i) * 3 + 1]),
					z: points.map(v => v[(this.sliceStart + i) * 3 + 2]),
					line: {
						width: 6,
						color,
					},
					marker,
				}));

				this.Plotly.newPlot(this.$el, data, {
					margin: {l: 0, r: 0, t: 0, b: 0},
					width: this.size.width,
					height: this.size.height,
				});
			},


			delayUpdatePlot () {
				this.sliceUpdateTime = Date.now();
				setTimeout(() => {
					if (Date.now() - this.sliceUpdateTime > 490)
						this.updatePlot();
				}, 500);
			},
		},


		watch: {
			normalPoints: "updatePlot",


			sliceStart: "delayUpdatePlot",
			sliceCount: "delayUpdatePlot",


			dataPath: "loadData",
		},
	};
</script>
