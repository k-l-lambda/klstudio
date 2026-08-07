// Static asset cache service worker.
//
// Caches large, fixed-path (non-fingerprinted) static assets in the Cache Storage API with a
// cache-first strategy, so each downloads once per browser and is served locally thereafter. It
// intercepts ONLY the assets configured in RULES below — navigation, hashed JS/CSS and every other
// request fall through to the network untouched, so it can't interfere with hash-routing or the
// normal caching of fingerprinted assets.
//
// To cache a new asset: add a rule to RULES. Each rule gets its OWN cache bucket
// (klstudio-asset-<name>-<version>); bump a rule's `version` to invalidate just that bucket. Only
// large, fixed-path assets belong here — do NOT add Vite-bundled `assets/*-<hash>.js` files, they
// are fingerprinted and cached by URL already.

const CACHE_PREFIX = "klstudio-asset-";

const RULES = [
	// General MIDI soundfont (~38 MB) — spiral-piano / lotus audio.
	{name: "soundfont", version: "v1", match: (p) => /\/soundfont\/gm\.sf3$/.test(p) || /\.sf[23]$/.test(p)},
	// Chess opening analysis libraries (~17 MB total) — chess-lab.
	{name: "chess-openings", version: "v1", match: (p) => /\/chess\/open-games\/[3-7]\.yaml$/.test(p)},
	// FluidSynth WASM runtime (~2.3 MB) — audio worklet.
	{name: "fluidsynth", version: "v1", match: (p) => /\/fluid\/libfluidsynth-.*\.js$/.test(p)},
	// OpenCV wasm (~1.2 MB) — hexiamond photo recognition.
	{name: "opencv", version: "v1", match: (p) => /\/opencv(\.min)?\.wasm$/.test(p)},
];

const cacheNameFor = (rule) => `${CACHE_PREFIX}${rule.name}-${rule.version}`;

const ruleFor = (url) => {
	if (url.origin !== self.location.origin)
		return null;
	return RULES.find(rule => rule.match(url.pathname)) || null;
};

self.addEventListener("install", () => {
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil((async () => {
		const valid = new Set(RULES.map(cacheNameFor));
		const keys = await caches.keys();
		await Promise.all(keys
			// Drop stale/removed asset buckets, and the legacy soundfont-only SW's caches.
			.filter(key => (key.startsWith(CACHE_PREFIX) && !valid.has(key)) || key.startsWith("klstudio-soundfont-"))
			.map(key => caches.delete(key)));
		await self.clients.claim();
	})());
});

self.addEventListener("fetch", (event) => {
	const request = event.request;
	if (request.method !== "GET")
		return;
	let url;
	try {
		url = new URL(request.url);
	}
	catch (error) {
		void error;
		return;
	}
	const rule = ruleFor(url);
	if (!rule)
		return;		// Not a configured asset: let the browser handle it normally.

	event.respondWith((async () => {
		const cache = await caches.open(cacheNameFor(rule));
		const cached = await cache.match(request);
		if (cached)
			return cached;
		// Miss: fetch from network, store a clone on success, and return the response.
		const response = await fetch(request);
		if (response && response.ok && response.type !== "opaque") {
			// Keep the worker alive until the (large) write finishes; a fire-and-forget put can be
			// dropped when the worker is terminated after the event, leaving the cache empty.
			event.waitUntil(cache.put(request, response.clone()));
		}
		return response;
	})());
});
