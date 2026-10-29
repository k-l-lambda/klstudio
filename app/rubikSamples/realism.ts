// Phone-photo realism for the synthetic samples, calibrated on a real hand-held video (a GAN cube on a desk, 720×1280
// H.264): the measured gaps were sharpness (Laplacian variance / variance in the cube's box) 0.030 real vs 0.095
// rendered, noise inside a sticker (high-pass std) 0.95 vs 0, colour spread inside a sticker 1.3 vs 0, white b* +3.9
// vs −0.6 (warm white balance), the cube ~10 cubies away (fill ~0.35) off centre, a cluttered desk behind (the lattice
// explained 0.56 of the segment weight vs 0.88).
//
// Labels stay exact: every blur here is symmetric, the backdrop is behind the cube. Parameters are drawn from their own
// random stream (the sample seed's), so a sample without realism is the same as before.
import {mulberry32} from "./sampler";



// the camera's imaging, applied to the rendered pixels in this order
export interface Imaging {
	defocus: number;	// Gaussian sigma, px at 1024 width (scaled with the image)
	shake: number;		// motion blur length, px (a line kernel)
	shakeAngle: number;	// its direction, radians
	gain: number;		// exposure gain
	whiteBalance: [number, number, number];	// R G B gains (warm: R > B)
	gamma: number;		// tone curve exponent (1 = none)
	vignette: number;	// darkening at the corners (0–1)
	noise: number;		// sensor noise std at mid-grey, grey levels (shot noise: grows with the square root of the signal)
	jpeg: number;		// JPEG quality (0–1) of the delivered image
}

// a desk behind the cube: a canvas texture on a plane in the camera frame (per view its own patch of one scene)
export interface Backdrop {
	kind: "wood" | "paper" | "cloth" | "plain";
	base: string;		// base colour
	depth: number;		// distance behind the cube centre, cubie pitches
	tilt: number;		// the desk's tilt away from facing the camera, radians (about the image x axis)
	items: number;		// clutter: papers, books, a keyboard, cables, notes
	blur: number;		// its defocus, px of the texture
	seed: number;		// its drawing
}

export interface Realism {
	imaging: Imaging;
	backdrop: Backdrop;
	gloss: {envIntensity: number; clearcoat: number; clearcoatRoughness: number};
}

export const drawRealism = (seed: number): Realism => {
	const random = mulberry32(seed * 104729 + 31);
	const uniform = (a: number, b: number) => a + (b - a) * random();
	const kinds: Backdrop["kind"][] = ["wood", "paper", "cloth", "plain"];
	const kind = kinds[Math.floor(random() * (random() < 0.85 ? 3 : 4))];
	const bases = {
		wood: ["#b98a5a", "#8a5f3c", "#d6b48c", "#6e4b32"],
		paper: ["#f1efe8", "#e7e3d9", "#ffffff", "#dcdcd6"],
		cloth: ["#5a6b7a", "#7a5a5a", "#4a5a4a", "#9a9a92"],
		plain: ["#cfcfcf", "#3a3a3a", "#e8e4dc", "#8a8a8a"],
	};
	return {
		imaging: {
			defocus: uniform(0.3, 1.3),
			shake: random() < 0.5 ? uniform(0, 2.5) : uniform(2.5, 7),
			shakeAngle: uniform(0, Math.PI),
			gain: uniform(0.8, 1.15),
			whiteBalance: [uniform(0.98, 1.06), 1, uniform(0.9, 1.02)],
			gamma: uniform(0.9, 1.1),
			vignette: uniform(0, 0.35),
			noise: uniform(1.6, 4.5),
			jpeg: uniform(0.62, 0.9),
		},
		backdrop: {
			kind,
			base: bases[kind][Math.floor(random() * 4)],
			depth: uniform(1.5, 6),
			tilt: uniform(0.35, 1.1),
			items: Math.floor(uniform(4, 15)),
			blur: uniform(0.5, 3),
			seed: Math.floor(random() * 1e9),
		},
		gloss: {envIntensity: uniform(0.15, 0.9), clearcoat: uniform(0, 0.8), clearcoatRoughness: uniform(0.05, 0.4)},
	};
};


// --- the backdrop's texture -----------------------------------------------------------------------------------

export const drawBackdrop = (canvas: HTMLCanvasElement, b: Backdrop): void => {
	const random = mulberry32(b.seed);
	const uniform = (x: number, y: number) => x + (y - x) * random();
	const W = canvas.width, H = canvas.height;
	const g = canvas.getContext("2d");
	g.fillStyle = b.base;
	g.fillRect(0, 0, W, H);
	if (b.kind === "wood") {
		// grain: long thin darker streaks along x
		for (let i = 0; i < 260; ++i) {
			const y = uniform(0, H), dy = uniform(-6, 6);
			g.strokeStyle = `rgba(40, 20, 5, ${uniform(0.03, 0.12)})`;
			g.lineWidth = uniform(0.5, 3);
			g.beginPath();
			g.moveTo(0, y);
			g.bezierCurveTo(W / 3, y + dy, 2 * W / 3, y - dy, W, y + uniform(-4, 4));
			g.stroke();
		}
		// plank seams
		for (let x = uniform(0, W / 4); x < W; x += uniform(W / 5, W / 2.5)) {
			g.fillStyle = "rgba(30, 15, 5, 0.35)";
			g.fillRect(0, x * H / W, W, 2);
		}
	}
	else if (b.kind === "cloth") {
		for (let i = 0; i < 4000; ++i) {
			g.fillStyle = `rgba(${random() < 0.5 ? "0,0,0" : "255,255,255"}, ${uniform(0.02, 0.06)})`;
			g.fillRect(uniform(0, W), uniform(0, H), uniform(1, 3), uniform(1, 3));
		}
	}
	// clutter: hard straight edges the lattice fit must not take for a cube
	const item = () => {
		const kind = Math.floor(random() * 6);
		const x = uniform(-0.1, 1) * W, y = uniform(-0.1, 1) * H, angle = uniform(-0.5, 0.5);
		g.save();
		g.translate(x, y);
		g.rotate(angle);
		if (kind === 0 || kind === 1) {
			// a sheet of paper, maybe ruled or squared
			const w = uniform(0.25, 0.5) * W, h = w * 1.41;
			g.fillStyle = `hsl(${uniform(30, 60)}, ${uniform(0, 20)}%, ${uniform(88, 97)}%)`;
			g.fillRect(0, 0, w, h);
			if (kind === 1) {
				g.strokeStyle = `rgba(80, 110, 170, ${uniform(0.15, 0.4)})`;
				g.lineWidth = 1;
				const step = uniform(10, 22);
				for (let s = step; s < h; s += step) {
					g.beginPath();
					g.moveTo(0, s);
					g.lineTo(w, s);
					g.stroke();
				}
				if (random() < 0.5) {
					for (let s = step; s < w; s += step) {
						g.beginPath();
						g.moveTo(s, 0);
						g.lineTo(s, h);
						g.stroke();
					}
				}
			}
		}
		else if (kind === 2) {
			// a book
			const w = uniform(0.2, 0.4) * W, h = w * uniform(1.2, 1.5);
			g.fillStyle = `hsl(${uniform(0, 360)}, ${uniform(20, 70)}%, ${uniform(20, 55)}%)`;
			g.fillRect(0, 0, w, h);
			g.fillStyle = "rgba(255,255,255,0.7)";
			g.fillRect(w * 0.1, h * 0.15, w * 0.8, h * 0.06);
		}
		else if (kind === 3) {
			// a keyboard: a grid of keys
			const cols = 14, rows = 5, k = uniform(14, 26);
			g.fillStyle = "#2a2a2a";
			g.fillRect(-k * 0.3, -k * 0.3, cols * k + k * 0.6, rows * k + k * 0.6);
			g.fillStyle = random() < 0.5 ? "#444" : "#ddd";
			for (let r = 0; r < rows; ++r) {
				for (let c = 0; c < cols; ++c)
					g.fillRect(c * k + 1.5, r * k + 1.5, k - 3, k - 3);
			}
		}
		else if (kind === 4) {
			// a cable
			g.strokeStyle = random() < 0.5 ? "#111" : "#eee";
			g.lineWidth = uniform(3, 7);
			g.beginPath();
			g.moveTo(0, 0);
			g.bezierCurveTo(uniform(-W, W) / 2, uniform(-H, H) / 2, uniform(-W, W) / 2, uniform(-H, H) / 2, uniform(-W, W), uniform(-H, H));
			g.stroke();
		}
		else {
			// a sticky note or a phone
			const s = uniform(0.06, 0.14) * W;
			g.fillStyle = random() < 0.5 ? `hsl(${uniform(40, 200)}, 80%, 70%)` : "#151515";
			g.fillRect(0, 0, s, random() < 0.5 ? s : s * 2);
		}
		g.restore();
	};
	for (let i = 0; i < b.items; ++i)
		item();
	// light falling off across the desk
	const grad = g.createRadialGradient(uniform(0.2, 0.8) * W, uniform(0.2, 0.8) * H, 0, W / 2, H / 2, Math.max(W, H) * 0.8);
	grad.addColorStop(0, "rgba(255,255,255,0.12)");
	grad.addColorStop(1, `rgba(0,0,0,${uniform(0.15, 0.45)})`);
	g.fillStyle = grad;
	g.fillRect(0, 0, W, H);
	// out of focus
	if (b.blur > 0) {
		const copy = document.createElement("canvas");
		copy.width = W;
		copy.height = H;
		const c = copy.getContext("2d");
		c.filter = `blur(${b.blur}px)`;
		c.drawImage(canvas, 0, 0);
		g.clearRect(0, 0, W, H);
		g.drawImage(copy, 0, 0);
	}
};


// --- the imaging chain on the rendered pixels --------------------------------------------------------------------

// separable 1-D Gaussian kernel of std sigma
const gaussian = (sigma: number): number[] => {
	const r = Math.max(1, Math.ceil(sigma * 3));
	const k = Array(2 * r + 1).fill(0).map((_, i) => Math.exp(-((i - r) ** 2) / (2 * sigma * sigma)));
	const sum = k.reduce((a, b) => a + b, 0);
	return k.map(v => v / sum);
};

const blurAxis = (src: Float32Array, dst: Float32Array, W: number, H: number, kernel: number[], dx: number, dy: number): void => {
	const r = (kernel.length - 1) / 2;
	for (let y = 0; y < H; ++y) {
		for (let x = 0; x < W; ++x) {
			let s0 = 0, s1 = 0, s2 = 0;
			for (let i = 0; i < kernel.length; ++i) {
				const xi = Math.min(W - 1, Math.max(0, x + (i - r) * dx)), yi = Math.min(H - 1, Math.max(0, y + (i - r) * dy));
				const o = (yi * W + xi) * 3;
				s0 += src[o] * kernel[i];
				s1 += src[o + 1] * kernel[i];
				s2 += src[o + 2] * kernel[i];
			}
			const o = (y * W + x) * 3;
			dst[o] = s0;
			dst[o + 1] = s1;
			dst[o + 2] = s2;
		}
	}
};

// motion blur: a line kernel of `length` px along `angle`, sampled at whole pixels (nearest)
const lineBlur = (src: Float32Array, dst: Float32Array, W: number, H: number, length: number, angle: number): void => {
	const n = Math.max(1, Math.round(length));
	const cx = Math.cos(angle), cy = Math.sin(angle);
	const taps: [number, number][] = [];
	for (let i = 0; i <= n; ++i) {
		const t = (i / n - 0.5) * length;
		taps.push([Math.round(t * cx), Math.round(t * cy)]);
	}
	for (let y = 0; y < H; ++y) {
		for (let x = 0; x < W; ++x) {
			let s0 = 0, s1 = 0, s2 = 0;
			for (const [dx, dy] of taps) {
				const xi = Math.min(W - 1, Math.max(0, x + dx)), yi = Math.min(H - 1, Math.max(0, y + dy));
				const o = (yi * W + xi) * 3;
				s0 += src[o];
				s1 += src[o + 1];
				s2 += src[o + 2];
			}
			const o = (y * W + x) * 3;
			dst[o] = s0 / taps.length;
			dst[o + 1] = s1 / taps.length;
			dst[o + 2] = s2 / taps.length;
		}
	}
};

// The camera's imaging on a rendered canvas: optics (defocus, shake), the sensor (noise), the ISP (white balance,
// gain, tone, vignette), then JPEG. `shake` overrides the imaging's (a video frame's own motion). Returns a JPEG data
// URL. noiseSeed: per view.
export const applyImaging = (source: HTMLCanvasElement, m: Imaging, noiseSeed: number, shake?: {length: number; angle: number}): string => {
	const W = source.width, H = source.height;
	const canvas = document.createElement("canvas");
	canvas.width = W;
	canvas.height = H;
	const g = canvas.getContext("2d");
	g.drawImage(source, 0, 0);
	const image = g.getImageData(0, 0, W, H);
	const d = image.data;
	let a = new Float32Array(W * H * 3), b = new Float32Array(W * H * 3);
	for (let i = 0, j = 0; i < d.length; i += 4, j += 3) {
		a[j] = d[i];
		a[j + 1] = d[i + 1];
		a[j + 2] = d[i + 2];
	}
	const scale = W / 1024;
	const sigma = m.defocus * scale;
	if (sigma > 0.25) {
		const k = gaussian(sigma);
		blurAxis(a, b, W, H, k, 1, 0);
		blurAxis(b, a, W, H, k, 0, 1);
	}
	const length = (shake ? shake.length : m.shake) * scale, angle = shake ? shake.angle : m.shakeAngle;
	if (length >= 1) {
		lineBlur(a, b, W, H, length, angle);
		[a, b] = [b, a];
	}
	const random = mulberry32(noiseSeed);
	const normal = () => {
		const u = Math.max(1e-9, random()), v = random();
		return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
	};
	const diagonal = Math.hypot(W / 2, H / 2);
	for (let y = 0, j = 0; y < H; ++y) {
		for (let x = 0; x < W; ++x, j += 3) {
			const r2 = (Math.hypot(x - W / 2, y - H / 2) / diagonal) ** 2;
			const v = 1 - m.vignette * r2;
			for (let c = 0; c < 3; ++c) {
				let p = a[j + c] * m.gain * m.whiteBalance[c] * v;
				p = 255 * Math.pow(Math.max(0, p) / 255, m.gamma);
				p += normal() * m.noise * Math.sqrt(Math.max(p, 1) / 128);
				d[(j / 3) * 4 + c] = Math.min(255, Math.max(0, Math.round(p)));
			}
		}
	}
	g.putImageData(image, 0, 0);
	return canvas.toDataURL("image/jpeg", m.jpeg);
};
