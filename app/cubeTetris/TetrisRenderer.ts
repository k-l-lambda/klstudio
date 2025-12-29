
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


/**
 * Corner types for nine-grid geometry
 */
enum CornerType {
	OUTER_CONVEX,    // Outer convex corner: both edges are exterior
	SIDE_EXTEND_A,   // Side extension: edge A is exterior, edge B has neighbor
	SIDE_EXTEND_B,   // Side extension: edge A has neighbor, edge B is exterior
	INNER_CONCAVE,   // Inner concave corner: both edges have neighbors
}


/**
 * Determine corner type based on edge exterior states
 */
function getCornerType(exteriorA: boolean, exteriorB: boolean): CornerType {
	if (exteriorA && exteriorB) return CornerType.OUTER_CONVEX;
	if (exteriorA && !exteriorB) return CornerType.SIDE_EXTEND_A;
	if (!exteriorA && exteriorB) return CornerType.SIDE_EXTEND_B;
	return CornerType.INNER_CONCAVE;
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

	build(): THREE.BufferGeometry {
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.Float32BufferAttribute(this.vertices, 3));
		geometry.setAttribute("normal", new THREE.Float32BufferAttribute(this.normals, 3));
		geometry.setIndex(this.indices);
		return geometry;
	}
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
	const s = HALF_SIZE;
	const inner = INNER;
	const outer = OUTER;
	const sExt = S_EXT;

	// Determine coordinate mapping based on face direction
	// Each face has: main axis (face normal direction), A-axis, B-axis
	// +Y face: main=Y, A=X, B=Z
	// -Y face: main=Y, A=X, B=Z (reversed)
	// +Z face: main=Z, A=X, B=Y
	// -Z face: main=Z, A=X, B=Y (reversed)
	// +X face: main=X, A=Z, B=Y
	// -X face: main=X, A=Z, B=Y (reversed)

	if (face === "+y") {
		buildFaceYPositive(builder, ox, oy, oz, s, inner, outer, sExt, exterior);
	}
	else if (face === "-y") {
		buildFaceYNegative(builder, ox, oy, oz, s, inner, outer, sExt, exterior);
	}
	else if (face === "+z") {
		buildFaceZPositive(builder, ox, oy, oz, s, inner, outer, sExt, exterior);
	}
	else if (face === "-z") {
		buildFaceZNegative(builder, ox, oy, oz, s, inner, outer, sExt, exterior);
	}
	else if (face === "+x") {
		buildFaceXPositive(builder, ox, oy, oz, s, inner, outer, sExt, exterior);
	}
	else if (face === "-x") {
		buildFaceXNegative(builder, ox, oy, oz, s, inner, outer, sExt, exterior);
	}
}


/**
 * +Y face (top) nine-grid generation
 * A-axis = X, B-axis = Z
 */
function buildFaceYPositive(
	builder: GeometryBuilder,
	ox: number, oy: number, oz: number,
	s: number, inner: number, outer: number, sExt: number,
	exterior: Record<FaceDir, boolean>
): void {
	const y = oy + s;  // face position
	const normal: number[] = [0, 1, 0];

	const extPosX = exterior["+x"];
	const extNegX = exterior["-x"];
	const extPosZ = exterior["+z"];
	const extNegZ = exterior["-z"];

	// ========== 1. Center quad ==========
	builder.addQuad(
		[ox - inner, y, oz + inner], [ox + inner, y, oz + inner],
		[ox + inner, y, oz - inner], [ox - inner, y, oz - inner],
		normal
	);

	// ========== 2. Four edges ==========
	// -X edge
	if (extNegX) {
		// Bevel surface
		builder.addQuad(
			[ox - inner, y, oz + inner], [ox - inner, y, oz - inner],
			[ox - outer, oy + outer, oz - inner], [ox - outer, oy + outer, oz + inner],
			[-BEVEL_MAJOR, BEVEL_MINOR, 0]
		);
	}
	else {
		// Flat extension
		builder.addQuad(
			[ox - inner, y, oz + inner], [ox - inner, y, oz - inner],
			[ox - sExt, y, oz - inner], [ox - sExt, y, oz + inner],
			normal
		);
	}

	// +X edge
	if (extPosX) {
		builder.addQuad(
			[ox + inner, y, oz - inner], [ox + inner, y, oz + inner],
			[ox + outer, oy + outer, oz + inner], [ox + outer, oy + outer, oz - inner],
			[BEVEL_MAJOR, BEVEL_MINOR, 0]
		);
	}
	else {
		builder.addQuad(
			[ox + inner, y, oz - inner], [ox + inner, y, oz + inner],
			[ox + sExt, y, oz + inner], [ox + sExt, y, oz - inner],
			normal
		);
	}

	// -Z edge
	if (extNegZ) {
		builder.addQuad(
			[ox - inner, y, oz - inner], [ox + inner, y, oz - inner],
			[ox + inner, oy + outer, oz - outer], [ox - inner, oy + outer, oz - outer],
			[0, BEVEL_MINOR, -BEVEL_MAJOR]
		);
	}
	else {
		builder.addQuad(
			[ox - inner, y, oz - inner], [ox + inner, y, oz - inner],
			[ox + inner, y, oz - sExt], [ox - inner, y, oz - sExt],
			normal
		);
	}

	// +Z edge
	if (extPosZ) {
		builder.addQuad(
			[ox + inner, y, oz + inner], [ox - inner, y, oz + inner],
			[ox - inner, oy + outer, oz + outer], [ox + inner, oy + outer, oz + outer],
			[0, BEVEL_MINOR, BEVEL_MAJOR]
		);
	}
	else {
		builder.addQuad(
			[ox + inner, y, oz + inner], [ox - inner, y, oz + inner],
			[ox - inner, y, oz + sExt], [ox + inner, y, oz + sExt],
			normal
		);
	}

	// ========== 3. Four corners ==========
	// (-X, -Z) corner
	buildCornerYPositive(builder, ox, oy, oz, s, inner, outer, sExt,
		-1, -1, extNegX, extNegZ);

	// (+X, -Z) corner
	buildCornerYPositive(builder, ox, oy, oz, s, inner, outer, sExt,
		+1, -1, extPosX, extNegZ);

	// (-X, +Z) corner
	buildCornerYPositive(builder, ox, oy, oz, s, inner, outer, sExt,
		-1, +1, extNegX, extPosZ);

	// (+X, +Z) corner
	buildCornerYPositive(builder, ox, oy, oz, s, inner, outer, sExt,
		+1, +1, extPosX, extPosZ);
}


/**
 * +Y face corner generation
 * Triangulation: a-b-d and a-d-c (shared edge a-d from inner to diagonal outer)
 * @param signX X direction sign (+1 or -1)
 * @param signZ Z direction sign (+1 or -1)
 */
function buildCornerYPositive(
	builder: GeometryBuilder,
	ox: number, oy: number, oz: number,
	s: number, inner: number, outer: number, sExt: number,
	signX: number, signZ: number,
	exteriorX: boolean, exteriorZ: boolean
): void {
	const y = oy + s;
	const yOuter = oy + outer;

	// Point a: inner corner on face (always fixed)
	const a: number[] = [ox + signX * inner, y, oz + signZ * inner];

	// Point d: diagonal outer corner - coordinates depend on neighbor status
	const xD = exteriorX ? outer : sExt;
	const zD = exteriorZ ? outer : sExt;
	// Face normal direction: use inner if both neighbors (concave), else outer
	const yD = (!exteriorX && !exteriorZ) ? (oy + inner) : yOuter;
	const d: number[] = [ox + signX * xD, yD, oz + signZ * zD];

	// Point b: on X-direction edge
	// - exterior: on bevel at (xOuter, yOuter, zInner)
	// - neighbor: on flat at (xExt, y, zInner)
	const b: number[] = exteriorX
		? [ox + signX * outer, yOuter, oz + signZ * inner]
		: [ox + signX * sExt, y, oz + signZ * inner];

	// Point c: on Z-direction edge
	// - exterior: on bevel at (xInner, yOuter, zOuter)
	// - neighbor: on flat at (xInner, y, zExt)
	const c: number[] = exteriorZ
		? [ox + signX * inner, yOuter, oz + signZ * outer]
		: [ox + signX * inner, y, oz + signZ * sExt];

	// Helper: compute triangle normal via cross product
	const triNormal = (p1: number[], p2: number[], p3: number[]): number[] => {
		const ab = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
		const ac = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
		const nx = ab[1] * ac[2] - ab[2] * ac[1];
		const ny = ab[2] * ac[0] - ab[0] * ac[2];
		const nz = ab[0] * ac[1] - ab[1] * ac[0];
		const len = Math.hypot(nx, ny, nz) || 1;
		return [nx / len, ny / len, nz / len];
	};

	// Winding order depends on sign product
	// When signX * signZ < 0 (opposite signs): a-b-d, a-d-c
	// When signX * signZ > 0 (same signs): a-d-b, a-c-d
	if (signX * signZ < 0) {
		const n1 = triNormal(a, b, d);
		if (n1[1] < 0) { n1[0] = -n1[0]; n1[1] = -n1[1]; n1[2] = -n1[2]; }
		builder.addTriangle(a, b, d, n1);

		const n2 = triNormal(a, d, c);
		if (n2[1] < 0) { n2[0] = -n2[0]; n2[1] = -n2[1]; n2[2] = -n2[2]; }
		builder.addTriangle(a, d, c, n2);
	}
	else {
		const n1 = triNormal(a, d, b);
		if (n1[1] < 0) { n1[0] = -n1[0]; n1[1] = -n1[1]; n1[2] = -n1[2]; }
		builder.addTriangle(a, d, b, n1);

		const n2 = triNormal(a, c, d);
		if (n2[1] < 0) { n2[0] = -n2[0]; n2[1] = -n2[1]; n2[2] = -n2[2]; }
		builder.addTriangle(a, c, d, n2);
	}
}


/**
 * -Y face (bottom) nine-grid generation
 */
function buildFaceYNegative(
	builder: GeometryBuilder,
	ox: number, oy: number, oz: number,
	s: number, inner: number, outer: number, sExt: number,
	exterior: Record<FaceDir, boolean>
): void {
	const y = oy - s;
	const normal: number[] = [0, -1, 0];

	const extPosX = exterior["+x"];
	const extNegX = exterior["-x"];
	const extPosZ = exterior["+z"];
	const extNegZ = exterior["-z"];

	// Center
	builder.addQuad(
		[ox - inner, y, oz - inner], [ox + inner, y, oz - inner],
		[ox + inner, y, oz + inner], [ox - inner, y, oz + inner],
		normal
	);

	// -X edge
	if (extNegX) {
		builder.addQuad(
			[ox - inner, y, oz - inner], [ox - inner, y, oz + inner],
			[ox - outer, oy - outer, oz + inner], [ox - outer, oy - outer, oz - inner],
			[-BEVEL_MAJOR, -BEVEL_MINOR, 0]
		);
	}
	else {
		builder.addQuad(
			[ox - inner, y, oz - inner], [ox - inner, y, oz + inner],
			[ox - sExt, y, oz + inner], [ox - sExt, y, oz - inner],
			normal
		);
	}

	// +X edge
	if (extPosX) {
		builder.addQuad(
			[ox + inner, y, oz + inner], [ox + inner, y, oz - inner],
			[ox + outer, oy - outer, oz - inner], [ox + outer, oy - outer, oz + inner],
			[BEVEL_MAJOR, -BEVEL_MINOR, 0]
		);
	}
	else {
		builder.addQuad(
			[ox + inner, y, oz + inner], [ox + inner, y, oz - inner],
			[ox + sExt, y, oz - inner], [ox + sExt, y, oz + inner],
			normal
		);
	}

	// -Z edge
	if (extNegZ) {
		builder.addQuad(
			[ox + inner, y, oz - inner], [ox - inner, y, oz - inner],
			[ox - inner, oy - outer, oz - outer], [ox + inner, oy - outer, oz - outer],
			[0, -BEVEL_MINOR, -BEVEL_MAJOR]
		);
	}
	else {
		builder.addQuad(
			[ox + inner, y, oz - inner], [ox - inner, y, oz - inner],
			[ox - inner, y, oz - sExt], [ox + inner, y, oz - sExt],
			normal
		);
	}

	// +Z edge
	if (extPosZ) {
		builder.addQuad(
			[ox - inner, y, oz + inner], [ox + inner, y, oz + inner],
			[ox + inner, oy - outer, oz + outer], [ox - inner, oy - outer, oz + outer],
			[0, -BEVEL_MINOR, BEVEL_MAJOR]
		);
	}
	else {
		builder.addQuad(
			[ox - inner, y, oz + inner], [ox + inner, y, oz + inner],
			[ox + inner, y, oz + sExt], [ox - inner, y, oz + sExt],
			normal
		);
	}

	// Four corners
	buildCornerYNegative(builder, ox, oy, oz, s, inner, outer, sExt, -1, -1, extNegX, extNegZ);
	buildCornerYNegative(builder, ox, oy, oz, s, inner, outer, sExt, +1, -1, extPosX, extNegZ);
	buildCornerYNegative(builder, ox, oy, oz, s, inner, outer, sExt, -1, +1, extNegX, extPosZ);
	buildCornerYNegative(builder, ox, oy, oz, s, inner, outer, sExt, +1, +1, extPosX, extPosZ);
}


function buildCornerYNegative(
	builder: GeometryBuilder,
	ox: number, oy: number, oz: number,
	s: number, inner: number, outer: number, sExt: number,
	signX: number, signZ: number,
	exteriorX: boolean, exteriorZ: boolean
): void {
	const y = oy - s;
	const yOuter = oy - outer;

	// Point a: inner corner on face (always fixed)
	const a: number[] = [ox + signX * inner, y, oz + signZ * inner];

	// Point d: diagonal outer corner - coordinates depend on neighbor status
	const xD = exteriorX ? outer : sExt;
	const zD = exteriorZ ? outer : sExt;
	// Face normal direction: use inner if both neighbors (concave), else outer
	const yD = (!exteriorX && !exteriorZ) ? (oy - inner) : yOuter;
	const d: number[] = [ox + signX * xD, yD, oz + signZ * zD];

	// Point b: on X-direction edge
	const b: number[] = exteriorX
		? [ox + signX * outer, yOuter, oz + signZ * inner]
		: [ox + signX * sExt, y, oz + signZ * inner];

	// Point c: on Z-direction edge
	const c: number[] = exteriorZ
		? [ox + signX * inner, yOuter, oz + signZ * outer]
		: [ox + signX * inner, y, oz + signZ * sExt];

	// Helper: compute triangle normal
	const triNormal = (p1: number[], p2: number[], p3: number[]): number[] => {
		const ab = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
		const ac = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
		const nx = ab[1] * ac[2] - ab[2] * ac[1];
		const ny = ab[2] * ac[0] - ab[0] * ac[2];
		const nz = ab[0] * ac[1] - ab[1] * ac[0];
		const len = Math.hypot(nx, ny, nz) || 1;
		return [nx / len, ny / len, nz / len];
	};

	// Winding order depends on sign product (opposite to +Y face)
	if (signX * signZ < 0) {
		const n1 = triNormal(a, d, b);
		if (n1[1] > 0) { n1[0] = -n1[0]; n1[1] = -n1[1]; n1[2] = -n1[2]; }
		builder.addTriangle(a, d, b, n1);

		const n2 = triNormal(a, c, d);
		if (n2[1] > 0) { n2[0] = -n2[0]; n2[1] = -n2[1]; n2[2] = -n2[2]; }
		builder.addTriangle(a, c, d, n2);
	}
	else {
		const n1 = triNormal(a, b, d);
		if (n1[1] > 0) { n1[0] = -n1[0]; n1[1] = -n1[1]; n1[2] = -n1[2]; }
		builder.addTriangle(a, b, d, n1);

		const n2 = triNormal(a, d, c);
		if (n2[1] > 0) { n2[0] = -n2[0]; n2[1] = -n2[1]; n2[2] = -n2[2]; }
		builder.addTriangle(a, d, c, n2);
	}
}


/**
 * +Z face (front) nine-grid generation
 * A-axis = X, B-axis = Y
 */
function buildFaceZPositive(
	builder: GeometryBuilder,
	ox: number, oy: number, oz: number,
	s: number, inner: number, outer: number, sExt: number,
	exterior: Record<FaceDir, boolean>
): void {
	const z = oz + s;
	const normal: number[] = [0, 0, 1];

	const extPosX = exterior["+x"];
	const extNegX = exterior["-x"];
	const extPosY = exterior["+y"];
	const extNegY = exterior["-y"];

	// Center
	builder.addQuad(
		[ox - inner, oy - inner, z], [ox + inner, oy - inner, z],
		[ox + inner, oy + inner, z], [ox - inner, oy + inner, z],
		normal
	);

	// -X edge
	if (extNegX) {
		builder.addQuad(
			[ox - inner, oy - inner, z], [ox - inner, oy + inner, z],
			[ox - outer, oy + inner, oz + outer], [ox - outer, oy - inner, oz + outer],
			[-BEVEL_MAJOR, 0, BEVEL_MINOR]
		);
	}
	else {
		builder.addQuad(
			[ox - inner, oy - inner, z], [ox - inner, oy + inner, z],
			[ox - sExt, oy + inner, z], [ox - sExt, oy - inner, z],
			normal
		);
	}

	// +X edge
	if (extPosX) {
		builder.addQuad(
			[ox + inner, oy + inner, z], [ox + inner, oy - inner, z],
			[ox + outer, oy - inner, oz + outer], [ox + outer, oy + inner, oz + outer],
			[BEVEL_MAJOR, 0, BEVEL_MINOR]
		);
	}
	else {
		builder.addQuad(
			[ox + inner, oy + inner, z], [ox + inner, oy - inner, z],
			[ox + sExt, oy - inner, z], [ox + sExt, oy + inner, z],
			normal
		);
	}

	// -Y edge
	if (extNegY) {
		builder.addQuad(
			[ox + inner, oy - inner, z], [ox - inner, oy - inner, z],
			[ox - inner, oy - outer, oz + outer], [ox + inner, oy - outer, oz + outer],
			[0, -BEVEL_MAJOR, BEVEL_MINOR]
		);
	}
	else {
		builder.addQuad(
			[ox + inner, oy - inner, z], [ox - inner, oy - inner, z],
			[ox - inner, oy - sExt, z], [ox + inner, oy - sExt, z],
			normal
		);
	}

	// +Y edge
	if (extPosY) {
		builder.addQuad(
			[ox - inner, oy + inner, z], [ox + inner, oy + inner, z],
			[ox + inner, oy + outer, oz + outer], [ox - inner, oy + outer, oz + outer],
			[0, BEVEL_MAJOR, BEVEL_MINOR]
		);
	}
	else {
		builder.addQuad(
			[ox - inner, oy + inner, z], [ox + inner, oy + inner, z],
			[ox + inner, oy + sExt, z], [ox - inner, oy + sExt, z],
			normal
		);
	}

	// Four corners
	buildCornerZPositive(builder, ox, oy, oz, s, inner, outer, sExt, -1, -1, extNegX, extNegY);
	buildCornerZPositive(builder, ox, oy, oz, s, inner, outer, sExt, +1, -1, extPosX, extNegY);
	buildCornerZPositive(builder, ox, oy, oz, s, inner, outer, sExt, -1, +1, extNegX, extPosY);
	buildCornerZPositive(builder, ox, oy, oz, s, inner, outer, sExt, +1, +1, extPosX, extPosY);
}


function buildCornerZPositive(
	builder: GeometryBuilder,
	ox: number, oy: number, oz: number,
	s: number, inner: number, outer: number, sExt: number,
	signX: number, signY: number,
	exteriorX: boolean, exteriorY: boolean
): void {
	const z = oz + s;
	const zOuter = oz + outer;

	// Point a: inner corner on face (always fixed)
	const a: number[] = [ox + signX * inner, oy + signY * inner, z];

	// Point d: diagonal outer corner - coordinates depend on neighbor status
	const xD = exteriorX ? outer : sExt;
	const yD = exteriorY ? outer : sExt;
	// Face normal direction: use inner if both neighbors (concave), else outer
	const zD = (!exteriorX && !exteriorY) ? (oz + inner) : zOuter;
	const d: number[] = [ox + signX * xD, oy + signY * yD, zD];

	// Point b: on X-direction edge
	const b: number[] = exteriorX
		? [ox + signX * outer, oy + signY * inner, zOuter]
		: [ox + signX * sExt, oy + signY * inner, z];

	// Point c: on Y-direction edge
	const c: number[] = exteriorY
		? [ox + signX * inner, oy + signY * outer, zOuter]
		: [ox + signX * inner, oy + signY * sExt, z];

	// Helper: compute triangle normal
	const triNormal = (p1: number[], p2: number[], p3: number[]): number[] => {
		const ab = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
		const ac = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
		const nx = ab[1] * ac[2] - ab[2] * ac[1];
		const ny = ab[2] * ac[0] - ab[0] * ac[2];
		const nz = ab[0] * ac[1] - ab[1] * ac[0];
		const len = Math.hypot(nx, ny, nz) || 1;
		return [nx / len, ny / len, nz / len];
	};

	// Winding order depends on sign product
	if (signX * signY > 0) {
		const n1 = triNormal(a, b, d);
		if (n1[2] < 0) { n1[0] = -n1[0]; n1[1] = -n1[1]; n1[2] = -n1[2]; }
		builder.addTriangle(a, b, d, n1);

		const n2 = triNormal(a, d, c);
		if (n2[2] < 0) { n2[0] = -n2[0]; n2[1] = -n2[1]; n2[2] = -n2[2]; }
		builder.addTriangle(a, d, c, n2);
	}
	else {
		const n1 = triNormal(a, d, b);
		if (n1[2] < 0) { n1[0] = -n1[0]; n1[1] = -n1[1]; n1[2] = -n1[2]; }
		builder.addTriangle(a, d, b, n1);

		const n2 = triNormal(a, c, d);
		if (n2[2] < 0) { n2[0] = -n2[0]; n2[1] = -n2[1]; n2[2] = -n2[2]; }
		builder.addTriangle(a, c, d, n2);
	}
}


/**
 * -Z face (back) nine-grid generation
 */
function buildFaceZNegative(
	builder: GeometryBuilder,
	ox: number, oy: number, oz: number,
	s: number, inner: number, outer: number, sExt: number,
	exterior: Record<FaceDir, boolean>
): void {
	const z = oz - s;
	const normal: number[] = [0, 0, -1];

	const extPosX = exterior["+x"];
	const extNegX = exterior["-x"];
	const extPosY = exterior["+y"];
	const extNegY = exterior["-y"];

	// Center
	builder.addQuad(
		[ox + inner, oy - inner, z], [ox - inner, oy - inner, z],
		[ox - inner, oy + inner, z], [ox + inner, oy + inner, z],
		normal
	);

	// +X edge
	if (extPosX) {
		builder.addQuad(
			[ox + inner, oy - inner, z], [ox + inner, oy + inner, z],
			[ox + outer, oy + inner, oz - outer], [ox + outer, oy - inner, oz - outer],
			[BEVEL_MAJOR, 0, -BEVEL_MINOR]
		);
	}
	else {
		builder.addQuad(
			[ox + inner, oy - inner, z], [ox + inner, oy + inner, z],
			[ox + sExt, oy + inner, z], [ox + sExt, oy - inner, z],
			normal
		);
	}

	// -X edge
	if (extNegX) {
		builder.addQuad(
			[ox - inner, oy + inner, z], [ox - inner, oy - inner, z],
			[ox - outer, oy - inner, oz - outer], [ox - outer, oy + inner, oz - outer],
			[-BEVEL_MAJOR, 0, -BEVEL_MINOR]
		);
	}
	else {
		builder.addQuad(
			[ox - inner, oy + inner, z], [ox - inner, oy - inner, z],
			[ox - sExt, oy - inner, z], [ox - sExt, oy + inner, z],
			normal
		);
	}

	// -Y edge
	if (extNegY) {
		builder.addQuad(
			[ox - inner, oy - inner, z], [ox + inner, oy - inner, z],
			[ox + inner, oy - outer, oz - outer], [ox - inner, oy - outer, oz - outer],
			[0, -BEVEL_MAJOR, -BEVEL_MINOR]
		);
	}
	else {
		builder.addQuad(
			[ox - inner, oy - inner, z], [ox + inner, oy - inner, z],
			[ox + inner, oy - sExt, z], [ox - inner, oy - sExt, z],
			normal
		);
	}

	// +Y edge
	if (extPosY) {
		builder.addQuad(
			[ox + inner, oy + inner, z], [ox - inner, oy + inner, z],
			[ox - inner, oy + outer, oz - outer], [ox + inner, oy + outer, oz - outer],
			[0, BEVEL_MAJOR, -BEVEL_MINOR]
		);
	}
	else {
		builder.addQuad(
			[ox + inner, oy + inner, z], [ox - inner, oy + inner, z],
			[ox - inner, oy + sExt, z], [ox + inner, oy + sExt, z],
			normal
		);
	}

	// Four corners
	buildCornerZNegative(builder, ox, oy, oz, s, inner, outer, sExt, -1, -1, extNegX, extNegY);
	buildCornerZNegative(builder, ox, oy, oz, s, inner, outer, sExt, +1, -1, extPosX, extNegY);
	buildCornerZNegative(builder, ox, oy, oz, s, inner, outer, sExt, -1, +1, extNegX, extPosY);
	buildCornerZNegative(builder, ox, oy, oz, s, inner, outer, sExt, +1, +1, extPosX, extPosY);
}


function buildCornerZNegative(
	builder: GeometryBuilder,
	ox: number, oy: number, oz: number,
	s: number, inner: number, outer: number, sExt: number,
	signX: number, signY: number,
	exteriorX: boolean, exteriorY: boolean
): void {
	const z = oz - s;
	const zOuter = oz - outer;

	// Point a: inner corner on face (always fixed)
	const a: number[] = [ox + signX * inner, oy + signY * inner, z];

	// Point d: diagonal outer corner - coordinates depend on neighbor status
	const xD = exteriorX ? outer : sExt;
	const yD = exteriorY ? outer : sExt;
	// Face normal direction: use inner if both neighbors (concave), else outer
	const zD = (!exteriorX && !exteriorY) ? (oz - inner) : zOuter;
	const d: number[] = [ox + signX * xD, oy + signY * yD, zD];

	// Point b: on X-direction edge
	const b: number[] = exteriorX
		? [ox + signX * outer, oy + signY * inner, zOuter]
		: [ox + signX * sExt, oy + signY * inner, z];

	// Point c: on Y-direction edge
	const c: number[] = exteriorY
		? [ox + signX * inner, oy + signY * outer, zOuter]
		: [ox + signX * inner, oy + signY * sExt, z];

	// Helper: compute triangle normal
	const triNormal = (p1: number[], p2: number[], p3: number[]): number[] => {
		const ab = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
		const ac = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
		const nx = ab[1] * ac[2] - ab[2] * ac[1];
		const ny = ab[2] * ac[0] - ab[0] * ac[2];
		const nz = ab[0] * ac[1] - ab[1] * ac[0];
		const len = Math.hypot(nx, ny, nz) || 1;
		return [nx / len, ny / len, nz / len];
	};

	// Winding order depends on sign product (opposite to +Z face)
	if (signX * signY > 0) {
		const n1 = triNormal(a, d, b);
		if (n1[2] > 0) { n1[0] = -n1[0]; n1[1] = -n1[1]; n1[2] = -n1[2]; }
		builder.addTriangle(a, d, b, n1);

		const n2 = triNormal(a, c, d);
		if (n2[2] > 0) { n2[0] = -n2[0]; n2[1] = -n2[1]; n2[2] = -n2[2]; }
		builder.addTriangle(a, c, d, n2);
	}
	else {
		const n1 = triNormal(a, b, d);
		if (n1[2] > 0) { n1[0] = -n1[0]; n1[1] = -n1[1]; n1[2] = -n1[2]; }
		builder.addTriangle(a, b, d, n1);

		const n2 = triNormal(a, d, c);
		if (n2[2] > 0) { n2[0] = -n2[0]; n2[1] = -n2[1]; n2[2] = -n2[2]; }
		builder.addTriangle(a, d, c, n2);
	}
}


/**
 * +X face (right) nine-grid generation
 * A-axis = Z, B-axis = Y
 */
function buildFaceXPositive(
	builder: GeometryBuilder,
	ox: number, oy: number, oz: number,
	s: number, inner: number, outer: number, sExt: number,
	exterior: Record<FaceDir, boolean>
): void {
	const x = ox + s;
	const normal: number[] = [1, 0, 0];

	const extPosZ = exterior["+z"];
	const extNegZ = exterior["-z"];
	const extPosY = exterior["+y"];
	const extNegY = exterior["-y"];

	// Center
	builder.addQuad(
		[x, oy - inner, oz + inner], [x, oy - inner, oz - inner],
		[x, oy + inner, oz - inner], [x, oy + inner, oz + inner],
		normal
	);

	// +Z edge
	if (extPosZ) {
		builder.addQuad(
			[x, oy - inner, oz + inner], [x, oy + inner, oz + inner],
			[ox + outer, oy + inner, oz + outer], [ox + outer, oy - inner, oz + outer],
			[BEVEL_MINOR, 0, BEVEL_MAJOR]
		);
	}
	else {
		builder.addQuad(
			[x, oy - inner, oz + inner], [x, oy + inner, oz + inner],
			[x, oy + inner, oz + sExt], [x, oy - inner, oz + sExt],
			normal
		);
	}

	// -Z edge
	if (extNegZ) {
		builder.addQuad(
			[x, oy + inner, oz - inner], [x, oy - inner, oz - inner],
			[ox + outer, oy - inner, oz - outer], [ox + outer, oy + inner, oz - outer],
			[BEVEL_MINOR, 0, -BEVEL_MAJOR]
		);
	}
	else {
		builder.addQuad(
			[x, oy + inner, oz - inner], [x, oy - inner, oz - inner],
			[x, oy - inner, oz - sExt], [x, oy + inner, oz - sExt],
			normal
		);
	}

	// -Y edge
	if (extNegY) {
		builder.addQuad(
			[x, oy - inner, oz - inner], [x, oy - inner, oz + inner],
			[ox + outer, oy - outer, oz + inner], [ox + outer, oy - outer, oz - inner],
			[BEVEL_MINOR, -BEVEL_MAJOR, 0]
		);
	}
	else {
		builder.addQuad(
			[x, oy - inner, oz - inner], [x, oy - inner, oz + inner],
			[x, oy - sExt, oz + inner], [x, oy - sExt, oz - inner],
			normal
		);
	}

	// +Y edge
	if (extPosY) {
		builder.addQuad(
			[x, oy + inner, oz + inner], [x, oy + inner, oz - inner],
			[ox + outer, oy + outer, oz - inner], [ox + outer, oy + outer, oz + inner],
			[BEVEL_MINOR, BEVEL_MAJOR, 0]
		);
	}
	else {
		builder.addQuad(
			[x, oy + inner, oz + inner], [x, oy + inner, oz - inner],
			[x, oy + sExt, oz - inner], [x, oy + sExt, oz + inner],
			normal
		);
	}

	// Four corners
	buildCornerXPositive(builder, ox, oy, oz, s, inner, outer, sExt, -1, -1, extNegZ, extNegY);
	buildCornerXPositive(builder, ox, oy, oz, s, inner, outer, sExt, +1, -1, extPosZ, extNegY);
	buildCornerXPositive(builder, ox, oy, oz, s, inner, outer, sExt, -1, +1, extNegZ, extPosY);
	buildCornerXPositive(builder, ox, oy, oz, s, inner, outer, sExt, +1, +1, extPosZ, extPosY);
}


function buildCornerXPositive(
	builder: GeometryBuilder,
	ox: number, oy: number, oz: number,
	s: number, inner: number, outer: number, sExt: number,
	signZ: number, signY: number,
	exteriorZ: boolean, exteriorY: boolean
): void {
	const x = ox + s;
	const xOuter = ox + outer;

	// Point a: inner corner on face (always fixed)
	const a: number[] = [x, oy + signY * inner, oz + signZ * inner];

	// Point d: diagonal outer corner - coordinates depend on neighbor status
	const yD = exteriorY ? outer : sExt;
	const zD = exteriorZ ? outer : sExt;
	// Face normal direction: use inner if both neighbors (concave), else outer
	const xD = (!exteriorY && !exteriorZ) ? (ox + inner) : xOuter;
	const d: number[] = [xD, oy + signY * yD, oz + signZ * zD];

	// Point b: on Z-direction edge
	const b: number[] = exteriorZ
		? [xOuter, oy + signY * inner, oz + signZ * outer]
		: [x, oy + signY * inner, oz + signZ * sExt];

	// Point c: on Y-direction edge
	const c: number[] = exteriorY
		? [xOuter, oy + signY * outer, oz + signZ * inner]
		: [x, oy + signY * sExt, oz + signZ * inner];

	// Helper: compute triangle normal
	const triNormal = (p1: number[], p2: number[], p3: number[]): number[] => {
		const ab = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
		const ac = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
		const nx = ab[1] * ac[2] - ab[2] * ac[1];
		const ny = ab[2] * ac[0] - ab[0] * ac[2];
		const nz = ab[0] * ac[1] - ab[1] * ac[0];
		const len = Math.hypot(nx, ny, nz) || 1;
		return [nx / len, ny / len, nz / len];
	};

	// Winding order depends on sign product
	if (signZ * signY < 0) {
		const n1 = triNormal(a, b, d);
		if (n1[0] < 0) { n1[0] = -n1[0]; n1[1] = -n1[1]; n1[2] = -n1[2]; }
		builder.addTriangle(a, b, d, n1);

		const n2 = triNormal(a, d, c);
		if (n2[0] < 0) { n2[0] = -n2[0]; n2[1] = -n2[1]; n2[2] = -n2[2]; }
		builder.addTriangle(a, d, c, n2);
	}
	else {
		const n1 = triNormal(a, d, b);
		if (n1[0] < 0) { n1[0] = -n1[0]; n1[1] = -n1[1]; n1[2] = -n1[2]; }
		builder.addTriangle(a, d, b, n1);

		const n2 = triNormal(a, c, d);
		if (n2[0] < 0) { n2[0] = -n2[0]; n2[1] = -n2[1]; n2[2] = -n2[2]; }
		builder.addTriangle(a, c, d, n2);
	}
}


/**
 * -X face (left) nine-grid generation
 */
function buildFaceXNegative(
	builder: GeometryBuilder,
	ox: number, oy: number, oz: number,
	s: number, inner: number, outer: number, sExt: number,
	exterior: Record<FaceDir, boolean>
): void {
	const x = ox - s;
	const normal: number[] = [-1, 0, 0];

	const extPosZ = exterior["+z"];
	const extNegZ = exterior["-z"];
	const extPosY = exterior["+y"];
	const extNegY = exterior["-y"];

	// Center
	builder.addQuad(
		[x, oy - inner, oz - inner], [x, oy - inner, oz + inner],
		[x, oy + inner, oz + inner], [x, oy + inner, oz - inner],
		normal
	);

	// -Z edge
	if (extNegZ) {
		builder.addQuad(
			[x, oy - inner, oz - inner], [x, oy + inner, oz - inner],
			[ox - outer, oy + inner, oz - outer], [ox - outer, oy - inner, oz - outer],
			[-BEVEL_MINOR, 0, -BEVEL_MAJOR]
		);
	}
	else {
		builder.addQuad(
			[x, oy - inner, oz - inner], [x, oy + inner, oz - inner],
			[x, oy + inner, oz - sExt], [x, oy - inner, oz - sExt],
			normal
		);
	}

	// +Z edge
	if (extPosZ) {
		builder.addQuad(
			[x, oy + inner, oz + inner], [x, oy - inner, oz + inner],
			[ox - outer, oy - inner, oz + outer], [ox - outer, oy + inner, oz + outer],
			[-BEVEL_MINOR, 0, BEVEL_MAJOR]
		);
	}
	else {
		builder.addQuad(
			[x, oy + inner, oz + inner], [x, oy - inner, oz + inner],
			[x, oy - inner, oz + sExt], [x, oy + inner, oz + sExt],
			normal
		);
	}

	// -Y edge
	if (extNegY) {
		builder.addQuad(
			[x, oy - inner, oz + inner], [x, oy - inner, oz - inner],
			[ox - outer, oy - outer, oz - inner], [ox - outer, oy - outer, oz + inner],
			[-BEVEL_MINOR, -BEVEL_MAJOR, 0]
		);
	}
	else {
		builder.addQuad(
			[x, oy - inner, oz + inner], [x, oy - inner, oz - inner],
			[x, oy - sExt, oz - inner], [x, oy - sExt, oz + inner],
			normal
		);
	}

	// +Y edge
	if (extPosY) {
		builder.addQuad(
			[x, oy + inner, oz - inner], [x, oy + inner, oz + inner],
			[ox - outer, oy + outer, oz + inner], [ox - outer, oy + outer, oz - inner],
			[-BEVEL_MINOR, BEVEL_MAJOR, 0]
		);
	}
	else {
		builder.addQuad(
			[x, oy + inner, oz - inner], [x, oy + inner, oz + inner],
			[x, oy + sExt, oz + inner], [x, oy + sExt, oz - inner],
			normal
		);
	}

	// Four corners
	buildCornerXNegative(builder, ox, oy, oz, s, inner, outer, sExt, -1, -1, extNegZ, extNegY);
	buildCornerXNegative(builder, ox, oy, oz, s, inner, outer, sExt, +1, -1, extPosZ, extNegY);
	buildCornerXNegative(builder, ox, oy, oz, s, inner, outer, sExt, -1, +1, extNegZ, extPosY);
	buildCornerXNegative(builder, ox, oy, oz, s, inner, outer, sExt, +1, +1, extPosZ, extPosY);
}


function buildCornerXNegative(
	builder: GeometryBuilder,
	ox: number, oy: number, oz: number,
	s: number, inner: number, outer: number, sExt: number,
	signZ: number, signY: number,
	exteriorZ: boolean, exteriorY: boolean
): void {
	const x = ox - s;
	const xOuter = ox - outer;

	// Point a: inner corner on face (always fixed)
	const a: number[] = [x, oy + signY * inner, oz + signZ * inner];

	// Point d: diagonal outer corner - coordinates depend on neighbor status
	const yD = exteriorY ? outer : sExt;
	const zD = exteriorZ ? outer : sExt;
	// Face normal direction: use inner if both neighbors (concave), else outer
	const xD = (!exteriorY && !exteriorZ) ? (ox - inner) : xOuter;
	const d: number[] = [xD, oy + signY * yD, oz + signZ * zD];

	// Point b: on Z-direction edge
	const b: number[] = exteriorZ
		? [xOuter, oy + signY * inner, oz + signZ * outer]
		: [x, oy + signY * inner, oz + signZ * sExt];

	// Point c: on Y-direction edge
	const c: number[] = exteriorY
		? [xOuter, oy + signY * outer, oz + signZ * inner]
		: [x, oy + signY * sExt, oz + signZ * inner];

	// Helper: compute triangle normal
	const triNormal = (p1: number[], p2: number[], p3: number[]): number[] => {
		const ab = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
		const ac = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
		const nx = ab[1] * ac[2] - ab[2] * ac[1];
		const ny = ab[2] * ac[0] - ab[0] * ac[2];
		const nz = ab[0] * ac[1] - ab[1] * ac[0];
		const len = Math.hypot(nx, ny, nz) || 1;
		return [nx / len, ny / len, nz / len];
	};

	// Winding order depends on sign product (opposite to +X face)
	if (signZ * signY < 0) {
		const n1 = triNormal(a, d, b);
		if (n1[0] > 0) { n1[0] = -n1[0]; n1[1] = -n1[1]; n1[2] = -n1[2]; }
		builder.addTriangle(a, d, b, n1);

		const n2 = triNormal(a, c, d);
		if (n2[0] > 0) { n2[0] = -n2[0]; n2[1] = -n2[1]; n2[2] = -n2[2]; }
		builder.addTriangle(a, c, d, n2);
	}
	else {
		const n1 = triNormal(a, b, d);
		if (n1[0] > 0) { n1[0] = -n1[0]; n1[1] = -n1[1]; n1[2] = -n1[2]; }
		builder.addTriangle(a, b, d, n1);

		const n2 = triNormal(a, d, c);
		if (n2[0] > 0) { n2[0] = -n2[0]; n2[1] = -n2[1]; n2[2] = -n2[2]; }
		builder.addTriangle(a, d, c, n2);
	}
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

	// Build each exterior face using nine-grid system
	for (const face of FACE_DIRS) {
		if (exterior[face]) {
			buildFaceGeometry(builder, 0, 0, 0, face, exterior);
		}
	}

	return builder.build();
}


/**
 * Create unified piece geometry for a set of blocks.
 * Uses the nine-grid system for proper corner handling.
 * Internal faces between adjacent cubes are removed.
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
	private boardCenter: THREE.Vector3;

	// Camera height following
	private heapMaxY: number = 0;
	private currentPieceY: number = 0;
	private cameraTargetHeight: number = 5;
	private lastFrameTime: number = 0;

	// Layer clearing animation
	private clearingBlocks: Map<string, {mesh: THREE.Mesh; remain: number; originalColor: THREE.Color}> = new Map();
	private clearingGroup: THREE.Group;
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
		this.clearingGroup = new THREE.Group();

		this.scene.add(this.boardGroup);
		this.scene.add(this.pieceGroup);
		this.scene.add(this.ghostGroup);
		this.scene.add(this.boundaryGroup);
		this.scene.add(this.clearingGroup);

		// Shared geometry and materials - use beveled cube
		this.blockGeometry = createBeveledCubeGeometry();
		this.ghostMaterial = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 0.15,
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

		// Corner posts - thicker and more visible
		const postGeometry = new THREE.CylinderGeometry(0.08, 0.08, boardHeight, 8);
		const postMaterial = new THREE.MeshStandardMaterial({
			color: 0x6688bb,
			metalness: 0.5,
			roughness: 0.3,
		});

		const corners = [
			[0, 0], [boardWidth, 0], [0, boardDepth], [boardWidth, boardDepth]
		];

		for (const [x, z] of corners) {
			const post = new THREE.Mesh(postGeometry, postMaterial);
			post.position.set(x - 0.5, boardHeight / 2 - 0.5, z - 0.5);
			this.boundaryGroup.add(post);
		}
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
	 */
	updateBoard(board: CubeGrid): void {
		// Clear existing board meshes
		while (this.boardGroup.children.length > 0) {
			const child = this.boardGroup.children[0];
			this.boardGroup.remove(child);
			if (child instanceof THREE.Mesh) {
				(child.material as THREE.Material).dispose();
			}
		}

		// Add blocks from board using their stored faceMask
		for (const {point, data} of board.toPointList()) {
			const faceMask = data.faceMask ?? FACE_MASK.ALL;
			const mesh = this.createBlockMesh(data.color, faceMask);
			mesh.position.set(point.x, point.y, point.z);
			this.boardGroup.add(mesh);
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
	 */
	updateGhost(piece: TetrisPiece | null, ghostPosition: Point3D | null): void {
		// Clear existing ghost meshes (don't dispose geometry - it's cached)
		while (this.ghostGroup.children.length > 0) {
			const child = this.ghostGroup.children[0];
			this.ghostGroup.remove(child);
		}

		if (!piece || !ghostPosition) return;

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
			this.autoRotateAngle += this.autoRotateSpeed * 0.01;
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
		disposeGroup(this.clearingGroup);
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
	 * Calculate ideal camera height based on heap and current piece
	 * Ported from original CubeTetris TetrisPool:idealCameraHeight()
	 */
	private idealCameraHeight(): number {
		const minHeight = 5;  // Minimum camera height
		const maxHeight = this.config.boardHeight;

		// Base height follows heap top + offset
		let height = this.heapMaxY + 2;

		// If there's a current piece, constrain camera to piece range
		if (this.currentPieceY > 0) {
			const pieceY = this.currentPieceY;
			// Camera should be at most 12 units below the piece
			if (height < pieceY - 12) {
				height = pieceY - 12;
			}
			// Camera should be at most 10 units above the piece
			if (height > pieceY + 10) {
				height = pieceY + 10;
			}
		}

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
	 * Update current piece Y position (call this when piece changes)
	 */
	setCurrentPieceY(y: number): void {
		this.currentPieceY = y;
	}


	/**
	 * Start clearing animation for blocks at specified positions
	 * @param blocks Array of block positions to animate (with color and faceMask)
	 */
	startClearingAnimation(blocks: Array<{point: Point3D; color: string; faceMask?: number}>): void {
		for (const {point, color, faceMask} of blocks) {
			const key = coordKey(point.x, point.y, point.z);

			// Skip if already animating this block
			if (this.clearingBlocks.has(key)) {
				continue;
			}

			// Get or create cached geometry for this faceMask
			const mask = faceMask ?? FACE_MASK.ALL;
			let geometry = this.blockGeometryCache.get(mask);
			if (!geometry) {
				geometry = createBlockGeometryFromMask(mask);
				this.blockGeometryCache.set(mask, geometry);
			}

			// Create mesh for clearing block
			const originalColor = new THREE.Color(color);
			const material = new THREE.MeshStandardMaterial({
				color: originalColor,
				metalness: 0.3,
				roughness: 0.4,
				emissive: new THREE.Color(0xffffff),
				emissiveIntensity: 0,
			});
			const mesh = new THREE.Mesh(geometry, material);
			mesh.position.set(point.x, point.y, point.z);
			mesh.castShadow = true;
			mesh.receiveShadow = true;

			this.clearingGroup.add(mesh);
			this.clearingBlocks.set(key, {
				mesh,
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
			// Calculate flash state (alternates every FLASH_INTERVAL)
			const flashPhase = Math.floor(data.remain / this.FLASH_INTERVAL) % 2;
			const material = data.mesh.material as THREE.MeshStandardMaterial;

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

		// Remove finished blocks
		for (const key of toRemove) {
			const data = this.clearingBlocks.get(key);
			if (data) {
				this.clearingGroup.remove(data.mesh);
				data.mesh.geometry?.dispose();
				(data.mesh.material as THREE.Material).dispose();
				this.clearingBlocks.delete(key);
			}
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
