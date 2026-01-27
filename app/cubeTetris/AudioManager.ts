/**
 * Cube Tetris - Audio Manager
 * Handles game sound effects
 */

// Import sound files
import brickFreezeUrl from "../assets/cube-tetris/brick-freeze.wav";
import gameOverUrl from "../assets/cube-tetris/game-over.wav";
import layerClearUrl from "../assets/cube-tetris/layer-clear.wav";

export type SoundType = "brickFreeze" | "gameOver" | "layerClear";

interface SoundConfig {
	url: string;
	volume: number;
}

const SOUND_CONFIG: Record<SoundType, SoundConfig> = {
	brickFreeze: {url: brickFreezeUrl, volume: 0.5},
	gameOver: {url: gameOverUrl, volume: 0.6},
	layerClear: {url: layerClearUrl, volume: 0.5},
};


/**
 * AudioManager - Manages game sound effects
 */
export class AudioManager {
	private sounds: Map<SoundType, HTMLAudioElement> = new Map();
	private _muted: boolean = false;
	private _masterVolume: number = 1.0;
	private _initialized: boolean = false;


	constructor () {
		// Preload all sounds
		this.preloadSounds();
	}


	/**
	 * Preload all sound files
	 */
	private preloadSounds (): void {
		for (const [name, config] of Object.entries(SOUND_CONFIG)) {
			const audio = new Audio(config.url);
			audio.preload = "auto";
			audio.volume = config.volume * this._masterVolume;
			this.sounds.set(name as SoundType, audio);
		}
		this._initialized = true;
	}


	/**
	 * Play a sound effect
	 */
	play (sound: SoundType): void {
		if (this._muted || !this._initialized) return;

		const audio = this.sounds.get(sound);
		if (!audio) return;

		// Clone the audio to allow overlapping sounds
		const clone = audio.cloneNode() as HTMLAudioElement;
		clone.volume = SOUND_CONFIG[sound].volume * this._masterVolume;
		clone.play().catch(() => {
			// Ignore play errors (e.g., user hasn't interacted with page yet)
		});
	}


	/**
	 * Get/set muted state
	 */
	get muted (): boolean {
		return this._muted;
	}

	set muted (value: boolean) {
		this._muted = value;
	}


	/**
	 * Toggle mute state
	 */
	toggleMute (): boolean {
		this._muted = !this._muted;
		return this._muted;
	}


	/**
	 * Get/set master volume (0.0 - 1.0)
	 */
	get masterVolume (): number {
		return this._masterVolume;
	}

	set masterVolume (value: number) {
		this._masterVolume = Math.max(0, Math.min(1, value));

		// Update volume on all preloaded sounds
		for (const [name, audio] of this.sounds) 
			audio.volume = SOUND_CONFIG[name].volume * this._masterVolume;
		
	}


	/**
	 * Dispose of audio resources
	 */
	dispose (): void {
		for (const audio of this.sounds.values()) {
			audio.pause();
			audio.src = "";
		}
		this.sounds.clear();
		this._initialized = false;
	}
}
