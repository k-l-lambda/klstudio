// Synthetic test video of a hand-held 3×3: the scene of a photo sample (cube, colours, build, lights, camera), with
// the camera still and the cube turned in front of it to show four corners in turn — each held for a while with a
// little hand tremor, eased turns in between. Four corners of one tetrahedron ({RUF, LDF, LUB, RDB} or its mirror)
// cover all six faces, each face in two holds. Pure like sampler.ts: labels only, sampleRenderer draws the frames.
//
// Then optionally (`twists`) a run of random face turns: before each one the cube is turned to the pose nearest the
// current one that shows the turning face (one of that face's four corners), it drifts a little while the layer turns,
// then it is held still for a while. The turning face stays in sight throughout.
//
// A video is a Sample whose `views` are the frames (same label format as a photo view, so the renderer and the
// detector harness take it unchanged), plus `video` with the timeline. Every frame carries its own cube state
// (`facelets`: the state before the turn while a layer is turning) and, while turning, `twist`. Reproducible from
// the sample seed; the twists draw after everything else, so a video without them is the same as before.
import * as THREE from "three";

import {CubeN} from "../../inc/cubeN";
import {FACE_LETTERS, MIN_SIGHT_ANGLE, Sample, ViewLabel, faceletCubie, mulberry32, placeOnCubie} from "./sampler";

type Vector3 = [number, number, number];
type Point2 = [number, number];

export interface VideoOptions {
	fps?: number;
	hold?: number;		// seconds each corner is shown
	turn?: number;		// seconds per turn between corners
	tremor?: number;	// hand tremor while holding: rotation amplitude, degrees (translation follows at 0.02 cubie / degree)
	twists?: number;	// face turns after the four holds (0: none)
	twistHold?: number;	// seconds held after each face turn
	reorient?: number;	// seconds for the whole-cube turn before each face turn
	twistTime?: number;	// seconds per quarter turn (a half turn takes 1.6×)
}

// a layer turning: the face turn `move` (R L U D F B, ' or 2), as CubeN's Twist (axis, layer 0 = negative side,
// quarter turns right-handed about +axis) and the angle reached in this frame
export interface TwistLabel {
	move: string;
	axis: number;
	layer: number;
	turns: number;
	angle: number;		// radians, right-handed about +axis, in the cube frame
	progress: number;	// 0–1
}

export interface FrameLabel extends ViewLabel {
	frame: number;
	time: number;		// seconds
	phase: "hold" | "turn" | "reorient" | "twist" | "settle";	// settle: held after a face turn
	hold: number;		// index of the hold this frame belongs to, or of the hold the turn leaves; twists: 4 + step
	progress: number;	// 0–1 within the phase
	facelets: string;	// the cube state shown (54 colour letters; while turning, the state before the turn)
	step: number;		// face turns completed before this frame
	twist?: TwistLabel;
}

export interface VideoSample extends Omit<Sample, "views"> {
	views: FrameLabel[];
	video: {
		fps: number;
		frames: number;
		holds: {corner: string; visibleFaces: string; start: number; end: number}[];	// frame ranges, end exclusive
		// face turns: frame ranges of the whole-cube turn before, the layer turn and the settle hold after; the state
		// after the turn
		twists: {move: string; corner: string; reorient: [number, number]; twist: [number, number]; settle: [number, number]; facelets: string}[];
		facelets: string;	// final state
	};
}

const TETRAHEDRA: Vector3[][] = [
	[[1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]],
	[[-1, 1, 1], [1, -1, 1], [1, 1, -1], [-1, -1, -1]],
];

const cornerName = (c: Vector3): string => (c[0] > 0 ? "R" : "L") + (c[1] > 0 ? "U" : "D") + (c[2] > 0 ? "F" : "B");

export const generateVideo = (sample: Sample, {fps = 5, hold = 2, turn = 1.2, tremor = 0.6, twists = 0, twistHold = 1.5, reorient = 0.8,
	twistTime = 0.5}: VideoOptions = {}): VideoSample => {
	const random = mulberry32(sample.seed * 7919 + 17);
	const uniform = (a: number, b: number) => a + (b - a) * random();
	const {width, height} = sample.image;
	const {fx, fy, cx, cy, fovY} = sample.intrinsics;
	const tanY = Math.tan(THREE.MathUtils.degToRad(fovY) / 2), tanX = tanY * width / height;
	const distance = sample.views.reduce((sum, view) => sum + Math.hypot(...view.translation), 0) / sample.views.length;
	const project = (p: Vector3): Point2 => [fx * p[0] / p[2] + cx, fy * p[1] / p[2] + cy];

	// hold poses: the camera in the corner's octant, every face of the corner at least MIN_SIGHT_ANGLE off its plane
	// (face `marginAxis` by `margin` more, relaxed if the camera is too close for it), the cube near the image centre,
	// a random roll
	const corners = TETRAHEDRA[Math.floor(random() * 2)].slice();
	for (let i = corners.length - 1; i > 0; --i) {
		const j = Math.floor(random() * (i + 1));
		[corners[i], corners[j]] = [corners[j], corners[i]];
	}
	const holdPose = (corner: Vector3, margin = 0, marginAxis = -1) => {
		for (let attempt = 0; ; ++attempt) {
			const toward = new THREE.Vector3(...corner.map(c => c * uniform(0.35, 1)) as Vector3).normalize();
			const cameraInCube = toward.clone().multiplyScalar(distance);
			const sight = [0, 1, 2].map(axis => {
				const d = cameraInCube.toArray().map((c, k) => k === axis ? c - corner[axis] * 1.5 : c);
				return THREE.MathUtils.radToDeg(Math.asin(d[axis] * corner[axis] / Math.hypot(...d)));
			});
			const extra = attempt > 5000 ? 0 : Math.max(Math.min(margin, 3), margin * (1 - attempt / 500));
			if (Math.min(...sight) <= MIN_SIGHT_ANGLE || (marginAxis >= 0 && sight[marginAxis] <= MIN_SIGHT_ANGLE + extra))
				continue;
			const ndc = [uniform(-0.08, 0.08), uniform(-0.08, 0.08)];
			const ray = new THREE.Vector3(ndc[0] * tanX, ndc[1] * tanY, 1).normalize();
			const quaternion = new THREE.Quaternion().setFromUnitVectors(toward, ray.clone().negate());
			quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(ray.clone().negate(), uniform(-0.6, 0.6) + (random() < 0.5 ? 0 : Math.PI / 2)));
			return {corner, quaternion, translation: ray.clone().multiplyScalar(distance)};
		}
	};
	const holds = corners.map(corner => holdPose(corner));

	// hand tremor: two slow sinusoids per axis, random phases
	const wobble = Array(6).fill(null).map(() => ({f1: uniform(0.3, 0.8), f2: uniform(1.1, 2.2), p1: uniform(0, 2 * Math.PI), p2: uniform(0, 2 * Math.PI)}));
	const tremorAt = (time: number) => wobble.map(w => (Math.sin(2 * Math.PI * w.f1 * time + w.p1) * 0.7 + Math.sin(2 * Math.PI * w.f2 * time + w.p2) * 0.3));

	const holdFrames = Math.round(hold * fps), turnFrames = Math.round(turn * fps);
	type Frame = {quaternion: THREE.Quaternion; translation: THREE.Vector3; phase: FrameLabel["phase"]; hold: number; progress: number;
		step: number; twist?: Omit<TwistLabel, "angle" | "progress">; twistProgress?: number};
	const frames: Frame[] = [];
	const ranges: VideoSample["video"]["holds"] = [];
	const smooth = (s: number) => s * s * (3 - 2 * s);
	holds.forEach((h, i) => {
		ranges.push({corner: cornerName(h.corner), visibleFaces: "", start: frames.length, end: frames.length + holdFrames});
		for (let f = 0; f < holdFrames; ++f)
			frames.push({quaternion: h.quaternion.clone(), translation: h.translation.clone(), phase: "hold", hold: i, progress: (f + 0.5) / holdFrames, step: 0});
		if (i + 1 < holds.length) {
			const next = holds[i + 1];
			for (let f = 1; f <= turnFrames; ++f) {
				const s = f / (turnFrames + 1), e = smooth(s);
				frames.push({quaternion: h.quaternion.clone().slerp(next.quaternion, e), translation: h.translation.clone().lerp(next.translation, e),
					phase: "turn", hold: i, progress: s, step: 0});
			}
		}
	});

	// face turns: a random outer face, not on the axis of the previous one; quarter (either way) or half turn
	const states = [sample.cube.facelets];
	const twistRanges: VideoSample["video"]["twists"] = [];
	let current = holds[holds.length - 1], lastAxis = -1;
	const cube = new CubeN(3, {code: sample.cube.code});
	const letters = () => Array.from(cube.facelets, c => FACE_LETTERS[c]).join("");
	for (let step = 0; step < twists; ++step) {
		let face: string;
		do
			face = "RLUDFB"[Math.floor(random() * 6)];
		while (Math.floor("RLUDFB".indexOf(face) / 2) === lastAxis);
		const r = random(), prime = r >= 0.4 && r < 0.8, double = r >= 0.8;
		const move = face + (double ? "2" : prime ? "'" : "");
		const t = cube.model.faceTwist(face, {prime, double});
		lastAxis = t.axis;
		// target: of the face's four corners, the pose nearest the current one (a few tries each) yet at least 20° away
		// (the cube is always turned some), with a margin so the drift during the turn keeps the face in sight
		const axis = t.axis, sign = "RLUDFB".indexOf(face) % 2 === 0 ? 1 : -1;
		let target = null, best = Infinity, nearest = null, nearestAngle = Infinity;
		for (const a of [-1, 1]) {
			for (const b of [-1, 1]) {
				const corner = [0, 0, 0] as Vector3;
				corner[axis] = sign;
				corner[(axis + 1) % 3] = a;
				corner[(axis + 2) % 3] = b;
				for (let k = 0; k < 3; ++k) {
					const pose = holdPose(corner, 8, axis);
					const angle = current.quaternion.angleTo(pose.quaternion);
					if (angle < best && angle >= THREE.MathUtils.degToRad(20))
						[best, target] = [angle, pose];
					if (angle < nearestAngle)
						[nearestAngle, nearest] = [angle, pose];
				}
			}
		}
		target = target || nearest;
		// drift while the layer turns: up to 6° about a random axis, less if it would take the face within 2° (tremor)
		// of MIN_SIGHT_ANGLE
		const sightOf = (quaternion: THREE.Quaternion) => {
			const camera = target.translation.clone().negate().applyQuaternion(quaternion.clone().invert()).toArray();
			camera[axis] -= sign * 1.5;
			return THREE.MathUtils.radToDeg(Math.asin(camera[axis] * sign / Math.hypot(...camera)));
		};
		const driftAxis = new THREE.Vector3(uniform(-1, 1), uniform(-1, 1), uniform(-1, 1)).normalize();
		let driftAngle = THREE.MathUtils.degToRad(uniform(2, 6)), drifted: THREE.Quaternion;
		for (;;) {
			drifted = new THREE.Quaternion().setFromAxisAngle(driftAxis, driftAngle).multiply(target.quaternion);
			if (sightOf(drifted) > MIN_SIGHT_ANGLE + 2 || driftAngle < 1e-3)
				break;
			driftAngle /= 2;
		}
		const reorientFrames = Math.max(1, Math.round(reorient * fps));
		const twistFrames = Math.max(1, Math.round(twistTime * (double ? 1.6 : 1) * fps));
		const settleFrames = Math.max(1, Math.round(twistHold * fps));
		const holdIndex = holds.length + step;
		const range = {move, corner: cornerName(target.corner), reorient: [frames.length, 0], twist: [0, 0], settle: [0, 0], facelets: ""} as VideoSample["video"]["twists"][0];
		for (let f = 1; f <= reorientFrames; ++f) {
			const s = f / (reorientFrames + 1), e = smooth(s);
			frames.push({quaternion: current.quaternion.clone().slerp(target.quaternion, e), translation: current.translation.clone().lerp(target.translation, e),
				phase: "reorient", hold: holdIndex, progress: s, step});
		}
		range.reorient[1] = range.twist[0] = frames.length;
		const twistInfo = {move, axis: t.axis, layer: t.layers[0], turns: t.turns};
		for (let f = 1; f <= twistFrames; ++f) {
			const s = f / (twistFrames + 1);
			frames.push({quaternion: target.quaternion.clone().slerp(drifted, s), translation: target.translation.clone(), phase: "twist", hold: holdIndex, progress: s,
				step, twist: twistInfo, twistProgress: smooth(s)});
		}
		cube.twist(t);
		states.push(letters());
		range.twist[1] = range.settle[0] = frames.length;
		for (let f = 0; f < settleFrames; ++f)
			frames.push({quaternion: drifted.clone(), translation: target.translation.clone(), phase: "settle", hold: holdIndex, progress: (f + 0.5) / settleFrames, step: step + 1});
		range.settle[1] = frames.length;
		range.facelets = states[states.length - 1];
		twistRanges.push(range);
		current = {corner: target.corner, quaternion: drifted, translation: target.translation};
	}

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
		const facelets = states[frame.step];
		// a turning layer: its stickers rotated about the axis (cube frame), seen when their turned face looks at the camera
		const twistAngle = frame.twist ? frame.twist.turns * Math.PI / 2 * frame.twistProgress : 0;
		const twistRotation = frame.twist && new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3().setComponent(frame.twist.axis, 1), twistAngle);
		const turnPoint = (p: Vector3, moving: boolean): Vector3 => moving ? new THREE.Vector3(...p).applyQuaternion(twistRotation).toArray() as Vector3 : p;
		const stickers = Array(54).fill(null).map((_, k) => {
			const face = FACE_LETTERS[Math.floor(k / 9)], row = Math.floor((k % 9) / 3), col = k % 3;
			const f = Math.floor(k / 9), axis = Math.floor(f / 2), sign = f % 2 ? 1 : -1;
			const {right, down} = faceFrames[face];
			const normal = [0, 0, 0];
			normal[axis] = sign;
			const onCubie = faceletCubie(normal, right, down, row, col);
			const moving = !!frame.twist && Math.round(onCubie[frame.twist.axis]) === frame.twist.layer - 1;
			const flat = [0, 1, 2].map(i => normal[i] * stickerPlane + right[i] * (col - 1) + down[i] * (row - 1)) as Vector3;
			const centre = turnPoint(placeOnCubie(flat, onCubie, sample.render.cubies), moving);
			const at = (a: number, b: number): Vector3 => turnPoint(placeOnCubie(flat.map((c, i) => c + right[i] * a * half + down[i] * b * half) as Vector3, onCubie, sample.render.cubies), moving);
			const quad = [at(-1, -1), at(1, -1), at(1, 1), at(-1, 1)].map(p => project(toCamera(p)));
			// inFrame here is the share of the square's corners inside the image (the photo samples clip the area)
			const inside = quad.filter(([u, v]) => u >= 0 && u <= width && v >= 0 && v <= height).length / 4;
			// facing the camera: a still sticker when its face is visible; a turning one when its turned normal looks at
			// the camera (mid-turn it can still be hidden by the next layer: the labels don't model that)
			let facing = visible.includes(face);
			if (moving) {
				const n = turnPoint(normal as Vector3, true);
				facing = [0, 1, 2].reduce((sum, i) => sum + n[i] * (cameraInCube[i] - centre[i]), 0) > 0;
			}
			const shown = facing && inside > 0;
			return {index: k, face, row, col, color: facelets[k], visible: shown, inFrame: shown ? inside : 0,
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
			corner: frame.phase === "hold" ? cornerName(holds[frame.hold].corner) : frame.phase === "settle" ? twistRanges[frame.step - 1].corner : "",
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
			facelets,
			step: frame.step,
			...frame.twist ? {twist: {...frame.twist, angle: twistAngle, progress: frame.twistProgress}} : {},
		};
	});
	ranges.forEach(range => range.visibleFaces = frameLabels[range.start].visibleFaces);

	return {...sample, views: frameLabels, video: {fps, frames: frameLabels.length, holds: ranges, twists: twistRanges, facelets: states[states.length - 1]}};
};
