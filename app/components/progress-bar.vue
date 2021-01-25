<template>
	<span class="progress-bar"
		@mousemove="onMouseMove"
		@mouseleave="onMouseLeave"
		@click="emitCursor"
	>
		<span class="fill cursor" :style="{width: `${progress * 100}%`}"></span>
		<span v-if="indicator" class="fill indicator" :style="{width: `${indicator * 100}%`}"></span>
		<span class="timer">
			<span v-html="formatTime(cursor)"></span> / <span v-html="formatTime(duration)"></span>
		</span>
	</span>
</template>

<script>
	export default {
		name: "progress-bar",


		props: {
			cursor: Number,
			duration: {
				type: Number,
				validator: value => value > 0,
			},
		},


		data () {
			return {
				indicator: null,
			};
		},


		computed: {
			progress () {
				return this.cursor / this.duration;
			},
		},


		methods: {
			onMouseMove (event) {
				//console.log("onMouseMove:", event.buttons);
				this.indicator = event.offsetX / this.$el.clientWidth;

				if (event.buttons === 1)
					this.emitCursor();
			},


			onMouseLeave () {
				this.indicator = null;
			},


			emitCursor () {
				const oldCursor = this.cursor;

				this.$emit("update:cursor", this.indicator * this.duration);
				this.$emit("turnCursor", this.indicator * this.duration, oldCursor);
			},


			formatTime (ms) {
				if (!Number.isFinite(ms) || ms < 0)
					return "--:--";

				const minutes = Math.floor(ms / 60e+3);
				const seconds = ((ms % 60e+3) / 1e+3).toFixed(1).replace(/\.(\d+)$/, "<sub>.$1</sub>");

				return `${minutes}:${(ms % 60e+3) / 1e+3 < 10 ? "0" : ""}${seconds}`;
			},
		},
	};
</script>

<style scoped>
	.progress-bar
	{
		position: relative;
		display: inline-block;
		min-width: 2em;
		min-height: 1em;
		border-radius: 0.2em;
		background-image: linear-gradient(180deg, #666 0%, #000 100%);
		overflow: hidden;
		cursor: pointer;
	}

	.fill
	{
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		background-image: linear-gradient(180deg, #0000 0%, #0008 100%);
	}

	.fill.cursor
	{
		background-color: #aaa;
	}

	.fill.indicator
	{
		background-color: #1199faaa;
	}

	.timer
	{
		position: absolute;
		display: inline-block;
		left: 0;
		width: 100%;
		top: 50%;
		transform: translateY(-50%);
		text-align: center;
		pointer-events: none;
		color: #fff;
		font-size: 60%;
		font-family: Arial;
		text-shadow: 1px 1px 1px #000c;
	}

	.timer >>> sub
	{
		opacity: 0.6;
		vertical-align: middle;
	}
</style>
