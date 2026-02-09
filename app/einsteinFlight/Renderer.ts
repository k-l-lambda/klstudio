// WebGL renderer for star field + Canvas 2D overlay for ship & HUD

import {Game, TransformedStar, C} from "./Game";
import type {InputState} from "./Game";


// ── Shader sources ──────────────────────────────────────────────

const VERT_SRC = `
attribute vec3 aPosition;
attribute vec4 aColor;
attribute float aSize;

uniform mat4 uVP;
uniform float uViewH;

varying vec4 vColor;

void main() {
	gl_Position = uVP * vec4(aPosition, 1.0);
	// Perspective-scaled point size: base size × (viewH / clipW) for consistent screen px
	gl_PointSize = aSize * (uViewH * 0.5) / gl_Position.w;
	// Clamp to reasonable range
	gl_PointSize = clamp(gl_PointSize, 1.0, 64.0);
	vColor = aColor;
}
`;

const FRAG_SRC = `
precision mediump float;
varying vec4 vColor;

void main() {
	// Radial falloff from center of point sprite
	vec2 c = gl_PointCoord - 0.5;
	float r = length(c) * 2.0; // 0 at center, 1 at edge
	if (r > 1.0) discard;

	// Bright core + soft glow falloff
	float core = exp(-r * r * 4.0);   // bright center
	float glow = exp(-r * r * 1.2);   // wide soft halo
	float alpha = mix(glow, core, 0.5);

	// Boost brightness — saturate core toward white
	vec3 col = mix(vColor.rgb, vec3(1.0), core * 0.5);
	gl_FragColor = vec4(col, vColor.a * alpha);
}
`;


// ── Matrix helpers ──────────────────────────────────────────────

type Mat4 = Float32Array;

function mat4Multiply (a: Mat4, b: Mat4): Mat4 {
	const out = new Float32Array(16);
	for (let i = 0; i < 4; i++) {
		for (let j = 0; j < 4; j++) {
			out[j * 4 + i] =
				a[i] * b[j * 4] +
				a[4 + i] * b[j * 4 + 1] +
				a[8 + i] * b[j * 4 + 2] +
				a[12 + i] * b[j * 4 + 3];
		}
	}
	return out;
}

function mat4Perspective (fovY: number, aspect: number, near: number, far: number): Mat4 {
	const f = 1 / Math.tan(fovY / 2);
	const nf = 1 / (near - far);
	const m = new Float32Array(16);
	m[0] = f / aspect;
	m[5] = f;
	m[10] = (far + near) * nf;
	m[11] = -1;
	m[14] = 2 * far * near * nf;
	return m;
}

function mat4LookAt (eyeX: number, eyeY: number, eyeZ: number,
	centerX: number, centerY: number, centerZ: number,
	upX: number, upY: number, upZ: number): Mat4 {
	// Forward = normalize(center - eye)
	let fx = centerX - eyeX, fy = centerY - eyeY, fz = centerZ - eyeZ;
	let len = Math.sqrt(fx * fx + fy * fy + fz * fz);
	fx /= len; fy /= len; fz /= len;

	// Side = normalize(forward × up)
	let sx = fy * upZ - fz * upY;
	let sy = fz * upX - fx * upZ;
	let sz = fx * upY - fy * upX;
	len = Math.sqrt(sx * sx + sy * sy + sz * sz);
	sx /= len; sy /= len; sz /= len;

	// Recomputed up = side × forward
	const ux = sy * fz - sz * fy;
	const uy = sz * fx - sx * fz;
	const uz = sx * fy - sy * fx;

	const m = new Float32Array(16);
	m[0] = sx;  m[1] = ux;  m[2] = -fx; m[3] = 0;
	m[4] = sy;  m[5] = uy;  m[6] = -fy; m[7] = 0;
	m[8] = sz;  m[9] = uz;  m[10] = -fz; m[11] = 0;
	m[12] = -(sx * eyeX + sy * eyeY + sz * eyeZ);
	m[13] = -(ux * eyeX + uy * eyeY + uz * eyeZ);
	m[14] = -(-fx * eyeX + -fy * eyeY + -fz * eyeZ);
	m[15] = 1;
	return m;
}


// ── WebGL helpers ───────────────────────────────────────────────

function compileShader (gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
	const s = gl.createShader(type)!;
	gl.shaderSource(s, src);
	gl.compileShader(s);
	if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
		const info = gl.getShaderInfoLog(s);
		gl.deleteShader(s);
		throw new Error("Shader compile error: " + info);
	}
	return s;
}

function createProgram (gl: WebGLRenderingContext, vs: WebGLShader, fs: WebGLShader): WebGLProgram {
	const p = gl.createProgram()!;
	gl.attachShader(p, vs);
	gl.attachShader(p, fs);
	gl.linkProgram(p);
	if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
		const info = gl.getProgramInfoLog(p);
		gl.deleteProgram(p);
		throw new Error("Program link error: " + info);
	}
	return p;
}


// ── Renderer ────────────────────────────────────────────────────

const FOV = 30 * Math.PI / 180; // 30° vertical FoV
const CAMERA_Z = 2000; // Camera below flight plane — looking up through star field
const NEAR = 500;
const FAR = 5000;

export class Renderer {
	private glCanvas: HTMLCanvasElement;
	private gl: WebGLRenderingContext;
	private overlayCanvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;

	private width = 0;
	private height = 0;
	private dpr = 1;
	private rafId = 0;

	// WebGL resources
	private program: WebGLProgram;
	private vsShader: WebGLShader;
	private fsShader: WebGLShader;
	private posBuf: WebGLBuffer;
	private colorBuf: WebGLBuffer;
	private sizeBuf: WebGLBuffer;
	private aPosition: number;
	private aColor: number;
	private aSize: number;
	private uVP: WebGLUniformLocation;
	private uViewH: WebGLUniformLocation;

	// Reusable typed arrays (grown as needed)
	private posArr = new Float32Array(0);
	private colorArr = new Float32Array(0);
	private sizeArr = new Float32Array(0);

	constructor (canvas: HTMLCanvasElement) {
		this.glCanvas = canvas;

		// Get WebGL context
		const gl = canvas.getContext("webgl", {alpha: false, antialias: false})!;
		this.gl = gl;

		// Create overlay canvas for ship + HUD
		this.overlayCanvas = document.createElement("canvas");
		this.overlayCanvas.style.position = "absolute";
		this.overlayCanvas.style.top = "0";
		this.overlayCanvas.style.left = "0";
		this.overlayCanvas.style.width = "100%";
		this.overlayCanvas.style.height = "100%";
		this.overlayCanvas.style.pointerEvents = "none";
		canvas.parentElement!.appendChild(this.overlayCanvas);
		this.ctx = this.overlayCanvas.getContext("2d")!;

		// Compile shaders + link program
		this.vsShader = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
		this.fsShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
		this.program = createProgram(gl, this.vsShader, this.fsShader);

		// Attribute locations
		this.aPosition = gl.getAttribLocation(this.program, "aPosition");
		this.aColor = gl.getAttribLocation(this.program, "aColor");
		this.aSize = gl.getAttribLocation(this.program, "aSize");

		// Uniform locations
		this.uVP = gl.getUniformLocation(this.program, "uVP")!;
		this.uViewH = gl.getUniformLocation(this.program, "uViewH")!;

		// Create buffers
		this.posBuf = gl.createBuffer()!;
		this.colorBuf = gl.createBuffer()!;
		this.sizeBuf = gl.createBuffer()!;

		this.resize();
	}

	resize (): void {
		this.dpr = window.devicePixelRatio || 1;
		const rect = this.glCanvas.parentElement?.getBoundingClientRect();
		if (!rect) return;

		this.width = rect.width;
		this.height = rect.height;

		const pw = this.width * this.dpr;
		const ph = this.height * this.dpr;

		// Resize WebGL canvas
		this.glCanvas.width = pw;
		this.glCanvas.height = ph;
		this.glCanvas.style.width = `${this.width}px`;
		this.glCanvas.style.height = `${this.height}px`;
		this.gl.viewport(0, 0, pw, ph);

		// Resize overlay canvas
		this.overlayCanvas.width = pw;
		this.overlayCanvas.height = ph;
		this.overlayCanvas.style.width = `${this.width}px`;
		this.overlayCanvas.style.height = `${this.height}px`;
		this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
	}

	render (game: Game): void {
		const w = this.width;
		const h = this.height;

		// ── 1. Build view-projection matrix ──
		const cosH = Math.cos(game.heading);
		const sinH = Math.sin(game.heading);
		const view = mat4LookAt(
			0, 0, -CAMERA_Z, // eye below flight plane
			0, 0, 0, // look at ship position
			cosH, sinH, 0, // up = heading direction → screen Y+
		);
		const aspect = w / h;
		const proj = mat4Perspective(FOV, aspect, NEAR, FAR);
		const vp = mat4Multiply(proj, view);

		// ── 2. Get 3D star data ──
		const stars = game.getVisibleStars(w, h);

		// ── 3. Render stars with WebGL ──
		this.renderStarsGL(stars, vp, h);

		// ── 4. Overlay: ship + HUD ──
		const ctx = this.ctx;
		ctx.clearRect(0, 0, w, h);
		this.drawShip(ctx, w / 2, h / 2);
		this.drawHUD(ctx, game);
	}

	private renderStarsGL (stars: TransformedStar[], vp: Mat4, viewH: number): void {
		const gl = this.gl;
		const n = stars.length;

		// Ensure typed arrays are large enough
		if (this.posArr.length < n * 3) {
			this.posArr = new Float32Array(n * 3);
			this.colorArr = new Float32Array(n * 4);
			this.sizeArr = new Float32Array(n);
		}

		const pos = this.posArr;
		const col = this.colorArr;
		const sz = this.sizeArr;

		for (let i = 0; i < n; i++) {
			const s = stars[i];
			const i3 = i * 3;
			const i4 = i * 4;
			pos[i3] = s.x;
			pos[i3 + 1] = s.y;
			pos[i3 + 2] = s.z;
			col[i4] = s.r / 255;
			col[i4 + 1] = s.g / 255;
			col[i4 + 2] = s.b / 255;
			col[i4 + 3] = s.alpha;
			sz[i] = s.radius * 12; // scale up for point sprite visibility
		}

		// Clear
		gl.clearColor(0, 0, 0, 1);
		gl.clear(gl.COLOR_BUFFER_BIT);

		if (n === 0) return;

		gl.useProgram(this.program);

		// Additive blending
		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
		gl.depthMask(false);

		// Upload uniforms
		gl.uniformMatrix4fv(this.uVP, false, vp);
		gl.uniform1f(this.uViewH, viewH * this.dpr);

		// Position buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
		gl.bufferData(gl.ARRAY_BUFFER, pos.subarray(0, n * 3), gl.DYNAMIC_DRAW);
		gl.enableVertexAttribArray(this.aPosition);
		gl.vertexAttribPointer(this.aPosition, 3, gl.FLOAT, false, 0, 0);

		// Color buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuf);
		gl.bufferData(gl.ARRAY_BUFFER, col.subarray(0, n * 4), gl.DYNAMIC_DRAW);
		gl.enableVertexAttribArray(this.aColor);
		gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, 0, 0);

		// Size buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuf);
		gl.bufferData(gl.ARRAY_BUFFER, sz.subarray(0, n), gl.DYNAMIC_DRAW);
		gl.enableVertexAttribArray(this.aSize);
		gl.vertexAttribPointer(this.aSize, 1, gl.FLOAT, false, 0, 0);

		// Draw
		gl.drawArrays(gl.POINTS, 0, n);

		// Clean up state
		gl.disable(gl.BLEND);
		gl.depthMask(true);
	}

	private drawShip (ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
		ctx.save();
		ctx.translate(cx, cy);
		// Ship always points UP (-π/2 rotation from +x axis)
		ctx.rotate(-Math.PI / 2);

		// Ship triangle — pointing right (+x direction) in local coords, which is UP on screen
		const size = 14;
		ctx.beginPath();
		ctx.moveTo(size, 0); // nose
		ctx.lineTo(-size * 0.6, -size * 0.5);
		ctx.lineTo(-size * 0.4, 0);
		ctx.lineTo(-size * 0.6, size * 0.5);
		ctx.closePath();

		// Fill with translucent cyan
		ctx.fillStyle = "rgba(0, 220, 255, 0.7)";
		ctx.fill();

		// Stroke with white
		ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
		ctx.lineWidth = 1.5;
		ctx.stroke();

		ctx.restore();
	}

	private drawHUD (ctx: CanvasRenderingContext2D, game: Game): void {
		const x = this.width - 16;
		const y = 20;
		const lineH = 20;

		ctx.save();
		ctx.font = "13px 'Courier New', monospace";
		ctx.textAlign = "right";
		ctx.fillStyle = "rgba(0, 220, 255, 0.85)";

		// Mode label
		const modeLabel = game.mode === "einstein" ? "EINSTEIN" : "GALILEO";
		ctx.fillText(modeLabel, x, y);

		if (game.mode === "einstein") {
			ctx.fillText(`v/c  ${game.beta.toFixed(4)}`, x, y + lineH);
			ctx.fillText(`\u03C6    ${game.rapidity.toFixed(3)}`, x, y + lineH * 2);
			ctx.fillText(`\u03B3    ${game.gamma.toFixed(3)}`, x, y + lineH * 3);

			// Speed bar (0 to 1c)
			const barW = 120;
			const barH = 4;
			const barX = x - barW;
			const barY = y + lineH * 4;

			ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
			ctx.fillRect(barX, barY, barW, barH);

			ctx.fillStyle = "rgba(0, 220, 255, 0.7)";
			ctx.fillRect(barX, barY, barW * game.beta, barH);
		}
		else {
			// Galilean HUD
			ctx.fillText(`v/c  ${game.beta.toFixed(4)}`, x, y + lineH);
			const rawSpeed = game.speed;
			ctx.fillText(`v    ${rawSpeed.toFixed(0)} u/s`, x, y + lineH * 2);

			// Speed bar scaled to 5c with c-threshold marker
			const barW = 120;
			const barH = 4;
			const barX = x - barW;
			const barY = y + lineH * 3;

			ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
			ctx.fillRect(barX, barY, barW, barH);

			const fillFraction = Math.min(game.speed / (C * 5), 1);
			ctx.fillStyle = game.speed > C ? "rgba(255, 160, 60, 0.8)" : "rgba(0, 220, 255, 0.7)";
			ctx.fillRect(barX, barY, barW * fillFraction, barH);

			// c-threshold marker at 1/5 of bar
			const cMarkerX = barX + barW * 0.2;
			ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
			ctx.fillRect(cMarkerX - 0.5, barY - 2, 1, barH + 4);
		}

		ctx.restore();
	}

	startLoop (game: Game, inputState: InputState, onFrame?: () => void): void {
		let lastTime = 0;

		const loop = (time: number) => {
			this.rafId = requestAnimationFrame(loop);

			if (lastTime === 0) {
				lastTime = time;
				return;
			}

			const dt = Math.min((time - lastTime) / 1000, 0.05);
			lastTime = time;

			game.update(dt, inputState);
			this.render(game);

			if (onFrame) onFrame();
		};

		this.rafId = requestAnimationFrame(loop);
	}

	dispose (): void {
		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
			this.rafId = 0;
		}

		const gl = this.gl;
		gl.deleteBuffer(this.posBuf);
		gl.deleteBuffer(this.colorBuf);
		gl.deleteBuffer(this.sizeBuf);
		gl.deleteProgram(this.program);
		gl.deleteShader(this.vsShader);
		gl.deleteShader(this.fsShader);

		// Remove overlay canvas
		this.overlayCanvas.parentElement?.removeChild(this.overlayCanvas);
	}
}
