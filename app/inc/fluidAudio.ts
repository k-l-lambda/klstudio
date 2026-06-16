
import {AudioWorkletNodeSynthesizer, type ISequencer} from "js-synthesizer";
import {MidiAudio as LegacyMidiAudio} from "@k-l-lambda/music-widgets";



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
//
// Fallback: the FluidSynth soundfont is large (~14–38 MB) and takes a moment to
// fetch + decode. While it loads, we fall back to the legacy MIDI.js WebAudio
// player (a small, locally-bundled acoustic-grand-piano soundfont) so playback is
// audible immediately. Once FluidSynth is ready we switch to it transparently.


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

// Legacy MIDI.js fallback (single-piano), used until FluidSynth finishes loading.
let legacyReady = false;


// True once the (preferred) FluidSynth backend has finished loading.
const ready = (): boolean => loaded;

// True while FluidSynth is still loading — the UI shows a spinner during this.
// Note: not "empty"; the legacy fallback may already be producing sound.
const loading = (): boolean => !loaded && !!loadingPromise;

// Whether any backend can produce sound yet (FluidSynth or the legacy fallback).
const empty = (): boolean => !loaded && !legacyReady;


const loadPlugin = async (): Promise<void> => {
	if (loaded)
		return;
	if (loadingPromise)
		return loadingPromise;

	// Start the lightweight legacy fallback immediately so playback is audible
	// while the large FluidSynth soundfont downloads. Failure here is non-fatal.
	if (LegacyMidiAudio.WebAudio.empty()) {
		LegacyMidiAudio.loadPlugin({soundfontUrl: "./soundfont/", api: "webaudio"})
			.then(() => legacyReady = true)
			.catch((err: unknown) => console.warn("Legacy fallback audio failed to load:", err));
	}
	else
		legacyReady = true;

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

		// Hand off from the fallback: silence any of its lingering notes.
		if (legacyReady)
			LegacyMidiAudio.stopAllNotes();

		loaded = true;
		console.log("FluidSynth soundfont loaded.");
	})();

	return loadingPromise;
};


// Resume audio output; must be called from a user gesture (autoplay policy).
// Warms up both the FluidSynth AudioContext and the legacy fallback.
const resume = async (): Promise<void> => {
	if (audioCtx && audioCtx.state === "suspended")
		await audioCtx.resume();
	if (legacyReady && LegacyMidiAudio.WebAudio.needsWarmup?.())
		await LegacyMidiAudio.WebAudio.awaitWarmup?.();
};


// Convert an absolute performance.now()-based timestamp into a relative
// "milliseconds from now" delay for the sequencer.
const delayFromNow = (timestamp: number): number => Math.max(0, timestamp - performance.now());


const noteOn = (channel: number, note: number, velocity: number, timestamp: number): void => {
	if (seq) {
		seq.sendEventAt({type: "noteon", channel, key: note, vel: velocity}, delayFromNow(timestamp), false);
		return;
	}
	if (legacyReady)
		LegacyMidiAudio.noteOn(channel, note, velocity, timestamp);
};


const noteOff = (channel: number, note: number, timestamp: number): void => {
	if (seq) {
		seq.sendEventAt({type: "noteoff", channel, key: note}, delayFromNow(timestamp), false);
		return;
	}
	if (legacyReady)
		LegacyMidiAudio.noteOff(channel, note, timestamp);
};


const programChange = (channel: number, program: number): void => {
	if (seq) {
		seq.sendEventAt({type: "programchange", channel, preset: program}, 0, false);
		return;
	}
	if (legacyReady)
		LegacyMidiAudio.programChange(channel, program);
};


const stopAllNotes = (): void => {
	if (seq)
		seq.removeAllEvents();		// drop the in-flight look-ahead window
	if (synth) {
		for (let ch = 0; ch < 16; ++ch)
			synth.midiAllSoundsOff(ch);
	}
	if (legacyReady)
		LegacyMidiAudio.stopAllNotes();
};



export default {
	empty,
	loading,
	ready,
	loadPlugin,
	resume,
	noteOn,
	noteOff,
	programChange,
	stopAllNotes,
};
