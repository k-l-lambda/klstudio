<template>
	<div class="complex-function" v-resize="onResize">
		<canvas ref="canvas"
			:width="size.width"
			:height="size.height"
			@mousedown.prevent="onMouseDown"
			@mousemove="onMouseMove"
			@mouseup="onMouseUp"
			@mouseleave="onMouseLeave"
			@wheel.prevent="onWheel"
			@touchstart.prevent="onTouchStart"
			@touchmove.prevent="onTouchMove"
			@touchend="onTouchEnd"
		/>
		<svg class="labels" :viewBox="`0 0 ${size.width} ${size.height}`" :width="size.width" :height="size.height">
			<g class="real">
				<text v-for="tick of realTicks" :key="`r${tick.value}`" :x="tick.x" :y="tick.y">{{tick.label}}</text>
			</g>
			<g class="imaginary">
				<text v-for="tick of imaginaryTicks" :key="`i${tick.value}`" :x="tick.x" :y="tick.y">{{tick.label}}</text>
			</g>
		</svg>
		<header>
			<div class="formula">
				<label>f(z) =</label>
				<input type="text"
					:spellcheck="false"
					autocomplete="off"
					autocapitalize="off"
					placeholder="(1+z^2)^-1"
					v-model="expressionInput"
					@input="onExpressionInput"
					@keydown.enter="commitExpression"
					@blur="commitExpression"
				/>
				<button class="favorite" :class="{on: isFavorite}"
					:title="isFavorite ? 'Remove from favorites' : 'Add to favorites'"
					@click="toggleFavorite"
				>{{isFavorite ? "&#x2605;" : "&#x2606;"}}</button>
				<button class="settings" :class="{on: panelIsOn}" title="Settings" @click="panelIsOn = !panelIsOn">&#x2699;</button>
			</div>
			<div class="error" v-if="error">{{error}}</div>
			<div class="config" v-if="panelIsOn">
				<div class="row">
					<label>examples</label>
					<div class="chips">
						<button v-for="preset of PRESETS" :key="preset.expression"
							:class="{on: preset.expression === expression}"
							:title="preset.hint"
							@click="applyExpression(preset.expression)"
						>{{preset.label}}</button>
					</div>
				</div>
				<div class="row" v-if="favorites.length">
					<label>favorites</label>
					<div class="chips">
						<button v-for="item of favorites" :key="item"
							:class="{on: item === expression}"
							@click="applyExpression(item)"
						>{{item}}<i class="drop" title="Remove" @click.stop="removeFavorite(item)">&#xd7;</i></button>
					</div>
				</div>
				<div class="row">
					<label>brightness</label>
					<input type="range" min="0.2" max="3" step="0.05" v-model.number="brightness" />
					<span class="value">{{brightness.toFixed(2)}}</span>
					<label class="check"><input type="checkbox" v-model="contours" /> contours</label>
					<label class="check"><input type="checkbox" v-model="grid" /> grid</label>
					<button class="reset" @click="resetView">reset view</button>
				</div>
			</div>
		</header>
		<footer v-if="cursor">
			<span class="item"><label>z</label><em>{{formatComplex(cursor.z)}}</em></span>
			<span class="item"><label>f(z)</label><em>{{cursorValue ? formatComplex(cursorValue) : "—"}}</em></span>
			<span class="item" v-if="cursorValue"><label>|f|</label><em>{{formatNumber(cursorAbs)}}</em></span>
			<span class="item" v-if="cursorValue"><label>arg f</label><em>{{formatNumber(cursorArg)}}&pi;</em></span>
			<span class="item scale"><label>view</label><em>{{formatNumber(viewWidth)}} wide</em></span>
		</footer>
	</div>
</template>

<script>
	import * as THREE from "three";
	import {markRaw} from "vue";
	import resize from "vue-resize-directive";

	import {parse, evaluate, compileGLSL, complexAbs, complexArg, GLSL_PRELUDE} from "../inc/complexExpression";


	const DEFAULT_EXPRESSION = "(1+z^2)^-1";

	const STORAGE_KEYS = {
		expression: "complexFunction.expression",
		favorites: "complexFunction.favorites",
		shading: "complexFunction.shading",
	};

	/**
	 * Query keys are short because they end up in a shared URL. `f` is the expression; `cx`/`cy`/`w`
	 * are the view window; `b`/`c`/`g` are the shading controls.
	 */
	const QUERY_KEYS = {
		expression: "f",
		centerX: "cx",
		centerY: "cy",
		viewWidth: "w",
		brightness: "b",
		contours: "c",
		grid: "g",
	};

	/**
	 * Leading-edge rate limit on shader rebuilds: the first change of a burst lands at once and further
	 * changes inside the window are held, so continuous typing rebuilds once per window rather than once
	 * per keystroke. A rebuild measures ~15 ms, so this bounds cost without ever making the first edit
	 * wait — plain trailing-edge debouncing would.
	 */
	const EXPRESSION_WINDOW = 600;

	/**
	 * How long a formula must stay unparseable before it is reported. Long enough that `(1+z^` on the way
	 * to `(1+z^2)^-1` never flashes an error, short enough that genuinely broken input does not sit there
	 * silently doing nothing.
	 */
	const ERROR_DELAY = 2000;

	/** Panning fires per mousemove; the address bar only needs to catch up once the gesture rests. */
	const QUERY_DEBOUNCE = 400;


	// A short tour of what domain coloring is good at: zeros, poles, branch cuts, essential
	// singularities, and the lattice of a periodic function.
	const PRESETS = [
		{label: "z", expression: "z", hint: "the identity: one zero, hue winding once"},
		{label: "z²", expression: "z^2", hint: "a double zero: hue winds twice"},
		{label: "1/z", expression: "1/z", hint: "a simple pole, hue winding backwards"},
		{label: "1/(1+z²)", expression: "(1+z^2)^-1", hint: "poles at ±i"},
		{label: "log z", expression: "log(z)", hint: "the branch cut along the negative reals"},
		{label: "√z", expression: "sqrt(z)", hint: "two sheets, one cut"},
		{label: "eᶻ", expression: "exp(z)", hint: "periodic in the imaginary direction"},
		{label: "sin z", expression: "sin(z)", hint: "zeros at every multiple of pi"},
		{label: "tan z", expression: "tan(z)", hint: "alternating zeros and poles"},
		{label: "e^(1/z)", expression: "exp(1/z)", hint: "an essential singularity at the origin"},
		{label: "Γ(z)", expression: "gamma(z)", hint: "poles at the non-positive integers"},
		{label: "Joukowsky", expression: "(z+1/z)/2", hint: "the aerofoil map"},
		{label: "rational", expression: "(z^2-1)(z-2-i)^2/(z^2+2+2i)", hint: "the Wikipedia domain-coloring example"},
	];


	const VERTEX_SHADER = `
		varying vec2 vUv;

		void main () {
			vUv = uv;
			gl_Position = vec4(position.xy, 0.0, 1.0);
		}
	`;


	/**
	 * The fragment shader is assembled per expression: the prelude supplies complex arithmetic over
	 * vec2, and the compiled body becomes the one line of `f`. Every pixel is one independent
	 * evaluation, which is the whole reason this is on the GPU.
	 *
	 * Hue carries arg f (the full turn maps to the full wheel) and lightness carries |f|, through
	 * atan so that it is 0.5 exactly at |f| = 1 and approaches black at a zero and white at a pole
	 * without ever clipping. Contours mark integer powers of 2 in modulus and twelfths of a turn in
	 * phase, which is what makes the rate of change legible rather than merely pretty.
	 */
	const buildFragmentShader = body => `
		precision highp float;

		varying vec2 vUv;

		uniform vec2 uCenter;
		uniform vec2 uSpan;
		uniform float uBrightness;
		uniform float uContours;
		uniform float uGrid;
		uniform float uGridStep;
		uniform float uPixel;

		${GLSL_PRELUDE}

		vec2 f (vec2 z) {
			return ${body};
		}

		void main () {
			vec2 z = uCenter + (vUv - 0.5) * uSpan;
			vec2 w = f(z);

			float mag = length(w);
			vec3 rgb;

			// NaN and infinity both fail this comparison, which is the portable test in GLSL ES 1.00.
			// A pole reads white, matching the limit of the lightness ramp below.
			if (!(mag < 1e30)) {
				rgb = vec3(1.0);
			}
			else {
				float hue = atan(w.y, w.x) / (2.0 * PI);
				float lightness = atan(mag * uBrightness) * (2.0 / PI);
				rgb = hsl2rgb(hue, 1.0, clamp(lightness, 0.0, 1.0));

				if (uContours > 0.5) {
					// |f| doubling: fract(log2) is 0 on each contour, so the sawtooth's distance to an
					// end marks it. Skipped where mag is 0, whose log2 is undefined.
					if (mag > 0.0) {
						float band = fract(log2(mag));
						float edge = min(band, 1.0 - band);
						rgb *= mix(0.82, 1.0, smoothstep(0.0, 0.06, edge));
					}

					// arg f in twelfths of a turn.
					float phase = fract(atan(w.y, w.x) / (2.0 * PI) * 12.0);
					float phaseEdge = min(phase, 1.0 - phase);
					rgb *= mix(0.88, 1.0, smoothstep(0.0, 0.10, phaseEdge));
				}
			}

			if (uGrid > 0.5) {
				// Lines are drawn a fixed number of pixels wide, so they stay hairline at any zoom.
				vec2 toLine = abs(fract(z / uGridStep + 0.5) - 0.5) * uGridStep;
				float line = min(toLine.x, toLine.y);
				rgb = mix(rgb, vec3(1.0), 0.16 * (1.0 - smoothstep(0.0, uPixel, line)));

				float axis = min(abs(z.x), abs(z.y));
				rgb = mix(rgb, vec3(1.0), 0.5 * (1.0 - smoothstep(0.0, uPixel * 1.2, axis)));
			}

			gl_FragColor = vec4(rgb, 1.0);
		}
	`;


	/** 1, 2 or 5 times a power of ten — the spacing that keeps roughly 8 divisions across the view. */
	const gridStepFor = span => {
		const rough = span / 8;
		const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
		const normalized = rough / magnitude;

		return (normalized >= 5 ? 5 : normalized >= 2 ? 2 : 1) * magnitude;
	};


	/**
	 * Enough significant digits to survive a deep zoom round-trip, without trailing noise in the URL.
	 * `Number.prototype.toPrecision` keeps exponential form for extremes, which parses back cleanly.
	 */
	const encodeNumber = value => {
		const text = Math.abs(value) >= 1e-6 && Math.abs(value) < 1e6 ? value.toPrecision(10) : value.toExponential(8);

		// Drop trailing zeros (and a bare trailing point) from the fixed form.
		return text.includes("e") ? text : text.replace(/\.?0+$/, "") || "0";
	};


	/**
	 * `Number("")` is 0, so a blank value has to be rejected explicitly — otherwise a bare `cy=` in the
	 * URL would silently mean the origin instead of "not specified". `accept` narrows what counts as
	 * valid: a span or a brightness may not be zero or negative, and clamping such a value would drop
	 * the viewer into an extreme zoom rather than ignoring the nonsense.
	 */
	const decodeNumber = (raw, fallback, accept = Number.isFinite) => {
		if (raw === undefined || raw === null || String(raw).trim() === "")
			return fallback;

		const value = Number(raw);

		return accept(value) ? value : fallback;
	};


	const isPositive = value => Number.isFinite(value) && value > 0;


	/**
	 * Only the words we emit, plus their obvious negations, count. A blank or unrecognised value means
	 * "not specified" and keeps the current setting, matching `decodeNumber` — silently reading `g=` or
	 * `g=maybe` as "off" would turn a typo into a state change.
	 */
	const decodeFlag = (raw, fallback) => {
		const text = String(raw === undefined || raw === null ? "" : raw).trim().toLowerCase();

		if (["1", "true", "yes", "on"].includes(text))
			return true;
		if (["0", "false", "no", "off"].includes(text))
			return false;

		return fallback;
	};


	const readJSON = (key, fallback) => {
		try {
			const raw = window.localStorage.getItem(key);

			return raw === null ? fallback : JSON.parse(raw);
		}
		catch (error) {
			console.warn("cannot read", key, error);

			return fallback;
		}
	};


	const writeJSON = (key, value) => {
		try {
			window.localStorage.setItem(key, JSON.stringify(value));
		}
		catch (error) {
			console.warn("cannot persist", key, error);
		}
	};


	const MIN_SPAN = 1e-4;
	const MAX_SPAN = 1e4;



	export default {
		name: "complex-function",


		directives: {
			resize,
		},


		data () {
			const shading = readJSON(STORAGE_KEYS.shading, {});

			// Precedence: URL query, then localStorage, then the default. A shared link has to
			// reproduce what the sender saw, so the query outranks whatever this browser had stored.
			const query = (this.$route && this.$route.query) || {};
			const expression = query[QUERY_KEYS.expression] || readJSON(STORAGE_KEYS.expression, DEFAULT_EXPRESSION);

			const brightness = query[QUERY_KEYS.brightness] !== undefined
				? Math.min(Math.max(decodeNumber(query[QUERY_KEYS.brightness], 1, isPositive), 0.2), 3)
				: (Number.isFinite(shading.brightness) ? shading.brightness : 1);

			return {
				PRESETS,
				size: {width: 800, height: 600},
				expression,
				expressionInput: expression,
				error: null,
				favorites: readJSON(STORAGE_KEYS.favorites, []),
				panelIsOn: true,
				brightness,
				contours: decodeFlag(query[QUERY_KEYS.contours], shading.contours !== false),
				grid: decodeFlag(query[QUERY_KEYS.grid], shading.grid !== false),
				// The complex plane window, in complex units. Height follows from the aspect ratio, so
				// the picture is never anisotropically stretched.
				center: {
					x: decodeNumber(query[QUERY_KEYS.centerX], 0),
					y: decodeNumber(query[QUERY_KEYS.centerY], 0),
				},
				viewWidth: Math.min(Math.max(decodeNumber(query[QUERY_KEYS.viewWidth], 8, isPositive), MIN_SPAN), MAX_SPAN),
				cursor: null,
				cursorValue: null,
				// Held while a rebuild window is open; applied when it closes.
				pendingExpression: null,
			};
		},


		computed: {
			viewHeight () {
				return this.viewWidth * this.size.height / this.size.width;
			},


			gridStep () {
				return gridStepFor(this.viewWidth);
			},


			cursorAbs () {
				return this.cursorValue ? complexAbs(this.cursorValue) : null;
			},


			/** In half-turns, so the readout reads as a multiple of pi. */
			cursorArg () {
				return this.cursorValue ? complexArg(this.cursorValue) / Math.PI : null;
			},


			isFavorite () {
				return this.favorites.includes(this.expression);
			},


			/** Bundling the shading controls gives one thing to watch for both redraw and persistence. */
			shadingState () {
				return {
					brightness: this.brightness,
					contours: this.contours,
					grid: this.grid,
				};
			},


			/**
			 * The query this view would write for its current state. Watching one computed means every
			 * control feeds the URL through a single path — a new control only has to appear here.
			 */
			urlQuery () {
				return {
					[QUERY_KEYS.expression]: this.expression,
					[QUERY_KEYS.centerX]: encodeNumber(this.center.x),
					[QUERY_KEYS.centerY]: encodeNumber(this.center.y),
					[QUERY_KEYS.viewWidth]: encodeNumber(this.viewWidth),
					[QUERY_KEYS.brightness]: encodeNumber(this.brightness),
					[QUERY_KEYS.contours]: this.contours ? "1" : "0",
					[QUERY_KEYS.grid]: this.grid ? "1" : "0",
				};
			},


			/** Tick labels for the real axis, pinned to the axis but kept inside the canvas. */
			realTicks () {
				return this.ticksAlong("real");
			},


			imaginaryTicks () {
				return this.ticksAlong("imaginary");
			},
		},


		mounted () {
			this.initializeRenderer();
			this.updateExpression(this.expression);

			this.rendererActive = true;
			this.requestRender();

			// The watcher only fires on change, so a visit that lands on a bare URL would leave the
			// address bar empty until some control moved — and a link copied right away would carry
			// none of what the viewer is actually showing.
			this.syncQuery();
		},


		beforeUnmount () {
			this.rendererActive = false;

			this.clearExpressionTimer();
			if (this.queryTimer)
				clearTimeout(this.queryTimer);

			if (this.frameHandle)
				cancelAnimationFrame(this.frameHandle);

			// A WebGL context is a scarce resource; leaving it to the GC can starve later views.
			if (this.material)
				this.material.dispose();
			if (this.quad)
				this.quad.geometry.dispose();
			if (this.renderer)
				this.renderer.dispose();
		},


		methods: {
			initializeRenderer () {
				this.renderer = markRaw(new THREE.WebGLRenderer({canvas: this.$refs.canvas, antialias: false}));
				this.renderer.setSize(this.size.width, this.size.height, false);

				this.scene = markRaw(new THREE.Scene());
				// The vertex shader writes clip space directly, so the camera is a formality.
				this.camera = markRaw(new THREE.Camera());

				this.uniforms = markRaw({
					uCenter: {value: new THREE.Vector2(0, 0)},
					uSpan: {value: new THREE.Vector2(8, 6)},
					uBrightness: {value: this.brightness},
					uContours: {value: this.contours ? 1 : 0},
					uGrid: {value: this.grid ? 1 : 0},
					uGridStep: {value: 1},
					uPixel: {value: 0.01},
				});

				this.quad = markRaw(new THREE.Mesh(new THREE.PlaneGeometry(2, 2)));
				this.scene.add(this.quad);
			},


			/**
			 * Rebuild the shader for a new expression. A compile failure is reported and the previous
			 * material is kept, so a half-typed formula never blanks the plot.
			 */
			updateExpression (source) {
				let body;
				try {
					body = compileGLSL(source);
					this.tree = parse(source);
				}
				catch (error) {
					this.error = error.message;

					return false;
				}

				const material = markRaw(new THREE.ShaderMaterial({
					uniforms: this.uniforms,
					vertexShader: VERTEX_SHADER,
					fragmentShader: buildFragmentShader(body),
				}));

				const previous = this.material;
				this.material = material;
				this.quad.material = material;

				// A GLSL error surfaces only at compile time, which three.js defers to the first render.
				// Force it here so a bad shader is reported rather than silently drawing nothing.
				try {
					this.renderer.compile(this.scene, this.camera);
				}
				catch (error) {
					console.warn("shader compilation failed for", source, error);
					this.error = "cannot render this expression";
					this.material = previous;
					this.quad.material = previous;
					material.dispose();

					return false;
				}

				if (previous)
					previous.dispose();

				this.error = null;
				this.expression = source;
				// What the GPU is running, so the input path can tell a real change from a cosmetic one.
				this.shaderBody = body;
				writeJSON(STORAGE_KEYS.expression, source);
				this.updateCursorValue();
				this.requestRender();

				return true;
			},


			/**
			 * Live editing. Compiling is ~0.1 ms, so every keystroke is compiled rather than guessed
			 * about: only input that actually parses AND yields a shader body different from the one on
			 * the GPU is worth rate limiting. Anything else — half-typed, or a purely cosmetic edit like
			 * `z ^ 2` for `z^2` — costs nothing and starts no timer.
			 */
			onExpressionInput () {
				const source = this.expressionInput.trim();

				let body;
				try {
					body = source ? compileGLSL(source) : null;
				}
				catch (error) {
					// Mid-formula. Say nothing yet, but do not stay silent forever if the user stops here.
					this.armErrorReport(error.message);

					return;
				}

				this.clearErrorTimer();

				if (!body || body === this.shaderBody) {
					// The GPU is already showing this. Drop any stale complaint about earlier input.
					this.error = null;

					return;
				}

				// Inside an open window a rebuild is deferred; otherwise it happens now.
				if (this.expressionTimer)
					this.pendingExpression = source;
				else
					this.applyAndHold(source);
			},


			/** Rebuild now, then hold the window open so a fast typist cannot rebuild per keystroke. */
			applyAndHold (source) {
				this.pendingExpression = null;
				this.updateExpression(source);

				this.expressionTimer = setTimeout(() => {
					this.expressionTimer = null;

					const pending = this.pendingExpression;
					this.pendingExpression = null;

					// Reopens the window, so continuous typing stays rate limited rather than catching up
					// in a burst once the first window closes.
					if (pending && pending !== this.expression)
						this.applyAndHold(pending);
				}, EXPRESSION_WINDOW);
			},


			armErrorReport (message) {
				this.clearErrorTimer();
				this.errorTimer = setTimeout(() => {
					this.errorTimer = null;
					this.error = message;
				}, ERROR_DELAY);
			},


			clearErrorTimer () {
				if (this.errorTimer) {
					clearTimeout(this.errorTimer);
					this.errorTimer = null;
				}
			},


			/** Drop every deferred effect of typing, so an explicit choice cannot be overwritten later. */
			clearExpressionTimer () {
				if (this.expressionTimer) {
					clearTimeout(this.expressionTimer);
					this.expressionTimer = null;
				}

				this.pendingExpression = null;
				this.clearErrorTimer();
			},


			/**
			 * Enter and blur mean "I am done": apply at once, bypassing the window, and report a bad
			 * formula immediately rather than after the error delay.
			 */
			commitExpression () {
				this.clearExpressionTimer();

				const source = this.expressionInput.trim();
				if (!source || source === this.expression)
					return;

				this.applyAndHold(source);
			},


			/**
			 * Mirror the current state into the hash query, debounced: a pan updates `center` on every
			 * mousemove and the address bar only needs the resting value. `replace` rather than `push`
			 * so dragging the plot does not bury the back button under history entries.
			 */
			syncQuery () {
				if (this.queryTimer)
					clearTimeout(this.queryTimer);

				this.queryTimer = setTimeout(() => {
					this.queryTimer = null;

					const current = this.$route.query;
					const mine = this.urlQuery;
					if (Object.keys(mine).every(key => current[key] === mine[key]))
						return;

					// Keys this view does not own are carried through rather than dropped.
					this.$router.replace({path: this.$route.path, query: {...current, ...mine}})
						.catch(error => {
							// A redundant navigation is not an error worth surfacing.
							if (!error || error.name !== "NavigationDuplicated")
								console.warn("cannot sync the URL query", error);
						});
				}, QUERY_DEBOUNCE);
			},


			/** Adopt state from the query — back/forward, or a hand-edited URL. */
			applyQuery (query) {
				const expression = query[QUERY_KEYS.expression];
				if (expression && expression !== this.expression) {
					this.expressionInput = expression;
					this.clearExpressionTimer();
					this.updateExpression(expression);
				}

				const cx = decodeNumber(query[QUERY_KEYS.centerX], this.center.x);
				const cy = decodeNumber(query[QUERY_KEYS.centerY], this.center.y);
				if (cx !== this.center.x || cy !== this.center.y)
					this.center = {x: cx, y: cy};

				const width = Math.min(Math.max(decodeNumber(query[QUERY_KEYS.viewWidth], this.viewWidth, isPositive), MIN_SPAN), MAX_SPAN);
				if (width !== this.viewWidth)
					this.viewWidth = width;

				this.brightness = Math.min(Math.max(decodeNumber(query[QUERY_KEYS.brightness], this.brightness, isPositive), 0.2), 3);
				this.contours = decodeFlag(query[QUERY_KEYS.contours], this.contours);
				this.grid = decodeFlag(query[QUERY_KEYS.grid], this.grid);

				this.requestRender();
			},


			applyExpression (source) {
				// An explicit pick outranks whatever was typed a moment ago and is still held.
				this.clearExpressionTimer();

				this.expressionInput = source;
				this.updateExpression(source);
			},


			requestRender () {
				if (this.frameHandle || !this.rendererActive)
					return;

				this.frameHandle = requestAnimationFrame(() => {
					this.frameHandle = null;
					this.draw();
				});
			},


			draw () {
				if (!this.renderer || !this.material)
					return;

				this.uniforms.uCenter.value.set(this.center.x, this.center.y);
				this.uniforms.uSpan.value.set(this.viewWidth, this.viewHeight);
				this.uniforms.uBrightness.value = this.brightness;
				this.uniforms.uContours.value = this.contours ? 1 : 0;
				this.uniforms.uGrid.value = this.grid ? 1 : 0;
				this.uniforms.uGridStep.value = this.gridStep;
				this.uniforms.uPixel.value = this.viewWidth / Math.max(this.size.width, 1);

				this.renderer.render(this.scene, this.camera);
			},


			/** Canvas offset -> complex plane. The imaginary axis points up, as it should. */
			pointToComplex (offsetX, offsetY) {
				return {
					re: this.center.x + (offsetX / this.size.width - 0.5) * this.viewWidth,
					im: this.center.y - (offsetY / this.size.height - 0.5) * this.viewHeight,
				};
			},


			complexToPoint (re, im) {
				return {
					x: (re - this.center.x) / this.viewWidth * this.size.width + this.size.width / 2,
					y: this.size.height / 2 - (im - this.center.y) / this.viewHeight * this.size.height,
				};
			},


			ticksAlong (axis) {
				const step = this.gridStep;
				const ticks = [];

				const [low, high] = axis === "real"
					? [this.center.x - this.viewWidth / 2, this.center.x + this.viewWidth / 2]
					: [this.center.y - this.viewHeight / 2, this.center.y + this.viewHeight / 2];

				const first = Math.ceil(low / step);
				const last = Math.floor(high / step);

				// Guard against a pathological step; the loop below is bounded by the view either way.
				if (!Number.isFinite(first) || !Number.isFinite(last) || last - first > 200)
					return ticks;

				for (let n = first; n <= last; ++n) {
					if (n === 0)
						continue;

					const value = n * step;
					const point = axis === "real" ? this.complexToPoint(value, this.center.y) : this.complexToPoint(this.center.x, value);
					const zero = this.complexToPoint(0, 0);

					ticks.push({
						value,
						// Labels ride their own axis while it is on screen, and stick to the edge once it
						// scrolls off, so the scale stays readable when the origin is panned away.
						x: axis === "real" ? point.x : Math.min(Math.max(zero.x + 6, 4), this.size.width - 40),
						y: axis === "real" ? Math.min(Math.max(zero.y + 14, 14), this.size.height - 6) : point.y - 4,
						label: this.formatTick(value, step, axis),
					});
				}

				return ticks;
			},


			formatTick (value, step, axis) {
				const digits = Math.max(0, Math.min(6, -Math.floor(Math.log10(step))));
				const text = value.toFixed(digits);

				return axis === "real" ? text : `${text}i`;
			},


			formatNumber (value) {
				if (value === null || value === undefined || !Number.isFinite(value))
					return "∞";

				const magnitude = Math.abs(value);
				if (magnitude !== 0 && (magnitude < 1e-4 || magnitude >= 1e5))
					return value.toExponential(3);

				return value.toFixed(4);
			},


			formatComplex (value) {
				if (!Number.isFinite(value.re) || !Number.isFinite(value.im))
					return "∞";

				const sign = value.im < 0 ? "−" : "+";

				return `${this.formatNumber(value.re)} ${sign} ${this.formatNumber(Math.abs(value.im))}i`;
			},


			updateCursorValue () {
				if (!this.cursor || !this.tree) {
					this.cursorValue = null;

					return;
				}

				try {
					this.cursorValue = evaluate(this.tree, {re: this.cursor.z.re, im: this.cursor.z.im});
				}
				catch (error) {
					this.cursorValue = null;
				}
			},


			onResize () {
				this.size = {
					width: Math.max(this.$el.clientWidth, 1),
					height: Math.max(this.$el.clientHeight, 1),
				};

				if (this.renderer) {
					this.renderer.setSize(this.size.width, this.size.height, false);
					this.requestRender();
				}
			},


			onMouseDown (event) {
				this.dragging = {
					x: event.offsetX,
					y: event.offsetY,
					center: {...this.center},
				};
			},


			onMouseMove (event) {
				if (this.dragging) {
					// Pan by the complex-plane distance the pointer has travelled since mousedown.
					const dx = (event.offsetX - this.dragging.x) / this.size.width * this.viewWidth;
					const dy = (event.offsetY - this.dragging.y) / this.size.height * this.viewHeight;

					this.center = {
						x: this.dragging.center.x - dx,
						y: this.dragging.center.y + dy,
					};
				}

				this.cursor = {z: this.pointToComplex(event.offsetX, event.offsetY)};
				this.updateCursorValue();
				this.requestRender();
			},


			onMouseUp () {
				this.dragging = null;
			},


			onMouseLeave () {
				this.dragging = null;
				this.cursor = null;
				this.cursorValue = null;
			},


			onWheel (event) {
				// Zoom about the cursor: the complex point under the pointer stays put.
				const anchor = this.pointToComplex(event.offsetX, event.offsetY);
				const factor = Math.exp(event.deltaY * 1e-3);
				const width = Math.min(Math.max(this.viewWidth * factor, MIN_SPAN), MAX_SPAN);
				const ratio = width / this.viewWidth;

				this.center = {
					x: anchor.re + (this.center.x - anchor.re) * ratio,
					y: anchor.im + (this.center.y - anchor.im) * ratio,
				};
				this.viewWidth = width;

				this.updateCursorValue();
				this.requestRender();
			},


			touchToOffset (touch) {
				const rect = this.$refs.canvas.getBoundingClientRect();

				return {offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top};
			},


			touchSpread (touches) {
				return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
			},


			onTouchStart (event) {
				if (event.touches.length === 1)
					this.onMouseDown(this.touchToOffset(event.touches[0]));
				else if (event.touches.length === 2) {
					this.dragging = null;
					this.pinch = {spread: this.touchSpread(event.touches), width: this.viewWidth};
				}
			},


			onTouchMove (event) {
				if (event.touches.length === 1 && this.dragging)
					this.onMouseMove(this.touchToOffset(event.touches[0]));
				else if (event.touches.length === 2 && this.pinch) {
					const spread = this.touchSpread(event.touches);
					if (spread > 0) {
						this.viewWidth = Math.min(Math.max(this.pinch.width * this.pinch.spread / spread, MIN_SPAN), MAX_SPAN);
						this.requestRender();
					}
				}
			},


			onTouchEnd () {
				this.dragging = null;
				this.pinch = null;
			},


			resetView () {
				this.center = {x: 0, y: 0};
				this.viewWidth = 8;
				this.requestRender();
			},


			toggleFavorite () {
				if (this.isFavorite)
					this.removeFavorite(this.expression);
				else
					this.favorites = [...this.favorites, this.expression];
			},


			removeFavorite (item) {
				this.favorites = this.favorites.filter(entry => entry !== item);
			},
		},


		watch: {
			favorites: {
				handler (value) {
					writeJSON(STORAGE_KEYS.favorites, value);
				},
				deep: true,
			},


			size: "requestRender",


			shadingState (value) {
				writeJSON(STORAGE_KEYS.shading, value);
				this.requestRender();
			},


			// Any control that reaches the URL passes through urlQuery, so one watcher covers them all.
			urlQuery: {
				handler () {
					this.syncQuery();
				},
				deep: true,
			},


			/**
			 * The other direction: back/forward, or a URL the user edited by hand.
			 *
			 * The guard is a value comparison rather than an "am I writing" flag: our own replace()
			 * produces a query that already equals urlQuery, so it is filtered here without depending on
			 * how the router's promise and this watcher interleave.
			 */
			$route (to) {
				const query = to.query || {};
				if (Object.keys(this.urlQuery).every(key => query[key] === this.urlQuery[key]))
					return;

				this.applyQuery(query);
			},
		},
	};
</script>

<style lang="scss" scoped>
	// The host page keeps a logo (and, in the inner viewer, the route box) pinned to the top-left
	// corner, so the header indents past it. Same value home.vue uses to clear the logo with its title.
	$logoSize: 46px;


	.complex-function
	{
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		background: #111;
		font-family: Verdana, Arial, Helvetica, sans-serif;
		color: #eee;
	}

	canvas
	{
		display: block;
		cursor: crosshair;
	}

	.labels
	{
		position: absolute;
		left: 0;
		top: 0;
		pointer-events: none;

		text
		{
			font-size: 10px;
			fill: #fff;
			opacity: 0.75;
			text-anchor: middle;
			paint-order: stroke;
			stroke: #0008;
			stroke-width: 2.4px;
			user-select: none;
		}

		.imaginary text
		{
			text-anchor: start;
		}
	}

	header
	{
		position: absolute;
		left: 0;
		top: 0;
		right: 0;
		padding: 0.8em 1em 0.8em calc(#{$logoSize} + 0.5em);
		background: linear-gradient(#000a, #0000);
	}

	.formula
	{
		display: flex;
		align-items: center;
		gap: 0.5em;

		label
		{
			font-style: italic;
			opacity: 0.8;
		}

		input[type=text]
		{
			flex: 0 1 24em;
			padding: 0.35em 0.6em;
			border: 1px solid #fff3;
			border-radius: 3px;
			background: #0007;
			color: #fff;
			font-family: "Courier New", Courier, monospace;
			font-size: 15px;

			&:focus
			{
				outline: none;
				border-color: #6cf;
			}
		}
	}

	button
	{
		border: 1px solid #fff3;
		border-radius: 3px;
		background: #0007;
		color: #ddd;
		cursor: pointer;
		font-size: 13px;
		padding: 0.3em 0.6em;

		&:hover
		{
			border-color: #6cf;
			color: #fff;
		}

		&.on
		{
			border-color: #6cf;
			color: #6cf;
		}
	}

	button.favorite
	{
		font-size: 16px;
		line-height: 1;

		&.on
		{
			color: #fc3;
			border-color: #fc3;
		}
	}

	.error
	{
		margin-top: 0.5em;
		color: #f88;
		font-size: 12px;
		font-family: "Courier New", Courier, monospace;
	}

	.config
	{
		margin-top: 0.7em;
		font-size: 12px;

		.row
		{
			display: flex;
			align-items: center;
			gap: 0.6em;
			margin-bottom: 0.5em;

			& > label
			{
				flex: 0 0 5.5em;
				opacity: 0.7;
				text-transform: uppercase;
				letter-spacing: 0.05em;
				font-size: 10px;
			}
		}

		.chips
		{
			display: flex;
			flex-wrap: wrap;
			gap: 0.35em;

			button
			{
				font-family: "Courier New", Courier, monospace;
			}
		}

		.drop
		{
			margin-left: 0.5em;
			font-style: normal;
			opacity: 0.5;

			&:hover
			{
				opacity: 1;
				color: #f88;
			}
		}

		.check
		{
			flex: 0 0 auto;
			opacity: 0.85;
			cursor: pointer;
		}

		.value
		{
			flex: 0 0 3em;
			font-family: "Courier New", Courier, monospace;
			opacity: 0.7;
		}
	}

	footer
	{
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 0.6em 1em;
		background: linear-gradient(#0000, #000a);
		font-size: 12px;
		display: flex;
		flex-wrap: wrap;
		gap: 1.4em;
		pointer-events: none;

		.item label
		{
			opacity: 0.6;
			margin-right: 0.45em;
			font-style: italic;
		}

		em
		{
			font-style: normal;
			font-family: "Courier New", Courier, monospace;
		}
	}
</style>
