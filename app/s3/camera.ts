
import * as THREE from "three";



/**
 * A camera moving through the 3-sphere S^3, embedded in R^4.
 *
 * The camera is an orthonormal frame of four 4-vectors: a tangent basis
 * (right, up, fwd) at the eye, plus the eye point (pos) itself, which lies on
 * S^3. Every motion is a rotation in a coordinate plane applied to two of the
 * four vectors (a Givens rotation), which keeps the frame in SO(4):
 *
 *   - moveForward: rotate the (pos, fwd) pair  — the eye glides along the
 *     geodesic it faces; go 2*pi and you return to the start.
 *   - strafe:      rotate the (pos, right) pair.
 *   - yaw / pitch: rotate the tangent frame (fwd with right / up), eye fixed.
 *
 * To render, project a world point p in S^3 onto the frame: the component along
 * `pos` is cos(theta) (theta = geodesic distance), and the tangent components
 * give the bearing direction in camera-local axes.
 */



export type Vec4 = [number, number, number, number];


const dot = (a: Vec4, b: Vec4): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];


export interface Bearing {
	/** Geodesic angle from the eye to the point, in [0, pi]. */
	theta: number;
	/** Unit direction to the point in three.js camera-local space (+x right, +y up, -z forward). */
	dir: THREE.Vector3;
}


/** A point on S^3 a geodesic `angle` ahead of a fresh (identity) camera's forward axis. */
export const pointAhead = (angle: number): Vec4 => [0, 0, Math.sin(angle), Math.cos(angle)];


export class S3Camera {
	// Columns of an SO(4) frame. Identity: looking down +fwd from the w-pole.
	right: Vec4 = [1, 0, 0, 0];
	up: Vec4 = [0, 1, 0, 0];
	fwd: Vec4 = [0, 0, 1, 0];
	pos: Vec4 = [0, 0, 0, 1];


	/** In-plane rotation of two basis vectors: (u, v) -> (c u + s v, -s u + c v). */
	private turn (u: Vec4, v: Vec4, angle: number): void {
		const c = Math.cos(angle);
		const s = Math.sin(angle);
		for (let i = 0; i < 4; ++i) {
			const ui = u[i];
			const vi = v[i];
			u[i] = c * ui + s * vi;
			v[i] = -s * ui + c * vi;
		}
	}


	/** Glide the eye forward (delta > 0) or backward along the faced geodesic. */
	moveForward (delta: number): void {
		this.turn(this.pos, this.fwd, delta);
	}

	/** Glide the eye to the right (delta > 0) or left. */
	strafe (delta: number): void {
		this.turn(this.pos, this.right, delta);
	}

	/** Turn the view right (angle > 0) or left, eye fixed. */
	yaw (angle: number): void {
		this.turn(this.fwd, this.right, angle);
	}

	/** Tilt the view up (angle > 0) or down, eye fixed. */
	pitch (angle: number): void {
		this.turn(this.fwd, this.up, angle);
	}


	/** Re-orthonormalize the frame (Gram-Schmidt) to shed accumulated float drift. */
	orthonormalize (): void {
		const basis = [this.pos, this.fwd, this.up, this.right];
		for (let i = 0; i < basis.length; ++i) {
			const v = basis[i];
			for (let j = 0; j < i; ++j) {
				const u = basis[j];
				const d = dot(v, u);
				for (let k = 0; k < 4; ++k)
					v[k] -= d * u[k];
			}
			const n = Math.hypot(v[0], v[1], v[2], v[3]) || 1;
			for (let k = 0; k < 4; ++k)
				v[k] /= n;
		}
	}


	/** Geodesic distance and camera-local bearing to a point p on S^3. */
	bearingTo (p: Vec4): Bearing {
		const vRight = dot(this.right, p);
		const vUp = dot(this.up, p);
		const vFwd = dot(this.fwd, p);
		const vPos = dot(this.pos, p);
		const theta = Math.acos(Math.max(-1, Math.min(1, vPos)));
		// three.js camera looks down -z, so the forward component maps to -z.
		const dir = new THREE.Vector3(vRight, vUp, -vFwd);
		if (dir.lengthSq() < 1e-12)
			dir.set(0, 0, -1);
		dir.normalize();
		return {theta, dir};
	}
}
