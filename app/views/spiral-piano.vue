<template>
	<div v-resize="onResize" class="spiral-piano"
		:class="{'drag-hover': drageHover}"
		@dragover.prevent="drageHover = true"
		@dragleave="drageHover = false"
		@drop.prevent="onDropFiles"
	>
		<svg class="canvas" viewBox="-500 -500 1000 1000" :class="{'full-width': fullWidth, 'full-height': !fullWidth}">
			<defs>
				<filter id="filter-brilliancy">
					<feColorMatrix type="saturate" values="1.2"/>
				</filter>
				<filter id="filter-middle-saturate">
					<feColorMatrix type="saturate" values="0.7"/>
				</filter>
				<filter id="filter-grey">
					<feColorMatrix type="saturate" values="0.06"/>
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
						<feFuncR type="linear" intercept="0.5" slope="1"/>
						<feFuncG type="linear" intercept="0.5" slope="1"/>
						<feFuncB type="linear" intercept="0.5" slope="1"/>
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
							:class="{active: keyStatus[key.pitch].active}"
							:data-pitch="key.pitch"
							:data-step="key.step"
							:d="key.path"
							@mousedown="onKeyDown(key.pitch)"
							@mouseup="onKeyUp(key.pitch)"
						/>
					</g>
				</g>
			</g>
		</svg>
		<div class="dashboard" v-show="showDashboard">
			<table>
				<tbody>
					<tr>
						<th></th>
						<td>
							<MidiDevices @midiInput="onMidiInputMessage" />
						</td>
					</tr>
					<tr>
						<th></th>
						<td>
							<input type="range" v-model.number="wideRange.Start" min="21" :max="wideRange.End - 1" />
							<input type="range" v-model.number="wideRange.End" :min="wideRange.Start + 1" max="108" />
							<span>[{{wideRange.Start}} - {{wideRange.End}}]</span>
						</td>
					</tr>
					<tr>
						<th>Modal</th>
						<td>
							<input type="range" v-model.number="modalOffset" min="-7" :max="7" />
							{{modalOffset}}
						</td>
					</tr>
					<tr v-if="midiFileName">
						<th></th>
						<td>
							<button @click="onPlayFile">{{isPlaying ? '\u23f8' : '\u25b6'}}</button>
							<span>{{midiFileName}}</span>
						</td>
					</tr>
				</tbody>
			</table>
		</div>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";

	import MidiPlayer from "../MidiPlayer";
	import "../utils.js";

	import MidiDevices from "../components/midi-devices.vue";



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
				MainPitches: {0: true, 2: true, 4: true, 5: true, 7: true, 9: true, 11: true},
				SyllableNames: ["do", null, "re", null, "mi", "fa", null, "so", null, "la", null, "ti"],
			},
			Minor: {
				MainPitches: {0: true, 2: true, 3: true, 5: true, 7: true, 8: true, 11: true},
				SyllableNames: ["do", null, "re", "mi", null, "fa", null, "so", "la", null, null, "ti"],
			},
		},
		KeySerials: {
			White: [0, 2, 4, 5, 7, 9, 11],
		},
		SpanKeyWidth: 9,
	};


	const keyToPitch = function (key) {
		return Config.NoteEnd - key;
	};

	/*const pitchToKey = function (pitch) {
		return Config.NoteEnd - pitch;
	};*/

	const pitchToStep = function (pitch) {
		let step = pitch % Config.GroupLen;
		if (step < 0)
			step += Config.GroupLen;
		return step;
	};

	const pitchToGroup = function (pitch) {
		return Math.floor(pitch / Config.GroupLen);
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
			const x = (keyToPitch(k) - avg) / unit;
			exts[k] = Math.exp(-x * x * x * x / 2);
		}

		const sum = exts.reduce((sum, ext) => sum + ext, 0);
		const scale = (Config.RegionRadius * 0.9 - Config.InnerRadius) * 12 / sum;

		return exts.map(ext => ext * scale);
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


		components: {
			MidiDevices,
		},


		data () {
			return {
				Config,
				size: null,
				extends: null,
				keyRadius: Array(Config.KeyCount + Config.GroupLen + 1).fill().map((_, k) => Config.InnerRadius + k * Config.ScrewPitch / Config.GroupLen),
				keyPoints: null,
				modalOffset: 0,
				keyWidthRatio: 0.5,
				mode: Config.Mode.Major,
				wideRange: {Start: 54, End: 77},
				synesthesiaScheme: "FifthRainbow",
				keyStatus: Array(Config.NoteEnd + 1).fill().map(() => ({active: false})),
				showDashboard: false,
				drageHover: false,
				isPlaying: false,
				midiFileName: null,
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


			wideRangeHash () {
				return `${this.wideRange.Start}|${this.wideRange.End}`;
			},
		},


		mounted () {
			window.$main = this;

			//window.MidiPlayer = MidiPlayer;
			MidiPlayer.loadPlugin().then(() => console.log("MIDI loaded."));

			this.updateKeyRadius();

			window.addEventListener("keydown", event => {
				switch (event.keyCode) {
				// F9
				case 120:
					this.showDashboard = !this.showDashboard;

					break;
				}
			});

			MidiPlayer.Player.addListener(data => {
				switch (data.message) {
				case 144:
					this.activateKey(data.note, true);

					break;
				case 128:
					this.activateKey(data.note, false);

					break;
				case "meta":
					switch (data.subtype) {
					case "keySignature":
						this.modalOffset = keyToOffset(data.key);

						break;
					}
					break;
				}
			});
		},


		methods: {
			onResize () {
				this.size = {width: this.$el.clientWidth, height: this.$el.clientHeight};
			},


			async onDropFiles (event) {
				this.drageHover = false;

				MidiPlayer.Player.stop();
				this.isPlaying = false;

				const file = event.dataTransfer.files[0];
				//console.log("file:", file);
				switch (file.type) {
				case "audio/mid":
				case "audio/midi":
					const buffer = await file.readAs("ArrayBuffer");
					const blob = new Blob([buffer], {type: file.type});
					const url = URL.createObjectURL(blob);
					await MidiPlayer.Player.loadFile(url);

					console.log("MIDI file loaded.");

					this.midiFileName = file.name;

					this.onPlayFile();

					break;
				}
			},


			onPlayFile () {
				if (this.isPlaying) {
					MidiPlayer.Player.pause();

					this.isPlaying = false;
				}
				else {
					MidiPlayer.Player.resume();

					this.isPlaying = true;
				}
			},


			updateKeyRadius () {
				this.extends = getSpanExtends(this.wideRange.Start, this.wideRange.End);

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


			activateKey (pitch, on) {
				this.keyStatus[pitch].active = on;
			},


			onKeyDown (pitch) {
				this.activateKey(pitch, true);

				MidiPlayer.noteOn(0, pitch, 100, 0);
			},


			onKeyUp (pitch) {
				this.activateKey(pitch, false);

				MidiPlayer.noteOff(0, pitch, 0);
			},


			onMidiInputMessage (message) {
				console.log("message:", message);
				const cmd = message.data[0] >> 4;
				const channel = message.data[0] & 0xf;
				const pitch = message.data[1];
				const velocity = message.data[2];

				switch (cmd) {
				case 9: // note on
					if (velocity > 0) {
						this.activateKey(pitch, true);
						MidiPlayer.noteOn(channel, pitch, velocity, 0);

						break;
					}
				// break omitted: when velocity is 0, the event type is note off

				case 8: // note off
					this.activateKey(pitch, false);
					MidiPlayer.noteOff(channel, pitch, 0);

					break;
				}
			},
		},


		watch: {
			wideRangeHash: "updateKeyRadius",
		},
	};
</script>

<style scoped>
	.spiral-piano
	{
		width: 100%;
		height: 100%;
	}

	.drag-hover
	{
		outline: 4px #4f4 solid;
		background-color: #cfc;
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

	.dashboard
	{
		position: fixed;
		bottom: 50px;
		right: 50px;
		background-color: #fffe;
		padding: 2em;
		border-radius: 2em;
		box-shadow: 4px 4px 20px #000a;
	}
</style>
