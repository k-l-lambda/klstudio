// Run: npx ts-node --project ./tsconfig.node.json tests/rubikSamples.ts [count]
import * as THREE from "three";

import {FACE_LETTERS, MIN_CHROMA, MIN_HUE_GAP, MIN_SATURATION, MIN_SIGHT_ANGLE, generateSample, hexToLch, isNearWhite, sampleCube, saturation} from "../app/rubikSamples/sampler";



let failures = 0;
const check = (condition: boolean, ...message: any[]) => {
	console.assert(condition, ...message);
	if (!condition)
		++failures;
};


const count = Number(process.argv[2]) || 500;
const schemeSet = (process.argv[3] || "standard") as "standard" | "nonstandard" | "all";
const stats = {fovY: [], fill: [], points: [0, 0, 0, 0], schemes: {}, sightAngle: [], hiddenAngle: [], coverage: [], styles: {}, cropped: 0, partial: 0, pointDistance: [], nonstandard: 0, saturation: [], offsets: [], bleeds: [], projectionError: 0};

for (let seed = 1; seed <= count; ++seed) {
	const width = seed % 3 ? 640 : 480, height = seed % 3 ? 480 : 640;
	const sample = generateSample(seed, {width, height, schemes: schemeSet});
	const tag = `seed ${seed}`;

	// determinism
	if (seed <= 20)
		check(JSON.stringify(generateSample(seed, {width, height, schemes: schemeSet})) === JSON.stringify(sample), tag, "deterministic");

	// the state
	const cube = sampleCube(sample);
	check(cube.validate(), tag, "valid state");
	check(sample.cube.facelets.length === 54, tag, "54 facelets");
	FACE_LETTERS.split("").forEach((face, f) => {
		check(sample.cube.facelets.split("").filter(c => c === face).length === 9, tag, "nine of", face);
		check(sample.cube.facelets[f * 9 + 4] === face, tag, "centre", face);
	});
	check(new Set(Object.values(sample.cube.colors)).size === 6, tag, "six distinct colours");
	if (sample.cube.scheme.startsWith("nonstandard")) {
		// at most one near-white; every other colour saturated (HSV S and C*); their Lab hues MIN_HUE_GAP apart
		const hexes = Object.values(sample.cube.colors);
		const lch = hexes.map(hexToLch);
		const whites = lch.filter(isNearWhite).length;
		const others = hexes.filter((c, i) => !isNearWhite(lch[i]));
		check(whites <= 1, tag, "near-whites", whites);
		check(others.every(c => saturation(c) >= MIN_SATURATION && hexToLch(c)[1] >= MIN_CHROMA), tag, "saturated", JSON.stringify(others.map(c => [c, saturation(c).toFixed(2)])));
		check(sample.cube.hueGap >= MIN_HUE_GAP, tag, "hue gap", sample.cube.hueGap);
		others.forEach(c => stats.saturation.push(saturation(c)));
		stats.nonstandard += 1;
	}

	// coverage: 3 faces per view, all 6 together, one shared face per pair
	const sets = sample.views.map(view => new Set(view.visibleFaces.split("")));
	check(sets.every(set => set.size === 3), tag, "3 faces per view");
	check(new Set(sample.views.flatMap(view => view.visibleFaces.split(""))).size === 6, tag, "all faces covered");
	for (let a = 0; a < 3; ++a) {
		for (let b = a + 1; b < 3; ++b)
			check([...sets[a]].filter(face => sets[b].has(face)).length === 1, tag, "pair shares one face", a, b);
	}

	const {fovY} = sample.intrinsics;
	const camera = new THREE.PerspectiveCamera(fovY, width / height, 0.1, 100);
	camera.updateMatrixWorld();
	camera.updateProjectionMatrix();

	for (const view of sample.views) {
		const R = view.rotation, t = view.translation;
		// rotation is proper and orthonormal
		const m = new THREE.Matrix3().set(R[0], R[1], R[2], R[3], R[4], R[5], R[6], R[7], R[8]);
		check(Math.abs(m.determinant() - 1) < 1e-9, tag, "det R = 1");
		const q = new THREE.Quaternion(...view.quaternion);
		const fromQ = new THREE.Matrix4().makeRotationFromQuaternion(q).elements;
		check([0, 1, 2].every(r => [0, 1, 2].every(c => Math.abs(fromQ[c * 4 + r] - R[r * 3 + c]) < 1e-9)), tag, "quaternion = rotation");

		// the camera sees exactly its corner's faces, every one of the six face centres at a sight angle > MIN_SIGHT_ANGLE
		// from its plane (hidden faces on the far side)
		FACE_LETTERS.split("").forEach((face, f) => {
			const axis = Math.floor(f / 2), sign = f % 2 ? 1 : -1;
			const d = view.cameraInCube.map((c, k) => k === axis ? c - sign * 1.5 : c);
			const angle = THREE.MathUtils.radToDeg(Math.asin(d[axis] * sign / Math.hypot(...d)));
			const visible = view.visibleFaces.includes(face);
			check(visible ? angle > MIN_SIGHT_ANGLE : angle < -MIN_SIGHT_ANGLE, tag, "sight angle", face, angle);
			if (visible) {
				check(Math.abs(angle - view.faceAngles[face]) < 1e-9, tag, "faceAngles label", face);
				stats.sightAngle.push(angle);
			}
			else
				stats.hiddenAngle.push(-angle);
		});

		// framing: centre near the image centre, slight crop at most; stickers of visible faces in frame unless cropped
		check(Math.abs(view.offset[0]) <= 0.12 + 1e-9 && Math.abs(view.offset[1]) <= 0.12 + 1e-9, tag, "centre offset", view.offset);
		check(view.bleed <= 0.04 * Math.min(width, height) + 1e-9, tag, "bleed", view.bleed);
		const visible = view.stickers.filter(s => s.visible);
		check(visible.length <= 27 && visible.every(s => view.visibleFaces.includes(s.face)), tag, "visible stickers on visible faces");
		view.stickers.forEach(s => {
			const inside = s.corners.every(([u, v]) => u >= 0 && v >= 0 && u <= width && v <= height);
			check(s.inFrame >= 0 && s.inFrame <= 1 + 1e-9 && (s.visible === s.inFrame > 0), tag, "inFrame range", s.index, s.inFrame);
			if (view.visibleFaces.includes(s.face))
				check(inside ? Math.abs(s.inFrame - 1) < 1e-9 : s.inFrame < 1, tag, "inFrame vs corners", s.index, s.inFrame);
		});
		// every face centre sticker stays in frame
		check(view.visibleFaces.split("").every(face => view.stickers[FACE_LETTERS.indexOf(face) * 9 + 4].inFrame === 1), tag, "face centres in frame");
		stats.cropped += view.bleed > 0 ? 1 : 0;
		stats.partial += visible.filter(s => s.inFrame < 1).length;
		stats.offsets.push(Math.max(Math.abs(view.offset[0]), Math.abs(view.offset[1])));
		stats.bleeds.push(view.bleed);

		// labels agree with an independent three.js projection (three.js camera frame = diag(1, -1, -1) of ours)
		const group = new THREE.Object3D();
		group.quaternion.copy(new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().set(
			R[0], R[1], R[2], 0, -R[3], -R[4], -R[5], 0, -R[6], -R[7], -R[8], 0, 0, 0, 0, 1)));
		group.position.set(t[0], -t[1], -t[2]);
		group.updateMatrixWorld();
		for (const s of visible) {
			const frame = sample.cube.faceFrames[s.face];
			const f = FACE_LETTERS.indexOf(s.face), axis = Math.floor(f / 2), sign = f % 2 ? 1 : -1;
			const local = new THREE.Vector3().setComponent(axis, sign * sample.render.stickerPlane);
			local.addScaledVector(new THREE.Vector3(...frame.right), s.col - 1).addScaledVector(new THREE.Vector3(...frame.down), s.row - 1);
			const ndc = group.localToWorld(local).project(camera);
			const u = (ndc.x + 1) / 2 * width, v = (1 - ndc.y) / 2 * height;
			const error = Math.hypot(u - s.center[0], v - s.center[1]);
			stats.projectionError = Math.max(stats.projectionError, error);
			// and the sticker corners go clockwise on screen (seen from outside, image y down)
			const [a, b, c] = s.corners;
			check((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]) > 0, tag, "corners clockwise", s.index);
		}

		stats.fill.push(view.fill);
	}

	// build: stickerless covers the cubie face; stickered stays on its flat part, mostly thin borders
	const r = sample.render;
	if (r.style === "stickerless")
		check(r.border === 0 && Math.abs(r.sticker - (1 - r.gap)) < 1e-12, tag, "stickerless covers the face");
	else {
		check(r.border >= r.cubieRadius && Math.abs(r.sticker + 2 * r.border - (1 - r.gap)) < 1e-12, tag, "sticker on the flat part");
		stats.coverage.push(r.sticker / (1 - r.gap));
	}
	stats.styles[r.style] = (stats.styles[r.style] || 0) + 1;

	// point lights: capped, and never close to the cube in any view
	r.points.forEach(point => {
		const distance = Math.min(...sample.views.map(view => Math.hypot(...point.position.map((c, k) => c - view.translation[k]))));
		check(point.intensity <= 0.8 && distance >= 7 - 1e-9, tag, "point light", point.intensity, distance);
		stats.pointDistance.push(distance);
	});

	stats.fovY.push(fovY);
	++stats.points[sample.render.points.length];
	stats.schemes[sample.cube.scheme] = (stats.schemes[sample.cube.scheme] || 0) + 1;
}

check(stats.projectionError < 1e-6, "projection error", stats.projectionError);

const range = (a: number[]) => `${Math.min(...a).toFixed(2)}..${Math.max(...a).toFixed(2)}`;
console.log(`schemes ${schemeSet}: ${stats.nonstandard} non-standard` + (stats.saturation.length ? `, saturation of the non-white colours ${range(stats.saturation)}` : ""));
console.log(`${count} samples: fovY ${range(stats.fovY)}, fill ${range(stats.fill)}, sight angles visible ${range(stats.sightAngle)}°, hidden ${range(stats.hiddenAngle)}°`);
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
console.log(`fill mean ${mean(stats.fill).toFixed(3)}, centre offset ≤ ${Math.max(...stats.offsets).toFixed(3)}, cropped views ${stats.cropped}/${count * 3} (bleed ≤ ${Math.max(...stats.bleeds).toFixed(1)} px), partly cut stickers ${stats.partial}`);
const thick = stats.coverage.filter(c => c < 0.84).length;
console.log(`styles ${JSON.stringify(stats.styles)}, sticker coverage ${range(stats.coverage)} (thick border < 0.84: ${thick} = ${(thick / stats.coverage.length * 100).toFixed(1)} % of stickered)`);
console.log(`point lights 0/1/2/3: ${stats.points.join("/")}, distance to cube ${range(stats.pointDistance)}, schemes ${JSON.stringify(stats.schemes)}, max projection error ${stats.projectionError.toExponential(1)} px`);

console.log(failures ? `${failures} failures` : "all passed");
process.exit(failures ? 1 : 0);
