// Synthetic photo samples of a 3×3 cube for image-based state reconstruction: one random scene (cube state, colour
// scheme, cube build, lighting, camera) seen in three views. Pure: this module draws no pixels (sampleRenderer.ts
// does), so labels can be generated and checked in node. Everything is reproducible from the seed.
//
// Three views cover all six faces with every pair sharing a face. A convex cube shows at most the three faces around
// one corner, so the views are three corners with each axis seen from both sides and no two opposite: one of the 8
// sets like {URF, ULB, DRB}... (each pair then shares exactly one face).
//
// Label frames (OpenCV style):
//	cube frame: x → R, y → U, z → F, origin at the cube centre, unit = cubie pitch (the cube spans ±1.5);
//	camera frame: x right, y down, z forward; pixel (u, v) from the image's top-left corner, pixel centres at +0.5:
//	u = fx · X / Z + cx, v = fy · Y / Z + cy; a point p in the cube frame is at R·p + t in the camera frame.
// The renderer works in three.js' camera frame (y up, z backward) = diag(1, -1, -1) of these.
import * as THREE from "three";

import {CubeN, cubeModel} from "../../inc/cubeN";
import {randomCube} from "../../inc/cove3";



export const FACE_LETTERS = "LRDUBF";	// CubeN face order: -X +X -Y +Y -Z +Z

type Vector3 = [number, number, number];
type Point2 = [number, number];


export const mulberry32 = (seed: number) => () => {
	seed |= 0;
	seed = (seed + 0x6d2b79f5) | 0;
	let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
	t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};


export interface StickerLabel {
	index: number;		// facelet index: face * 9 + row * 3 + col, as CubeN facelets
	face: string;		// face of the cube it sits on
	row: number;		// rows and columns as seen from outside the face (see faceFrames)
	col: number;
	color: string;		// face letter of its colour (the face whose centre has that colour)
	visible: boolean;	// on a face turned to the camera and at least partly inside the image
	inFrame: number;	// share of the sticker square's image area inside the image (1 = fully in frame)
	corners: Point2[];	// sticker square, seen from outside: top-left, top-right, bottom-right, bottom-left
	center: Point2;
}

export interface ViewLabel {
	corner: string;		// cube corner the camera looks at, e.g. "RUF"
	visibleFaces: string;
	rotation: number[];	// 3×3 row-major, cube frame → camera frame
	translation: Vector3;	// cube centre in the camera frame
	quaternion: [number, number, number, number];	// rotation as x, y, z, w
	cameraInCube: Vector3;	// camera centre in the cube frame
	faceAngles: Record<string, number>;	// per visible face: degrees between its plane and the sight line from its centre to the camera (> MIN_SIGHT_ANGLE)
	fill: number;		// projected cube outline: larger of width / image width, height / image height
	offset: Point2;		// projected cube centre from the image centre, in half image sizes (NDC-like, y down)
	bleed: number;		// px of the outline past the image border (0 = whole cube in frame)
	stickers: StickerLabel[];
}

// Anti-pop tiles: per corner of a facelet's coloured square, a radius as a share of the square's side, by what the
// corner points at — the face centre (inner) or not (outer). Centre caps: all four corners `centre` (0.5 = a disc);
// edge pieces: the two corners towards the centre `edge`; corner pieces: the corner towards the centre `corner`.
// Tiles are extruded by `depth` with a bevel of `bevel` (rounded tile edges), on a dark core; on the cube's edges a tile
// stops depth + 2·bevel short of the label square (the core's rounded edge shows there).
export interface AntipopBuild {
	centre: number;
	edge: number;
	corner: number;
	outer: number;
	depth: number;
	bevel: number;
	jitter: number;		// max cubie offset per axis, cubie pitches
	tilt: number;		// max cubie rotation, degrees
}

// a cubie's actual pose: rotated by `quaternion` (x, y, z, w) about its lattice centre `position`, then moved by `offset`
export interface CubieOffset {
	position: Vector3;
	offset: Vector3;
	quaternion: [number, number, number, number];
}

// Where point p (cube frame, on cubie `position`) really is, given the cubies' pose errors (none: p itself).
export const placeOnCubie = (p: Vector3, position: Vector3, cubies?: CubieOffset[]): Vector3 => {
	const c = cubies && cubies.find(item => item.position.every((v, i) => v === position[i]));
	if (!c)
		return p;
	const q = new THREE.Quaternion(...c.quaternion);
	const local = new THREE.Vector3(p[0] - position[0], p[1] - position[1], p[2] - position[2]).applyQuaternion(q);
	return [0, 1, 2].map(i => position[i] + c.offset[i] + local.getComponent(i)) as Vector3;
};

// the cubie a facelet sits on: its centre on the face plane at 1 → the lattice point
export const faceletCubie = (normal: number[], right: number[], down: number[], row: number, col: number): Vector3 =>
	[0, 1, 2].map(i => normal[i] + right[i] * (col - 1) + down[i] * (row - 1)) as Vector3;

export interface Light {
	color: string;
	intensity: number;
}

export interface Sample {
	version: 1;
	seed: number;
	image: {width: number; height: number};
	intrinsics: {fovY: number; fx: number; fy: number; cx: number; cy: number; K: number[]};
	cube: {
		order: 3;
		code: string;		// CubeN.encode()
		facelets: string;	// 54 colour letters, CubeN facelet order
		faceOrder: string;
		faceFrames: Record<string, {right: Vector3; down: Vector3}>;	// row/column directions of each face in the cube frame
		scheme: string;		// western / japanese / shuffled, or nonstandard-<vivid|light|deep|mixed> (see nonstandardColors)
		colors: Record<string, string>;	// sticker colour (sRGB hex) per face letter
		hueGap: number;		// smallest CIE Lab hue difference (degrees) between the chromatic colours (C* ≥ 20)
		body: string;
	};
	render: {
		// stickerless: the colour covers the whole cubie face, rounded edges included. antipop: an anti-pop speed cube
		// (stickerless tiles with strongly rounded inner corners, round centre caps, dark core in wider gaps, see
		// AntipopBuild), each cubie slightly off its lattice place (cubies)
		style: "stickered" | "stickerless" | "antipop";
		gap: number;		// space between cubies
		cubieRadius: number;	// rounded cubie edges
		border: number;		// cubie face margin around the sticker (0 when stickerless)
		// side of the coloured square. Stickerless: the cubie side; the colour runs over the rounded edges up to their
		// 45° line, so the visible colour ends about 0.3 cubieRadius inside the label square (the edge curves away), and
		// a sliver of a hidden face's colour can show on the rounded edges (still visible: false)
		sticker: number;
		stickerRadius: number;	// rounded sticker corners (the label corners are the square's)
		stickerPlane: number;	// distance of the coloured surface from the cube centre
		antipop?: AntipopBuild;
		cubies?: CubieOffset[];	// antipop: every cubie's pose error; the labels include it
		stickerRoughness: number;
		bodyRoughness: number;
		background: string;
		ambient: Light;
		main: Light & {direction: Vector3};	// camera frame, from the scene towards the light
		points: (Light & {position: Vector3; distance: number; decay: number})[];	// camera frame
	};
	views: ViewLabel[];
}


// sRGB base colours per role
const PALETTE = {
	white: "#f2f2ee", yellow: "#ffd200", red: "#c41e2e", orange: "#ff6a00", blue: "#0050b5", green: "#00a050",
};
// U R F D L B ... in CubeN face order L R D U B F
const SCHEMES: {name: string; weight: number; faces: string[]}[] = [
	{name: "western", weight: 0.6, faces: ["orange", "red", "yellow", "white", "blue", "green"]},
	{name: "japanese", weight: 0.15, faces: ["orange", "red", "blue", "white", "yellow", "green"]},
	{name: "shuffled", weight: 0.25, faces: null},
];
const BODIES = [{color: "#111111", weight: 0.65}, {color: "#eeeeea", weight: 0.2}, {color: "#4a4a4a", weight: 0.15}];

// --- non-standard colour schemes ---------------------------------------------------------------------------------
// Six sticker colours built in CIE LCh (D65), so "hue" is the Lab hue the detector reads.
//	- near-white: at most one (L* ≥ 88, C* < 8), exempt from the hue rule; no other colour may be whitish
//	- every other colour saturated: HSV saturation ≥ MIN_SATURATION and C* ≥ MIN_CHROMA (rules out pastels)
//	- their hues at least MIN_HUE_GAP apart around the circle (6 hues fit 60° each at most; 45° rules out pairs like
//	  the standard red/orange, ~26° apart)
// Families by lightness: vivid (mid), light (bright but saturated: lemon, sky, lime), deep (dark, rich), mixed.

export const MIN_HUE_GAP = 45;
export const MIN_CHROMA = 40;
export const MIN_SATURATION = 0.6;
export const isNearWhite = (lch: number[]) => lch[0] >= 88 && lch[1] < 8;

const srgbToLinear = (c: number) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const linearToSrgb = (c: number) => c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
const D65 = [0.95047, 1, 1.08883];

const labToLinear = (L: number, a: number, b: number): number[] => {
	const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
	const inv = (t: number) => t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787;
	const [x, y, z] = [inv(fx) * D65[0], inv(fy) * D65[1], inv(fz) * D65[2]];
	return [
		3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
		-0.9692660 * x + 1.8760108 * y + 0.0415560 * z,
		0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
	];
};

// sRGB hex → [L*, C*, h°]
export const hexToLch = (hexColor: string): number[] => {
	const [r, g, b] = [1, 3, 5].map(i => srgbToLinear(parseInt(hexColor.slice(i, i + 2), 16) / 255));
	const xyz = [
		(0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / D65[0],
		(0.2126729 * r + 0.7151522 * g + 0.0721750 * b) / D65[1],
		(0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / D65[2],
	];
	const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
	const [fx, fy, fz] = xyz.map(f);
	const L = 116 * fy - 16, A = 500 * (fx - fy), B = 200 * (fy - fz);
	return [L, Math.hypot(A, B), (THREE.MathUtils.radToDeg(Math.atan2(B, A)) + 360) % 360];
};

const lchToHex = (L: number, C: number, h: number): string | null => {
	const rad = THREE.MathUtils.degToRad(h);
	const rgb = labToLinear(L, C * Math.cos(rad), C * Math.sin(rad));
	if (rgb.some(c => c < -1e-4 || c > 1 + 1e-4))
		return null;
	return "#" + rgb.map(c => Math.round(Math.min(1, Math.max(0, linearToSrgb(Math.max(0, c)))) * 255).toString(16).padStart(2, "0")).join("");
};

// the largest chroma in the sRGB gamut at lightness L and hue h
const maxChroma = (L: number, h: number): number => {
	let lo = 0, hi = 150;
	for (let i = 0; i < 30; ++i) {
		const mid = (lo + hi) / 2;
		if (lchToHex(L, mid, h))
			lo = mid;
		else
			hi = mid;
	}
	return lo;
};

// smallest cyclic hue difference among colours with C* ≥ 20 (white excluded); 360 if fewer than two
export const hueGap = (hexColors: string[]): number => {
	const hues = hexColors.map(hexToLch).filter(([, C]) => C >= 20).map(([, , h]) => h).sort((a, b) => a - b);
	if (hues.length < 2)
		return 360;
	return Math.min(...hues.map((h, i) => i ? h - hues[i - 1] : hues[0] + 360 - hues[hues.length - 1]));
};

// HSV saturation of an sRGB hex
export const saturation = (hexColor: string): number => {
	const [r, g, b] = [1, 3, 5].map(i => parseInt(hexColor.slice(i, i + 2), 16));
	const max = Math.max(r, g, b);
	return max ? (max - Math.min(r, g, b)) / max : 0;
};

const FAMILIES = {	// preferred lightness, and chroma as a share of the gamut's maximum at (L, h)
	vivid: {L: [45, 75], C: [0.85, 1]},
	light: {L: [72, 92], C: [0.85, 1]},
	deep: {L: [25, 45], C: [0.8, 1]},
};
const FAMILY_WEIGHTS = [{name: "vivid", weight: 0.45}, {name: "light", weight: 0.2}, {name: "deep", weight: 0.15}, {name: "mixed", weight: 0.2}];

const saturated = (hexColor: string) => saturation(hexColor) >= MIN_SATURATION && hexToLch(hexColor)[1] >= MIN_CHROMA;

// A saturated colour at hue h, its lightness within the family's range if this hue allows it there, else the
// nearest lightness that does (blue and violet only saturate dark, yellow only light); null if none at all.
type Uniform = typeof Math.min;	// (a, b) → a value in [a, b); typed via a built-in to keep parameter names out of the signature

const saturatedColour = (h: number, fam: {L: number[]; C: number[]}, uniform: Uniform): string | null => {
	const options: {L: number; hex: string}[] = [];
	for (let L = 18; L <= 96; L += 2) {
		const Cmax = maxChroma(L, h);
		const hex = lchToHex(L, Cmax * uniform(fam.C[0], fam.C[1]), h);
		const top = lchToHex(L, Cmax * 0.995, h);
		const pick = hex && saturated(hex) ? hex : top && saturated(top) ? top : null;
		if (pick)
			options.push({L, hex: pick});
	}
	if (!options.length)
		return null;
	const inRange = options.filter(o => o.L >= fam.L[0] && o.L <= fam.L[1]);
	const pool = inRange.length ? inRange : (() => {
		const d = (o: {L: number}) => Math.max(fam.L[0] - o.L, o.L - fam.L[1], 0);
		const near = Math.min(...options.map(d));
		return options.filter(o => d(o) <= near + 6);
	})();
	return pool[Math.floor(uniform(0, pool.length - 1e-9))].hex;
};

export const nonstandardColors = (random: () => number): {family: string; colors: string[]} => {
	const uniform = (a: number, b: number) => a + (b - a) * random();
	let r = random() * FAMILY_WEIGHTS.reduce((sum, f) => sum + f.weight, 0);
	const family = (FAMILY_WEIGHTS.find(f => (r -= f.weight) < 0) || FAMILY_WEIGHTS[0]).name;
	const withWhite = random() < 0.6;
	const n = withWhite ? 5 : 6;

	for (let attempt = 0; ; ++attempt) {
		// hues: random gaps, each MIN_HUE_GAP plus a share of the slack (+3° margin for hex rounding), random start
		const slack = 360 - n * (MIN_HUE_GAP + 3);
		const parts = Array(n).fill(0).map(() => -Math.log(1 - random()));
		const sum = parts.reduce((a, b) => a + b, 0);
		let h = uniform(0, 360);
		const hues = parts.map(p => {
			const here = h;
			h += MIN_HUE_GAP + 3 + slack * p / sum;
			return here % 360;
		});

		const colours = hues.map(hue => saturatedColour(hue, FAMILIES[family === "mixed" ? ["vivid", "light", "deep"][Math.floor(random() * 3)] : family], uniform));
		if (withWhite) {
			// a white: very light, a faint warm or cool cast
			colours.push(lchToHex(uniform(92, 97), uniform(0, 4), uniform(0, 360)));
		}

		const lch = colours.every(Boolean) ? colours.map(hexToLch) : null;
		const ok = lch && hueGap(colours) >= MIN_HUE_GAP && new Set(colours).size === 6
			&& lch.filter(isNearWhite).length === (withWhite ? 1 : 0)
			&& colours.every((c, i) => isNearWhite(lch[i]) || saturated(c));
		if (ok) {
			// colours to faces at random
			for (let i = colours.length - 1; i > 0; --i) {
				const j = Math.floor(random() * (i + 1));
				[colours[i], colours[j]] = [colours[j], colours[i]];
			}
			return {family, colors: colours};
		}
		if (attempt > 200)
			throw new Error("nonstandardColors: no valid scheme found");
	}
};


// three corners covering all faces, every pair sharing one face
const CORNER_SETS: Vector3[][] = (() => {
	const corners: Vector3[] = [];
	for (const x of [-1, 1]) {
		for (const y of [-1, 1]) {
			for (const z of [-1, 1])
				corners.push([x, y, z]);
		}
	}
	const sets: Vector3[][] = [];
	for (let a = 0; a < 8; ++a) {
		for (let b = a + 1; b < 8; ++b) {
			for (let c = b + 1; c < 8; ++c) {
				const set = [corners[a], corners[b], corners[c]];
				const opposite = (p: Vector3, q: Vector3) => p.every((v, k) => v === -q[k]);
				const covers = [0, 1, 2].every(k => set.some(p => p[k] > 0) && set.some(p => p[k] < 0));
				if (covers && !opposite(set[0], set[1]) && !opposite(set[0], set[2]) && !opposite(set[1], set[2]))
					sets.push(set);
			}
		}
	}
	return sets;
})();

// smallest angle between a visible face's plane and the line of sight from the face centre to the camera
export const MIN_SIGHT_ANGLE = 15;

const cornerName = (c: Vector3): string => (c[0] > 0 ? "R" : "L") + (c[1] > 0 ? "U" : "D") + (c[2] > 0 ? "F" : "B");

// Sight angles (degrees) of the corner's three faces (x, y, z) from a camera at `camera` (cube frame): the angle between
// each face plane and the line from the face centre to the camera; negative = the face is turned away.
const sightAngles = (camera: THREE.Vector3 | Vector3, corner: Vector3): number[] => {
	const p = Array.isArray(camera) ? camera : camera.toArray();
	return [0, 1, 2].map(axis => {
		const d = p.map((c, k) => k === axis ? c - corner[axis] * 1.5 : c);	// face centre → camera
		return THREE.MathUtils.radToDeg(Math.asin(d[axis] * corner[axis] / Math.hypot(...d)));
	});
};

const faceLetter = (axis: number, sign: number): string => FACE_LETTERS[axis * 2 + (sign > 0 ? 1 : 0)];


export type SchemeSet = "standard" | "nonstandard" | "all";

export type BuildSet = "classic" | "antipop" | "all";

export interface SampleOptions {
	width?: number;
	height?: number;
	schemes?: SchemeSet;	// standard (default; the draws of earlier versions, so old seeds reproduce), nonstandard, all
	builds?: BuildSet;	// classic (default; stickered / stickerless, old seeds reproduce), antipop, all (a third antipop)
}


export const generateSample = (seed: number, {width = 640, height = 480, schemes = "standard", builds = "classic"}: SampleOptions = {}): Sample => {
	const random = mulberry32(seed);
	const uniform = (a: number, b: number) => a + (b - a) * random();
	const pick = <T extends {weight: number}>(items: T[]): T => {
		let r = random() * items.reduce((sum, item) => sum + item.weight, 0);
		return items.find(item => (r -= item.weight) < 0) || items[items.length - 1];
	};
	const hex = (color: THREE.Color) => "#" + color.getHexString();
	const hsl = (h: number, s: number, l: number) => hex(new THREE.Color().setHSL(h, s, l));
	const unit = (): Vector3 => {
		for (;;) {
			const v: Vector3 = [uniform(-1, 1), uniform(-1, 1), uniform(-1, 1)];
			const length = Math.hypot(...v);
			if (length > 0.1 && length <= 1)
				return v.map(c => c / length) as Vector3;
		}
	};

	// cube state and colours
	const cube = randomCube(random);
	const colors: Record<string, string> = {};
	let schemeName: string;
	if (schemes === "standard" || (schemes === "all" && random() < 0.5)) {
		const scheme = pick(SCHEMES);
		schemeName = scheme.name;
		const roles = scheme.faces || (() => {
			const roles = Object.keys(PALETTE);
			for (let i = roles.length - 1; i > 0; --i) {
				const j = Math.floor(random() * (i + 1));
				[roles[i], roles[j]] = [roles[j], roles[i]];
			}
			return roles;
		})();
		FACE_LETTERS.split("").forEach((face, i) => {
			const color = new THREE.Color(PALETTE[roles[i]]);
			color.offsetHSL(uniform(-0.015, 0.015), uniform(-0.12, 0.05), uniform(-0.07, 0.05));
			colors[face] = hex(color);
		});
	}
	else {
		const generated = nonstandardColors(random);
		schemeName = "nonstandard-" + generated.family;
		FACE_LETTERS.split("").forEach((face, i) => colors[face] = generated.colors[i]);
	}
	let body = hex(new THREE.Color(pick(BODIES).color).offsetHSL(0, 0, uniform(-0.03, 0.03)));

	// cube build
	// cube build: a quarter stickerless; stickered mostly with a thin border (the sticker covers 84–94 % of the cubie
	// face's width), a few with a thick one (72–84 %). A sticker sits on the flat part, so border ≥ the cubie radius.
	// classic draws exactly as before; antipop draws its own build after the style choice
	const antipop = builds === "antipop" || (builds === "all" && random() < 1 / 3);
	const style = antipop ? "antipop" : random() < 0.25 ? "stickerless" : "stickered";
	const gap = antipop ? uniform(0.02, 0.045) : uniform(0.005, 0.03);
	const side = 1 - gap;
	let cubieRadius: number, border: number, sticker: number, stickerRadius: number;
	let antipopBuild: AntipopBuild, cubies: CubieOffset[];
	if (style === "antipop") {
		// radii ordered centre ≥ edge ≥ corner ≥ outer (shares of the tile side; centre 0.5 = a disc)
		const centre = uniform(0.36, 0.5), edge = uniform(0.2, Math.min(0.42, centre)), corner = uniform(0.04, Math.min(0.2, edge));
		antipopBuild = {
			centre, edge, corner, outer: uniform(0.02, Math.min(0.07, corner)),
			depth: uniform(0.008, 0.02), bevel: uniform(0.012, 0.025), jitter: uniform(0.004, 0.02), tilt: uniform(0.2, 1.2),
		};
		cubieRadius = antipopBuild.bevel;
		body = hex(new THREE.Color("#101010").offsetHSL(0, 0, uniform(0, 0.08)));	// the dark core seen in the gaps
		border = 0;
		sticker = side;
		stickerRadius = 0;
		// each cubie a little off: offset up to `jitter` per axis, rotation up to `tilt` about a random axis
		cubies = [];
		for (let x = -1; x <= 1; ++x) {
			for (let y = -1; y <= 1; ++y) {
				for (let z = -1; z <= 1; ++z) {
					if (!(x || y || z))
						continue;
					const offset = [0, 1, 2].map(() => uniform(-1, 1) * antipopBuild.jitter) as Vector3;
					const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(...unit()), THREE.MathUtils.degToRad(uniform(0, antipopBuild.tilt)));
					cubies.push({position: [x, y, z], offset, quaternion: [q.x, q.y, q.z, q.w]});
				}
			}
		}
	}
	else if (style === "stickerless") {
		cubieRadius = uniform(0.02, 0.12);
		border = 0;
		sticker = side;
		stickerRadius = cubieRadius;
	}
	else {
		const coverage = random() < 0.15 ? uniform(0.72, 0.84) : uniform(0.84, 0.94);
		border = side * (1 - coverage) / 2;
		cubieRadius = Math.min(uniform(0.02, 0.1), border * 0.9);
		sticker = side - 2 * border;
		stickerRadius = sticker / 2 * uniform(0, 0.4);
	}
	// stickers float just above the cubie face; a stickerless face is the cubie face itself
	const stickerPlane = 1.5 - gap / 2 + (style === "stickered" ? 0.002 : 0);

	// lights (camera frame)
	const main = {
		direction: (() => {
			const v: Vector3 = [uniform(-1, 1), -uniform(0, 1.5), -uniform(-0.6, 1.2)];	// mostly above (y down) and from the camera side (z backward)
			const length = Math.hypot(...v);
			return v.map(c => c / length) as Vector3;
		})(),
		color: hsl(uniform(0.05, 0.6), uniform(0, 0.25), uniform(0.85, 1)),
		intensity: uniform(0.5, 2),
	};
	const ambient = {color: hsl(random(), uniform(0, 0.4), uniform(0.6, 1)), intensity: uniform(0.05, 0.7)};
	const background = hsl(random(), uniform(0, 0.5), uniform(0.08, 0.92));

	// camera
	const fovY = uniform(30, 70);
	const tanY = Math.tan(THREE.MathUtils.degToRad(fovY) / 2), tanX = tanY * width / height;
	const fy = height / 2 / tanY, fx = fy, cx = width / 2, cy = height / 2;
	// framing: the projected outline fills 0.5–0.95 of the image (per scene, ±0.04 per view); the cube centre stays
	// within ±OFFSET of the image centre (half sizes); the outline may run up to BLEED of the smaller side past the border
	const fill = uniform(0.5, 0.95);
	const tanMin = Math.min(tanX, tanY);
	const baseDistance = 2.4 / (fill * tanMin);	// rough: outline half-extent ≈ 2.4 cubie pitches


	const project = (p: Vector3): Point2 => [fx * p[0] / p[2] + cx, fy * p[1] / p[2] + cy];
	const OFFSET = 0.12, BLEED = 0.04 * Math.min(width, height);

	const model = cubeModel(3);
	const faceletColors = cube.facelets;

	const corners = [...CORNER_SETS[Math.floor(random() * CORNER_SETS.length)]];
	for (let i = 2; i > 0; --i) {
		const j = Math.floor(random() * (i + 1));
		[corners[i], corners[j]] = [corners[j], corners[i]];
	}

	// a quad's area inside the image (Sutherland–Hodgman on the 4 borders) / its whole area
	const inFrameShare = (quad: Point2[]): number => {
		const area = (poly: Point2[]) => Math.abs(poly.reduce((sum, p, i) => {
			const q = poly[(i + 1) % poly.length];
			return sum + p[0] * q[1] - q[0] * p[1];
		}, 0)) / 2;
		let poly = quad;
		for (const [axis, limit, keep] of [[0, 0, 1], [0, width, -1], [1, 0, 1], [1, height, -1]]) {
			const inside = (p: Point2) => (p[axis] - limit) * keep >= 0;
			const next: Point2[] = [];
			poly.forEach((p, i) => {
				const q = poly[(i + 1) % poly.length];
				if (inside(p))
					next.push(p);
				if (inside(p) !== inside(q)) {
					const t = (limit - p[axis]) / (q[axis] - p[axis]);
					next.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
				}
			});
			poly = next;
			if (!poly.length)
				return 0;
		}
		return area(poly) / area(quad);
	};

	const views: ViewLabel[] = corners.map(corner => {
		let target = Math.min(0.97, fill + uniform(-0.04, 0.04));
		for (let attempt = 0; ; ++attempt) {
			// hard cases (wide angle + close up can't keep the sight angles): back off a little every 20 attempts
			if (attempt && attempt % 20 === 0)
				target *= 0.98;

			// camera position in the cube frame = distance · toward, `toward` in the corner's octant; a random roll; the cube
			// centre near the image centre
			const toward = new THREE.Vector3(...corner.map(c => c * uniform(0.05, 1)) as Vector3).normalize();
			const ndc = [uniform(-1, 1) * OFFSET * Math.max(0, 1 - attempt / 60), uniform(-1, 1) * OFFSET * Math.max(0, 1 - attempt / 60)];
			const ray = new THREE.Vector3(ndc[0] * tanX, ndc[1] * tanY, 1).normalize();	// camera frame, y down
			const quaternion = new THREE.Quaternion().setFromUnitVectors(toward, ray.clone().negate());
			quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(ray.clone().negate(), uniform(0, 2 * Math.PI)));
			const e = new THREE.Matrix4().makeRotationFromQuaternion(quaternion).elements;	// column-major
			const rotation = [e[0], e[4], e[8], e[1], e[5], e[9], e[2], e[6], e[10]];

			const outlineAt = (distance: number): Point2[] => {
				const t = ray.clone().multiplyScalar(distance);
				const points: Point2[] = [];
				for (const x of [-1.5, 1.5]) {
					for (const y of [-1.5, 1.5]) {
						for (const z of [-1.5, 1.5]) {
							const p = [0, 1, 2].map(r => rotation[r * 3] * x + rotation[r * 3 + 1] * y + rotation[r * 3 + 2] * z + t.getComponent(r)) as Vector3;
							points.push(project(p));
						}
					}
				}
				return points;
			};
			const fillOf = (outline: Point2[]): number => {
				const us = outline.map(p => p[0]), vs = outline.map(p => p[1]);
				return Math.max((Math.max(...us) - Math.min(...us)) / width, (Math.max(...vs) - Math.min(...vs)) / height);
			};

			// distance for the target fill (fill ~ 1 / distance)
			let distance = baseDistance;
			for (let i = 0; i < 5; ++i)
				distance *= fillOf(outlineAt(distance)) / target;

			// the sight line from each visible face centre to the camera at least MIN_SIGHT_ANGLE off the face plane (the
			// hidden faces are then further off theirs: they face away, |c + 1.5| > |c - 1.5|)
			const cameraInCube = toward.toArray().map(c => c * distance) as Vector3;
			if (Math.min(...sightAngles(cameraInCube, corner)) <= MIN_SIGHT_ANGLE)
				continue;

			const outline = outlineAt(distance);
			const bleed = Math.max(0, ...outline.map(([u, v]) => Math.max(-u, -v, u - width, v - height)));
			if (bleed > BLEED)
				continue;

			const translation = ray.clone().multiplyScalar(distance);
			const toCamera = (p: Vector3): Vector3 => [0, 1, 2].map(r => rotation[r * 3] * p[0] + rotation[r * 3 + 1] * p[1] + rotation[r * 3 + 2] * p[2] + translation.getComponent(r)) as Vector3;

			const visible = [0, 1, 2].map(k => faceLetter(k, corner[k]));
			const stickers: StickerLabel[] = model.facelets.map(({normal, right, down}, k) => {
				const face = FACE_LETTERS[Math.floor(k / 9)], row = Math.floor((k % 9) / 3), col = k % 3;
				const onCubie = faceletCubie(normal, right, down, row, col);
				const flat = [0, 1, 2].map(i => normal[i] * stickerPlane + right[i] * (col - 1) + down[i] * (row - 1)) as Vector3;
				const centre = placeOnCubie(flat, onCubie, cubies);
				const s = sticker / 2;
				const at = (a: number, b: number): Vector3 => placeOnCubie(flat.map((c, i) => c + right[i] * a * s + down[i] * b * s) as Vector3, onCubie, cubies);
				const corners = [at(-1, -1), at(1, -1), at(1, 1), at(-1, 1)].map(p => project(toCamera(p)));
				const inFrame = visible.includes(face) ? inFrameShare(corners) : 0;
				return {
					index: k, face, row, col,
					color: FACE_LETTERS[faceletColors[k]],
					visible: inFrame > 0,
					inFrame,
					corners, center: project(toCamera(centre)),
				};
			});

			const angles = sightAngles(cameraInCube, corner);
			const faceAngles = {};
			visible.forEach((face, k) => faceAngles[face] = angles[k]);

			const [u0, v0] = project(translation.toArray() as Vector3);
			return {
				corner: cornerName(corner),
				visibleFaces: visible.join(""),
				rotation,
				translation: translation.toArray() as Vector3,
				quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w],
				cameraInCube,
				faceAngles,
				fill: fillOf(outline),
				offset: [(u0 - cx) / (width / 2), (v0 - cy) / (height / 2)],
				bleed,
				stickers,
			};
		}
	});

	// 0–3 interfering point lights, placed after the views so they can keep their distance from the cube in every view:
	// ≥ POINT_MIN_DISTANCE (cubie pitches) from the cube centre, intensity ≤ 0.8 (the main light goes to 2), a soft falloff
	const POINT_MIN_DISTANCE = 7;
	const centres = views.map(view => new THREE.Vector3(...view.translation));
	const meanCentre = centres.reduce((sum, c) => sum.add(c), new THREE.Vector3()).divideScalar(3);
	const points = Array(Math.floor(random() * 4)).fill(null).map(() => {
		let position: THREE.Vector3;
		do
			position = meanCentre.clone().add(new THREE.Vector3(...unit()).multiplyScalar(uniform(POINT_MIN_DISTANCE, 12)));
		while (Math.min(...centres.map(c => c.distanceTo(position))) < POINT_MIN_DISTANCE);
		return {
			position: position.toArray() as Vector3,
			color: hsl(random(), uniform(0.3, 1), uniform(0.5, 0.7)),
			intensity: uniform(0.2, 0.8),
			distance: position.distanceTo(meanCentre) * 2.5,
			decay: 1.5,
		};
	});

	const faceFrames = {};
	FACE_LETTERS.split("").forEach((face, f) => {
		const {right, down} = model.facelets[f * 9];
		faceFrames[face] = {right, down};
	});

	return {
		version: 1,
		seed,
		image: {width, height},
		intrinsics: {fovY, fx, fy, cx, cy, K: [fx, 0, cx, 0, fy, cy, 0, 0, 1]},
		cube: {
			order: 3,
			code: cube.encode(),
			facelets: Array.from(faceletColors, c => FACE_LETTERS[c]).join(""),
			faceOrder: FACE_LETTERS,
			faceFrames,
			scheme: schemeName,
			colors,
			hueGap: hueGap(Object.values(colors)),
			body,
		},
		render: {style, gap, cubieRadius, border, sticker, stickerRadius, stickerPlane, antipop: antipopBuild, cubies,
			stickerRoughness: uniform(0.15, 0.9), bodyRoughness: uniform(0.3, 0.9),
			background, ambient, main, points},
		views,
	};
};


// a state check helper for consumers: the cube a sample shows
export const sampleCube = (sample: Sample): CubeN => new CubeN(3, {code: sample.cube.code});
