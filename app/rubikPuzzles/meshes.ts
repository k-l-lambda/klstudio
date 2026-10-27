// Piece geometry and materials for the rubik-puzzles app.
// Cubes: rounded boxes coloured by the dominant axis of the surface normal (as app/cubeMesh.js does for the 3×3).
// Mastermorphix: each piece is its 3×3×3 slab cell intersected with a pillowed tetrahedron; the tetrahedron's
// edges pass through the six cube face centres, so the cube centres become the edge wedges, four cube corners
// the tips and the other four the small face-centre triangles. Coloured by tetrahedron face.
import * as THREE from "three";
import {RoundedBoxGeometry} from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import {Piece, PuzzleKind, Vector3} from "./puzzle";



// face order 0 +X, 1 -X, 2 +Y, 3 -Y, 4 +Z, 5 -Z
const CUBE_COLORS = [0xb90000, 0xff5900, 0xffffff, 0xffd500, 0x009b48, 0x0045ad];
// tetrahedron faces, outward normals (1,1,-1), (1,-1,1), (-1,1,1), (-1,-1,-1)
const TETRA_NORMALS: Vector3[] = [[1, 1, -1], [1, -1, 1], [-1, 1, 1], [-1, -1, -1]].map(n => n.map(c => c / Math.sqrt(3)) as Vector3);
const TETRA_COLORS = [0xd8141c, 0x1a4fd6, 0xffd200, 0x0f8a3a];
const BASE_COLOR = 0x111111;

const GAP_SCALE = 0.985;


// Mastermorphix surface, star-shaped about the origin: radius per direction blends a soft-cornered tetrahedron with
// a sphere. Units are cube cells (cut planes at ±0.5). The flat tetrahedron has its vertices on the cube corners
// (±1.5, ±1.5, ±1.5), so the cuts divide each face into a 3-row triangular grid of 9 stickers; the other four cube
// corners would only touch the face centres, and it is the bulge that gives them their small centre triangle.
const TETRA_VERTEX = 1.5;
const TETRA_INRADIUS = TETRA_VERTEX / Math.sqrt(3);
const PILLOW = 0.5;			// share of the sphere in the blend: bulges faces, blunts tips
const SPHERE_RADIUS = 1.75;
const SOFTNESS = 12;			// p-norm exponent of the soft max over faces: rounds the tetrahedron edges

const morphixRadius = (x: number, y: number, z: number): number => {
	const length = Math.hypot(x, y, z);
	let sum = 0;
	for (const n of TETRA_NORMALS) {
		const d = (n[0] * x + n[1] * y + n[2] * z) / length;
		if (d > 0)
			sum += d ** SOFTNESS;
	}
	const support = sum ** (1 / SOFTNESS);

	return (1 - PILLOW) * TETRA_INRADIUS / support + PILLOW * SPHERE_RADIUS;
};

// < 0 inside
const morphixField = (x: number, y: number, z: number): number => Math.hypot(x, y, z) - morphixRadius(x, y, z);

const morphixNormal = (p: Vector3): Vector3 => {
	const e = 1e-4;
	const g: Vector3 = [
		morphixField(p[0] + e, p[1], p[2]) - morphixField(p[0] - e, p[1], p[2]),
		morphixField(p[0], p[1] + e, p[2]) - morphixField(p[0], p[1] - e, p[2]),
		morphixField(p[0], p[1], p[2] + e) - morphixField(p[0], p[1], p[2] - e),
	];
	const length = Math.hypot(...g);

	return g.map(c => c / length) as Vector3;
};


const createMaterial = (colors: number[], tetra: boolean): THREE.ShaderMaterial => new THREE.ShaderMaterial({
	defines: tetra ? {TETRA: 1} : {},
	uniforms: {
		// the uniform is vec3[6]: the 4 tetrahedron colours are padded
		colors: {value: [...colors, ...Array(6 - colors.length).fill(BASE_COLOR)].map(color => new THREE.Color(color))},
		tetraNormals: {value: TETRA_NORMALS.map(n => new THREE.Vector3(...n))},
		baseColor: {value: new THREE.Color(BASE_COLOR)},
		highlighted: {value: 0},
		lightDir1: {value: new THREE.Vector3(10, 20, 10).normalize()},
		lightDir2: {value: new THREE.Vector3(-10, -10, -10).normalize()},
	},
	vertexShader: `
		attribute float sticker;

		varying vec3 vNormal;
		varying vec3 vObjectNormal;
		varying vec3 vObjectPosition;
		varying vec3 vViewPosition;
		varying float vSticker;

		void main() {
			vNormal = normalize(normalMatrix * normal);
			vObjectNormal = normal;
			vObjectPosition = position;
			vSticker = sticker;
			vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
			vViewPosition = -mvPosition.xyz;
			gl_Position = projectionMatrix * mvPosition;
		}
	`,
	fragmentShader: `
		uniform vec3 colors[6];
		uniform vec3 tetraNormals[4];
		uniform vec3 baseColor;
		uniform float highlighted;
		uniform vec3 lightDir1;
		uniform vec3 lightDir2;

		varying vec3 vNormal;
		varying vec3 vObjectNormal;
		varying vec3 vObjectPosition;
		varying vec3 vViewPosition;
		varying float vSticker;

		void main() {
			vec3 faceColor = baseColor;
			if (vSticker > 0.5) {
#ifdef TETRA
				int best = 0;
				float top = dot(vObjectPosition, tetraNormals[0]);
				for (int i = 1; i < 4; ++i) {
					float d = dot(vObjectPosition, tetraNormals[i]);
					if (d > top) {
						top = d;
						best = i;
					}
				}
				for (int i = 0; i < 4; ++i) {
					if (i == best)
						faceColor = colors[i];
				}
#else
				vec3 n = normalize(vObjectNormal);
				vec3 a = abs(n);
				if (a.x >= a.y && a.x >= a.z)
					faceColor = n.x > 0.0 ? colors[0] : colors[1];
				else if (a.y >= a.z)
					faceColor = n.y > 0.0 ? colors[2] : colors[3];
				else
					faceColor = n.z > 0.0 ? colors[4] : colors[5];
#endif
			}

			faceColor = mix(faceColor, faceColor * 1.3 + vec3(0.1), highlighted);

			vec3 normal = normalize(vNormal);
			vec3 viewDir = normalize(vViewPosition);

			float diffuse = max(dot(normal, lightDir1), 0.0) + max(dot(normal, lightDir2), 0.0) * 0.3;
			float specular = pow(max(dot(normal, normalize(lightDir1 + viewDir)), 0.0), 64.0)
				+ pow(max(dot(normal, normalize(lightDir2 + viewDir)), 0.0), 64.0) * 0.2;
			float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0) * 0.15;

			vec3 finalColor = faceColor * (0.35 + 0.7 * diffuse) + vec3(1.0) * (0.8 * specular * vSticker + fresnel);

			gl_FragColor = vec4(finalColor, 1.0);
		}
	`,
});


const cubeGeometry = new RoundedBoxGeometry(1, 1, 1, 4, 0.08);

const createCubePiece = (piece: Piece): THREE.BufferGeometry => {
	const geometry = cubeGeometry.clone();
	geometry.scale(0.98, 0.98, 0.98);
	geometry.translate(...piece.home);
	geometry.setAttribute("sticker", new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count).fill(1), 1));

	return geometry;
};


// Bisection along a → b, a inside, b outside.
const surfaceOnSegment = (a: Vector3, b: Vector3): Vector3 => {
	let [lo, hi] = [0, 1];
	for (let i = 0; i < 40; ++i) {
		const t = (lo + hi) / 2;
		if (morphixField(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t) < 0)
			lo = t;
		else
			hi = t;
	}

	return a.map((c, i) => c + (b[i] - c) * lo) as Vector3;
};


const MORPHIX_BOUND = 4;	// beyond the surface everywhere
const MORPHIX_DENSITY = 12;	// grid segments per unit length on the bounding box faces

// A piece = cell ∩ surface. The cell, cut off at MORPHIX_BOUND, is tessellated face by face; every vertex outside the
// surface is pulled onto it along a direction that keeps it on each cut plane of the cell it lies on: from the anchor
// that equals the vertex on axes cut on both sides and the cut plane on axes cut on one side. Faces of the bounding
// box land on the outer surface (sticker), cut-plane faces stay flat and shrink to the surface outline (black).
const createMorphixPiece = (piece: Piece): THREE.BufferGeometry => {
	const lower: number[] = [], upper: number[] = [];
	const lowerCut: boolean[] = [], upperCut: boolean[] = [];
	piece.home.forEach((c, axis) => {
		lowerCut[axis] = c > -1;
		upperCut[axis] = c < 1;
		lower[axis] = lowerCut[axis] ? c - 0.5 : -MORPHIX_BOUND;
		upper[axis] = upperCut[axis] ? c + 0.5 : MORPHIX_BOUND;
	});

	const positions: number[] = [], normals: number[] = [], stickers: number[] = [], indices: number[] = [];

	for (let axis = 0; axis < 3; ++axis) {
		for (const side of [-1, 1]) {
			const cut = side < 0 ? lowerCut[axis] : upperCut[axis];
			const plane = side < 0 ? lower[axis] : upper[axis];
			const [u, v] = [(axis + 1) % 3, (axis + 2) % 3];
			const su = Math.max(4, Math.ceil((upper[u] - lower[u]) * MORPHIX_DENSITY));
			const sv = Math.max(4, Math.ceil((upper[v] - lower[v]) * MORPHIX_DENSITY));
			const base = positions.length / 3;

			for (let j = 0; j <= sv; ++j) {
				for (let i = 0; i <= su; ++i) {
					const p: Vector3 = [0, 0, 0];
					p[axis] = plane;
					p[u] = lower[u] + (upper[u] - lower[u]) * i / su;
					p[v] = lower[v] + (upper[v] - lower[v]) * j / sv;

					let point = p;
					if (morphixField(...p) > 0) {
						const anchor = p.map((c, k) => lowerCut[k] && upperCut[k] ? c : (lowerCut[k] ? lower[k] : upper[k])) as Vector3;
						point = surfaceOnSegment(anchor, p);
					}

					let normal: Vector3 = [0, 0, 0];
					normal[axis] = side;
					if (!cut)
						normal = morphixNormal(point);

					positions.push(...point);
					normals.push(...normal);
					stickers.push(cut ? 0 : 1);
				}
			}

			for (let j = 0; j < sv; ++j) {
				for (let i = 0; i < su; ++i) {
					const a = base + j * (su + 1) + i;
					const b = a + 1, c = a + su + 1, d = c + 1;
					// (u, v, axis) is right-handed: counter-clockwise in (u, v) faces +axis
					if (side > 0)
						indices.push(a, b, d, a, d, c);
					else
						indices.push(a, d, b, a, c, d);
				}
			}
		}
	}

	// small gaps between pieces: shrink each piece about its cell centre
	for (let i = 0; i < positions.length; i += 3) {
		for (let k = 0; k < 3; ++k)
			positions[i + k] = piece.home[k] + (positions[i + k] - piece.home[k]) * GAP_SCALE;
	}

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
	geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
	geometry.setAttribute("sticker", new THREE.Float32BufferAttribute(stickers, 1));
	geometry.setIndex(indices);
	geometry.computeBoundingSphere();

	return geometry;
};


export type PieceMesh = THREE.Mesh & {material: THREE.ShaderMaterial};


export const createPieceMeshes = (kind: PuzzleKind, pieces: Piece[]): PieceMesh[] => pieces.map(piece => {
	let mesh: THREE.Mesh;
	if (kind.shape === "mastermorphix")
		mesh = new THREE.Mesh(createMorphixPiece(piece), createMaterial(TETRA_COLORS, true));
	else {
		const colors = Array(6).fill(BASE_COLOR);
		piece.stickers.forEach(sticker => colors[sticker.face] = CUBE_COLORS[sticker.face]);
		mesh = new THREE.Mesh(createCubePiece(piece), createMaterial(colors, false));
	}

	return mesh as PieceMesh;
});


// Radius of a sphere holding the whole puzzle, for framing the camera.
export const puzzleRadius = (kind: PuzzleKind): number => {
	if (kind.shape === "mastermorphix")
		return Math.max(...[[1, 1, 1], [1, 0, 0], [1, 1, -1]].map(d => morphixRadius(d[0], d[1], d[2])));

	return kind.order / 2 * Math.sqrt(3);
};
