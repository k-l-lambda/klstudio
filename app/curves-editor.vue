<template>
	<body>
		<article>
			<SvgMap ref="cartesian"
				:width="size.width"
				:height="size.height"
				:initViewWidth="4"
				:initViewCenter="{x: 0, y: 0}"
				v-resize="onResize"
			>
				<g class="axes">
					<line x1="-100" x2="100" y1="0" y2="0" />
					<line y1="-100" y2="100" x1="0" x2="0" />
				</g>
				<g class="curves">

				</g>
			</SvgMap>
		</article>
		<header>
			<button class="settings" :class="{on: panelIsOn, off: !panelIsOn}" @click="panelIsOn = !panelIsOn">&#x2699;</button>
			<div class="config" v-if="panelIsOn">
				<table class="curves">
					<tbody>
					<tr v-for="(config, i) in curveConfig" :key="i">
						<td class="index">{{i + 1}}.</td>
							<td>
								<div><input type="text" placeholder="X Function" v-model="config.xExp" /></div>
								<div><input type="text" placeholder="Y Function" v-model="config.yExp" /></div>
							</td>
							<td>
								<input type="text" placeholder="Arg Function" v-model="config.argExp" />
							</td>
							<td>
								<input type="text" placeholder="arg start" v-model.number="config.argLow" />
								<input type="text" placeholder="arg end" v-model.number="config.argHigh" />
							</td>
							<td>
								<input type="number" placeholder="segments" v-model.number="config.segments" />
							</td>
							<td>
								<select v-model="config.style">
									<option value="solid">solid</option>
									<option value="dashed">dashed</option>
								</select>
							</td>
							<td>
								<input type="text" placeholder="color" v-model="config.color" />
							</td>
							<td>
								<input type="text" placeholder="width" v-model="config.width" />
							</td>
							<td>
								<button class="remove-curve" @click="onRemoveCurve(i)">-</button>
							</td>
						</tr>
					</tbody>
				</table>
				<button class="add-curve" @click="onAddCurve">+</button>
			</div>
		</header>
	</body>
</template>

<script>
	import resize from "vue-resize-directive";

	import SvgMap from "./svg-map.vue";
	import SvgCurve from "./svg-curve.vue";



	class CurveConfig {
		constructor(values = {
			xExp: "",
			yExp: "",
			argExp: "",
			argLow: 0,
			argHigh: 0,
			segments: 100,
			style: "solid",
			color: "black",
			width: "0.1",
		}) {
			Object.assign(this, values);
		}


		get valid() {
			return this.xFunction && this.yFunction;
		}
	};



	export default {
		name: "curves-editor",


		directives: {
			resize,
		},


		components: {
			SvgMap,
			SvgCurve,
		},


		data() {
			const halfPoints = [...Array(100).keys()].map(i => (i / 40) ** 2);

			return {
				size: {},
				panelIsOn: false,
				curveConfig: [],
			};
		},


		mounted() {
			//console.log("home:", document);
		},


		methods: {
			onResize() {
				this.size = {width: this.$el.clientWidth, height: this.$el.clientHeight};
			},


			onAddCurve() {
				this.curveConfig.push(new CurveConfig());
			},


			onRemoveCurve(index) {
				this.curveConfig.splice(index, 1);
			},
		},
	};
</script>

<style>
	html
	{
		overflow: hidden;
	}

	body
	{
		margin: 0;
		height: 100vh;
	}

	header
	{
		position: absolute;
		top: 0;
		width: 100%;
		text-align: center;
		font-family: Arial;
		padding: 1em 0;
	}

	header .settings
	{
		position: absolute;
		right: 1em;
		top: 1em;
	}

	header .config
	{
		background-color: #fffc;
	}

	button
	{
		cursor: pointer;
	}

	.axes line
	{
		stroke: black;
		stroke-width: 0.01;
	}

	button.on
	{
		font-weight:bold;
	}

	button.off
	{
		background: transparent;
		border: 0;
		color: #000a;
	}

	.add-curve
	{
		color: #0c0;
	}

	.remove-curve
	{
		color: #d00;
	}
</style>
