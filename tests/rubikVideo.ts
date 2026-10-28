// Run: npx ts-node --project ./tsconfig.node.json tests/rubikVideo.ts [count]
// Test videos with face turns (app/rubikSamples/video.ts): the photo-only part unchanged by the turns, each turn's
// layer rotation (labels' and renderer's angle convention) carrying the state before it onto CubeN's state after it,
// the turning face in sight through the turn and the hold after it.
import * as THREE from "three";

import {FACE_LETTERS, MIN_SIGHT_ANGLE, generateSample, faceletCubie} from "../app/rubikSamples/sampler";
import {generateVideo} from "../app/rubikSamples/video";



let failures = 0;
const check = (condition: boolean, ...message: any[]) => {
	console.assert(condition, ...message);
	if (!condition)
		++failures;
};


const count = Number(process.argv[2]) || 40;
const stats = {turns: 0, frames: 0, minSight: Infinity, reorient: []};

for (let seed = 1; seed <= count; ++seed) {
	const sample = generateSample(seed, {width: 640, height: 480, builds: seed % 2 ? "classic" : "antipop"});
	const tag = `seed ${seed}`;
	const plain = generateVideo(sample);
	const video = generateVideo(sample, {twists: 8});
	stats.frames += video.views.length;

	// without turns as before; with them, the same frames first
	check(plain.video.twists.length === 0 && plain.video.facelets === sample.cube.facelets, tag, "no turns");
	check(JSON.stringify(video.views.slice(0, plain.views.length).map(v => v.stickers)) === JSON.stringify(plain.views.map(v => v.stickers)), tag, "holds unchanged");
	check(video.video.twists.length === 8, tag, "eight turns");

	// facelet k's centre and outward normal on the lattice
	const frames = sample.cube.faceFrames;
	const place = (k: number) => {
		const face = FACE_LETTERS[Math.floor(k / 9)], row = Math.floor((k % 9) / 3), col = k % 3;
		const f = Math.floor(k / 9), axis = Math.floor(f / 2), sign = f % 2 ? 1 : -1;
		const {right, down} = frames[face];
		const normal = [0, 0, 0];
		normal[axis] = sign;
		const cubie = faceletCubie(normal, right, down, row, col);
		return {cubie, point: new THREE.Vector3(...cubie).addScaledVector(new THREE.Vector3(...normal), 0.5)};
	};
	const at = new Map(Array(54).fill(0).map((_, k) => [place(k).point.toArray().map(c => Math.round(c * 2)).join(), k]));

	let before = sample.cube.facelets;
	video.video.twists.forEach((turn, step) => {
		const frame = video.views[turn.twist[0]];
		const {axis, layer, turns} = frame.twist;
		stats.turns++;
		check(frame.facelets === before, tag, step, "turning from the state before");
		// the layer rotated by the full turn (the frames' angle convention) carries the colours onto the state after
		const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3().setComponent(axis, 1), turns * Math.PI / 2);
		const moved = before.split("");
		for (let k = 0; k < 54; ++k) {
			const {cubie, point} = place(k);
			if (cubie[axis] !== layer - 1)
				continue;
			const j = at.get(point.clone().applyQuaternion(rotation).toArray().map(c => Math.round(c * 2)).join());
			moved[j] = before[k];
		}
		check(moved.join("") === turn.facelets, tag, step, turn.move, "layer rotation = CubeN twist");
		// angles grow towards the full turn
		const angles = video.views.slice(turn.twist[0], turn.twist[1]).map(v => v.twist.angle / (turns * Math.PI / 2));
		check(angles.every((a, i) => a > 0 && a < 1 && (i === 0 || a > angles[i - 1])), tag, step, "angles monotone");
		// the turning face in sight from the turn through the hold after it, its centre sticker labelled visible
		const face = turn.move[0];
		for (let i = turn.twist[0]; i < turn.settle[1]; ++i) {
			const view = video.views[i];
			const angle = view.faceAngles[face];
			check(angle > MIN_SIGHT_ANGLE, tag, step, i, "turning face in sight", angle);
			stats.minSight = Math.min(stats.minSight, angle || 0);
			check(view.stickers[FACE_LETTERS.indexOf(face) * 9 + 4].visible, tag, step, i, "turning face centre visible");
		}
		// settle frames show the state after
		check(video.views.slice(turn.settle[0], turn.settle[1]).every(v => v.facelets === turn.facelets && !v.twist), tag, step, "settled");
		// some whole-cube turn before each face turn
		const q0 = new THREE.Quaternion(...video.views[turn.reorient[0] - 1].quaternion), q1 = new THREE.Quaternion(...video.views[turn.twist[0]].quaternion);
		stats.reorient.push(THREE.MathUtils.radToDeg(q0.angleTo(q1)));
		before = turn.facelets;
	});
	check(video.video.facelets === before, tag, "final state");
}

const r = stats.reorient.sort((a, b) => a - b);
console.log(`${count} videos, ${stats.turns} turns, ${stats.frames} frames; turning face sight angle ≥ ${stats.minSight.toFixed(1)}°; `
	+ `whole-cube turn before a face turn: median ${r[r.length >> 1].toFixed(0)}°, min ${r[0].toFixed(0)}°, max ${r[r.length - 1].toFixed(0)}°`);
console.log(failures ? `${failures} failures` : "all passed");
process.exit(failures ? 1 : 0);
