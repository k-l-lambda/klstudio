
/*
 * Acceptance test for the S^3 flat-projection transform.
 *
 * A ball starts at the camera and travels one full great circle of an S^3 of
 * radius R = 1000 (circumference 2000*pi, antipode at 1000*pi). We track the
 * apparent size of the NEAR (front) image along the trip and assert the schema:
 *
 *   0    -> 500pi : shrinks   (theta 0 -> pi/2)
 *   500pi-> 1000pi: grows     (theta pi/2 -> pi, toward antipode)
 *   1000pi       : near & far images equal size AND equal distance -> merge
 *   1000pi->1500pi: shrinks   (former far image is now the short arc)
 *   1500pi->2000pi: grows     (that image comes near)
 *
 * Plus: minima at 500pi and 1500pi, and near/far images always share apparent
 * size (they differ only in direction and distance).
 *
 * Run: npx ts-node --project ./tsconfig.node.json tests/s3HyperTransform.ts
 */

import * as THREE from "three";
import {imageProjection, buildImageMatrix} from "../app/s3/hyperTransform";



const R = 1000;
const PI = Math.PI;

let failures = 0;
const check = (label: string, cond: boolean): void => {
	console.assert(cond, `FAIL: ${label}`);
	if (!cond)
		++failures;
	else
		console.log(`ok: ${label}`);
};


/** Apparent size of the near (short-arc) image at arc distance d. */
const nearSize = (d: number): number => imageProjection(d, R, false).apparentSize;


/** Assert strict monotonic trend of nearSize across (a, b) by sampling. */
const assertTrend = (a: number, b: number, wantIncreasing: boolean, label: string): void => {
	const steps = 50;
	let monotone = true;
	let prev = nearSize(a + (b - a) * (0.5 / steps));
	for (let i = 1; i < steps; ++i) {
		const d = a + (b - a) * ((i + 0.5) / steps);
		const cur = nearSize(d);
		const ok = wantIncreasing ? cur > prev : cur < prev;
		if (!ok)
			monotone = false;
		prev = cur;
	}
	check(label, monotone);
};


// --- Monotonic trends of the near image over the four quarters. ------------
assertTrend(0, 500 * PI, false, "near image shrinks on 0 .. 500pi");
assertTrend(500 * PI, 1000 * PI, true, "near image grows on 500pi .. 1000pi");
assertTrend(1000 * PI, 1500 * PI, false, "near image shrinks on 1000pi .. 1500pi");
assertTrend(1500 * PI, 2000 * PI, true, "near image grows on 1500pi .. 2000pi");


// --- Local minima at the equator crossings (theta = pi/2 => size == 1). ----
const sizeAtMin1 = nearSize(500 * PI);
const sizeAtMin2 = nearSize(1500 * PI);
check("size == 1 at d = 500pi (equator)", Math.abs(sizeAtMin1 - 1) < 1e-6);
check("size == 1 at d = 1500pi (equator)", Math.abs(sizeAtMin2 - 1) < 1e-6);
check("d=500pi is a local min", nearSize(500 * PI) < nearSize(400 * PI) && nearSize(500 * PI) < nearSize(600 * PI));
check("d=1500pi is a local min", nearSize(1500 * PI) < nearSize(1400 * PI) && nearSize(1500 * PI) < nearSize(1600 * PI));


// --- Merge at the antipode: near & far equal in size AND render distance. ---
const antipode = 1000 * PI;
const near = imageProjection(antipode, R, false);
const far = imageProjection(antipode, R, true);
check("antipode: near & far equal apparent size", Math.abs(near.apparentSize - far.apparentSize) < 1e-6);
check("antipode: near & far equal render distance", Math.abs(near.renderDistance - far.renderDistance) < 1e-6);
// renderDistance is the geodesic ANGLE (radians, in (0, pi]), not arc length;
// this keeps the embedded flat scene compact while preserving apparentSize =
// 1/sin(theta). At the antipode both images merge at angle pi.
check("antipode: both at render distance pi", Math.abs(near.renderDistance - PI) < 1e-3);


// --- Near and far images always share apparent size. -----------------------
let sizesMatch = true;
for (let d = 10 * PI; d < 2000 * PI; d += 37 * PI) {
	const n = imageProjection(d, R, false).apparentSize;
	const f = imageProjection(d, R, true).apparentSize;
	if (Math.abs(n - f) > 1e-6)
		sizesMatch = false;
}
check("near & far apparent size match for all d", sizesMatch);


// --- Far image sits farther than near, except at the antipode. -------------
check("far render distance > near off-antipode", imageProjection(300 * PI, R, true).renderDistance > imageProjection(300 * PI, R, false).renderDistance);


// --- Far image is a point inversion: upside-down + depth-reversed (det < 0). -
// Build near/far matrices for a puppet a short arc ahead (dir = -Z) / behind
// (dir = +Z), with identity orientation, and inspect their 3x3 linear parts.
const det3 = (m: THREE.Matrix4): number => {
	const e = m.elements; // column-major; upper-left 3x3
	return (
		e[0] * (e[5] * e[10] - e[6] * e[9]) -
		e[4] * (e[1] * e[10] - e[2] * e[9]) +
		e[8] * (e[1] * e[6] - e[2] * e[5])
	);
};
const dirF = new THREE.Vector3(0, 0, -1);
const dirB = new THREE.Vector3(0, 0, 1);
const q = new THREE.Quaternion();
const nearM = buildImageMatrix(300 * PI, R, dirF, q, false).matrix;
const farM = buildImageMatrix(300 * PI, R, dirB, q, true).matrix;
check("near image preserves orientation (det > 0)", det3(nearM) > 0);
check("far image reverses orientation (det < 0)", det3(farM) < 0);

// A +up point on the far object (local +Y) must map to a -up world offset from
// the far image center (upside-down). Compare a local +Y vs the image origin.
const farOrigin = new THREE.Vector3(0, 0, 0).applyMatrix4(farM);
const farUp = new THREE.Vector3(0, 1, 0).applyMatrix4(farM).sub(farOrigin);
check("far image is upside-down (local +Y -> world -Y)", farUp.y < 0);


console.log(failures === 0 ? "\nAll S^3 transform assertions passed." : `\n${failures} assertion(s) FAILED.`);
if (failures > 0)
	process.exit(1);
