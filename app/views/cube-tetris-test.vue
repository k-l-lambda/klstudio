<template>
	<div class="cube-tetris-test">
		<canvas ref="canvas"></canvas>
		<div class="controls">
			<div>
				<label>Test Mode:</label>
				<select v-model="testMode">
					<option value="single">Single Block (faceMask)</option>
					<option value="brick0">Brick4_0 (I-piece)</option>
					<option value="brick1">Brick4_1 (L-piece)</option>
					<option value="brick2">Brick4_2 (T-piece)</option>
					<option value="brick3">Brick4_3 (O-piece)</option>
					<option value="brick4">Brick4_4 (S-piece)</option>
					<option value="brick5">Brick4_5 (3D corner)</option>
					<option value="brick6">Brick4_6 (3D L)</option>
					<option value="brick7">Brick4_7 (3D S)</option>
				</select>
			</div>
			<div v-if="testMode === 'single'">
				<label>Face Mask:</label>
				<label><input type="checkbox" v-model="faces.posX"> +X</label>
				<label><input type="checkbox" v-model="faces.negX"> -X</label>
				<label><input type="checkbox" v-model="faces.posY"> +Y</label>
				<label><input type="checkbox" v-model="faces.negY"> -Y</label>
				<label><input type="checkbox" v-model="faces.posZ"> +Z</label>
				<label><input type="checkbox" v-model="faces.negZ"> -Z</label>
			</div>
			<div v-if="testMode === 'single'">
				<button @click="addSecondBlock = !addSecondBlock">
					{{ addSecondBlock ? 'Hide' : 'Show' }} Adjacent Block (+X)
				</button>
			</div>
			<div v-if="testMode !== 'single'">
				<label><input type="checkbox" v-model="showGhost"> Show Ghost</label>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import {markRaw} from "vue";
import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {FACE_MASK, coordKey} from "../cubeTetris/constants";

type FaceDir = "+x" | "-x" | "+y" | "-y" | "+z" | "-z";

const FACE_NEIGHBORS: Record<FaceDir, {x: number; y: number; z: number}> = {
	"+x": {x: 1, y: 0, z: 0},
	"-x": {x: -1, y: 0, z: 0},
	"+y": {x: 0, y: 1, z: 0},
	"-y": {x: 0, y: -1, z: 0},
	"+z": {x: 0, y: 0, z: 1},
	"-z": {x: 0, y: 0, z: -1},
};

interface Point3D {
	x: number;
	y: number;
	z: number;
}

// Copy createUnifiedPieceGeometry from TetrisRenderer for testing
function createUnifiedPieceGeometry(blocks: Point3D[], cubeSize: number = 1.003): THREE.BufferGeometry {
	const s = cubeSize / 2;
	const inner = s * 0.82;
	const outer = s * 0.91;
	// Extend exactly to half the grid spacing (0.5) when meeting neighbor
	const sExt = 0.5;

	const vertices: number[] = [];
	const normals: number[] = [];
	const indices: number[] = [];

	const blockSet = new Set<string>();
	for (const block of blocks) {
		blockSet.add(coordKey(block.x, block.y, block.z));
	}

	const hasNeighbor = (block: Point3D, dir: FaceDir): boolean => {
		const offset = FACE_NEIGHBORS[dir];
		const key = coordKey(block.x + offset.x, block.y + offset.y, block.z + offset.z);
		return blockSet.has(key);
	};

	const addFace = (v0: number[], v1: number[], v2: number[], v3: number[], normal: number[]) => {
		const baseIdx = vertices.length / 3;
		vertices.push(...v0, ...v1, ...v2, ...v3);
		normals.push(...normal, ...normal, ...normal, ...normal);
		indices.push(baseIdx, baseIdx + 1, baseIdx + 2, baseIdx, baseIdx + 2, baseIdx + 3);
	};

	for (const block of blocks) {
		const ox = block.x;
		const oy = block.y;
		const oz = block.z;

		const exterior: Record<FaceDir, boolean> = {
			"+x": !hasNeighbor(block, "+x"),
			"-x": !hasNeighbor(block, "-x"),
			"+y": !hasNeighbor(block, "+y"),
			"-y": !hasNeighbor(block, "-y"),
			"+z": !hasNeighbor(block, "+z"),
			"-z": !hasNeighbor(block, "-z"),
		};

		// Inner flat area ALWAYS uses 'inner' bounds
		// Extension strips (in else branches) fill the gap from 'inner' to 'sExt'
		const xMin = inner;
		const xMax = inner;
		const yMin = inner;
		const yMax = inner;
		const zMin = inner;
		const zMax = inner;

		// Extended bounds for extension strips - extend to sExt when perpendicular face has neighbor
		// This ensures extension strips cover corners properly
		const exMin = exterior["-x"] ? inner : sExt;
		const exMax = exterior["+x"] ? inner : sExt;
		const eyMin = exterior["-y"] ? inner : sExt;
		const eyMax = exterior["+y"] ? inner : sExt;
		const ezMin = exterior["-z"] ? inner : sExt;
		const ezMax = exterior["+z"] ? inner : sExt;

		// Outer bevel coordinates - extend to sExt when perpendicular face has neighbor
		// This ensures bevel edges meet properly with adjacent blocks
		const oxMin = exterior["-x"] ? outer : sExt;
		const oxMax = exterior["+x"] ? outer : sExt;
		const oyMin = exterior["-y"] ? outer : sExt;
		const oyMax = exterior["+y"] ? outer : sExt;
		const ozMin = exterior["-z"] ? outer : sExt;
		const ozMax = exterior["+z"] ? outer : sExt;

		// +Y face (top)
		if (exterior["+y"]) {
			addFace(
				[ox - xMin, oy + s, oz + zMax], [ox + xMax, oy + s, oz + zMax],
				[ox + xMax, oy + s, oz - zMin], [ox - xMin, oy + s, oz - zMin],
				[0, 1, 0]
			);
			// Beveled edges when exterior, flat extension strips when neighbor exists
			if (exterior["-x"]) {
				addFace(
					[ox - inner, oy + s, oz + ezMax], [ox - inner, oy + s, oz - ezMin],
					[ox - outer, oy + outer, oz - ozMin], [ox - outer, oy + outer, oz + ozMax],
					[-0.716, 0.698, 0]
				);
			} else {
				addFace(
					[ox - inner, oy + s, oz + ezMax], [ox - inner, oy + s, oz - ezMin],
					[ox - sExt, oy + s, oz - ezMin], [ox - sExt, oy + s, oz + ezMax],
					[0, 1, 0]
				);
			}
			if (exterior["+x"]) {
				addFace(
					[ox + inner, oy + s, oz - ezMin], [ox + inner, oy + s, oz + ezMax],
					[ox + outer, oy + outer, oz + ozMax], [ox + outer, oy + outer, oz - ozMin],
					[0.716, 0.698, 0]
				);
			} else {
				addFace(
					[ox + inner, oy + s, oz - ezMin], [ox + inner, oy + s, oz + ezMax],
					[ox + sExt, oy + s, oz + ezMax], [ox + sExt, oy + s, oz - ezMin],
					[0, 1, 0]
				);
			}
			if (exterior["+z"]) {
				addFace(
					[ox + exMax, oy + s, oz + inner], [ox - exMin, oy + s, oz + inner],
					[ox - oxMin, oy + outer, oz + outer], [ox + oxMax, oy + outer, oz + outer],
					[0, 0.698, 0.716]
				);
			} else {
				addFace(
					[ox + exMax, oy + s, oz + inner], [ox - exMin, oy + s, oz + inner],
					[ox - exMin, oy + s, oz + sExt], [ox + exMax, oy + s, oz + sExt],
					[0, 1, 0]
				);
			}
			if (exterior["-z"]) {
				addFace(
					[ox - exMin, oy + s, oz - inner], [ox + exMax, oy + s, oz - inner],
					[ox + oxMax, oy + outer, oz - outer], [ox - oxMin, oy + outer, oz - outer],
					[0, 0.698, -0.716]
				);
			} else {
				addFace(
					[ox - exMin, oy + s, oz - inner], [ox + exMax, oy + s, oz - inner],
					[ox + exMax, oy + s, oz - sExt], [ox - exMin, oy + s, oz - sExt],
					[0, 1, 0]
				);
			}
		}

		// -Y face (bottom)
		if (exterior["-y"]) {
			addFace(
				[ox - xMin, oy - s, oz - zMin], [ox + xMax, oy - s, oz - zMin],
				[ox + xMax, oy - s, oz + zMax], [ox - xMin, oy - s, oz + zMax],
				[0, -1, 0]
			);
			// Beveled edges when exterior, flat extension strips when neighbor exists
			if (exterior["-x"]) {
				addFace(
					[ox - inner, oy - s, oz - ezMin], [ox - inner, oy - s, oz + ezMax],
					[ox - outer, oy - outer, oz + ozMax], [ox - outer, oy - outer, oz - ozMin],
					[-0.716, -0.698, 0]
				);
			} else {
				addFace(
					[ox - inner, oy - s, oz - ezMin], [ox - inner, oy - s, oz + ezMax],
					[ox - sExt, oy - s, oz + ezMax], [ox - sExt, oy - s, oz - ezMin],
					[0, -1, 0]
				);
			}
			if (exterior["+x"]) {
				addFace(
					[ox + inner, oy - s, oz + ezMax], [ox + inner, oy - s, oz - ezMin],
					[ox + outer, oy - outer, oz - ozMin], [ox + outer, oy - outer, oz + ozMax],
					[0.716, -0.698, 0]
				);
			} else {
				addFace(
					[ox + inner, oy - s, oz + ezMax], [ox + inner, oy - s, oz - ezMin],
					[ox + sExt, oy - s, oz - ezMin], [ox + sExt, oy - s, oz + ezMax],
					[0, -1, 0]
				);
			}
			if (exterior["+z"]) {
				addFace(
					[ox - exMin, oy - s, oz + inner], [ox + exMax, oy - s, oz + inner],
					[ox + oxMax, oy - outer, oz + outer], [ox - oxMin, oy - outer, oz + outer],
					[0, -0.698, 0.716]
				);
			} else {
				addFace(
					[ox - exMin, oy - s, oz + inner], [ox + exMax, oy - s, oz + inner],
					[ox + exMax, oy - s, oz + sExt], [ox - exMin, oy - s, oz + sExt],
					[0, -1, 0]
				);
			}
			if (exterior["-z"]) {
				addFace(
					[ox + exMax, oy - s, oz - inner], [ox - exMin, oy - s, oz - inner],
					[ox - oxMin, oy - outer, oz - outer], [ox + oxMax, oy - outer, oz - outer],
					[0, -0.698, -0.716]
				);
			} else {
				addFace(
					[ox + exMax, oy - s, oz - inner], [ox - exMin, oy - s, oz - inner],
					[ox - exMin, oy - s, oz - sExt], [ox + exMax, oy - s, oz - sExt],
					[0, -1, 0]
				);
			}
		}

		// +Z face (front)
		if (exterior["+z"]) {
			addFace(
				[ox - xMin, oy - yMin, oz + s], [ox + xMax, oy - yMin, oz + s],
				[ox + xMax, oy + yMax, oz + s], [ox - xMin, oy + yMax, oz + s],
				[0, 0, 1]
			);
			// Beveled edges when exterior, flat extension strips when neighbor exists
			if (exterior["-x"]) {
				addFace(
					[ox - inner, oy - eyMin, oz + s], [ox - inner, oy + eyMax, oz + s],
					[ox - outer, oy + oyMax, oz + outer], [ox - outer, oy - oyMin, oz + outer],
					[-0.716, 0, 0.698]
				);
			} else {
				addFace(
					[ox - inner, oy - eyMin, oz + s], [ox - inner, oy + eyMax, oz + s],
					[ox - sExt, oy + eyMax, oz + s], [ox - sExt, oy - eyMin, oz + s],
					[0, 0, 1]
				);
			}
			if (exterior["+x"]) {
				addFace(
					[ox + inner, oy + eyMax, oz + s], [ox + inner, oy - eyMin, oz + s],
					[ox + outer, oy - oyMin, oz + outer], [ox + outer, oy + oyMax, oz + outer],
					[0.716, 0, 0.698]
				);
			} else {
				addFace(
					[ox + inner, oy + eyMax, oz + s], [ox + inner, oy - eyMin, oz + s],
					[ox + sExt, oy - eyMin, oz + s], [ox + sExt, oy + eyMax, oz + s],
					[0, 0, 1]
				);
			}
			if (exterior["+y"]) {
				addFace(
					[ox - exMin, oy + inner, oz + s], [ox + exMax, oy + inner, oz + s],
					[ox + oxMax, oy + outer, oz + outer], [ox - oxMin, oy + outer, oz + outer],
					[0, 0.716, 0.698]
				);
			} else {
				addFace(
					[ox - exMin, oy + inner, oz + s], [ox + exMax, oy + inner, oz + s],
					[ox + exMax, oy + sExt, oz + s], [ox - exMin, oy + sExt, oz + s],
					[0, 0, 1]
				);
			}
			if (exterior["-y"]) {
				addFace(
					[ox + exMax, oy - inner, oz + s], [ox - exMin, oy - inner, oz + s],
					[ox - oxMin, oy - outer, oz + outer], [ox + oxMax, oy - outer, oz + outer],
					[0, -0.716, 0.698]
				);
			} else {
				addFace(
					[ox + exMax, oy - inner, oz + s], [ox - exMin, oy - inner, oz + s],
					[ox - exMin, oy - sExt, oz + s], [ox + exMax, oy - sExt, oz + s],
					[0, 0, 1]
				);
			}
		}

		// -Z face (back)
		if (exterior["-z"]) {
			addFace(
				[ox + xMax, oy - yMin, oz - s], [ox - xMin, oy - yMin, oz - s],
				[ox - xMin, oy + yMax, oz - s], [ox + xMax, oy + yMax, oz - s],
				[0, 0, -1]
			);
			// Beveled edges when exterior, flat extension strips when neighbor exists
			if (exterior["+x"]) {
				addFace(
					[ox + inner, oy - eyMin, oz - s], [ox + inner, oy + eyMax, oz - s],
					[ox + outer, oy + oyMax, oz - outer], [ox + outer, oy - oyMin, oz - outer],
					[0.716, 0, -0.698]
				);
			} else {
				addFace(
					[ox + inner, oy - eyMin, oz - s], [ox + inner, oy + eyMax, oz - s],
					[ox + sExt, oy + eyMax, oz - s], [ox + sExt, oy - eyMin, oz - s],
					[0, 0, -1]
				);
			}
			if (exterior["-x"]) {
				addFace(
					[ox - inner, oy + eyMax, oz - s], [ox - inner, oy - eyMin, oz - s],
					[ox - outer, oy - oyMin, oz - outer], [ox - outer, oy + oyMax, oz - outer],
					[-0.716, 0, -0.698]
				);
			} else {
				addFace(
					[ox - inner, oy + eyMax, oz - s], [ox - inner, oy - eyMin, oz - s],
					[ox - sExt, oy - eyMin, oz - s], [ox - sExt, oy + eyMax, oz - s],
					[0, 0, -1]
				);
			}
			if (exterior["+y"]) {
				addFace(
					[ox + exMax, oy + inner, oz - s], [ox - exMin, oy + inner, oz - s],
					[ox - oxMin, oy + outer, oz - outer], [ox + oxMax, oy + outer, oz - outer],
					[0, 0.716, -0.698]
				);
			} else {
				addFace(
					[ox + exMax, oy + inner, oz - s], [ox - exMin, oy + inner, oz - s],
					[ox - exMin, oy + sExt, oz - s], [ox + exMax, oy + sExt, oz - s],
					[0, 0, -1]
				);
			}
			if (exterior["-y"]) {
				addFace(
					[ox - exMin, oy - inner, oz - s], [ox + exMax, oy - inner, oz - s],
					[ox + oxMax, oy - outer, oz - outer], [ox - oxMin, oy - outer, oz - outer],
					[0, -0.716, -0.698]
				);
			} else {
				addFace(
					[ox - exMin, oy - inner, oz - s], [ox + exMax, oy - inner, oz - s],
					[ox + exMax, oy - sExt, oz - s], [ox - exMin, oy - sExt, oz - s],
					[0, 0, -1]
				);
			}
		}

		// +X face (right)
		if (exterior["+x"]) {
			addFace(
				[ox + s, oy - yMin, oz + zMax], [ox + s, oy - yMin, oz - zMin],
				[ox + s, oy + yMax, oz - zMin], [ox + s, oy + yMax, oz + zMax],
				[1, 0, 0]
			);
			// Beveled edges when exterior, flat extension strips when neighbor exists
			if (exterior["+y"]) {
				addFace(
					[ox + s, oy + inner, oz + ezMax], [ox + s, oy + inner, oz - ezMin],
					[ox + outer, oy + outer, oz - ozMin], [ox + outer, oy + outer, oz + ozMax],
					[0.698, 0.716, 0]
				);
			} else {
				addFace(
					[ox + s, oy + inner, oz + ezMax], [ox + s, oy + inner, oz - ezMin],
					[ox + s, oy + sExt, oz - ezMin], [ox + s, oy + sExt, oz + ezMax],
					[1, 0, 0]
				);
			}
			if (exterior["-y"]) {
				addFace(
					[ox + s, oy - inner, oz - ezMin], [ox + s, oy - inner, oz + ezMax],
					[ox + outer, oy - outer, oz + ozMax], [ox + outer, oy - outer, oz - ozMin],
					[0.698, -0.716, 0]
				);
			} else {
				addFace(
					[ox + s, oy - inner, oz - ezMin], [ox + s, oy - inner, oz + ezMax],
					[ox + s, oy - sExt, oz + ezMax], [ox + s, oy - sExt, oz - ezMin],
					[1, 0, 0]
				);
			}
			if (exterior["+z"]) {
				addFace(
					[ox + s, oy - eyMin, oz + inner], [ox + s, oy + eyMax, oz + inner],
					[ox + outer, oy + oyMax, oz + outer], [ox + outer, oy - oyMin, oz + outer],
					[0.698, 0, 0.716]
				);
			} else {
				addFace(
					[ox + s, oy - eyMin, oz + inner], [ox + s, oy + eyMax, oz + inner],
					[ox + s, oy + eyMax, oz + sExt], [ox + s, oy - eyMin, oz + sExt],
					[1, 0, 0]
				);
			}
			if (exterior["-z"]) {
				addFace(
					[ox + s, oy + eyMax, oz - inner], [ox + s, oy - eyMin, oz - inner],
					[ox + outer, oy - oyMin, oz - outer], [ox + outer, oy + oyMax, oz - outer],
					[0.698, 0, -0.716]
				);
			} else {
				addFace(
					[ox + s, oy + eyMax, oz - inner], [ox + s, oy - eyMin, oz - inner],
					[ox + s, oy - eyMin, oz - sExt], [ox + s, oy + eyMax, oz - sExt],
					[1, 0, 0]
				);
			}
		}

		// -X face (left)
		if (exterior["-x"]) {
			addFace(
				[ox - s, oy - yMin, oz - zMin], [ox - s, oy - yMin, oz + zMax],
				[ox - s, oy + yMax, oz + zMax], [ox - s, oy + yMax, oz - zMin],
				[-1, 0, 0]
			);
			if (exterior["+y"]) {
				addFace(
					[ox - s, oy + inner, oz - ezMin], [ox - s, oy + inner, oz + ezMax],
					[ox - outer, oy + outer, oz + ozMax], [ox - outer, oy + outer, oz - ozMin],
					[-0.698, 0.716, 0]
				);
			} else {
				addFace(
					[ox - s, oy + inner, oz - ezMin], [ox - s, oy + inner, oz + ezMax],
					[ox - s, oy + sExt, oz + ezMax], [ox - s, oy + sExt, oz - ezMin],
					[-1, 0, 0]
				);
			}
			if (exterior["-y"]) {
				addFace(
					[ox - s, oy - inner, oz + ezMax], [ox - s, oy - inner, oz - ezMin],
					[ox - outer, oy - outer, oz - ozMin], [ox - outer, oy - outer, oz + ozMax],
					[-0.698, -0.716, 0]
				);
			} else {
				addFace(
					[ox - s, oy - inner, oz + ezMax], [ox - s, oy - inner, oz - ezMin],
					[ox - s, oy - sExt, oz - ezMin], [ox - s, oy - sExt, oz + ezMax],
					[-1, 0, 0]
				);
			}
			if (exterior["+z"]) {
				addFace(
					[ox - s, oy + eyMax, oz + inner], [ox - s, oy - eyMin, oz + inner],
					[ox - outer, oy - oyMin, oz + outer], [ox - outer, oy + oyMax, oz + outer],
					[-0.698, 0, 0.716]
				);
			} else {
				addFace(
					[ox - s, oy + eyMax, oz + inner], [ox - s, oy - eyMin, oz + inner],
					[ox - s, oy - eyMin, oz + sExt], [ox - s, oy + eyMax, oz + sExt],
					[-1, 0, 0]
				);
			}
			if (exterior["-z"]) {
				addFace(
					[ox - s, oy - eyMin, oz - inner], [ox - s, oy + eyMax, oz - inner],
					[ox - outer, oy + oyMax, oz - outer], [ox - outer, oy - oyMin, oz - outer],
					[-0.698, 0, -0.716]
				);
			} else {
				addFace(
					[ox - s, oy - eyMin, oz - inner], [ox - s, oy + eyMax, oz - inner],
					[ox - s, oy + eyMax, oz - sExt], [ox - s, oy - eyMin, oz - sExt],
					[-1, 0, 0]
				);
			}
		}
	}

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
	geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
	geometry.setIndex(indices);

	return geometry;
}

// Single block geometry
function createBlockGeometryFromMask(faceMask: number, cubeSize: number = 1.003): THREE.BufferGeometry {
	const s = cubeSize / 2;
	const inner = s * 0.82;
	const outer = s * 0.91;
	const sExt = 0.5;

	const vertices: number[] = [];
	const normals: number[] = [];
	const indices: number[] = [];

	const addFace = (v0: number[], v1: number[], v2: number[], v3: number[], normal: number[]) => {
		const baseIdx = vertices.length / 3;
		vertices.push(...v0, ...v1, ...v2, ...v3);
		normals.push(...normal, ...normal, ...normal, ...normal);
		indices.push(baseIdx, baseIdx + 1, baseIdx + 2, baseIdx, baseIdx + 2, baseIdx + 3);
	};

	const exterior = {
		"+x": (faceMask & FACE_MASK.POS_X) !== 0,
		"-x": (faceMask & FACE_MASK.NEG_X) !== 0,
		"+y": (faceMask & FACE_MASK.POS_Y) !== 0,
		"-y": (faceMask & FACE_MASK.NEG_Y) !== 0,
		"+z": (faceMask & FACE_MASK.POS_Z) !== 0,
		"-z": (faceMask & FACE_MASK.NEG_Z) !== 0,
	};

	const xMin = exterior["-x"] ? inner : sExt;
	const xMax = exterior["+x"] ? inner : sExt;
	const yMin = exterior["-y"] ? inner : sExt;
	const yMax = exterior["+y"] ? inner : sExt;
	const zMin = exterior["-z"] ? inner : sExt;
	const zMax = exterior["+z"] ? inner : sExt;

	const oxMin = exterior["-x"] ? outer : sExt;
	const oxMax = exterior["+x"] ? outer : sExt;
	const oyMin = exterior["-y"] ? outer : sExt;
	const oyMax = exterior["+y"] ? outer : sExt;
	const ozMin = exterior["-z"] ? outer : sExt;
	const ozMax = exterior["+z"] ? outer : sExt;

	// +Y face
	if (exterior["+y"]) {
		addFace([-xMin, s, zMax], [xMax, s, zMax], [xMax, s, -zMin], [-xMin, s, -zMin], [0, 1, 0]);
		if (exterior["-x"]) {
			addFace([-inner, s, zMax], [-inner, s, -zMin], [-outer, outer, -ozMin], [-outer, outer, ozMax], [-0.716, 0.698, 0]);
		} else {
			addFace([-inner, s, zMax], [-inner, s, -zMin], [-sExt, s, -zMin], [-sExt, s, zMax], [0, 1, 0]);
		}
		if (exterior["+x"]) {
			addFace([inner, s, -zMin], [inner, s, zMax], [outer, outer, ozMax], [outer, outer, -ozMin], [0.716, 0.698, 0]);
		} else {
			addFace([inner, s, -zMin], [inner, s, zMax], [sExt, s, zMax], [sExt, s, -zMin], [0, 1, 0]);
		}
		if (exterior["+z"]) {
			addFace([xMax, s, inner], [-xMin, s, inner], [-oxMin, outer, outer], [oxMax, outer, outer], [0, 0.698, 0.716]);
		} else {
			addFace([xMax, s, inner], [-xMin, s, inner], [-xMin, s, sExt], [xMax, s, sExt], [0, 1, 0]);
		}
		if (exterior["-z"]) {
			addFace([-xMin, s, -inner], [xMax, s, -inner], [oxMax, outer, -outer], [-oxMin, outer, -outer], [0, 0.698, -0.716]);
		} else {
			addFace([-xMin, s, -inner], [xMax, s, -inner], [xMax, s, -sExt], [-xMin, s, -sExt], [0, 1, 0]);
		}
	}

	// -Y face
	if (exterior["-y"]) {
		addFace([-xMin, -s, -zMin], [xMax, -s, -zMin], [xMax, -s, zMax], [-xMin, -s, zMax], [0, -1, 0]);
		if (exterior["-x"]) {
			addFace([-inner, -s, -zMin], [-inner, -s, zMax], [-outer, -outer, ozMax], [-outer, -outer, -ozMin], [-0.716, -0.698, 0]);
		} else {
			addFace([-inner, -s, -zMin], [-inner, -s, zMax], [-sExt, -s, zMax], [-sExt, -s, -zMin], [0, -1, 0]);
		}
		if (exterior["+x"]) {
			addFace([inner, -s, zMax], [inner, -s, -zMin], [outer, -outer, -ozMin], [outer, -outer, ozMax], [0.716, -0.698, 0]);
		} else {
			addFace([inner, -s, zMax], [inner, -s, -zMin], [sExt, -s, -zMin], [sExt, -s, zMax], [0, -1, 0]);
		}
		if (exterior["+z"]) {
			addFace([-xMin, -s, inner], [xMax, -s, inner], [oxMax, -outer, outer], [-oxMin, -outer, outer], [0, -0.698, 0.716]);
		} else {
			addFace([-xMin, -s, inner], [xMax, -s, inner], [xMax, -s, sExt], [-xMin, -s, sExt], [0, -1, 0]);
		}
		if (exterior["-z"]) {
			addFace([xMax, -s, -inner], [-xMin, -s, -inner], [-oxMin, -outer, -outer], [oxMax, -outer, -outer], [0, -0.698, -0.716]);
		} else {
			addFace([xMax, -s, -inner], [-xMin, -s, -inner], [-xMin, -s, -sExt], [xMax, -s, -sExt], [0, -1, 0]);
		}
	}

	// +Z face
	if (exterior["+z"]) {
		addFace([-xMin, -yMin, s], [xMax, -yMin, s], [xMax, yMax, s], [-xMin, yMax, s], [0, 0, 1]);
		if (exterior["-x"]) {
			addFace([-inner, -yMin, s], [-inner, yMax, s], [-outer, oyMax, outer], [-outer, -oyMin, outer], [-0.716, 0, 0.698]);
		} else {
			addFace([-inner, -yMin, s], [-inner, yMax, s], [-sExt, yMax, s], [-sExt, -yMin, s], [0, 0, 1]);
		}
		if (exterior["+x"]) {
			addFace([inner, yMax, s], [inner, -yMin, s], [outer, -oyMin, outer], [outer, oyMax, outer], [0.716, 0, 0.698]);
		} else {
			addFace([inner, yMax, s], [inner, -yMin, s], [sExt, -yMin, s], [sExt, yMax, s], [0, 0, 1]);
		}
		if (exterior["+y"]) {
			addFace([-xMin, inner, s], [xMax, inner, s], [oxMax, outer, outer], [-oxMin, outer, outer], [0, 0.716, 0.698]);
		} else {
			addFace([-xMin, inner, s], [xMax, inner, s], [xMax, sExt, s], [-xMin, sExt, s], [0, 0, 1]);
		}
		if (exterior["-y"]) {
			addFace([xMax, -inner, s], [-xMin, -inner, s], [-oxMin, -outer, outer], [oxMax, -outer, outer], [0, -0.716, 0.698]);
		} else {
			addFace([xMax, -inner, s], [-xMin, -inner, s], [-xMin, -sExt, s], [xMax, -sExt, s], [0, 0, 1]);
		}
	}

	// -Z face
	if (exterior["-z"]) {
		addFace([xMax, -yMin, -s], [-xMin, -yMin, -s], [-xMin, yMax, -s], [xMax, yMax, -s], [0, 0, -1]);
		if (exterior["+x"]) {
			addFace([inner, -yMin, -s], [inner, yMax, -s], [outer, oyMax, -outer], [outer, -oyMin, -outer], [0.716, 0, -0.698]);
		} else {
			addFace([inner, -yMin, -s], [inner, yMax, -s], [sExt, yMax, -s], [sExt, -yMin, -s], [0, 0, -1]);
		}
		if (exterior["-x"]) {
			addFace([-inner, yMax, -s], [-inner, -yMin, -s], [-outer, -oyMin, -outer], [-outer, oyMax, -outer], [-0.716, 0, -0.698]);
		} else {
			addFace([-inner, yMax, -s], [-inner, -yMin, -s], [-sExt, -yMin, -s], [-sExt, yMax, -s], [0, 0, -1]);
		}
		if (exterior["+y"]) {
			addFace([xMax, inner, -s], [-xMin, inner, -s], [-oxMin, outer, -outer], [oxMax, outer, -outer], [0, 0.716, -0.698]);
		} else {
			addFace([xMax, inner, -s], [-xMin, inner, -s], [-xMin, sExt, -s], [xMax, sExt, -s], [0, 0, -1]);
		}
		if (exterior["-y"]) {
			addFace([-xMin, -inner, -s], [xMax, -inner, -s], [oxMax, -outer, -outer], [-oxMin, -outer, -outer], [0, -0.716, -0.698]);
		} else {
			addFace([-xMin, -inner, -s], [xMax, -inner, -s], [xMax, -sExt, -s], [-xMin, -sExt, -s], [0, 0, -1]);
		}
	}

	// +X face
	if (exterior["+x"]) {
		addFace([s, -yMin, zMax], [s, -yMin, -zMin], [s, yMax, -zMin], [s, yMax, zMax], [1, 0, 0]);
		if (exterior["+y"]) {
			addFace([s, inner, zMax], [s, inner, -zMin], [outer, outer, -ozMin], [outer, outer, ozMax], [0.698, 0.716, 0]);
		} else {
			addFace([s, inner, zMax], [s, inner, -zMin], [s, sExt, -zMin], [s, sExt, zMax], [1, 0, 0]);
		}
		if (exterior["-y"]) {
			addFace([s, -inner, -zMin], [s, -inner, zMax], [outer, -outer, ozMax], [outer, -outer, -ozMin], [0.698, -0.716, 0]);
		} else {
			addFace([s, -inner, -zMin], [s, -inner, zMax], [s, -sExt, zMax], [s, -sExt, -zMin], [1, 0, 0]);
		}
		if (exterior["+z"]) {
			addFace([s, -yMin, inner], [s, yMax, inner], [outer, oyMax, outer], [outer, -oyMin, outer], [0.698, 0, 0.716]);
		} else {
			addFace([s, -yMin, inner], [s, yMax, inner], [s, yMax, sExt], [s, -yMin, sExt], [1, 0, 0]);
		}
		if (exterior["-z"]) {
			addFace([s, yMax, -inner], [s, -yMin, -inner], [outer, -oyMin, -outer], [outer, oyMax, -outer], [0.698, 0, -0.716]);
		} else {
			addFace([s, yMax, -inner], [s, -yMin, -inner], [s, -yMin, -sExt], [s, yMax, -sExt], [1, 0, 0]);
		}
	}

	// -X face
	if (exterior["-x"]) {
		addFace([-s, -yMin, -zMin], [-s, -yMin, zMax], [-s, yMax, zMax], [-s, yMax, -zMin], [-1, 0, 0]);
		if (exterior["+y"]) {
			addFace([-s, inner, -zMin], [-s, inner, zMax], [-outer, outer, ozMax], [-outer, outer, -ozMin], [-0.698, 0.716, 0]);
		} else {
			addFace([-s, inner, -zMin], [-s, inner, zMax], [-s, sExt, zMax], [-s, sExt, -zMin], [-1, 0, 0]);
		}
		if (exterior["-y"]) {
			addFace([-s, -inner, zMax], [-s, -inner, -zMin], [-outer, -outer, -ozMin], [-outer, -outer, ozMax], [-0.698, -0.716, 0]);
		} else {
			addFace([-s, -inner, zMax], [-s, -inner, -zMin], [-s, -sExt, -zMin], [-s, -sExt, zMax], [-1, 0, 0]);
		}
		if (exterior["+z"]) {
			addFace([-s, yMax, inner], [-s, -yMin, inner], [-outer, -oyMin, outer], [-outer, oyMax, outer], [-0.698, 0, 0.716]);
		} else {
			addFace([-s, yMax, inner], [-s, -yMin, inner], [-s, -yMin, sExt], [-s, yMax, sExt], [-1, 0, 0]);
		}
		if (exterior["-z"]) {
			addFace([-s, -yMin, -inner], [-s, yMax, -inner], [-outer, oyMax, -outer], [-outer, -oyMin, -outer], [-0.698, 0, -0.716]);
		} else {
			addFace([-s, -yMin, -inner], [-s, yMax, -inner], [-s, yMax, -sExt], [-s, -yMin, -sExt], [-1, 0, 0]);
		}
	}

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
	geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
	geometry.setIndex(indices);

	return geometry;
}

// Brick4_0 blocks (I-piece - vertical)
const BRICK0_BLOCKS: Point3D[] = [
	{x: 0, y: 0, z: 0},
	{x: 0, y: 1, z: 0},
	{x: 0, y: 2, z: 0},
	{x: 0, y: 3, z: 0},
];

// Brick4_1 blocks (L-piece)
const BRICK1_BLOCKS: Point3D[] = [
	{x: 0, y: 0, z: 0},
	{x: 1, y: 0, z: 0},
	{x: 0, y: 1, z: 0},
	{x: 0, y: 2, z: 0},
];

// Brick4_2 blocks (T-piece)
const BRICK2_BLOCKS: Point3D[] = [
	{x: 0, y: 0, z: 0},
	{x: 0, y: 1, z: 0},
	{x: 1, y: 1, z: 0},
	{x: 0, y: 2, z: 0},
];

// Brick4_3 blocks (O-piece - 2x2 square)
const BRICK3_BLOCKS: Point3D[] = [
	{x: 0, y: 0, z: 0},
	{x: 1, y: 0, z: 0},
	{x: 0, y: 1, z: 0},
	{x: 1, y: 1, z: 0},
];

// Brick4_4 blocks (S-piece - staircase)
const BRICK4_BLOCKS: Point3D[] = [
	{x: 0, y: 0, z: 0},
	{x: 1, y: 0, z: 0},
	{x: 1, y: 1, z: 0},
	{x: 2, y: 1, z: 0},
];

// Brick4_5 blocks (3D corner piece)
const BRICK5_BLOCKS: Point3D[] = [
	{x: 0, y: 0, z: 0},
	{x: 0, y: 0, z: 1},
	{x: 1, y: 0, z: 0},
	{x: 0, y: 1, z: 0},
];

// Brick4_6 blocks (3D L-piece)
const BRICK6_BLOCKS: Point3D[] = [
	{x: 0, y: 0, z: 0},
	{x: 1, y: 0, z: 0},
	{x: 1, y: 0, z: 1},
	{x: 0, y: 1, z: 0},
];

// Brick4_7 blocks (3D S-piece - mirror of Brick4_6)
const BRICK7_BLOCKS: Point3D[] = [
	{x: 0, y: 0, z: 0},
	{x: 1, y: 0, z: 0},
	{x: 0, y: 0, z: 1},
	{x: 1, y: 1, z: 0},
];

export default {
	name: "cube-tetris-test",
	data() {
		return {
			testMode: "brick0" as "single" | "brick0" | "brick1" | "brick2" | "brick3" | "brick4" | "brick5" | "brick6" | "brick7",
			faces: {
				posX: true,
				negX: true,
				posY: true,
				negY: true,
				posZ: true,
				negZ: true,
			},
			addSecondBlock: false,
			showGhost: true,
			scene: null as THREE.Scene | null,
			camera: null as THREE.PerspectiveCamera | null,
			renderer: null as THREE.WebGLRenderer | null,
			controls: null as OrbitControls | null,
			blockMesh: null as THREE.Mesh | null,
			block2Mesh: null as THREE.Mesh | null,
			ghostMesh: null as THREE.Mesh | null,
		};
	},
	computed: {
		faceMask(): number {
			let mask = 0;
			if (this.faces.posX) mask |= FACE_MASK.POS_X;
			if (this.faces.negX) mask |= FACE_MASK.NEG_X;
			if (this.faces.posY) mask |= FACE_MASK.POS_Y;
			if (this.faces.negY) mask |= FACE_MASK.NEG_Y;
			if (this.faces.posZ) mask |= FACE_MASK.POS_Z;
			if (this.faces.negZ) mask |= FACE_MASK.NEG_Z;
			return mask;
		},
		faceMask2(): number {
			return FACE_MASK.POS_X | FACE_MASK.POS_Y | FACE_MASK.NEG_Y | FACE_MASK.POS_Z | FACE_MASK.NEG_Z;
		},
	},
	watch: {
		faceMask() {
			this.updateBlock();
		},
		addSecondBlock() {
			this.updateBlock();
		},
		testMode() {
			this.updateBlock();
		},
		showGhost() {
			this.updateBlock();
		},
	},
	mounted() {
		this.initScene();
		this.updateBlock();
		this.animate();
	},
	beforeUnmount() {
		if (this.renderer) {
			this.renderer.dispose();
		}
	},
	methods: {
		initScene() {
			const canvas = this.$refs.canvas as HTMLCanvasElement;

			this.scene = markRaw(new THREE.Scene());
			this.scene.background = new THREE.Color(0x1a1a2e);

			this.camera = markRaw(new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100));
			this.camera.position.set(3, 3, 3);

			this.renderer = markRaw(new THREE.WebGLRenderer({ canvas, antialias: true }));
			this.renderer.setSize(window.innerWidth, window.innerHeight);

			this.controls = markRaw(new OrbitControls(this.camera, canvas));
			this.controls.target.set(0.5, 0.5, 0.5);
			this.controls.update();

			// Lighting
			const ambient = new THREE.AmbientLight(0xffffff, 0.4);
			this.scene.add(ambient);

			const directional = new THREE.DirectionalLight(0xffffff, 0.8);
			directional.position.set(5, 10, 5);
			this.scene.add(directional);

			// Grid
			const grid = new THREE.GridHelper(4, 4);
			grid.position.y = -0.5;
			this.scene.add(grid);

			// Axes
			const axes = new THREE.AxesHelper(2);
			this.scene.add(axes);
		},
		updateBlock() {
			if (!this.scene) return;

			// Remove old meshes
			if (this.blockMesh) {
				this.scene.remove(this.blockMesh);
				this.blockMesh.geometry.dispose();
				(this.blockMesh.material as THREE.Material).dispose();
				this.blockMesh = null;
			}
			if (this.block2Mesh) {
				this.scene.remove(this.block2Mesh);
				this.block2Mesh.geometry.dispose();
				(this.block2Mesh.material as THREE.Material).dispose();
				this.block2Mesh = null;
			}
			if (this.ghostMesh) {
				this.scene.remove(this.ghostMesh);
				this.ghostMesh.geometry.dispose();
				(this.ghostMesh.material as THREE.Material).dispose();
				this.ghostMesh = null;
			}

			// Brick type mapping: blocks and colors
			const brickMap: Record<string, {blocks: Point3D[]; color: number}> = {
				brick0: {blocks: BRICK0_BLOCKS, color: 0xff4444},  // red
				brick1: {blocks: BRICK1_BLOCKS, color: 0xff88aa},  // pink
				brick2: {blocks: BRICK2_BLOCKS, color: 0xaa6644},  // brown
				brick3: {blocks: BRICK3_BLOCKS, color: 0x4444ff},  // blue
				brick4: {blocks: BRICK4_BLOCKS, color: 0x44ff44},  // green
				brick5: {blocks: BRICK5_BLOCKS, color: 0xaa44aa},  // purple
				brick6: {blocks: BRICK6_BLOCKS, color: 0xffff44},  // yellow
				brick7: {blocks: BRICK7_BLOCKS, color: 0x44ffff},  // cyan
			};

			const brickInfo = brickMap[this.testMode];
			if (brickInfo) {
				// Create unified piece geometry for the brick
				const geometry = createUnifiedPieceGeometry(brickInfo.blocks);
				const material = new THREE.MeshStandardMaterial({
					color: brickInfo.color,
					metalness: 0.3,
					roughness: 0.4,
				});
				this.blockMesh = markRaw(new THREE.Mesh(geometry, material));
				this.scene.add(this.blockMesh);

				// Add ghost mesh if enabled
				if (this.showGhost) {
					const ghostGeometry = createUnifiedPieceGeometry(brickInfo.blocks);
					const ghostMaterial = new THREE.MeshStandardMaterial({
						color: 0xffffff,
						transparent: true,
						opacity: 0.15,
					});
					this.ghostMesh = markRaw(new THREE.Mesh(ghostGeometry, ghostMaterial));
					// Offset ghost based on brick width
					const maxX = Math.max(...brickInfo.blocks.map(b => b.x));
					this.ghostMesh.position.x = maxX + 2;
					this.scene.add(this.ghostMesh);
				}
			} else {
				// Single block mode
				const geometry = createBlockGeometryFromMask(this.faceMask);
				const material = new THREE.MeshStandardMaterial({
					color: 0x44aaff,
					metalness: 0.3,
					roughness: 0.4,
				});
				this.blockMesh = markRaw(new THREE.Mesh(geometry, material));
				this.scene.add(this.blockMesh);

				if (this.addSecondBlock) {
					const geometry2 = createBlockGeometryFromMask(this.faceMask2);
					const material2 = new THREE.MeshStandardMaterial({
						color: 0xff8844,
						metalness: 0.3,
						roughness: 0.4,
					});
					this.block2Mesh = markRaw(new THREE.Mesh(geometry2, material2));
					this.block2Mesh.position.x = 1;
					this.scene.add(this.block2Mesh);
				}
			}
		},
		animate() {
			requestAnimationFrame(() => this.animate());
			if (this.controls) this.controls.update();
			if (this.renderer && this.scene && this.camera) {
				this.renderer.render(this.scene, this.camera);
			}
		},
	},
};
</script>

<style scoped lang="scss">
.cube-tetris-test {
	width: 100vw;
	height: 100vh;
	position: relative;

	canvas {
		width: 100%;
		height: 100%;
	}

	.controls {
		position: absolute;
		top: 10px;
		left: 10px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 15px;
		border-radius: 8px;

		label {
			margin-right: 10px;
			cursor: pointer;
		}

		select {
			padding: 5px;
			margin-left: 10px;
		}

		button {
			margin-top: 10px;
			padding: 8px 16px;
			cursor: pointer;
		}

		p {
			margin: 10px 0 0 0;
			font-size: 12px;
			color: #aaa;
		}
	}
}
</style>
