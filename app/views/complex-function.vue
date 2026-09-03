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
			const expression = readJSON(STORAGE_KEYS.expression, DEFAULT_EXPRESSION);

			return {
				PRESETS,
				size: {width: 800, height: 600},
				expression,
				expressionInput: expression,
				error: null,
				favorites: readJSON(STORAGE_KEYS.favorites, []),
				panelIsOn: true,
				brightness: Number.isFinite(shading.brightness) ? shading.brightness : 1,
				contours: shading.contours !== false,
				grid: shading.grid !== false,
				// The complex plane window, in complex units. Height follows from the aspect ratio, so
				// the picture is never anisotropically stretched.
				center: {x: 0, y: 0},
				viewWidth: 8,
				cursor: null,
				cursorValue: null,
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
		},


		beforeUnmount () {
			this.rendererActive = false;

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
				writeJSON(STORAGE_KEYS.expression, source);
				this.updateCursorValue();
				this.requestRender();

				return true;
			},


			commitExpression () {
				const source = this.expressionInput.trim();
				if (!source || source === this.expression)
					return;

				this.updateExpression(source);
			},


			applyExpression (source) {
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
		},
	};
</script>

<style lang="scss" scoped>
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
		padding: 0.8em 1em;
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
