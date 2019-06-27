<template>
	<div v-resize="onResize" class="spiral-piano">
		<svg class="canvas" viewBox="-500 -500 1000 1000" :class="{['full-width']: fullWidth, ['full-height']: !fullWidth}">
			<defs>
				<filter id="filter-brilliancy">
					<feColorMatrix type="saturate" values="1.2"/>
				</filter>
				<filter id="filter-middle-saturate">
					<feColorMatrix type="saturate" values="0.7"/>
				</filter>
				<filter id="filter-grey">
					<feColorMatrix type="saturate" values="0.04"/>
				</filter>
				<filter id="filter-brightness-n4">
					<feComponentTransfer>
						<feFuncR type="linear" intercept="-0.4" slope="1"/>
						<feFuncG type="linear" intercept="-0.4" slope="1"/>
						<feFuncB type="linear" intercept="-0.4" slope="1"/>
					</feComponentTransfer>
				</filter>
				<filter id="filter-brightness-n3">
					<feComponentTransfer>
						<feFuncR type="linear" intercept="-0.3" slope="1"/>
						<feFuncG type="linear" intercept="-0.3" slope="1"/>
						<feFuncB type="linear" intercept="-0.3" slope="1"/>
					</feComponentTransfer>
				</filter>
				<filter id="filter-brightness-n2">
					<feComponentTransfer>
						<feFuncR type="linear" intercept="-0.2" slope="1"/>
						<feFuncG type="linear" intercept="-0.2" slope="1"/>
						<feFuncB type="linear" intercept="-0.2" slope="1"/>
					</feComponentTransfer>
				</filter>
				<filter id="filter-brightness-n1">
					<feComponentTransfer>
						<feFuncR type="linear" intercept="-0.1" slope="1"/>
						<feFuncG type="linear" intercept="-0.1" slope="1"/>
						<feFuncB type="linear" intercept="-0.1" slope="1"/>
					</feComponentTransfer>
				</filter>
				<filter id="filter-brightness-1">
					<feComponentTransfer>
						<feFuncR type="linear" intercept="0.1" slope="1"/>
						<feFuncG type="linear" intercept="0.1" slope="1"/>
						<feFuncB type="linear" intercept="0.1" slope="1"/>
					</feComponentTransfer>
				</filter>
				<filter id="filter-brightness-2">
					<feComponentTransfer>
						<feFuncR type="linear" intercept="0.2" slope="1"/>
						<feFuncG type="linear" intercept="0.2" slope="1"/>
						<feFuncB type="linear" intercept="0.2" slope="1"/>
					</feComponentTransfer>
				</filter>
				<filter id="filter-brightness-3">
					<feComponentTransfer>
						<feFuncR type="linear" intercept="0.3" slope="1"/>
						<feFuncG type="linear" intercept="0.3" slope="1"/>
						<feFuncB type="linear" intercept="0.3" slope="1"/>
					</feComponentTransfer>
				</filter>
				<filter id="filter-brightness-4">
					<feComponentTransfer>
						<feFuncR type="linear" intercept="0.4" slope="1"/>
						<feFuncG type="linear" intercept="0.4" slope="1"/>
						<feFuncB type="linear" intercept="0.4" slope="1"/>
					</feComponentTransfer>
				</filter>
				<filter id="filter-brightness-5">
					<feComponentTransfer>
						<feFuncR type="linear" intercept="0.4" slope="1"/>
						<feFuncG type="linear" intercept="0.4" slope="1"/>
						<feFuncB type="linear" intercept="0.4" slope="1"/>
					</feComponentTransfer>
				</filter>
			</defs>
			<g class="regions">
				<path v-for="(region, i) of regions" :key="i" class="region"
					:class="{main: region.main, deputy: !region.main}"
					:d="`M0,0 L${region.point.x},${region.point.y} A${Config.RegionRadius},${Config.RegionRadius} 0 0,0 ${regions[region.nextIndex].point.x},${regions[region.nextIndex].point.y} Z`"
				/>
			</g>
			<g class="labels"></g>
			<g class="keys">
				<g class="labels">
					<text v-for="(name, i) of mode.SyllableNames" :key="i" class="syllable"
						:x="Math.cos(regions[i].angle) * (Config.InnerRadius - 8)"
						:y="Math.sin(regions[i].angle) * (Config.InnerRadius - 8) + 3"
						v-show="name != null"
					>
						{{name}}
					</text>
				</g>
				<g class="groups"></g>
			</g>
		</svg>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";

	import MidiPlayer from "./MidiPlayer";



	const Config = {
		GroupLen: 12,
		InnerRadius: 30,
		ScrewPitch: 4,
		KeyCount: 88,
		NoteStart: 21,
		NoteEnd: 108,
		MiddleC: 60,
		RegionRadius: 400,
		Mode: {
			Major: {
				MainPitches: { 0: true, 2: true, 4: true, 5: true, 7: true, 9: true, 11: true },
				SyllableNames: ["do", null, "re", null, "mi", "fa", null, "so", null, "la", null, "ti"],
			},
			Minor: {
				MainPitches: { 0: true, 2: true, 3: true, 5: true, 7: true, 8: true, 11: true },
				SyllableNames: ["do", null, "re", "mi", null, "fa", null, "so", "la", null, null, "ti"],
			}
		},
		KeySerials: {
			White: [0, 2, 4, 5, 7, 9, 11],
			/*BlackPosition: {
				1: 0.4,
				3: 1.6,
				6: 3.34,
				8: 4.5,
				10: 5.66,
			},*/
		},
		SpanKeyWidth: 9,
	};


	const keyToPitch = function (key) {
		return Config.NoteEnd - key;
	};

	const pitchToKey = function (pitch) {
		return Config.NoteEnd - pitch;
	};

	const pitchToStep = function (pitch) {
		let step = pitch % Config.GroupLen;
		if (step < 0)
			step += Config.GroupLen;
		return step;
	};

	const pitchToGroup = function (pitch) {
		return Math.floor(pitch / Config.GroupLen);
	};

	/*var pitchToX = function (pitch) {
		var group = noteToGroup(pitch);
		var pitch = noteToPitch(pitch);
		var pos = Config.KeySerials.White.indexOf(pitch);
		if (pos < 0)
			pos = Config.KeySerials.BlackPosition[pitch];
		return group * Config.KeySerials.White.length + pos - 12;
	};

	var xToPitch = function (x) {
		var pos = Math.floor(x / Config.SpanKeyWidth) + 12;
		var group = Math.floor(pos / 7);
		var step = Config.KeySerials.White[pos % 7];
		return group * 12 + step;
	};*/

	const keyToOffset = function (key) {
		let offset = (key * 7) % 12;
		while (offset < -5)
			offset += 12;
		while (offset > 6)
			offset -= 12;
		return offset;
	};

	const getSpanExtends = function (low, high) {
		const exts = [];
		const avg = (low + high) / 2;
		const unit = (low - high) / 2;
		for (let k = 0; k < Config.KeyCount + Config.GroupLen + 1; ++k) {
			const x = (keyToPitch(k) - avg) / unit;
			exts[k] = Math.exp(-x * x * x * x / 2) * 70;
		}
		return exts;
	};



	export default {
		name: "spiral-piano",


		directives: {
			resize,
		},


		data() {
			return {
				Config,
				size: null,
				extends: [],
				keyPoints: [],
				modalOffset: 0,
				keyWidthRatio: 0.5,
				mode: Config.Mode.Major,
				wideRange: {Start: 51, End: 83},
			};
		},


		computed: {
			fullWidth () {
				return this.size && this.size.height > this.size.width;
			},


			regions () {
				return Array(Config.GroupLen).fill().map((_, i) => {
					const angle = Math.PI * (1.5 + i * 2 / Config.GroupLen);
					const boderAngle = Math.PI * (1.5 + (i + this.getOffsetAngles(i)) * 2 / Config.GroupLen);

					return {
						angle,
						boderAngle,
						point: {
							x: Math.cos(boderAngle) * Config.RegionRadius,
							y: Math.sin(boderAngle) * Config.RegionRadius,
						},
						nextIndex: (i > 0) ? i - 1 : Config.GroupLen - 1,
						main: pitchToStep(i + this.modalOffset) in this.mode.MainPitches,
					};
				});
			},
		},


		created() {
			for (let k = 0; k < Config.KeyCount + Config.GroupLen + 1; ++k) {
				this.keyPoints[k] = Config.InnerRadius + k * Config.ScrewPitch / Config.GroupLen;
			}
			this.extends = getSpanExtends(this.wideRange.Start, this.wideRange.End);
		},


		mounted () {
			//window.MidiPlayer = MidiPlayer;
			MidiPlayer.loadPlugin().then(() => console.log("MIDI loaded."));

			this.updateKeyPoints();
		},


		methods: {
			onResize () {
				this.size = { width: this.$el.clientWidth, height: this.$el.clientHeight };
			},


			updateKeyPoints () {
				for (let k = 0; k < Config.KeyCount + Config.GroupLen + 1; ++k) {
					let exts = 0;
					for (let g = Math.floor(k / Config.GroupLen); g > 0; --g)
						exts += this.extends[k - g * Config.GroupLen];
					this.keyPoints[k] = Config.InnerRadius + k * Config.ScrewPitch / Config.GroupLen + exts;
				}
			},


			getOffsetAngles (pitch) {
				const mains = [pitchToStep(pitch + 1) in this.mode.MainPitches, pitchToStep(pitch) in this.mode.MainPitches];
				return (mains[0] === mains[1]) ? 0.5 : (mains[0] ? 1 - this.keyWidthRatio : this.keyWidthRatio);
			},
		},
	};
</script>

<style scoped>
	.spiral-piano
	{
		width: 100%;
		height: 100%;
	}

	.full-width
	{
		width: 100%;
	}

	.full-height
	{
		height: 100%;
	}

	.syllable
	{
		font-size: 9px;
		text-anchor: middle;
	}

	.region
	{
		stroke: white;
		stroke-width: 1px;
	}

	.region.main
	{
		fill: #ccc;
	}
	.region.deputy
	{
		fill: #777;
	}
</style>
