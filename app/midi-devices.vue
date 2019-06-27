<template>
	<div class="midi-devices">
		<div v-if="navigatorSupported">
			<select class="input-list" title="Choose a MIDI Input Device" ref="inputList" @change="updateInputConnection" :disabled="loading || inputDevices.length == 0">
				<option v-for="device of inputDevices" :key="device.id" :value="device.id" :selected="device.id === value">
					{{ device.name }}
				</option>
				<option v-if="inputDevices.length == 0">
					No Connection
				</option>
			</select>
			<button class="refresh" @click="refreshInputList">&#x1F504;</button>
		</div>
		<div class="unsupported" v-if="!navigatorSupported">
			The browser does not supported <a href="https://www.w3.org/TR/webmidi/" target="_blank">WebMIDI APIs</a>.
		</div>
	</div>
</template>

<script>
	export default {
		name: "midi-devices",


		props: {
			value: String,
		},


		mounted () {
			if (navigator.requestMIDIAccess) {
				this.loading = true;

				navigator.requestMIDIAccess()
					.then(midi => {
						this.MidiAccess = midi;

						this.refreshInputList();
					});
			}
		},


		beforeDestroyed () {
			if (this.MidiAccess) {
				const inputs = this.MidiAccess.inputs.values();
				for (const input of inputs)
					input.onmidimessage = null;
			}
		},


		data () {
			return {
				inputDevices: [],
				loading: false,
			};
		},


		computed: {
			navigatorSupported () {
				return navigator.requestMIDIAccess;
			},
		},


		methods: {
			refreshInputList () {
				if (this.MidiAccess) {
					this.loading = true;

					this.inputDevices = [...this.MidiAccess.inputs.values()];

					this.$nextTick(() => this.updateInputConnection());
				}
			},

			updateInputConnection () {
				//console.log("chosen:", this.$refs.inputList.value);

				if (this.$refs.inputList) {
					const inputs = this.MidiAccess.inputs.values();
					for (const input of inputs)
						input.onmidimessage = input.id === this.$refs.inputList.value ? message => this.$emit("midiInput", message) : null;

					this.$emit("input", this.$refs.inputList.value);
				}

				this.loading = false;
			},
		},
	};
</script>

<style scoped>
	.midi-list
	{
		display: inline-block;
	}

	.refresh
	{
		width: 16px;
		height: 16px;
		padding: 0;
		border: 0;
		cursor: pointer;
	}

	.midi-devices select, .midi-devices input, .midi-devices button
	{
		font-size: inherit;
	}
</style>
