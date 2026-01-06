
/**
 * Cube Tetris - Three.js Renderer
 * Based on original CubeTetris visual style
 */

import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";

import type {GameConfig, Point3D, BlockData} from "./types";
import {CubeGrid} from "./CubeGrid";
import {TetrisPiece} from "./TetrisPiece";
import {GAME_CONFIG, PIECE_DEFINITIONS, coordKey, FACE_MASK} from "./constants";


// Face direction constants
type FaceDir = "+x" | "-x" | "+y" | "-y" | "+z" | "-z";
const FACE_DIRS: FaceDir[] = ["+x", "-x", "+y", "-y", "+z", "-z"];

// Neighbor offsets for each face direction
const FACE_NEIGHBORS: Record<FaceDir, Point3D> = {
	"+x": {x: 1, y: 0, z: 0},
	"-x": {x: -1, y: 0, z: 0},
	"+y": {x: 0, y: 1, z: 0},
	"-y": {x: 0, y: -1, z: 0},
	"+z": {x: 0, y: 0, z: 1},
	"-z": {x: 0, y: 0, z: -1},
};


// ============================================================================
// Nine-Grid Block Geometry System
// ============================================================================
//
// Each face is divided into 9 parts (3x3 grid):
// ┌────────┬────────┬────────┐
// │ Corner │  Edge  │ Corner │
// │(-A,-B) │  -B    │(+A,-B) │
// ├────────┼────────┼────────┤
// │  Edge  │ Center │  Edge  │
// │  -A    │(fixed) │  +A    │
// ├────────┼────────┼────────┤
// │ Corner │  Edge  │ Corner │
// │(-A,+B) │  +B    │(+A,+B) │
// └────────┴────────┴────────┘
//
// - Center: fixed quad, always flat
// - Edges: bevel (chamfer) when exterior, flat extension when neighbor exists
// - Corners: 3 cases based on adjacent edge states (2 triangles each)
//   A. Outer convex corner (both edges exterior)
//   B. Side extension (one edge exterior, one has neighbor)
//   C. Inner concave corner (both edges have neighbors)
// ============================================================================

// Geometry constants
const CUBE_SIZE = 1.003;
const HALF_SIZE = CUBE_SIZE / 2;        // ≈0.5015 (face position s)
const INNER = HALF_SIZE * 0.82;         // ≈0.411 (center region boundary)
const OUTER = HALF_SIZE * 0.91;         // ≈0.456 (bevel outer boundary)
const S_EXT = 0.5;                      // neighbor connection point (exact grid midpoint)

// Bevel normal components (from original cube0.mesh.xml)
const BEVEL_MAJOR = 0.716;  // major axis component
const BEVEL_MINOR = 0.698;  // minor axis component


// ============================================================================
// Axis Transform System
// ============================================================================
// Each face is defined by:
// - wAxis: the axis perpendicular to the face (0=X, 1=Y, 2=Z)
// - sign: +1 or -1 indicating direction along wAxis
// - uAxis, vAxis: the two axes forming the face plane
//
// Canonical coordinates (u, v, w) map to world coordinates (x, y, z):
// - u, v are coordinates on the face plane
// - w is the coordinate perpendicular to the face
// ============================================================================

interface AxisConfig {
	wAxis: number;  // Main axis (perpendicular to face): 0=X, 1=Y, 2=Z
	uAxis: number;  // First tangent axis
	vAxis: number;  // Second tangent axis
	wSign: number;  // Direction along wAxis: +1 or -1
	uSign: number;  // Direction along uAxis: +1 or -1 (for basis handedness)
	vSign: number;  // Direction along vAxis: +1 or -1 (for basis handedness)
}

// Axis configurations for each face direction
// The (u, v, w) basis forms a right-handed coordinate system when det > 0
const AXIS_CONFIGS: Record<FaceDir, AxisConfig> = {
	"+y": {wAxis: 1, uAxis: 0, vAxis: 2, wSign: +1, uSign: +1, vSign: +1},  // Y-up: u=+X, v=+Z
	"-y": {wAxis: 1, uAxis: 0, vAxis: 2, wSign: -1, uSign: +1, vSign: -1},  // Y-down: u=+X, v=-Z
	"+z": {wAxis: 2, uAxis: 0, vAxis: 1, wSign: +1, uSign: +1, vSign: +1},  // Z-front: u=+X, v=+Y
	"-z": {wAxis: 2, uAxis: 0, vAxis: 1, wSign: -1, uSign: -1, vSign: +1},  // Z-back: u=-X, v=+Y
	"+x": {wAxis: 0, uAxis: 2, vAxis: 1, wSign: +1, uSign: -1, vSign: +1},  // X-right: u=-Z, v=+Y
	"-x": {wAxis: 0, uAxis: 2, vAxis: 1, wSign: -1, uSign: +1, vSign: +1},  // X-left: u=+Z, v=+Y
};

/**
 * Calculate permutation parity of three axis indices
 * Returns +1 for even permutation of [0,1,2], -1 for odd
 */
function permutationParity(a: number, b: number, c: number): number {
	const perm = [a, b, c];
	let inversions = 0;
	for (let i = 0; i < 3; i++) {
		for (let j = i + 1; j < 3; j++) {
			if (perm[i] > perm[j]) inversions++;
		}
	}
	return (inversions % 2 === 0) ? +1 : -1;
}

/**
 * Check if the basis is mirrored (left-handed)
 * Returns true if we need to flip winding order for CCW faces
 * Takes into account both sign product AND axis permutation parity
 */
function isMirrored(cfg: AxisConfig): boolean {
	// Determinant = sign product × permutation parity
	// For a right-handed basis, det = +1; for left-handed, det = -1
	const signProduct = cfg.uSign * cfg.vSign * cfg.wSign;
	const parity = permutationParity(cfg.uAxis, cfg.vAxis, cfg.wAxis);
	return signProduct * parity < 0;
}

/**
 * Convert canonical (u, v, w) coordinates to world [x, y, z] array
 */
function toWorld(ox: number, oy: number, oz: number, u: number, v: number, w: number, cfg: AxisConfig): number[] {
	const result = [ox, oy, oz];
	result[cfg.uAxis] += u * cfg.uSign;
	result[cfg.vAxis] += v * cfg.vSign;
	result[cfg.wAxis] += w * cfg.wSign;
	return result;
}

/**
 * Convert canonical normal (nu, nv, nw) to world normal [nx, ny, nz]
 */
function normalToWorld(nu: number, nv: number, nw: number, cfg: AxisConfig): number[] {
	const result = [0, 0, 0];
	result[cfg.uAxis] = nu * cfg.uSign;
	result[cfg.vAxis] = nv * cfg.vSign;
	result[cfg.wAxis] = nw * cfg.wSign;
	return result;
}

/**
 * Get perpendicular face directions for a given face (the 4 edge directions)
 * Accounts for uSign/vSign to correctly map canonical +u/-u/+v/-v to world directions
 */
function getPerpDirs(face: FaceDir): {uPos: FaceDir; uNeg: FaceDir; vPos: FaceDir; vNeg: FaceDir} {
	const cfg = AXIS_CONFIGS[face];
	const axisToDir: Record<number, [FaceDir, FaceDir]> = {
		0: ["+x", "-x"],
		1: ["+y", "-y"],
		2: ["+z", "-z"],
	};
	// Get base positive/negative directions for each axis
	const [uAxisPos, uAxisNeg] = axisToDir[cfg.uAxis];
	const [vAxisPos, vAxisNeg] = axisToDir[cfg.vAxis];
	// Apply sign: if sign is negative, swap positive and negative directions
	const uPos = cfg.uSign > 0 ? uAxisPos : uAxisNeg;
	const uNeg = cfg.uSign > 0 ? uAxisNeg : uAxisPos;
	const vPos = cfg.vSign > 0 ? vAxisPos : vAxisNeg;
	const vNeg = cfg.vSign > 0 ? vAxisNeg : vAxisPos;
	return {uPos, uNeg, vPos, vNeg};
}


/**
 * Geometry builder helper class
 */
class GeometryBuilder {
	vertices: number[] = [];
	normals: number[] = [];
	indices: number[] = [];

	addQuad(v0: number[], v1: number[], v2: number[], v3: number[], normal: number[]): void {
		const baseIdx = this.vertices.length / 3;
		this.vertices.push(...v0, ...v1, ...v2, ...v3);
		this.normals.push(...normal, ...normal, ...normal, ...normal);
		this.indices.push(baseIdx, baseIdx + 1, baseIdx + 2, baseIdx, baseIdx + 2, baseIdx + 3);
	}

	addTriangle(v0: number[], v1: number[], v2: number[], normal: number[]): void {
		const baseIdx = this.vertices.length / 3;
		this.vertices.push(...v0, ...v1, ...v2);
		this.normals.push(...normal, ...normal, ...normal);
		this.indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
	}

	/**
	 * Emit a quad in canonical (u, v, w) coordinates, transformed to world space
	 * Vertices are specified in CW order when viewed from +w direction in canonical space
	 * For non-mirrored transforms, we flip to get CCW in world space (front-facing)
	 * For mirrored transforms, the transform itself flips winding, so we don't flip
	 */
	emitQuadCanonical(
		ox: number, oy: number, oz: number,
		cfg: AxisConfig,
		p0: [number, number, number], p1: [number, number, number],
		p2: [number, number, number], p3: [number, number, number],
		normalCanonical: [number, number, number]
	): void {
		const v0 = toWorld(ox, oy, oz, p0[0], p0[1], p0[2], cfg);
		const v1 = toWorld(ox, oy, oz, p1[0], p1[1], p1[2], cfg);
		const v2 = toWorld(ox, oy, oz, p2[0], p2[1], p2[2], cfg);
		const v3 = toWorld(ox, oy, oz, p3[0], p3[1], p3[2], cfg);
		const normal = normalToWorld(normalCanonical[0], normalCanonical[1], normalCanonical[2], cfg);

		if (isMirrored(cfg)) {
			// Mirrored transform flips winding, so canonical CW becomes world CCW (front-facing)
			this.addQuad(v0, v1, v2, v3, normal);
		} else {
			// Non-mirrored: flip to convert canonical CW to world CCW (front-facing)
			this.addQuad(v0, v3, v2, v1, normal);
		}
	}

	/**
	 * Emit a triangle in canonical (u, v, w) coordinates, transformed to world space
	 * Vertices are specified in CW order when viewed from +w direction in canonical space
	 * For non-mirrored transforms, we flip to get CCW in world space (front-facing)
	 * For mirrored transforms, the transform itself flips winding, so we don't flip
	 */
	emitTriCanonical(
		ox: number, oy: number, oz: number,
		cfg: AxisConfig,
		p0: [number, number, number], p1: [number, number, number], p2: [number, number, number],
		normalCanonical: [number, number, number]
	): void {
		const v0 = toWorld(ox, oy, oz, p0[0], p0[1], p0[2], cfg);
		const v1 = toWorld(ox, oy, oz, p1[0], p1[1], p1[2], cfg);
		const v2 = toWorld(ox, oy, oz, p2[0], p2[1], p2[2], cfg);
		const normal = normalToWorld(normalCanonical[0], normalCanonical[1], normalCanonical[2], cfg);

		if (isMirrored(cfg)) {
			// Mirrored transform flips winding, so canonical CW becomes world CCW (front-facing)
			this.addTriangle(v0, v1, v2, normal);
		} else {
			// Non-mirrored: flip to convert canonical CW to world CCW (front-facing)
			this.addTriangle(v0, v2, v1, normal);
		}
	}

	build(): THREE.BufferGeometry {
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.Float32BufferAttribute(this.vertices, 3));
		geometry.setAttribute("normal", new THREE.Float32BufferAttribute(this.normals, 3));
		geometry.setIndex(this.indices);
		return geometry;
	}
}


/**
 * Compute triangle normal via cross product (shared helper for all corner builders)
 */
function triNormal(p1: number[], p2: number[], p3: number[]): number[] {
	const ab = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
	const ac = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
	const nx = ab[1] * ac[2] - ab[2] * ac[1];
	const ny = ab[2] * ac[0] - ab[0] * ac[2];
	const nz = ab[0] * ac[1] - ab[1] * ac[0];
	const len = Math.hypot(nx, ny, nz) || 1;
	return [nx / len, ny / len, nz / len];
}


// ============================================================================
// Canonical Nine-Grid Face Builder
// ============================================================================
// Works in canonical (u, v, w) coordinates:
// - u, v: tangent axes on the face plane
// - w: perpendicular axis (face normal direction is +w)
// - Face surface is at w = s (HALF_SIZE)
// - Perpendicular directions: +u, -u, +v, -v (four edges of the face)
// ============================================================================

/**
 * Build exterior face geometry in canonical coordinates
 * @param builder Geometry builder
 * @param ox, oy, oz Block center in world coordinates
 * @param cfg Axis configuration for this face
 * @param extU Exterior flags for +u/-u directions [+u, -u]
 * @param extV Exterior flags for +v/-v directions [+v, -v]
 */
function buildFaceCanonical(
	builder: GeometryBuilder,
	ox: number, oy: number, oz: number,
	cfg: AxisConfig,
	extU: [boolean, boolean],  // [+u exterior, -u exterior]
	extV: [boolean, boolean]   // [+v exterior, -v exterior]
): void {
	const s = HALF_SIZE;
	const inner = INNER;
	const outer = OUTER;
	const sExt = S_EXT;

	// All coordinates are in canonical (u, v, w) space
	// Face is at w = +s, normal points in +w direction

	// ========== 1. Center quad ==========
	// Vertices in CCW order when viewed from +w
	builder.emitQuadCanonical(ox, oy, oz, cfg,
		[-inner, +inner, s], [+inner, +inner, s],
		[+inner, -inner, s], [-inner, -inner, s],
		[0, 0, 1]  // face normal in +w direction
	);

	// ========== 2. Four edge strips ==========
	// -u edge
	if (extU[1]) {
		// Bevel surface: from face edge down to outer bevel
		builder.emitQuadCanonical(ox, oy, oz, cfg,
			[-inner, +inner, s], [-inner, -inner, s],
			[-outer, -inner, outer], [-outer, +inner, outer],
			[-BEVEL_MAJOR, 0, BEVEL_MINOR]
		);
	} else {
		// Flat extension to neighbor
		builder.emitQuadCanonical(ox, oy, oz, cfg,
			[-inner, +inner, s], [-inner, -inner, s],
			[-sExt, -inner, s], [-sExt, +inner, s],
			[0, 0, 1]
		);
	}

	// +u edge
	if (extU[0]) {
		builder.emitQuadCanonical(ox, oy, oz, cfg,
			[+inner, -inner, s], [+inner, +inner, s],
			[+outer, +inner, outer], [+outer, -inner, outer],
			[BEVEL_MAJOR, 0, BEVEL_MINOR]
		);
	} else {
		builder.emitQuadCanonical(ox, oy, oz, cfg,
			[+inner, -inner, s], [+inner, +inner, s],
			[+sExt, +inner, s], [+sExt, -inner, s],
			[0, 0, 1]
		);
	}

	// -v edge
	if (extV[1]) {
		builder.emitQuadCanonical(ox, oy, oz, cfg,
			[-inner, -inner, s], [+inner, -inner, s],
			[+outer, -outer, outer], [-outer, -outer, outer],
			[0, -BEVEL_MAJOR, BEVEL_MINOR]
		);
	} else {
		builder.emitQuadCanonical(ox, oy, oz, cfg,
			[-inner, -inner, s], [+inner, -inner, s],
			[+inner, -sExt, s], [-inner, -sExt, s],
			[0, 0, 1]
		);
	}

	// +v edge
	if (extV[0]) {
		builder.emitQuadCanonical(ox, oy, oz, cfg,
			[+inner, +inner, s], [-inner, +inner, s],
			[-outer, +outer, outer], [+outer, +outer, outer],
			[0, BEVEL_MAJOR, BEVEL_MINOR]
		);
	} else {
		builder.emitQuadCanonical(ox, oy, oz, cfg,
			[+inner, +inner, s], [-inner, +inner, s],
			[-inner, +sExt, s], [+inner, +sExt, s],
			[0, 0, 1]
		);
	}

	// ========== 3. Four corners ==========
	// Each corner is a quadrant: (±u, ±v)
	buildCornerCanonical(builder, ox, oy, oz, cfg, -1, -1, extU[1], extV[1]);  // (-u, -v)
	buildCornerCanonical(builder, ox, oy, oz, cfg, +1, -1, extU[0], extV[1]);  // (+u, -v)
	buildCornerCanonical(builder, ox, oy, oz, cfg, -1, +1, extU[1], extV[0]);  // (-u, +v)
	buildCornerCanonical(builder, ox, oy, oz, cfg, +1, +1, extU[0], extV[0]);  // (+u, +v)
}


/**
 * Build corner geometry in canonical coordinates
 * Triangulation: a-b-d and a-d-c (shared edge a-d from inner to diagonal outer)
 * @param signU +1 or -1 for u direction
 * @param signV +1 or -1 for v direction
 * @param exteriorU true if exterior in u direction
 * @param exteriorV true if exterior in v direction
 */
function buildCornerCanonical(
	builder: GeometryBuilder,
	ox: number, oy: number, oz: number,
	cfg: AxisConfig,
	signU: number, signV: number,
	exteriorU: boolean, exteriorV: boolean
): void {
	const s = HALF_SIZE;
	const inner = INNER;
	const outer = OUTER;
	const sExt = S_EXT;

	// Point a: inner corner on face (always fixed)
	const a: [number, number, number] = [signU * inner, signV * inner, s];

	// Point d: diagonal outer corner - coordinates depend on neighbor status
	const uD = exteriorU ? outer : sExt;
	const vD = exteriorV ? outer : sExt;
	// w coordinate: use inner if both neighbors (concave), else outer
	const wD = (!exteriorU && !exteriorV) ? inner : outer;
	const d: [number, number, number] = [signU * uD, signV * vD, wD];

	// Point b: on u-direction edge
	const b: [number, number, number] = exteriorU
		? [signU * outer, signV * inner, outer]
		: [signU * sExt, signV * inner, s];

	// Point c: on v-direction edge
	const c: [number, number, number] = exteriorV
		? [signU * inner, signV * outer, outer]
		: [signU * inner, signV * sExt, s];

	// Compute triangle normals in world space for proper lighting
	const v0 = toWorld(ox, oy, oz, a[0], a[1], a[2], cfg);
	const v1 = toWorld(ox, oy, oz, b[0], b[1], b[2], cfg);
	const v2 = toWorld(ox, oy, oz, c[0], c[1], c[2], cfg);
	const v3 = toWorld(ox, oy, oz, d[0], d[1], d[2], cfg);

	// Determine winding based on sign product and basis handedness
	// In canonical space, CCW order when signU * signV > 0: a-b-d, a-d-c
	// When signU * signV < 0: a-d-b, a-c-d
	const shouldFlip = (signU * signV < 0) !== isMirrored(cfg);

	if (shouldFlip) {
		// Triangles: a-d-b, a-c-d
		const n1 = triNormal(v0, v3, v1);
		const n2 = triNormal(v0, v2, v3);
		// Ensure normals point outward (positive w component in canonical)
		if (n1[cfg.wAxis] * cfg.wSign < 0) { n1[0] = -n1[0]; n1[1] = -n1[1]; n1[2] = -n1[2]; }
		if (n2[cfg.wAxis] * cfg.wSign < 0) { n2[0] = -n2[0]; n2[1] = -n2[1]; n2[2] = -n2[2]; }
		builder.addTriangle(v0, v3, v1, n1);
		builder.addTriangle(v0, v2, v3, n2);
	} else {
		// Triangles: a-b-d, a-d-c
		const n1 = triNormal(v0, v1, v3);
		const n2 = triNormal(v0, v3, v2);
		if (n1[cfg.wAxis] * cfg.wSign < 0) { n1[0] = -n1[0]; n1[1] = -n1[1]; n1[2] = -n1[2]; }
		if (n2[cfg.wAxis] * cfg.wSign < 0) { n2[0] = -n2[0]; n2[1] = -n2[1]; n2[2] = -n2[2]; }
		builder.addTriangle(v0, v1, v3, n1);
		builder.addTriangle(v0, v3, v2, n2);
	}
}


// ============================================================================
// Canonical Inner Face Builder (for closing geometry on neighbor sides)
// ============================================================================

/**
 * Build inner face geometry in canonical coordinates
 * Used when a face has a neighbor (face is hidden, but needs closure geometry)
 * @param neighborU Neighbor flags for +u/-u directions [+u, -u]
 * @param neighborV Neighbor flags for +v/-v directions [+v, -v]
 */
function buildInnerFaceCanonical(
	builder: GeometryBuilder,
	ox: number, oy: number, oz: number,
	cfg: AxisConfig,
	neighborU: [boolean, boolean],  // [+u neighbor, -u neighbor]
	neighborV: [boolean, boolean]   // [+v neighbor, -v neighbor]
): void {
	const inner = INNER;
	const outer = OUTER;
	const sExt = S_EXT;

	// Inner face is at w = sExt (grid midpoint)

	// ========== Center quad ==========
	builder.emitQuadCanonical(ox, oy, oz, cfg,
		[-inner, +inner, sExt], [+inner, +inner, sExt],
		[+inner, -inner, sExt], [-inner, -inner, sExt],
		[0, 0, 1]
	);

	// ========== Four edge strips (always flat for inner faces) ==========
	// -u edge
	builder.emitQuadCanonical(ox, oy, oz, cfg,
		[-sExt, +inner, sExt], [-inner, +inner, sExt],
		[-inner, -inner, sExt], [-sExt, -inner, sExt],
		[0, 0, 1]
	);

	// +u edge
	builder.emitQuadCanonical(ox, oy, oz, cfg,
		[+inner, +inner, sExt], [+sExt, +inner, sExt],
		[+sExt, -inner, sExt], [+inner, -inner, sExt],
		[0, 0, 1]
	);

	// -v edge
	builder.emitQuadCanonical(ox, oy, oz, cfg,
		[-inner, -inner, sExt], [+inner, -inner, sExt],
		[+inner, -sExt, sExt], [-inner, -sExt, sExt],
		[0, 0, 1]
	);

	// +v edge
	builder.emitQuadCanonical(ox, oy, oz, cfg,
		[-inner, +sExt, sExt], [+inner, +sExt, sExt],
		[+inner, +inner, sExt], [-inner, +inner, sExt],
		[0, 0, 1]
	);

	// ========== Four corners with dynamic d-point ==========
	buildInnerCornerCanonical(builder, ox, oy, oz, cfg, -1, -1, neighborU[1], neighborV[1]);
	buildInnerCornerCanonical(builder, ox, oy, oz, cfg, +1, -1, neighborU[0], neighborV[1]);
	buildInnerCornerCanonical(builder, ox, oy, oz, cfg, -1, +1, neighborU[1], neighborV[0]);
	buildInnerCornerCanonical(builder, ox, oy, oz, cfg, +1, +1, neighborU[0], neighborV[0]);
}


/**
 * Build inner corner geometry in canonical coordinates
 */
function buildInnerCornerCanonical(
	builder: GeometryBuilder,
	ox: number, oy: number, oz: number,
	cfg: AxisConfig,
	signU: number, signV: number,
	neighborU: boolean, neighborV: boolean
): void {
	const inner = INNER;
	const outer = OUTER;
	const sExt = S_EXT;

	// Point a: inner corner, or outer when both neighbors exist (three-way junction)
	const aRadius = (neighborU && neighborV) ? outer : inner;
	const a: [number, number, number] = [signU * aRadius, signV * aRadius, sExt];

	// Point b: on u-direction edge
	const b: [number, number, number] = [signU * sExt, signV * inner, sExt];

	// Point c: on v-direction edge
	const c: [number, number, number] = [signU * inner, signV * sExt, sExt];

	// Point d: diagonal - coordinates depend on neighbor status
	let uD: number, vD: number, wD: number;
	if (neighborU && neighborV) {
		uD = outer; vD = outer; wD = outer;
	} else if (neighborU) {
		uD = sExt; vD = inner; wD = sExt;
	} else if (neighborV) {
		uD = inner; vD = sExt; wD = sExt;
	} else {
		uD = outer; vD = outer; wD = sExt;
	}
	const d: [number, number, number] = [signU * uD, signV * vD, wD];

	// Compute triangle normals in world space
	const v0 = toWorld(ox, oy, oz, a[0], a[1], a[2], cfg);
	const v1 = toWorld(ox, oy, oz, b[0], b[1], b[2], cfg);
	const v2 = toWorld(ox, oy, oz, c[0], c[1], c[2], cfg);
	const v3 = toWorld(ox, oy, oz, d[0], d[1], d[2], cfg);

	// Determine winding based on sign product and basis handedness
	const shouldFlip = (signU * signV < 0) !== isMirrored(cfg);

	if (shouldFlip) {
		const n1 = triNormal(v0, v3, v1);
		const n2 = triNormal(v0, v2, v3);
		if (n1[cfg.wAxis] * cfg.wSign < 0) { n1[0] = -n1[0]; n1[1] = -n1[1]; n1[2] = -n1[2]; }
		if (n2[cfg.wAxis] * cfg.wSign < 0) { n2[0] = -n2[0]; n2[1] = -n2[1]; n2[2] = -n2[2]; }
		builder.addTriangle(v0, v3, v1, n1);
		builder.addTriangle(v0, v2, v3, n2);
	} else {
		const n1 = triNormal(v0, v1, v3);
		const n2 = triNormal(v0, v3, v2);
		if (n1[cfg.wAxis] * cfg.wSign < 0) { n1[0] = -n1[0]; n1[1] = -n1[1]; n1[2] = -n1[2]; }
		if (n2[cfg.wAxis] * cfg.wSign < 0) { n2[0] = -n2[0]; n2[1] = -n2[1]; n2[2] = -n2[2]; }
		builder.addTriangle(v0, v1, v3, n1);
		builder.addTriangle(v0, v3, v2, n2);
	}
}


/**
 * Get perpendicular exterior flags from face direction
 * Returns [extU, extV] where extU = [+u exterior, -u exterior]
 */
function getExteriorFlags(face: FaceDir, exterior: Record<FaceDir, boolean>): {
	extU: [boolean, boolean];
	extV: [boolean, boolean];
} {
	const perpDirs = getPerpDirs(face);
	return {
		extU: [exterior[perpDirs.uPos], exterior[perpDirs.uNeg]],
		extV: [exterior[perpDirs.vPos], exterior[perpDirs.vNeg]],
	};
}


/**
 * Get perpendicular neighbor flags from face direction (inverse of exterior)
 */
function getNeighborFlags(face: FaceDir, exterior: Record<FaceDir, boolean>): {
	neighborU: [boolean, boolean];
	neighborV: [boolean, boolean];
} {
	const perpDirs = getPerpDirs(face);
	return {
		neighborU: [!exterior[perpDirs.uPos], !exterior[perpDirs.uNeg]],
		neighborV: [!exterior[perpDirs.vPos], !exterior[perpDirs.vNeg]],
	};
}


/**
 * Generate nine-grid geometry for a single face
 * @param builder Geometry builder
 * @param ox, oy, oz Block offset
 * @param face Face direction
 * @param exterior Neighbor state record
 */
function buildFaceGeometry(
	builder: GeometryBuilder,
	ox: number, oy: number, oz: number,
	face: FaceDir,
	exterior: Record<FaceDir, boolean>
): void {
	const cfg = AXIS_CONFIGS[face];
	const {extU, extV} = getExteriorFlags(face, exterior);
	buildFaceCanonical(builder, ox, oy, oz, cfg, extU, extV);
}



/**
 * Build inner face geometry for a face that has a neighbor
 */
function buildInnerFaceGeometry(
	builder: GeometryBuilder,
	ox: number, oy: number, oz: number,
	face: FaceDir,
	neighbors: Record<FaceDir, boolean>
): void {
	const cfg = AXIS_CONFIGS[face];
	const {neighborU, neighborV} = getNeighborFlags(face, {
		"+x": !neighbors["+x"],
		"-x": !neighbors["-x"],
		"+y": !neighbors["+y"],
		"-y": !neighbors["-y"],
		"+z": !neighbors["+z"],
		"-z": !neighbors["-z"],
	});
	buildInnerFaceCanonical(builder, ox, oy, oz, cfg, neighborU, neighborV);
}


/**
 * Generate a cache key from block positions
 * Sorts positions to ensure same shape always gets same key
 */
function geometryCacheKey(blocks: Point3D[]): string {
	// Sort by y, then x, then z for consistent ordering
	const sorted = [...blocks].sort((a, b) => {
		if (a.y !== b.y) return a.y - b.y;
		if (a.x !== b.x) return a.x - b.x;
		return a.z - b.z;
	});
	return sorted.map(b => `${b.x},${b.y},${b.z}`).join("|");
}


/**
 * Create single block geometry with specific faces exposed (based on faceMask).
 * Uses the nine-grid system for proper corner handling.
 * FaceMask bits: +x=1, -x=2, +y=4, -y=8, +z=16, -z=32
 */
export function createBlockGeometryFromMask(faceMask: number): THREE.BufferGeometry {
	const builder = new GeometryBuilder();

	// Determine which faces are exterior (exposed)
	const exterior: Record<FaceDir, boolean> = {
		"+x": (faceMask & FACE_MASK.POS_X) !== 0,
		"-x": (faceMask & FACE_MASK.NEG_X) !== 0,
		"+y": (faceMask & FACE_MASK.POS_Y) !== 0,
		"-y": (faceMask & FACE_MASK.NEG_Y) !== 0,
		"+z": (faceMask & FACE_MASK.POS_Z) !== 0,
		"-z": (faceMask & FACE_MASK.NEG_Z) !== 0,
	};

	// Build neighbor record for inner faces (opposite of exterior)
	const neighbors: Record<FaceDir, boolean> = {
		"+x": !exterior["+x"],
		"-x": !exterior["-x"],
		"+y": !exterior["+y"],
		"-y": !exterior["-y"],
		"+z": !exterior["+z"],
		"-z": !exterior["-z"],
	};

	// Build each face using nine-grid system
	for (const face of FACE_DIRS) {
		if (exterior[face]) {
			// Exterior face: beveled nine-grid
			buildFaceGeometry(builder, 0, 0, 0, face, exterior);
		}
		else {
			// Inner face: flat nine-grid to close geometry
			buildInnerFaceGeometry(builder, 0, 0, 0, face, neighbors);
		}
	}

	return builder.build();
}


/**
 * Create unified piece geometry for a set of blocks.
 * Uses the nine-grid system for proper corner handling.
 * Internal faces between adjacent cubes are removed.
 * Special case: corners where all 3 directions have neighbors are still drawn.
 */
export function createUnifiedPieceGeometry(blocks: Point3D[]): THREE.BufferGeometry {
	const builder = new GeometryBuilder();

	// Build a set of block positions for quick neighbor lookup
	const blockSet = new Set<string>();
	for (const block of blocks) {
		blockSet.add(coordKey(block.x, block.y, block.z));
	}

	// Check if a neighbor exists in the given direction
	const hasNeighbor = (block: Point3D, dir: FaceDir): boolean => {
		const offset = FACE_NEIGHBORS[dir];
		const key = coordKey(block.x + offset.x, block.y + offset.y, block.z + offset.z);
		return blockSet.has(key);
	};

	// Process each block
	for (const block of blocks) {
		// Determine which faces are exterior (no neighbor in that direction)
		const exterior: Record<FaceDir, boolean> = {
			"+x": !hasNeighbor(block, "+x"),
			"-x": !hasNeighbor(block, "-x"),
			"+y": !hasNeighbor(block, "+y"),
			"-y": !hasNeighbor(block, "-y"),
			"+z": !hasNeighbor(block, "+z"),
			"-z": !hasNeighbor(block, "-z"),
		};

		// Build each exterior face using nine-grid system
		for (const face of FACE_DIRS) {
			if (exterior[face]) {
				buildFaceGeometry(builder, block.x, block.y, block.z, face, exterior);
			}
		}

		// Special case: draw corners where all 3 directions have neighbors
		// These are "three-way junction" corners that need to close the geometry
		// Each corner needs triangles from ALL 3 inner faces (Y, X, Z) - they are different triangles
		const neighbors: Record<FaceDir, boolean> = {
			"+x": !exterior["+x"],
			"-x": !exterior["-x"],
			"+y": !exterior["+y"],
			"-y": !exterior["-y"],
			"+z": !exterior["+z"],
			"-z": !exterior["-z"],
		};

		// Build three-way junction corners using canonical inner corner builder
		// For each face that has a neighbor, check if both perpendicular directions also have neighbors
		for (const face of FACE_DIRS) {
			if (!neighbors[face]) continue;  // Skip if this face is exterior

			const cfg = AXIS_CONFIGS[face];
			const perpDirs = getPerpDirs(face);

			// Check all 4 corner combinations for this face
			const cornerCombos: Array<{signU: number; signV: number; uDir: FaceDir; vDir: FaceDir}> = [
				{signU: +1, signV: +1, uDir: perpDirs.uPos, vDir: perpDirs.vPos},
				{signU: +1, signV: -1, uDir: perpDirs.uPos, vDir: perpDirs.vNeg},
				{signU: -1, signV: +1, uDir: perpDirs.uNeg, vDir: perpDirs.vPos},
				{signU: -1, signV: -1, uDir: perpDirs.uNeg, vDir: perpDirs.vNeg},
			];

			for (const {signU, signV, uDir, vDir} of cornerCombos) {
				// Only draw if both perpendicular directions also have neighbors (three-way junction)
				if (neighbors[uDir] && neighbors[vDir]) {
					buildInnerCornerCanonical(builder, block.x, block.y, block.z, cfg, signU, signV, true, true);
				}
			}
		}
	}

	return builder.build();
}


/**
 * Create beveled cube geometry for a single cube (used for board blocks)
 */
function createBeveledCubeGeometry(): THREE.BufferGeometry {
	// Use unified piece geometry with a single block
	return createUnifiedPieceGeometry([{x: 0, y: 0, z: 0}]);
}


/**
 * TetrisRenderer - Three.js WebGL renderer for Cube Tetris
 */
export class TetrisRenderer {
	private canvas: HTMLCanvasElement;
	private config: GameConfig;

	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer;
	private controls: OrbitControls;

	private boardGroup: THREE.Group;
	private pieceGroup: THREE.Group;
	private ghostGroup: THREE.Group;
	private boundaryGroup: THREE.Group;

	// Track individual board block meshes by coordinate key
	private boardBlockMeshes: Map<string, THREE.Mesh> = new Map();

	private blockGeometry: THREE.BufferGeometry;
	private ghostMaterial: THREE.MeshStandardMaterial;

	// Geometry cache for piece shapes (keyed by block positions)
	private geometryCache: Map<string, THREE.BufferGeometry> = new Map();

	// Geometry cache for board blocks (keyed by faceMask)
	private blockGeometryCache: Map<number, THREE.BufferGeometry> = new Map();

	private animationFrameId: number | null = null;
	private isDisposed: boolean = false;

	// Auto-rotate camera for demo mode
	private autoRotate: boolean = false;
	private autoRotateSpeed: number = 0.3;
	private autoRotateAngle: number = 0;
	private pieceCentroid: {x: number; z: number} | null = null;  // Current piece center of gravity
	private pieceSpawnTime: number = 0;  // Timestamp when piece spawned (for camera delay)
	private cameraAngularVelocity: number = 0;  // Current angular velocity for smooth inertia
	private ghostMinY: number = Infinity;  // Ghost brick's lowest Y position
	private boardCenter: THREE.Vector3;

	// Camera height following
	private heapMaxY: number = 0;
	private cameraTargetHeight: number = 5;
	private lastFrameTime: number = 0;

	// Layer clearing animation (references existing meshes in boardBlockMeshes)
	private clearingBlocks: Map<string, {remain: number; originalColor: THREE.Color}> = new Map();
	private readonly CLEAR_DURATION = 0.4;  // 0.4 seconds like original
	private readonly FLASH_INTERVAL = 0.08; // Flash every 80ms like original


	constructor(canvas: HTMLCanvasElement, config?: Partial<GameConfig>) {
		this.canvas = canvas;
		this.config = {...GAME_CONFIG, ...config};

		// Initialize Three.js
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
		this.renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: true,
			alpha: true,
		});

		// Setup camera
		this.boardCenter = new THREE.Vector3(
			this.config.boardWidth / 2 - 0.5,
			this.config.boardHeight / 4,
			this.config.boardDepth / 2 - 0.5
		);
		this.camera.position.set(
			this.boardCenter.x + 8,
			this.boardCenter.y + 6,
			this.boardCenter.z + 8
		);
		this.camera.lookAt(this.boardCenter);

		// Setup controls
		this.controls = new OrbitControls(this.camera, canvas);
		this.controls.target.copy(this.boardCenter);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.05;
		this.controls.minDistance = 5;
		this.controls.maxDistance = 30;
		this.controls.maxPolarAngle = Math.PI * 0.85;
		this.controls.update();

		// Setup groups
		this.boardGroup = new THREE.Group();
		this.pieceGroup = new THREE.Group();
		this.ghostGroup = new THREE.Group();
		this.boundaryGroup = new THREE.Group();

		this.scene.add(this.boardGroup);
		this.scene.add(this.pieceGroup);
		this.scene.add(this.ghostGroup);
		this.scene.add(this.boundaryGroup);

		// Shared geometry and materials - use beveled cube
		this.blockGeometry = createBeveledCubeGeometry();
		this.ghostMaterial = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 0.35,
			wireframe: false,
		});

		// Setup scene
		this.setupLighting();
		this.setupBoundary();
		this.setupFloor();

		// Background - dark blue like original
		this.scene.background = new THREE.Color(0x0a0a18);
	}


	/**
	 * Setup lighting
	 */
	private setupLighting(): void {
		// Ambient light
		const ambient = new THREE.AmbientLight(0xffffff, 0.4);
		this.scene.add(ambient);

		// Main directional light
		const directional = new THREE.DirectionalLight(0xffffff, 0.8);
		directional.position.set(10, 20, 10);
		directional.castShadow = true;
		this.scene.add(directional);

		// Fill light
		const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
		fillLight.position.set(-10, 10, -10);
		this.scene.add(fillLight);
	}


	/**
	 * Setup game boundary visualization
	 */
	private setupBoundary(): void {
		const {boardWidth, boardDepth, boardHeight} = this.config;

		// Create wireframe box for boundary - more visible like original
		const boundaryGeometry = new THREE.BoxGeometry(boardWidth, boardHeight, boardDepth);
		const edges = new THREE.EdgesGeometry(boundaryGeometry);
		const lineMaterial = new THREE.LineBasicMaterial({
			color: 0x4466aa,
			transparent: true,
			opacity: 0.6,
		});
		const boundaryLines = new THREE.LineSegments(edges, lineMaterial);
		boundaryLines.position.set(boardWidth / 2 - 0.5, boardHeight / 2 - 0.5, boardDepth / 2 - 0.5);
		this.boundaryGroup.add(boundaryLines);

		// 4 vertical corner lines instead of cylinder posts
		const cornerLineMaterial = new THREE.LineBasicMaterial({
			color: 0x6688bb,
			transparent: true,
			opacity: 0.8,
		});

		const corners = [
			[0, 0], [boardWidth, 0], [0, boardDepth], [boardWidth, boardDepth]
		];

		for (const [x, z] of corners) {
			const points = [
				new THREE.Vector3(x - 0.5, -0.5, z - 0.5),
				new THREE.Vector3(x - 0.5, boardHeight - 0.5, z - 0.5)
			];
			const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
			const line = new THREE.Line(lineGeometry, cornerLineMaterial);
			this.boundaryGroup.add(line);
		}

		// Add 4 walls with Fresnel effect
		this.setupWalls();
	}


	/**
	 * Setup 4 walls with Fresnel effect material
	 * Transparent when viewed head-on, visible when viewed at grazing angles
	 */
	private setupWalls(): void {
		const {boardWidth, boardDepth, boardHeight} = this.config;

		// Fresnel shader material
		const fresnelMaterial = new THREE.ShaderMaterial({
			uniforms: {
				uColor: {value: new THREE.Color(0x4488cc)},
				uFresnelPower: {value: 2.5},
				uOpacityBase: {value: 0.01},
				uOpacityFresnel: {value: 0.15},
			},
			vertexShader: `
				varying vec3 vNormal;
				varying vec3 vViewDir;

				void main() {
					vec4 worldPosition = modelMatrix * vec4(position, 1.0);
					vNormal = normalize(normalMatrix * normal);
					vViewDir = normalize(cameraPosition - worldPosition.xyz);
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
				}
			`,
			fragmentShader: `
				uniform vec3 uColor;
				uniform float uFresnelPower;
				uniform float uOpacityBase;
				uniform float uOpacityFresnel;

				varying vec3 vNormal;
				varying vec3 vViewDir;

				void main() {
					// Fresnel effect: 1.0 when viewing at grazing angle, 0.0 when head-on
					float fresnel = 1.0 - abs(dot(vNormal, vViewDir));
					fresnel = pow(fresnel, uFresnelPower);

					// Combine base opacity with fresnel-based opacity
					float opacity = uOpacityBase + fresnel * uOpacityFresnel;

					// Add slight glow at edges
					vec3 color = uColor + fresnel * 0.3;

					gl_FragColor = vec4(color, opacity);
				}
			`,
			transparent: true,
			side: THREE.DoubleSide,
			depthWrite: false,
		});

		// Wall dimensions
		const wallHeight = boardHeight;

		// Front wall (-Z)
		const frontWall = new THREE.Mesh(
			new THREE.PlaneGeometry(boardWidth, wallHeight),
			fresnelMaterial
		);
		frontWall.position.set(boardWidth / 2 - 0.5, wallHeight / 2 - 0.5, -0.5);
		this.boundaryGroup.add(frontWall);

		// Back wall (+Z)
		const backWall = new THREE.Mesh(
			new THREE.PlaneGeometry(boardWidth, wallHeight),
			fresnelMaterial.clone()
		);
		backWall.position.set(boardWidth / 2 - 0.5, wallHeight / 2 - 0.5, boardDepth - 0.5);
		backWall.rotation.y = Math.PI;
		this.boundaryGroup.add(backWall);

		// Left wall (-X)
		const leftWall = new THREE.Mesh(
			new THREE.PlaneGeometry(boardDepth, wallHeight),
			fresnelMaterial.clone()
		);
		leftWall.position.set(-0.5, wallHeight / 2 - 0.5, boardDepth / 2 - 0.5);
		leftWall.rotation.y = Math.PI / 2;
		this.boundaryGroup.add(leftWall);

		// Right wall (+X)
		const rightWall = new THREE.Mesh(
			new THREE.PlaneGeometry(boardDepth, wallHeight),
			fresnelMaterial.clone()
		);
		rightWall.position.set(boardWidth - 0.5, wallHeight / 2 - 0.5, boardDepth / 2 - 0.5);
		rightWall.rotation.y = -Math.PI / 2;
		this.boundaryGroup.add(rightWall);
	}


	/**
	 * Setup floor/grid visualization
	 */
	private setupFloor(): void {
		const {boardWidth, boardDepth} = this.config;

		// Grid helper
		const gridHelper = new THREE.GridHelper(
			Math.max(boardWidth, boardDepth),
			Math.max(boardWidth, boardDepth),
			0x444444,
			0x333333
		);
		gridHelper.position.set(boardWidth / 2 - 0.5, -0.5, boardDepth / 2 - 0.5);
		this.scene.add(gridHelper);

		// Floor plane
		const floorGeometry = new THREE.PlaneGeometry(boardWidth, boardDepth);
		const floorMaterial = new THREE.MeshStandardMaterial({
			color: 0x222233,
			transparent: true,
			opacity: 0.8,
		});
		const floor = new THREE.Mesh(floorGeometry, floorMaterial);
		floor.rotation.x = -Math.PI / 2;
		floor.position.set(boardWidth / 2 - 0.5, -0.5, boardDepth / 2 - 0.5);
		floor.receiveShadow = true;
		this.scene.add(floor);
	}


	/**
	 * Create a block mesh with given color and optional faceMask
	 * @param color Block color
	 * @param faceMask Bitmask of exposed faces (default: all faces = 63)
	 */
	private createBlockMesh(color: string, faceMask: number = FACE_MASK.ALL): THREE.Mesh {
		const material = new THREE.MeshStandardMaterial({
			color: new THREE.Color(color),
			metalness: 0.3,
			roughness: 0.4,
		});

		// Get or create cached geometry for this faceMask
		let geometry = this.blockGeometryCache.get(faceMask);
		if (!geometry) {
			geometry = createBlockGeometryFromMask(faceMask);
			this.blockGeometryCache.set(faceMask, geometry);
		}

		const mesh = new THREE.Mesh(geometry, material);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		return mesh;
	}


	/**
	 * Update the board visualization
	 * Maintains boardBlockMeshes map for individual block tracking
	 */
	updateBoard(board: CubeGrid): void {
		// Build map of current board blocks with their data
		const currentBlocks = new Map<string, {point: Point3D; data: BlockData}>();
		for (const {point, data} of board.toPointList()) {
			currentBlocks.set(coordKey(point.x, point.y, point.z), {point, data});
		}

		// Remove meshes that are no longer in the board (unless being cleared)
		// Also remove meshes where the block data has changed (different color/faceMask)
		for (const [key, mesh] of this.boardBlockMeshes) {
			if (this.clearingBlocks.has(key)) continue;

			const blockData = currentBlocks.get(key);
			if (!blockData) {
				// Block no longer exists at this position
				this.boardGroup.remove(mesh);
				(mesh.material as THREE.Material).dispose();
				this.boardBlockMeshes.delete(key);
			} else {
				// Check if color or faceMask changed - if so, recreate mesh
				const material = mesh.material as THREE.MeshStandardMaterial;
				const currentColor = new THREE.Color(blockData.data.color);
				const currentFaceMask = blockData.data.faceMask ?? FACE_MASK.ALL;

				// Get stored faceMask from mesh userData
				const storedFaceMask = (mesh.userData as {faceMask?: number}).faceMask ?? FACE_MASK.ALL;

				if (!material.color.equals(currentColor) || storedFaceMask !== currentFaceMask) {
					// Data changed, remove old mesh (will be recreated below)
					this.boardGroup.remove(mesh);
					(mesh.material as THREE.Material).dispose();
					this.boardBlockMeshes.delete(key);
				}
			}
		}

		// Add meshes for blocks that don't have one
		for (const [key, {point, data}] of currentBlocks) {
			// Skip if already exists or being cleared
			if (this.boardBlockMeshes.has(key)) continue;
			if (this.clearingBlocks.has(key)) continue;

			const faceMask = data.faceMask ?? FACE_MASK.ALL;
			const mesh = this.createBlockMesh(data.color, faceMask);
			mesh.position.set(point.x, point.y, point.z);
			// Store faceMask in userData for change detection
			mesh.userData = {faceMask};
			this.boardGroup.add(mesh);
			this.boardBlockMeshes.set(key, mesh);
		}
	}


	/**
	 * Update current piece visualization using unified piece mesh
	 * @param piece The piece to render
	 * @param visualY Optional Y position override for animation
	 */
	updatePiece(piece: TetrisPiece | null, visualY?: number): void {
		// Clear existing piece meshes (only dispose material, geometry is cached)
		while (this.pieceGroup.children.length > 0) {
			const child = this.pieceGroup.children[0];
			this.pieceGroup.remove(child);
			if (child instanceof THREE.Mesh) {
				// Don't dispose geometry - it's cached for reuse
				(child.material as THREE.Material).dispose();
			}
		}

		if (!piece) return;

		const blocks = piece.getWorldBlocks();
		if (blocks.length === 0) return;

		// Get local blocks (already rotated by CubeGrid)
		const localBlocks = piece.getLocalBlocks();

		// Get or create cached geometry for this specific rotation
		// Cache key based on local block positions (handles all rotations)
		const cacheKey = geometryCacheKey(localBlocks);
		let geometry = this.geometryCache.get(cacheKey);
		if (!geometry) {
			geometry = createUnifiedPieceGeometry(localBlocks);
			this.geometryCache.set(cacheKey, geometry);
		}

		// Create material with piece color
		const material = new THREE.MeshStandardMaterial({
			color: new THREE.Color(blocks[0].data.color),
			metalness: 0.3,
			roughness: 0.4,
		});

		// Create single mesh for the entire piece
		const mesh = new THREE.Mesh(geometry, material);
		mesh.castShadow = true;
		mesh.receiveShadow = true;

		// Position at piece position (use visualY if provided for animation)
		const y = visualY !== undefined ? visualY : piece.position.y;
		mesh.position.set(piece.position.x, y, piece.position.z);

		this.pieceGroup.add(mesh);
	}


	/**
	 * Update ghost piece visualization (drop preview) using unified mesh
	 * @param piece The piece to render as ghost
	 * @param ghostPosition The position for the ghost
	 * @param opacity Optional opacity override (default: 0.35)
	 */
	updateGhost(piece: TetrisPiece | null, ghostPosition: Point3D | null, opacity?: number): void {
		// Clear existing ghost meshes (don't dispose geometry - it's cached)
		while (this.ghostGroup.children.length > 0) {
			const child = this.ghostGroup.children[0];
			this.ghostGroup.remove(child);
		}

		if (!piece || !ghostPosition) return;

		// Update ghost material opacity
		this.ghostMaterial.opacity = opacity ?? 0.35;

		// Get local blocks (already rotated by CubeGrid)
		const localBlocks = piece.getLocalBlocks();

		// Get or create cached geometry for this specific rotation
		// Cache key based on local block positions (handles all rotations)
		const cacheKey = geometryCacheKey(localBlocks);
		let geometry = this.geometryCache.get(cacheKey);
		if (!geometry) {
			geometry = createUnifiedPieceGeometry(localBlocks);
			this.geometryCache.set(cacheKey, geometry);
		}

		// Create single mesh for the ghost
		const mesh = new THREE.Mesh(geometry, this.ghostMaterial);

		// Position at ghost position
		mesh.position.set(ghostPosition.x, ghostPosition.y, ghostPosition.z);

		this.ghostGroup.add(mesh);
	}


	/**
	 * Resize handler
	 */
	resize(width: number, height: number): void {
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width, height);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	}


	/**
	 * Render a single frame
	 */
	render(time: number = 0): void {
		if (this.isDisposed) return;

		// Calculate elapsed time in seconds
		const elapsed = this.lastFrameTime > 0 ? (time - this.lastFrameTime) / 1000 : 0.016;
		this.lastFrameTime = time;

		// Update clearing animation
		this.updateClearingAnimation(elapsed);

		// Update camera height to follow heap/piece
		this.updateCameraHeight(elapsed);

		// Update board center Y to follow camera target height
		this.boardCenter.y = this.cameraTargetHeight;

		// Auto-rotate camera if enabled
		if (this.autoRotate) {
			// Calculate target angular velocity based on piece centroid
			// Conditions for centroid targeting:
			// 1. After 0.4s since piece spawn
			// 2. Ghost's lowest Y < heap's highest Y (piece is below existing blocks)
			const timeSinceSpawn = performance.now() - this.pieceSpawnTime;
			const ghostNearHeap = this.ghostMinY < this.heapMaxY;
			let targetVelocity = this.autoRotateSpeed * 0.005;  // Default inertial speed

			if (this.pieceCentroid && timeSinceSpawn > 400 && ghostNearHeap) {
				// Vector from board center to piece centroid
				const dx = this.pieceCentroid.x - this.boardCenter.x;
				const dz = this.pieceCentroid.z - this.boardCenter.z;

				// Target angle aligns with centroid direction
				const targetAngle = Math.atan2(dz, dx);

				// Rotation speed proportional to distance from center
				const distance = Math.sqrt(dx * dx + dz * dz);
				const rotateSpeed = Math.max(0.3, distance * 0.8);

				// Calculate angle difference
				let angleDiff = targetAngle - this.autoRotateAngle;
				// Normalize to [-PI, PI]
				while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
				while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

				// Target velocity based on angle difference
				targetVelocity = angleDiff * rotateSpeed * 0.02;
			}

			// Smooth interpolation of angular velocity (inertia)
			const inertiaFactor = 0.08;  // Lower = more inertia
			this.cameraAngularVelocity += (targetVelocity - this.cameraAngularVelocity) * inertiaFactor;

			// Apply velocity to angle
			this.autoRotateAngle += this.cameraAngularVelocity;

			const radius = 12;
			const height = this.cameraTargetHeight + 5;
			this.camera.position.x = this.boardCenter.x + Math.cos(this.autoRotateAngle) * radius;
			this.camera.position.z = this.boardCenter.z + Math.sin(this.autoRotateAngle) * radius;
			this.camera.position.y = height;
			this.camera.lookAt(this.boardCenter);
			this.controls.target.copy(this.boardCenter);
		} else {
			// In manual mode, also update orbit controls target
			this.controls.target.y = this.cameraTargetHeight;
		}

		this.controls.update();
		this.renderer.render(this.scene, this.camera);
	}


	/**
	 * Start animation loop
	 */
	startAnimationLoop(onFrame?: (time: number) => void): void {
		const animate = (time: number) => {
			if (this.isDisposed) return;

			onFrame?.(time);
			this.render(time);
			this.animationFrameId = requestAnimationFrame(animate);
		};

		this.animationFrameId = requestAnimationFrame(animate);
	}


	/**
	 * Stop animation loop
	 */
	stopAnimationLoop(): void {
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
	}


	/**
	 * Cleanup resources
	 */
	dispose(): void {
		this.isDisposed = true;
		this.stopAnimationLoop();

		// Dispose geometries and materials
		this.blockGeometry.dispose();
		this.ghostMaterial.dispose();

		// Dispose cached piece geometries
		for (const geometry of this.geometryCache.values()) {
			geometry.dispose();
		}
		this.geometryCache.clear();

		// Dispose cached block geometries
		for (const geometry of this.blockGeometryCache.values()) {
			geometry.dispose();
		}
		this.blockGeometryCache.clear();

		// Dispose all meshes in groups
		const disposeGroup = (group: THREE.Group, skipGeometry: boolean = false) => {
			group.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					// Skip geometry disposal for groups using cached geometry
					if (!skipGeometry) {
						child.geometry?.dispose();
					}
					if (child.material instanceof THREE.Material) {
						child.material.dispose();
					} else if (Array.isArray(child.material)) {
						child.material.forEach(m => m.dispose());
					}
				}
			});
			group.clear();
		};

		disposeGroup(this.boardGroup, true);  // Uses cached block geometries
		disposeGroup(this.pieceGroup, true);  // Uses cached piece geometries
		disposeGroup(this.ghostGroup, true);  // Uses cached piece geometries
		disposeGroup(this.boundaryGroup);
		this.boardBlockMeshes.clear();
		this.clearingBlocks.clear();

		// Dispose controls and renderer
		this.controls.dispose();
		this.renderer.dispose();
	}


	/**
	 * Get camera for external access
	 */
	getCamera(): THREE.PerspectiveCamera {
		return this.camera;
	}


	/**
	 * Get scene for external access
	 */
	getScene(): THREE.Scene {
		return this.scene;
	}


	/**
	 * Get board center for camera-relative controls
	 */
	getBoardCenter(): THREE.Vector3 {
		return this.boardCenter.clone();
	}


	/**
	 * Enable/disable auto-rotate camera for demo mode
	 */
	setAutoRotate(enabled: boolean, speed: number = 0.3): void {
		this.autoRotate = enabled;
		this.autoRotateSpeed = speed;
		if (enabled) {
			// Disable user controls during auto-rotate
			this.controls.enabled = false;
		} else {
			this.controls.enabled = true;
		}
	}


	/**
	 * Check if auto-rotate is enabled
	 */
	isAutoRotating(): boolean {
		return this.autoRotate;
	}


	/**
	 * Set current piece centroid for camera targeting
	 */
	setPieceCentroid(centroid: {x: number; z: number} | null): void {
		this.pieceCentroid = centroid;
	}


	/**
	 * Notify that a new piece has spawned (resets camera control delay)
	 */
	onPieceSpawned(): void {
		this.pieceSpawnTime = performance.now();
	}


	/**
	 * Set ghost brick's minimum Y position for camera control
	 */
	setGhostMinY(minY: number): void {
		this.ghostMinY = minY;
	}


	/**
	 * Calculate ideal camera height based on heap
	 * Ported from original CubeTetris TetrisPool:idealCameraHeight()
	 */
	private idealCameraHeight(): number {
		const minHeight = 5;  // Minimum camera height
		const maxHeight = this.config.boardHeight;

		// Base height follows heap top + offset
		let height = this.heapMaxY + 2;

		// Clamp to valid range
		height = Math.min(height, maxHeight);
		height = Math.max(height, minHeight);

		return height;
	}


	/**
	 * Update camera height to smoothly follow the ideal height
	 * Ported from original CubeTetris TetrisPool update logic
	 */
	private updateCameraHeight(elapsed: number): void {
		const ideal = this.idealCameraHeight();
		const differ = ideal - this.cameraTargetHeight;

		// Calculate smooth delta movement
		// Speed increases with distance (min 0.6, scales with differ * 0.8)
		const speed = Math.max(0.6, Math.abs(differ) * 0.8);
		let delta = (differ > 0 ? 1 : -1) * elapsed * speed;

		// Snap to ideal if we'd overshoot
		if (Math.abs(delta) > Math.abs(differ)) {
			delta = differ;
		}

		this.cameraTargetHeight += delta;
	}


	/**
	 * Update heap max Y (call this when board changes)
	 */
	setHeapMaxY(maxY: number): void {
		this.heapMaxY = maxY;
	}


	/**
	 * Start clearing animation for blocks at specified positions
	 * Uses existing meshes from boardBlockMeshes instead of creating new ones
	 * @param blocks Array of block positions to animate (with color and faceMask)
	 */
	startClearingAnimation(blocks: Array<{point: Point3D; color: string; faceMask?: number}>): void {
		for (const {point, color} of blocks) {
			const key = coordKey(point.x, point.y, point.z);

			// Skip if already animating this block
			if (this.clearingBlocks.has(key)) {
				continue;
			}

			// Find existing mesh in boardBlockMeshes
			const mesh = this.boardBlockMeshes.get(key);
			if (!mesh) {
				// Block not found in board, skip
				continue;
			}

			// Get original color from the mesh material or parameter
			const material = mesh.material as THREE.MeshStandardMaterial;
			const originalColor = new THREE.Color(color);

			// Enable emissive for flash effect
			material.emissive = new THREE.Color(0xffffff);
			material.emissiveIntensity = 0;

			// Track clearing state (mesh is already in boardBlockMeshes)
			this.clearingBlocks.set(key, {
				remain: this.CLEAR_DURATION,
				originalColor,
			});
		}
	}


	/**
	 * Update clearing animation
	 * @param elapsed Time elapsed since last frame in seconds
	 * @returns true if animation is still ongoing, false if all clearing is done
	 */
	updateClearingAnimation(elapsed: number): boolean {
		if (this.clearingBlocks.size === 0) return false;

		const toRemove: string[] = [];

		for (const [key, data] of this.clearingBlocks) {
			// Get mesh from boardBlockMeshes
			const mesh = this.boardBlockMeshes.get(key);
			if (!mesh) {
				// Mesh was removed externally, clean up
				toRemove.push(key);
				continue;
			}

			// Calculate flash state (alternates every FLASH_INTERVAL)
			const flashPhase = Math.floor(data.remain / this.FLASH_INTERVAL) % 2;
			const material = mesh.material as THREE.MeshStandardMaterial;

			if (flashPhase === 0) {
				// Bright flash (white-ish)
				material.emissiveIntensity = 0.8;
				material.color.setRGB(1, 1, 1);
			} else {
				// Original color
				material.emissiveIntensity = 0.2;
				material.color.copy(data.originalColor);
			}

			// Update remaining time
			data.remain -= elapsed;

			if (data.remain <= 0) {
				toRemove.push(key);
			}
		}

		// Remove finished blocks from board
		for (const key of toRemove) {
			const mesh = this.boardBlockMeshes.get(key);
			if (mesh) {
				this.boardGroup.remove(mesh);
				(mesh.material as THREE.Material).dispose();
				this.boardBlockMeshes.delete(key);
			}
			this.clearingBlocks.delete(key);
		}

		return this.clearingBlocks.size > 0;
	}


	/**
	 * Check if clearing animation is currently active
	 */
	isClearingAnimation(): boolean {
		return this.clearingBlocks.size > 0;
	}
}
