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
				<g class="groups">
					<g v-for="(group, i) of groups" :key="i" class="group" :data-index="group.index">
						<path v-for="(key, ii) of group.keys" :key="ii" class="key"
							:data-pitch="key.pitch"
							:data-step="key.step"
							:d="key.path"
						/>
					</g>
				</g>
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


	/*const Synesthesias = {
		Rainbow: {
			0: "#ff0000",
			1: "#ff8600",
			2: "#ffb400",
			3: "#ffe400",
			4: "#eaff00",
			5: "#6cff00",
			6: "#00ff96",
			7: "#00fff6",
			8: "#008cff",
			9: "#0003ff",
			10: "#8e00ff",
			11: "#f000ff",
		},
		FifthRainbow: {
			1: "#ff0000",
			8: "#ff8600",
			3: "#ffb400",
			10: "#ffe400",
			5: "#eaff00",
			0: "#6cff00",
			7: "#00ff96",
			2: "#00fff6",
			9: "#008cff",
			4: "#0003ff",
			11: "#8e00ff",
			6: "#f000ff",
		},
	};*/



	export default {
		name: "spiral-piano",


		directives: {
			resize,
		},


		data() {
			return {
				Config,
				size: null,
				extends: getSpanExtends(45, 84),
				keyRadius: Array(Config.KeyCount + Config.GroupLen + 1).fill().map((_, k) => Config.InnerRadius + k * Config.ScrewPitch / Config.GroupLen),
				keyPoints: null,
				modalOffset: 0,
				keyWidthRatio: 0.5,
				mode: Config.Mode.Major,
				wideRange: {Start: 45, End: 84},
				synesthesiaScheme: "FifthRainbow",
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


			keys () {
				if (!this.keyPoints)
					return null;

				return Array(Config.KeyCount).fill().map((_, k) => {
					const pitch = keyToPitch(k);
					const group = pitchToGroup(pitch);

					const [index0, index1, index2, index3] = [k, k + 1, k + Config.GroupLen + 1, k + Config.GroupLen];

					return {
						pitch,
						group,
						step: pitchToStep(pitch),
						path: `M${this.keyPoints[index0].x},${this.keyPoints[index0].y}
							A${this.keyRadius[index0]},${this.keyRadius[index0]} 0 0 0 ${this.keyPoints[index1].x},${this.keyPoints[index1].y}
							L${this.keyPoints[index2].x},${this.keyPoints[index2].y}
							A${this.keyRadius[index3]},${this.keyRadius[index3]} 0 0 1 ${this.keyPoints[index3].x},${this.keyPoints[index3].y}
							Z`.replace(/\n/g, ""),
					};
				});
			},


			groups () {
				if (!this.keys)
					return null;

				return Array(9).fill().map((_, i) => ({
					index: i + 1,
					keys: this.keys.filter(key => key.group === i + 1),
				}));
			},


			/*synesthesia () {
				return Synesthesias[this.synesthesiaScheme];
			},*/
		},


		/*created () {
			for (let k = 0; k < Config.KeyCount + Config.GroupLen + 1; ++k) {
				this.keyRadius[k] = Config.InnerRadius + k * Config.ScrewPitch / Config.GroupLen;
			}
			this.extends = getSpanExtends(this.wideRange.Start, this.wideRange.End);
		},*/


		mounted () {
			//window.MidiPlayer = MidiPlayer;
			MidiPlayer.loadPlugin().then(() => console.log("MIDI loaded."));

			this.updateKeyRadius();
		},


		methods: {
			onResize () {
				this.size = { width: this.$el.clientWidth, height: this.$el.clientHeight };
			},


			updateKeyRadius () {
				for (let k = 0; k < Config.KeyCount + Config.GroupLen + 1; ++k) {
					let exts = 0;
					for (let g = Math.floor(k / Config.GroupLen); g > 0; --g)
						exts += this.extends[k - g * Config.GroupLen];
					this.keyRadius[k] = Config.InnerRadius + k * Config.ScrewPitch / Config.GroupLen + exts;
				}

				this.keyPoints = Array(Config.KeyCount + Config.GroupLen + 1).fill().map((_, p) => {
					const offsetAngle = this.getOffsetAngles(keyToPitch(p) - this.modalOffset);
					const angle = Math.PI * (1.5 - (this.modalOffset + p - offsetAngle) * 2 / Config.GroupLen);
					const radius = (this.keyRadius[p] + (p > 0 ? this.keyRadius[p - 1] : this.keyRadius[p])) / 2;

					return {
						x: Math.cos(angle) * radius,
						y: Math.sin(angle) * radius,
					};
				});
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

	.key
	{
		stroke: white;
		stroke-width: 0;
		filter: url(#filter-grey);
		cursor: pointer;
		opacity: 0.8;
	}

	.key:hover
	{
		filter: url(#filter-middle-saturate);
		opacity: 1;
	}

	.key.active
	{
		filter: url(#filter-brilliancy) !important;
		opacity: 1;
		stroke-width: 2px;
	}

	.key[data-step="1"]
	{
		fill: #ff0000;
	}
	.key[data-step="8"]
	{
		fill: #ff8600;
	}
	.key[data-step="3"]
	{
		fill: #ffb400;
	}
	.key[data-step="10"]
	{
		fill: #ffe400;
	}
	.key[data-step="5"]
	{
		fill: #eaff00;
	}
	.key[data-step="0"]
	{
		fill: #6cff00;
	}
	.key[data-step="7"]
	{
		fill: #00ff96;
	}
	.key[data-step="2"]
	{
		fill: #00fff6;
	}
	.key[data-step="9"]
	{
		fill: #008cff;
	}
	.key[data-step="4"]
	{
		fill: #0003ff;
	}
	.key[data-step="11"]
	{
		fill: #8e00ff;
	}
	.key[data-step="6"]
	{
		fill: #f000ff;
	}

	.group[data-index="1"]
	{
		filter: url(#filter-brightness-n4);
	}
	.group[data-index="2"]
	{
		filter: url(#filter-brightness-n3);
	}
	.group[data-index="3"]
	{
		filter: url(#filter-brightness-n2);
	}
	.group[data-index="4"]
	{
		filter: url(#filter-brightness-n1);
	}
	.group[data-index="6"]
	{
		filter: url(#filter-brightness-1);
	}
	.group[data-index="7"]
	{
		filter: url(#filter-brightness-2);
	}
	.group[data-index="8"]
	{
		filter: url(#filter-brightness-3);
	}
	.group[data-index="9"]
	{
		filter: url(#filter-brightness-4);
	}
</style>
