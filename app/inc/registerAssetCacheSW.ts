// Registers the static asset cache service worker (public/asset-cache-sw.js). The worker caches large
// fixed-path assets (soundfont, chess opening libraries, FluidSynth/OpenCV wasm — see its RULES table)
// so each downloads once per browser. Registration is best-effort: it silently no-ops when service
// workers are unavailable (older browsers, or a non-secure http:// context) and never throws, so the
// callers (e.g. audio init) are unaffected either way.

let registered: Promise<void> | null = null;

export const registerAssetCacheSW = (): Promise<void> => {
	// Idempotent: register at most once per page; repeat calls reuse the same promise.
	if (registered)
		return registered;

	registered = (async () => {
		if (typeof navigator === "undefined" || !("serviceWorker" in navigator))
			return;
		try {
			const base = import.meta.env.BASE_URL || "/";
			// The worker sits at the app base path, so its default scope already covers every asset path
			// (soundfont/, chess/, fluid/, opencv…) — no Service-Worker-Allowed header needed (works on
			// GitHub Pages subpaths).
			await navigator.serviceWorker.register(`${base}asset-cache-sw.js`, {scope: base});
		}
		catch (error) {
			// Non-fatal: caching is an optimization, not a requirement.
			console.warn("Asset cache service worker registration failed:", error);
		}
	})();

	return registered;
};
