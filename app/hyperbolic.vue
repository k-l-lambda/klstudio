<template>
	<div class="hyperbolic" :class="{[`focus-${focusShape}`]: true}">
		<article>
			<SvgMap ref="cartesian"
				:width="size.width"
				:height="size.height"
				:initViewWidth="4"
				:initViewCenter="{x: 0, y: 0}"
				v-resize="onResize"
				@mousemove="onMouseMoving"
			>
				<g class="axes">
					<line x1="-100" x2="100" y1="0" y2="0" />
					<line y1="-100" y2="100" x1="0" x2="0" />
				</g>
				<g class="alignments">
					<line x1="-100" x2="100" y1="-100" y2="100" />
					<line x1="-100" x2="100" y1="100" y2="-100" />
				</g>
				<g class="circle">
					<circle class="shape" r="1" />
				</g>
				<g class="hyperbola">
					<path class="shape" :d="hyperbolaRPath" />
					<path class="shape" :d="hyperbolaLPath" />
				</g>
				<g v-if="cursorAngle">
					<line class="ray" x1="0" y1="0" :x2="Math.cos(cursorAngle) * 100" :y2="-Math.sin(cursorAngle) * 100" />
					<g class="circle values" v-if="circleRayPoint">
						<path class="angle" :d="circleArcPath" />
						<line class="sin" :x1="circleRayPoint.x" :y1="-circleRayPoint.y" :x2="circleRayPoint.x" y2="0" />
						<line class="cos" :x1="circleRayPoint.x" :y1="-circleRayPoint.y" x2="0" :y2="-circleRayPoint.y" />
						<line class="tan" :x1="1" :y1="-tanLength" x2="1" :y2="0" />
						<line class="ray-segment" x1="0" y1="0" :x2="circleRayPoint.x" :y2="-circleRayPoint.y" />
					</g>
					<g class="hyperbola values" v-if="hyperbolaRayPoint">
						<path class="angle" :d="hyperbolaArcPath" />
						<line class="sin" :x1="hyperbolaRayPoint.x" :y1="-hyperbolaRayPoint.y" :x2="hyperbolaRayPoint.x" y2="0" />
						<line class="cos" :x1="hyperbolaRayPoint.x" :y1="-hyperbolaRayPoint.y" x2="0" :y2="-hyperbolaRayPoint.y" />
						<line class="tan" :x1="1" :y1="-tanLength" x2="1" :y2="0" />
						<line class="ray-segment" x1="0" y1="0" :x2="hyperbolaRayPoint.x" :y2="-hyperbolaRayPoint.y" />
					</g>
				</g>
			</SvgMap>
		</article>
		<header>
			<select v-model="focusShape">
				<option value="circle">circle</option>
				<option value="hyperbola">hyperbola</option>
			</select>
		</header>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";

	import SvgMap from "./svg-map.vue";



	export default {
		name: "hyperbolic",


		directives: {
			resize,
		},


		components: {
			SvgMap,
		},


		data() {
			const halfPoints = [...Array(100).keys()].map(i => (i / 40) ** 2);

			return {
				size: {},
				hyperbolaPoints: [...halfPoints, ...halfPoints.map(a => -a)].sort((x, y) => x - y),
				focusShape: "circle",
				cursorPoint: null,
			};
		},


		computed: {
			hyperbolaRPath() {
				return "M" + this.hyperbolaPoints.map(point => `${Math.cosh(point).toFixed(6)} ${Math.sinh(point).toFixed(6)}`).join(" L");
			},


			hyperbolaLPath() {
				return "M" + this.hyperbolaPoints.map(point => `${-Math.cosh(point).toFixed(6)} ${Math.sinh(point).toFixed(6)}`).join(" L");
			},


			cursorAngle() {
				if (!this.cursorPoint)
					return null;

				if (this.cursorPoint.x == 0)
					return this.cursorPoint.y > 0 ? Math.PI / 2 : Math.PI / -2;

				const angle = Math.atan(this.cursorPoint.y / this.cursorPoint.x);

				return this.cursorPoint.x > 0 ? angle : angle + Math.PI;
			},


			circleRayPoint() {
				if (!this.cursorAngle)
					return null;

				return {
					x: Math.cos(this.cursorAngle),
					y: Math.sin(this.cursorAngle),
				};
			},


			hyperbolaRayPoint() {
				if (!(this.cursorAngle < Math.PI / 4 && this.cursorAngle > -Math.PI / 4))
					return null;

				const x = Math.sqrt(1 / (1 - Math.tan(this.cursorAngle) ** 2));

				return {
					x,
					y: x * Math.tan(this.cursorAngle),
				};
			},


			tanLength() {
				if (!this.cursorAngle)
					return null;

				return Math.tan(this.cursorAngle);
			},


			hyperbolicAngle() {
				if (!this.hyperbolaRayPoint)
					return null;

				return Math.asinh(this.hyperbolaRayPoint.y);
			},


			hyperbolaArcPath() {
				if (!this.hyperbolaRayPoint)
					return null;

				return `M${this.hyperbolaRayPoint.x} ${-this.hyperbolaRayPoint.y} L0 0 L1 0 L`
					+ [...Array(100).keys()].map(i => i * this.hyperbolicAngle / 100).map(point => `${Math.cosh(point).toFixed(6)} ${-Math.sinh(point).toFixed(6)}`).join(" L")
					+ "Z";
			},


			circleArcPath() {
				if (!this.cursorAngle)
					return null;

				return `M${this.circleRayPoint.x} ${-this.circleRayPoint.y} L0 0 L1 0 A1 1 0 ${Math.abs(this.cursorAngle) > Math.PI ? 1 : 0} ${this.cursorAngle > 0 ? 0 : 1} ${this.circleRayPoint.x} ${-this.circleRayPoint.y} Z`;
			},
		},


		mounted() {
			window.__main = this;
		},


		methods: {
			onResize() {
				this.size = {width: this.$el.clientWidth, height: this.$el.clientHeight};
			},


			onMouseMoving(event) {
				const cursorPoint = this.$refs.cartesian.clientToView({x: event.offsetX, y: event.offsetY});
				//console.log("cursorPoint:", cursorPoint);

				this.cursorPoint = {x: cursorPoint.x, y: -cursorPoint.y};
			},
		},
	};
</script>

<style scoped>
	header
	{
		position: absolute;
		top: 0;
		width: 100%;
		text-align: center;
		font-family: Arial;
		user-select: none;
		padding: 1em 0;
	}

	article
	{
		user-select: none;
	}

	article > *
	{
		vertical-align: middle;
	}

	.axes line
	{
		stroke: black;
		stroke-width: 0.01;
	}

	.alignments line
	{
		stroke: #0004;
		stroke-width: 0.004;
		stroke-dasharray: 0.03 0.02;
	}

	.shape
	{
		fill: transparent;
		stroke-width: 0.01;
		stroke: black;
		stroke-dasharray: 0.04 0.02;
	}

	.focus-circle .circle .shape, .focus-hyperbola .hyperbola .shape
	{
		stroke-width: 0.02;
		stroke-dasharray: none;
	}

	.ray
	{
		stroke: black;
		stroke-width: 0.001;
	}

	.ray-segment
	{
		stroke: black;
	}

	.sin
	{
		stroke: #f00;
	}

	.cos
	{
		stroke: #0c0;
	}

	.tan
	{
		stroke: #04f;
	}

	.values
	{
		visibility: hidden;
	}

	.values line
	{
		stroke-width: 0.02;
	}

	.focus-circle .circle.values, .focus-hyperbola .hyperbola.values
	{
		visibility: visible;
	}

	.angle
	{
		fill: #0003;
	}
</style>
