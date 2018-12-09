<template>
	<body>
		<section>
			<h2>
				主题：
				<select v-model="theme">
					<option v-for="theme in themes" :key="theme.name" :value="theme.name">{{theme.title}}</option>
				</select>
			</h2>
		</section>
		<section>
			<textarea v-debounce.4s="onHeadText" v-model="headText" :disabled="!ready" placeholder="在这里写个开头"></textarea>
		</section>
		<section>
			忠于原著 <input type="range" min="0.01" max="2" step="any" v-model.number="temperature" :title="temperature.toFixed(2)" /> 想象狂野
			<button @click="onRestart">重写</button>
		</section>
		<section>
			<span>{{headText}}</span>
			<pre v-text="bodyText"></pre>
		</section>
	</body>
</template>

<script>
	import url from "url";
	import * as tf from "@tensorflow/tfjs";
	import Vue from "vue"
	import vueDebounce from "vue-debounce"


	Vue.use(vueDebounce);


	const isDevelopment = process.env.NODE_ENV === "development";

	const waitAnimationFrame = () => new Promise(solve => requestAnimationFrame(solve));



	export default {
		name: "writer",


		data() {
			return {
				themes: [
					{
						name: "tang-poem",
						title: "唐诗",
					},
				],
				theme: url.parse(location.href).query,
				headText: null,
				bodyText: "",
				ready: false,
				temperature: 1,
			};
		},


		mounted() {
			if (isDevelopment) {
				window.__main = this;
				window.tf = tf;
			}

			if (this.theme)
				this.loadTheme();
		},


		beforeDestroy() {
			//console.log("beforeDestroy. 12");
			this.stopProducing();
		},


		methods: {
			async loadTheme() {
				//console.log("loadModel:", this.theme);
				this.chars = await (await fetch(`/mlmodels/char-rnn/${this.theme}/vocab.txt`)).text();
				this.vocab = this.chars.split("").reduce((v, char, i) => (v[char] = i, v), {});

				this.ready = true;

				console.log("vocab loaded:", this.theme);
			},


			onHeadText() {
				//console.log("onHeadText:", this.headText);
				this.onRestart();
			},


			async onRestart() {
				if (!this.ready)
					return;

				this.bodyText = "";

				await this.stopProducing();

				if (this.headText && this.headText.length)
					this.produce(this.headText);
			},


			async produce(headText) {
				console.log("producing...");

				this.producing = true;

				let inputs = headText.split("").map(char => this.vocab[char]).filter(Number.isInteger);
				//console.log("inputs:", inputs);

				this.model = await tf.loadModel(`/mlmodels/char-rnn/${this.theme}/model.json`);

				console.log("model loaded.");

				while (!this.onProduceFinished) {
					inputs = tf.tidy(() => {
						const inputsTensor = tf.tensor2d([inputs]);

						const predictions = this.model.predict(inputsTensor).squeeze();

						const ids = tf.multinomial(predictions.div(this.temperature), 1);
						//console.log("ids.shape:", ids.shape);
						const id = ids.shape.length > 1 ? ids.slice([ids.shape[0] - 1, 0], [1, 1]).reshape([-1]) : ids.slice([ids.shape[0] - 1], [1]);

						return id.dataSync();
					});

					//console.log("char:", this.chars[inputs[0]]);
					this.bodyText += this.chars[inputs[0]];

					await waitAnimationFrame();
				}

				this.producing = false;

				if (this.onProduceFinished)
					this.onProduceFinished();
			},


			async stopProducing() {
				if (this.producing) {
					await new Promise(resolve => this.onProduceFinished = resolve);

					this.onProduceFinished = null;

					console.log("Producing stopped.");
				}
			},
		},


		watch: {
			theme() {
				location.search = this.theme;
			},
		},
	};
</script>

<style>
	select
	{
		font-size: inherit;
	}
</style>
