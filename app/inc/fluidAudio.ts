
import {AudioWorkletNodeSynthesizer, type ISequencer} from "js-synthesizer";



// FluidSynth-backed audio adapter, shaped to match the subset of the legacy
// MIDI.js `MidiAudio` API that midi-player.vue uses (empty / loadPlugin / noteOn /
// noteOff / programChange / stopAllNotes). Swapping the backend here keeps the
// .vue diff minimal and lets the same adapter port to lilylet-live-editor.
//
// Architecture: MidiPlayer is a look-ahead scheduler — every frame it calls
// onMidi(data, absoluteTimestamp) for events within a ~400ms window, passing the
// absolute performance.now()-based time each note should sound. We forward those
// to FluidSynth's Sequencer via sendEventAt(event, dtMs, isAbsolute=false), i.e.
// "play in dtMs milliseconds", which preserves the look-ahead timing without
// reconciling performance.now() against the sequencer's own tick origin.


// SoundFont location (relative to the served page). Swap this file to upgrade
// audio quality — no code change needed. A General MIDI .sf2/.sf3 gives 128
// instruments; the legacy single-piano soundfont made every program sound as piano.
// Currently FluidR3Mono GM (~14 MB, .sf3; ogg-compressed samples — requires the
// libfluidsynth with-libsndfile build below).
const SOUNDFONT_URL = "./soundfont/gm.sf3";

// FluidSynth WASM runtime, copied into public/fluid/. The with-libsndfile build
// is required to decode .sf3 (ogg-compressed) soundfonts; it also reads .sf2.
const LIBFLUIDSYNTH_URL = "./fluid/libfluidsynth-2.4.6-with-libsndfile.js";
const WORKLET_URL = "./fluid/js-synthesizer.worklet.js";


let audioCtx: AudioContext | null = null;
let synth: AudioWorkletNodeSynthesizer | null = null;
let seq: ISequencer | null = null;
let loaded = false;
let loadingPromise: Promise<void> | null = null;


const empty = (): boolean => !loaded;


const loadPlugin = async (): Promise<void> => {
	if (loaded)
		return;
	if (loadingPromise)
		return loadingPromise;

	loadingPromise = (async () => {
		audioCtx = new AudioContext();

		// Both modules load into the AudioWorklet scope; libfluidsynth must come first.
		await audioCtx.audioWorklet.addModule(LIBFLUIDSYNTH_URL);
		await audioCtx.audioWorklet.addModule(WORKLET_URL);

		synth = new AudioWorkletNodeSynthesizer();
		synth.init(audioCtx.sampleRate);

		// createAudioNode MUST be called before any other synth method.
		const node = synth.createAudioNode(audioCtx);
		node.connect(audioCtx.destination);

		const sfontBuffer = await (await fetch(SOUNDFONT_URL)).arrayBuffer();
		await synth.loadSFont(sfontBuffer);

		seq = await synth.createSequencer();
		await seq.registerSynthesizer(synth);
		seq.setTimeScale(1000);		// 1 tick = 1 ms, matching performance.now()

		loaded = true;
		console.log("FluidSynth soundfont loaded.");
	})();

	return loadingPromise;
};


// Resume the AudioContext; must be called from a user gesture (autoplay policy).
const resume = async (): Promise<void> => {
	if (audioCtx && audioCtx.state === "suspended")
		await audioCtx.resume();
};


// Convert an absolute performance.now()-based timestamp into a relative
// "milliseconds from now" delay for the sequencer.
const delayFromNow = (timestamp: number): number => Math.max(0, timestamp - performance.now());


const noteOn = (channel: number, note: number, velocity: number, timestamp: number): void => {
	if (!seq)
		return;
	seq.sendEventAt({type: "noteon", channel, key: note, vel: velocity}, delayFromNow(timestamp), false);
};


const noteOff = (channel: number, note: number, timestamp: number): void => {
	if (!seq)
		return;
	seq.sendEventAt({type: "noteoff", channel, key: note}, delayFromNow(timestamp), false);
};


const programChange = (channel: number, program: number): void => {
	if (!seq)
		return;
	seq.sendEventAt({type: "programchange", channel, preset: program}, 0, false);
};


const stopAllNotes = (): void => {
	if (seq)
		seq.removeAllEvents();		// drop the in-flight look-ahead window
	if (synth) {
		for (let ch = 0; ch < 16; ++ch)
			synth.midiAllSoundsOff(ch);
	}
};



export default {
	empty,
	loadPlugin,
	resume,
	noteOn,
	noteOff,
	programChange,
	stopAllNotes,
};
