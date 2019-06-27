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
			<g class="regions"></g>
			<g class="labels"></g>
			<g class="keys">
				<g class="labels">
					<text v-for="(name, i) of mode.SyllableNames" :key="i" class="syllable"
						:x="Math.cos(regionAngles[i]) * (Config.InnerRadius - 8)"
						:y="Math.sin(regionAngles[i]) * (Config.InnerRadius - 8)"
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
				SyllableNames: ["do", null, "re", null, "mi", "fa", null, "so", null, "la", null, "si"]
			},
			Minor: {
				MainPitches: { 0: true, 2: true, 3: true, 5: true, 7: true, 8: true, 11: true },
				SyllableNames: ["do", null, "re", "mi", null, "fa", null, "so", "la", null, null, "si"]
			}
		},
		KeySerials: {
			White: [0, 2, 4, 5, 7, 9, 11],
			BlackPosition: {
				1: 0.4,
				3: 1.6,
				6: 3.34,
				8: 4.5,
				10: 5.66
			}
		},
		SpanKeyWidth: 9,
	};


	const keyToNote = function(key){
		return Config.NoteEnd - key;
	};

	const noteToKey = function (note) {
		return Config.NoteEnd - note;
	};

	const noteToPitch = function (note) {
		let pitch = note % Config.GroupLen;
		if (pitch < 0)
			pitch += Config.GroupLen;
		return pitch;
	};

	const noteToGroup = function(note){
		return Math.floor(note / Config.GroupLen);
	};

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
			const x = (keyToNote(k) - avg) / unit;
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
				keyWidthRatio: 0.7,
				mode: Config.Mode.Major,
				wideRange: {Start: 51, End: 83},
			};
		},


		computed: {
			fullWidth () {
				return this.size && this.size.height > this.size.width;
			},


			regionAngles () {
				return Array(Config.GroupLen).fill().map((_, i) => Math.PI * (1.5 + i * 2 / Config.GroupLen));
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
	}
</style>
