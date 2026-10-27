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
		scheme: string;
		colors: Record<string, string>;	// sticker colour (sRGB hex) per face letter
		body: string;
	};
	render: {
		style: "stickered" | "stickerless";	// stickerless: the colour covers the whole cubie face, rounded edges included
		gap: number;		// space between cubies
		cubieRadius: number;	// rounded cubie edges
		border: number;		// cubie face margin around the sticker (0 when stickerless)
		// side of the coloured square. Stickerless: the cubie side; the colour runs over the rounded edges up to their
		// 45° line, so the visible colour ends about 0.3 cubieRadius inside the label square (the edge curves away), and
		// a sliver of a hidden face's colour can show on the rounded edges (still visible: false)
		sticker: number;
		stickerRadius: number;	// rounded sticker corners (the label corners are the square's)
		stickerPlane: number;	// distance of the coloured surface from the cube centre
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


export interface SampleOptions {
	width?: number;
	height?: number;
}


export const generateSample = (seed: number, {width = 640, height = 480}: SampleOptions = {}): Sample => {
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
	const scheme = pick(SCHEMES);
	const roles = scheme.faces || (() => {
		const roles = Object.keys(PALETTE);
		for (let i = roles.length - 1; i > 0; --i) {
			const j = Math.floor(random() * (i + 1));
			[roles[i], roles[j]] = [roles[j], roles[i]];
		}
		return roles;
	})();
	const colors: Record<string, string> = {};
	FACE_LETTERS.split("").forEach((face, i) => {
		const color = new THREE.Color(PALETTE[roles[i]]);
		color.offsetHSL(uniform(-0.015, 0.015), uniform(-0.12, 0.05), uniform(-0.07, 0.05));
		colors[face] = hex(color);
	});
	const body = hex(new THREE.Color(pick(BODIES).color).offsetHSL(0, 0, uniform(-0.03, 0.03)));

	// cube build
	// cube build: a quarter stickerless; stickered mostly with a thin border (the sticker covers 84–94 % of the cubie
	// face's width), a few with a thick one (72–84 %). A sticker sits on the flat part, so border ≥ the cubie radius.
	const style = random() < 0.25 ? "stickerless" : "stickered";
	const gap = uniform(0.005, 0.03);
	const side = 1 - gap;
	let cubieRadius: number, border: number, sticker: number, stickerRadius: number;
	if (style === "stickerless") {
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
				const centre = [0, 1, 2].map(i => normal[i] * stickerPlane + right[i] * (col - 1) + down[i] * (row - 1)) as Vector3;
				const s = sticker / 2;
				const at = (a: number, b: number): Vector3 => centre.map((c, i) => c + right[i] * a * s + down[i] * b * s) as Vector3;
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
			scheme: scheme.name,
			colors,
			body,
		},
		render: {style, gap, cubieRadius, border, sticker, stickerRadius, stickerPlane,
			stickerRoughness: uniform(0.15, 0.9), bodyRoughness: uniform(0.3, 0.9),
			background, ambient, main, points},
		views,
	};
};


// a state check helper for consumers: the cube a sample shows
export const sampleCube = (sample: Sample): CubeN => new CubeN(3, {code: sample.cube.code});
