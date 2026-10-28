// Synthetic test video of a hand-held 3×3: the scene of a photo sample (cube, colours, build, lights, camera), with
// the camera still and the cube turned in front of it to show four corners in turn — each held for a while with a
// little hand tremor, eased turns in between. Four corners of one tetrahedron ({RUF, LDF, LUB, RDB} or its mirror)
// cover all six faces, each face in two holds. Pure like sampler.ts: labels only, sampleRenderer draws the frames.
//
// A video is a Sample whose `views` are the frames (same label format as a photo view, so the renderer and the
// detector harness take it unchanged), plus `video` with the timeline. Reproducible from the sample seed.
import * as THREE from "three";

import {FACE_LETTERS, MIN_SIGHT_ANGLE, Sample, ViewLabel, faceletCubie, mulberry32, placeOnCubie} from "./sampler";

type Vector3 = [number, number, number];
type Point2 = [number, number];

export interface VideoOptions {
	fps?: number;
	hold?: number;		// seconds each corner is shown
	turn?: number;		// seconds per turn between corners
	tremor?: number;	// hand tremor while holding: rotation amplitude, degrees (translation follows at 0.02 cubie / degree)
}

export interface FrameLabel extends ViewLabel {
	frame: number;
	time: number;		// seconds
	phase: "hold" | "turn";
	hold: number;		// index of the hold this frame belongs to, or of the hold the turn leaves
	progress: number;	// 0–1 within the phase
}

export interface VideoSample extends Omit<Sample, "views"> {
	views: FrameLabel[];
	video: {
		fps: number;
		frames: number;
		holds: {corner: string; visibleFaces: string; start: number; end: number}[];	// frame ranges, end exclusive
	};
}

const TETRAHEDRA: Vector3[][] = [
	[[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]],
	[[-1, 1, 1], [1, -1, 1], [1, 1, -1], [-1, -1, -1]],
];

const cornerName = (c: Vector3): string => (c[0] > 0 ? "R" : "L") + (c[1] > 0 ? "U" : "D") + (c[2] > 0 ? "F" : "B");

export const generateVideo = (sample: Sample, {fps = 5, hold = 2, turn = 1.2, tremor = 0.6}: VideoOptions = {}): VideoSample => {
	const random = mulberry32(sample.seed * 7919 + 17);
	const uniform = (a: number, b: number) => a + (b - a) * random();
	const {width, height} = sample.image;
	const {fx, fy, cx, cy, fovY} = sample.intrinsics;
	const tanY = Math.tan(THREE.MathUtils.degToRad(fovY) / 2), tanX = tanY * width / height;
	const distance = sample.views.reduce((sum, view) => sum + Math.hypot(...view.translation), 0) / sample.views.length;
	const project = (p: Vector3): Point2 => [fx * p[0] / p[2] + cx, fy * p[1] / p[2] + cy];

	// hold poses: the camera in the corner's octant, every face of the corner at least MIN_SIGHT_ANGLE off its plane,
	// the cube near the image centre, a random roll
	const corners = TETRAHEDRA[Math.floor(random() * 2)].slice();
	for (let i = corners.length - 1; i > 0; --i) {
		const j = Math.floor(random() * (i + 1));
		[corners[i], corners[j]] = [corners[j], corners[i]];
	}
	const holds = corners.map(corner => {
		for (;;) {
			const toward = new THREE.Vector3(...corner.map(c => c * uniform(0.35, 1)) as Vector3).normalize();
			const cameraInCube = toward.clone().multiplyScalar(distance);
			const sight = [0, 1, 2].map(axis => {
				const d = cameraInCube.toArray().map((c, k) => k === axis ? c - corner[axis] * 1.5 : c);
				return THREE.MathUtils.radToDeg(Math.asin(d[axis] * corner[axis] / Math.hypot(...d)));
			});
			if (Math.min(...sight) <= MIN_SIGHT_ANGLE)
				continue;
			const ndc = [uniform(-0.08, 0.08), uniform(-0.08, 0.08)];
			const ray = new THREE.Vector3(ndc[0] * tanX, ndc[1] * tanY, 1).normalize();
			const quaternion = new THREE.Quaternion().setFromUnitVectors(toward, ray.clone().negate());
			quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(ray.clone().negate(), uniform(-0.6, 0.6) + (random() < 0.5 ? 0 : Math.PI / 2)));
			return {corner, quaternion, translation: ray.clone().multiplyScalar(distance)};
		}
	});

	// hand tremor: two slow sinusoids per axis, random phases
	const wobble = Array(6).fill(null).map(() => ({f1: uniform(0.3, 0.8), f2: uniform(1.1, 2.2), p1: uniform(0, 2 * Math.PI), p2: uniform(0, 2 * Math.PI)}));
	const tremorAt = (time: number) => wobble.map(w => (Math.sin(2 * Math.PI * w.f1 * time + w.p1) * 0.7 + Math.sin(2 * Math.PI * w.f2 * time + w.p2) * 0.3));

	const holdFrames = Math.round(hold * fps), turnFrames = Math.round(turn * fps);
	const frames: {quaternion: THREE.Quaternion; translation: THREE.Vector3; phase: "hold" | "turn"; hold: number; progress: number}[] = [];
	const ranges: VideoSample["video"]["holds"] = [];
	holds.forEach((h, i) => {
		ranges.push({corner: cornerName(h.corner), visibleFaces: "", start: frames.length, end: frames.length + holdFrames});
		for (let f = 0; f < holdFrames; ++f)
			frames.push({quaternion: h.quaternion.clone(), translation: h.translation.clone(), phase: "hold", hold: i, progress: (f + 0.5) / holdFrames});
		if (i + 1 < holds.length) {
			const next = holds[i + 1];
			for (let f = 1; f <= turnFrames; ++f) {
				const s = f / (turnFrames + 1), e = s * s * (3 - 2 * s);	// smoothstep
				frames.push({quaternion: h.quaternion.clone().slerp(next.quaternion, e), translation: h.translation.clone().lerp(next.translation, e),
					phase: "turn", hold: i, progress: s});
			}
		}
	});

	const stickerPlane = sample.render.stickerPlane, half = sample.render.sticker / 2;
	const frameLabels: FrameLabel[] = frames.map((frame, index) => {
		const time = index / fps;
		const w = tremorAt(time);
		const rad = THREE.MathUtils.degToRad(tremor);
		const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(w[0] * rad, w[1] * rad, w[2] * rad)).multiply(frame.quaternion);
		const t = frame.translation.clone().add(new THREE.Vector3(w[3], w[4], w[5]).multiplyScalar(tremor * 0.02));
		const e = new THREE.Matrix4().makeRotationFromQuaternion(quaternion).elements;	// column-major
		const rotation = [e[0], e[4], e[8], e[1], e[5], e[9], e[2], e[6], e[10]];
		const toCamera = (p: Vector3): Vector3 => [0, 1, 2].map(r => rotation[r * 3] * p[0] + rotation[r * 3 + 1] * p[1] + rotation[r * 3 + 2] * p[2] + t.getComponent(r)) as Vector3;
		// camera centre in the cube frame: -Rᵀ t
		const cameraInCube = [0, 1, 2].map(c => -(rotation[c] * t.x + rotation[3 + c] * t.y + rotation[6 + c] * t.z)) as Vector3;

		// a face is visible when the camera is in front of its plane; its sight angle as in the photo samples
		const faceAngles: Record<string, number> = {};
		const visible = FACE_LETTERS.split("").filter((face, f) => {
			const axis = Math.floor(f / 2), sign = f % 2 ? 1 : -1;
			const d = cameraInCube.map((c, k) => k === axis ? c - sign * 1.5 : c);
			const angle = THREE.MathUtils.radToDeg(Math.asin(d[axis] * sign / Math.hypot(...d)));
			if (angle > 0)
				faceAngles[face] = angle;
			return angle > 0;
		});
		const faceFrames = sample.cube.faceFrames;
		const stickers = Array(54).fill(null).map((_, k) => {
			const face = FACE_LETTERS[Math.floor(k / 9)], row = Math.floor((k % 9) / 3), col = k % 3;
			const f = Math.floor(k / 9), axis = Math.floor(f / 2), sign = f % 2 ? 1 : -1;
			const {right, down} = faceFrames[face];
			const normal = [0, 0, 0];
			normal[axis] = sign;
			const onCubie = faceletCubie(normal, right, down, row, col);
			const flat = [0, 1, 2].map(i => normal[i] * stickerPlane + right[i] * (col - 1) + down[i] * (row - 1)) as Vector3;
			const centre = placeOnCubie(flat, onCubie, sample.render.cubies);
			const at = (a: number, b: number): Vector3 => placeOnCubie(flat.map((c, i) => c + right[i] * a * half + down[i] * b * half) as Vector3, onCubie, sample.render.cubies);
			const quad = [at(-1, -1), at(1, -1), at(1, 1), at(-1, 1)].map(p => project(toCamera(p)));
			// inFrame here is the share of the square's corners inside the image (the photo samples clip the area)
			const inside = quad.filter(([u, v]) => u >= 0 && u <= width && v >= 0 && v <= height).length / 4;
			const shown = visible.includes(face) && inside > 0;
			return {index: k, face, row, col, color: sample.cube.facelets[k], visible: shown, inFrame: shown ? inside : 0,
				corners: quad, center: project(toCamera(centre))};
		});
		const outline: Point2[] = [];
		for (const x of [-1.5, 1.5]) {
			for (const y of [-1.5, 1.5]) {
				for (const z of [-1.5, 1.5])
					outline.push(project(toCamera([x, y, z])));
			}
		}
		const us = outline.map(p => p[0]), vs = outline.map(p => p[1]);
		const [u0, v0] = project(t.toArray() as Vector3);
		return {
			corner: frame.phase === "hold" ? cornerName(holds[frame.hold].corner) : "",
			visibleFaces: visible.join(""),
			rotation,
			translation: t.toArray() as Vector3,
			quaternion: [quaternion.x, quaternion.y, quaternion.z, quaternion.w],
			cameraInCube,
			faceAngles,
			fill: Math.max((Math.max(...us) - Math.min(...us)) / width, (Math.max(...vs) - Math.min(...vs)) / height),
			offset: [(u0 - cx) / (width / 2), (v0 - cy) / (height / 2)],
			bleed: Math.max(0, ...outline.map(([u, v]) => Math.max(-u, -v, u - width, v - height))),
			stickers,
			frame: index,
			time,
			phase: frame.phase,
			hold: frame.hold,
			progress: frame.progress,
		};
	});
	ranges.forEach(range => range.visibleFaces = frameLabels[range.start].visibleFaces);

	return {...sample, views: frameLabels, video: {fps, frames: frameLabels.length, holds: ranges}};
};
