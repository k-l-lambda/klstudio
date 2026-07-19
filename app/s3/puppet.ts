
import * as THREE from "three";



/**
 * An abstract cross-shaped puppet for the S^3 hypersphere simulator.
 *
 * The figure is built from a handful of boxes arranged into a cross (a vertical
 * head-torso-legs bar crossed by a horizontal arm bar). A single canvas-2D atlas
 * paints every recognizable region — face, hair, shirt, pants, hands, shoes — into
 * a grid of tiles, and each box face is UV-mapped to one tile so the figure reads
 * clearly from any viewing angle.
 */



const ATLAS_SIZE = 1024;
const ATLAS_COLS = 4;
const ATLAS_ROWS = 4;
const TILE = ATLAS_SIZE / ATLAS_COLS;


type TileName =
	| "face" | "hairBack" | "hairSide" | "hairTop"
	| "shirtFront" | "shirtBack" | "shirtSide" | "collar"
	| "pantsFront" | "pantsBack" | "pantsSide" | "belt"
	| "hand" | "shoe" | "sleeve" | "neck";


/** Grid position (column, row from the top) of each named tile in the atlas. */
const TILE_GRID: Record<TileName, [number, number]> = {
	face: [0, 0], hairBack: [1, 0], hairSide: [2, 0], hairTop: [3, 0],
	shirtFront: [0, 1], shirtBack: [1, 1], shirtSide: [2, 1], collar: [3, 1],
	pantsFront: [0, 2], pantsBack: [1, 2], pantsSide: [2, 2], belt: [3, 2],
	hand: [0, 3], shoe: [1, 3], sleeve: [2, 3], neck: [3, 3],
};


interface UvRect {
	u0: number;
	v0: number;
	u1: number;
	v1: number;
}


/** UV rectangle of a tile, accounting for the default flipped Y of a CanvasTexture. */
const tileUvRect = (name: TileName): UvRect => {
	const [col, row] = TILE_GRID[name];
	return {
		u0: col / ATLAS_COLS,
		u1: (col + 1) / ATLAS_COLS,
		v0: 1 - (row + 1) / ATLAS_ROWS,
		v1: 1 - row / ATLAS_ROWS,
	};
};


const SKIN = "#f1c9a5";
const SKIN_SHADOW = "#d9a878";
const HAIR = "#3a2a1b";
const SHIRT = "#3f7bd6";
const SHIRT_DARK = "#2f5ea8";
const PANTS = "#39424f";
const PANTS_DARK = "#2a313b";
const SHOE = "#5a3a22";


/** Paint one 256px tile; (x, y) is the tile's top-left pixel corner. */
const paintTile = (ctx: CanvasRenderingContext2D, name: TileName, x: number, y: number): void => {
	const s = TILE;
	const cx = x + s / 2;
	const cy = y + s / 2;

	const fill = (color: string): void => {
		ctx.fillStyle = color;
		ctx.fillRect(x, y, s, s);
	};

	switch (name) {
	case "face":
		fill(SKIN);
		// eyes
		ctx.fillStyle = "#ffffff";
		ctx.beginPath();
		ctx.ellipse(x + s * 0.34, y + s * 0.4, s * 0.1, s * 0.13, 0, 0, Math.PI * 2);
		ctx.ellipse(x + s * 0.66, y + s * 0.4, s * 0.1, s * 0.13, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = "#20140c";
		ctx.beginPath();
		ctx.arc(x + s * 0.36, y + s * 0.42, s * 0.05, 0, Math.PI * 2);
		ctx.arc(x + s * 0.64, y + s * 0.42, s * 0.05, 0, Math.PI * 2);
		ctx.fill();
		// nose
		ctx.strokeStyle = SKIN_SHADOW;
		ctx.lineWidth = s * 0.03;
		ctx.beginPath();
		ctx.moveTo(cx, y + s * 0.46);
		ctx.lineTo(cx, y + s * 0.6);
		ctx.stroke();
		// mouth
		ctx.strokeStyle = "#a8443a";
		ctx.lineWidth = s * 0.035;
		ctx.beginPath();
		ctx.arc(cx, y + s * 0.66, s * 0.16, 0.15 * Math.PI, 0.85 * Math.PI);
		ctx.stroke();
		// hair fringe on top
		ctx.fillStyle = HAIR;
		ctx.fillRect(x, y, s, s * 0.14);
		break;

	case "hairBack":
		fill(HAIR);
		ctx.strokeStyle = "#241a10";
		ctx.lineWidth = s * 0.02;
		for (let i = 1; i < 6; ++i) {
			ctx.beginPath();
			ctx.moveTo(x + (s * i) / 6, y);
			ctx.lineTo(x + (s * i) / 6, y + s);
			ctx.stroke();
		}
		break;

	case "hairSide":
		fill(HAIR);
		break;

	case "hairTop":
		fill(HAIR);
		ctx.fillStyle = "#4a3624";
		ctx.beginPath();
		ctx.arc(cx, cy, s * 0.28, 0, Math.PI * 2);
		ctx.fill();
		break;

	case "neck":
		fill(SKIN_SHADOW);
		break;

	case "shirtFront":
		fill(SHIRT);
		// collar V
		ctx.fillStyle = SKIN;
		ctx.beginPath();
		ctx.moveTo(x + s * 0.5, y);
		ctx.lineTo(x + s * 0.36, y);
		ctx.lineTo(x + s * 0.5, y + s * 0.24);
		ctx.lineTo(x + s * 0.64, y);
		ctx.closePath();
		ctx.fill();
		// buttons
		ctx.fillStyle = SHIRT_DARK;
		for (let i = 0; i < 3; ++i) {
			ctx.beginPath();
			ctx.arc(cx, y + s * (0.4 + i * 0.16), s * 0.03, 0, Math.PI * 2);
			ctx.fill();
		}
		// center seam
		ctx.strokeStyle = SHIRT_DARK;
		ctx.lineWidth = s * 0.015;
		ctx.beginPath();
		ctx.moveTo(cx, y + s * 0.24);
		ctx.lineTo(cx, y + s);
		ctx.stroke();
		break;

	case "shirtBack":
		fill(SHIRT_DARK);
		ctx.strokeStyle = SHIRT;
		ctx.lineWidth = s * 0.02;
		ctx.beginPath();
		ctx.moveTo(x + s * 0.2, y + s * 0.2);
		ctx.lineTo(x + s * 0.8, y + s * 0.2);
		ctx.stroke();
		break;

	case "shirtSide":
		fill(SHIRT);
		ctx.fillStyle = SHIRT_DARK;
		ctx.fillRect(x, y, s * 0.12, s);
		ctx.fillRect(x + s * 0.88, y, s * 0.12, s);
		break;

	case "collar":
		fill(SHIRT_DARK);
		break;

	case "pantsFront":
		fill(PANTS);
		// leg split
		ctx.strokeStyle = PANTS_DARK;
		ctx.lineWidth = s * 0.03;
		ctx.beginPath();
		ctx.moveTo(cx, y + s * 0.1);
		ctx.lineTo(cx, y + s);
		ctx.stroke();
		// pockets
		ctx.strokeStyle = PANTS_DARK;
		ctx.lineWidth = s * 0.02;
		ctx.strokeRect(x + s * 0.12, y + s * 0.12, s * 0.22, s * 0.18);
		ctx.strokeRect(x + s * 0.66, y + s * 0.12, s * 0.22, s * 0.18);
		break;

	case "pantsBack":
		fill(PANTS_DARK);
		ctx.strokeStyle = PANTS;
		ctx.lineWidth = s * 0.03;
		ctx.beginPath();
		ctx.moveTo(cx, y);
		ctx.lineTo(cx, y + s);
		ctx.stroke();
		break;

	case "pantsSide":
		fill(PANTS);
		ctx.fillStyle = PANTS_DARK;
		ctx.fillRect(x + s * 0.44, y, s * 0.12, s);
		break;

	case "belt":
		fill("#20242b");
		ctx.fillStyle = "#c9a24b";
		ctx.fillRect(cx - s * 0.09, cy - s * 0.09, s * 0.18, s * 0.18);
		break;

	case "sleeve":
		fill(SHIRT);
		ctx.strokeStyle = SHIRT_DARK;
		ctx.lineWidth = s * 0.05;
		ctx.beginPath();
		ctx.moveTo(x, y + s * 0.5);
		ctx.lineTo(x + s, y + s * 0.5);
		ctx.stroke();
		break;

	case "hand":
		fill(SKIN);
		ctx.fillStyle = SKIN_SHADOW;
		ctx.beginPath();
		ctx.arc(cx, cy, s * 0.32, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = SKIN;
		ctx.beginPath();
		ctx.arc(cx, cy, s * 0.24, 0, Math.PI * 2);
		ctx.fill();
		// fingers hint
		ctx.strokeStyle = SKIN_SHADOW;
		ctx.lineWidth = s * 0.02;
		for (let i = 0; i < 4; ++i) {
			ctx.beginPath();
			ctx.moveTo(x + s * (0.34 + i * 0.11), y + s * 0.2);
			ctx.lineTo(x + s * (0.34 + i * 0.11), y + s * 0.42);
			ctx.stroke();
		}
		break;

	case "shoe":
		fill(SHOE);
		ctx.fillStyle = "#2a1a0f";
		ctx.fillRect(x, y + s * 0.72, s, s * 0.28);
		ctx.strokeStyle = "#edd9b8";
		ctx.lineWidth = s * 0.02;
		for (let i = 0; i < 3; ++i) {
			ctx.beginPath();
			ctx.moveTo(x + s * 0.34, y + s * (0.24 + i * 0.14));
			ctx.lineTo(x + s * 0.66, y + s * (0.24 + i * 0.14));
			ctx.stroke();
		}
		break;
	}
};


/** Build the whole atlas onto a canvas and wrap it in a THREE.CanvasTexture. */
const buildAtlasTexture = (): THREE.CanvasTexture => {
	const canvas = document.createElement("canvas");
	canvas.width = ATLAS_SIZE;
	canvas.height = ATLAS_SIZE;
	const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

	ctx.fillStyle = "#00000000";
	ctx.clearRect(0, 0, ATLAS_SIZE, ATLAS_SIZE);

	(Object.keys(TILE_GRID) as TileName[]).forEach(name => {
		const [col, row] = TILE_GRID[name];
		paintTile(ctx, name, col * TILE, row * TILE);
	});

	const texture = new THREE.CanvasTexture(canvas);
	texture.magFilter = THREE.NearestFilter;
	texture.minFilter = THREE.LinearMipMapLinearFilter;
	texture.anisotropy = 4;
	return texture;
};


/** Faces in three.js BoxGeometry group order: +x, -x, +y, -y, +z, -z. */
interface BoxFaces {
	px: TileName;
	nx: TileName;
	py: TileName;
	ny: TileName;
	pz: TileName;
	nz: TileName;
}


/** Remap a box's per-face UVs so each of the six faces samples its assigned tile. */
const applyBoxFaces = (geometry: THREE.BoxGeometry, faces: BoxFaces): void => {
	const order: TileName[] = [faces.px, faces.nx, faces.py, faces.ny, faces.pz, faces.nz];
	const uv = geometry.attributes.uv as THREE.BufferAttribute;
	for (let face = 0; face < 6; ++face) {
		const rect = tileUvRect(order[face]);
		for (let corner = 0; corner < 4; ++corner) {
			const index = face * 4 + corner;
			const u = uv.getX(index);
			const v = uv.getY(index);
			uv.setXY(index, rect.u0 + u * (rect.u1 - rect.u0), rect.v0 + v * (rect.v1 - rect.v0));
		}
	}
	uv.needsUpdate = true;
};


interface BoxSpec {
	size: [number, number, number];
	position: [number, number, number];
	faces: BoxFaces;
}


// Cross layout: a vertical head-torso-legs bar crossed by a horizontal arm bar.
// The figure faces +Z; up is +Y.
const BODY_PARTS: BoxSpec[] = [
	{
		// head
		size: [1, 1, 0.8],
		position: [0, 1.75, 0],
		faces: {px: "hairSide", nx: "hairSide", py: "hairTop", ny: "neck", pz: "face", nz: "hairBack"},
	},
	{
		// torso
		size: [1.4, 1.6, 0.6],
		position: [0, 0.45, 0],
		faces: {px: "shirtSide", nx: "shirtSide", py: "collar", ny: "belt", pz: "shirtFront", nz: "shirtBack"},
	},
	{
		// left arm (extends -X)
		size: [1.2, 0.5, 0.5],
		position: [-1.3, 0.85, 0],
		faces: {px: "sleeve", nx: "hand", py: "sleeve", ny: "sleeve", pz: "sleeve", nz: "sleeve"},
	},
	{
		// right arm (extends +X)
		size: [1.2, 0.5, 0.5],
		position: [1.3, 0.85, 0],
		faces: {px: "hand", nx: "sleeve", py: "sleeve", ny: "sleeve", pz: "sleeve", nz: "sleeve"},
	},
	{
		// legs
		size: [1.2, 1.6, 0.5],
		position: [0, -1.15, 0],
		faces: {px: "pantsSide", nx: "pantsSide", py: "belt", ny: "shoe", pz: "pantsFront", nz: "pantsBack"},
	},
];


export interface Puppet {
	group: THREE.Group;
	texture: THREE.CanvasTexture;
	/** An Object3D at the eyes, looking toward the figure's forward (+Z). Attach a camera here for first-person. */
	head: THREE.Object3D;
	dispose (): void;
}


/** Create the cross-shaped puppet, textured from a single canvas-2D atlas. */
export const createPuppet = (): Puppet => {
	const texture = buildAtlasTexture();
	const material = new THREE.MeshStandardMaterial({map: texture, roughness: 0.85, metalness: 0.05});

	const group = new THREE.Group();
	const geometries: THREE.BoxGeometry[] = [];

	for (const spec of BODY_PARTS) {
		const geometry = new THREE.BoxGeometry(...spec.size);
		applyBoxFaces(geometry, spec.faces);
		geometries.push(geometry);
		const mesh = new THREE.Mesh(geometry, material);
		mesh.position.set(...spec.position);
		group.add(mesh);
	}

	// First-person anchor: at the eyes, facing forward (+Z).
	const head = new THREE.Object3D();
	head.position.set(0, 1.85, 0.4);
	group.add(head);

	const dispose = (): void => {
		geometries.forEach(geometry => geometry.dispose());
		material.dispose();
		texture.dispose();
	};

	return {group, texture, head, dispose};
};
