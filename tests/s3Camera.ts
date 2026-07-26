
/*
 * Acceptance test for the S^3 moving camera (app/s3/camera.ts).
 *
 * Run: npx ts-node --project ./tsconfig.node.json tests/s3Camera.ts
 */

import {S3Camera, pointAhead, Vec4} from "../app/s3/camera";



const PI = Math.PI;
let failures = 0;
const check = (label: string, cond: boolean): void => {
	console.assert(cond, `FAIL: ${label}`);
	if (!cond)
		++failures;
	else
		console.log(`ok: ${label}`);
};
const near = (a: number, b: number, eps = 1e-9): boolean => Math.abs(a - b) < eps;
const dot4 = (a: Vec4, b: Vec4): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];


// --- Fresh camera looks straight ahead. ------------------------------------
{
	const cam = new S3Camera();
	const p = pointAhead(0.7);
	const {theta, dir} = cam.bearingTo(p);
	check("fresh: distance to a point 0.7 ahead is 0.7", near(theta, 0.7, 1e-6));
	check("fresh: it sits dead ahead (dir ~ -z)", near(dir.x, 0, 1e-6) && near(dir.y, 0, 1e-6) && near(dir.z, -1, 1e-6));
}

// --- moveForward reduces geodesic distance to a point ahead. ---------------
{
	const cam = new S3Camera();
	const p = pointAhead(1.2);
	cam.moveForward(0.5);
	check("moveForward 0.5 toward a point 1.2 ahead -> distance 0.7", near(cam.bearingTo(p).theta, 0.7, 1e-6));
	cam.moveForward(0.7); // now at the point
	check("reaching the point -> distance 0", near(cam.bearingTo(p).theta, 0, 1e-6));
	cam.moveForward(0.3); // pass through it
	const b = cam.bearingTo(p);
	check("passing it -> distance grows again", near(b.theta, 0.3, 1e-6));
	check("passing it -> the point is now BEHIND (dir ~ +z)", b.dir.z > 0.9);
}

// --- Travelling a full great circle (2*pi) returns to the start. ----------
{
	const cam = new S3Camera();
	const p = pointAhead(0.9);
	cam.moveForward(2 * PI);
	check("moveForward 2*pi returns: distance back to 0.9", near(cam.bearingTo(p).theta, 0.9, 1e-6));
}

// --- Yaw right pushes a point-ahead to the left of the view. --------------
{
	const cam = new S3Camera();
	const p = pointAhead(0.8);
	cam.yaw(0.3); // turn right
	const dir = cam.bearingTo(p).dir;
	check("yaw right: point ahead moves to screen-left (dir.x < 0)", dir.x < 0);
	check("yaw right: still roughly in front (dir.z < 0)", dir.z < 0);
}

// --- Strafe left/right shifts a point-ahead sideways. ---------------------
{
	const cam = new S3Camera();
	const p = pointAhead(0.8);
	cam.strafe(0.3); // slide right
	const dir = cam.bearingTo(p).dir;
	check("strafe right: point ahead moves to screen-left (dir.x < 0)", dir.x < 0);
}

// --- Frame stays orthonormal after a messy sequence of moves. -------------
{
	const cam = new S3Camera();
	const ops = [0.31, -0.22, 0.5, 0.17, -0.44, 0.9];
	for (const a of ops) { cam.moveForward(a); cam.yaw(a * 0.7); cam.strafe(-a * 0.4); cam.pitch(a * 0.3); }
	cam.orthonormalize();
	const cols = [cam.right, cam.up, cam.fwd, cam.pos];
	let ortho = true;
	for (let i = 0; i < 4; ++i)
		for (let j = 0; j < 4; ++j) {
			const want = i === j ? 1 : 0;
			if (!near(dot4(cols[i], cols[j]), want, 1e-9))
				ortho = false;
		}
	check("frame remains orthonormal (SO(4)) after mixed motion", ortho);
}


console.log(failures === 0 ? "\nAll S^3 camera assertions passed." : `\n${failures} assertion(s) FAILED.`);
if (failures > 0)
	process.exit(1);
