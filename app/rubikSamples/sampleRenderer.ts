// WebGL renderer for sampler.ts samples: builds the scene a Sample describes and renders its three views (or a
// video's frames: a frame with its own `facelets` is painted with them, a frame with a `twist` has that layer turned).
// Also renders exact sticker-id masks (per pixel: which facelet shows), which the browser test uses to check that
// the label corners sit on the rendered stickers.
import * as THREE from "three";
import {RoundedBoxGeometry} from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

import {FACE_LETTERS, Sample} from "./sampler";



// sRGB hex → linear colour (materials and lights work in linear space; output is encoded to sRGB)
const linear = (hex: string): THREE.Color => new THREE.Color(hex).convertSRGBToLinear();


const roundedSquare = (side: number, radius: number): THREE.ShapeGeometry => {
	const h = side / 2, r = Math.min(radius, h);
	const shape = new THREE.Shape();
	shape.moveTo(-h + r, -h);
	shape.lineTo(h - r, -h);
	shape.quadraticCurveTo(h, -h, h, -h + r);
	shape.lineTo(h, h - r);
	shape.quadraticCurveTo(h, h, h - r, h);
	shape.lineTo(-h + r, h);
	shape.quadraticCurveTo(-h, h, -h, h - r);
	shape.lineTo(-h, -h + r);
	shape.quadraticCurveTo(-h, -h, -h + r, -h);

	return new THREE.ShapeGeometry(shape, 6);
};


// mask colour of facelet k: r = k + 1 (0 is background)
export const maskColor = (index: number): number => index + 1;


export default class SampleRenderer {
	canvas: HTMLCanvasElement;
	renderer: THREE.WebGLRenderer;
	scene: THREE.Scene;
	camera: THREE.PerspectiveCamera;
	cube: THREE.Group;
	stickerMeshes: THREE.Mesh[] = [];	// stickered: by facelet index
	cubies: {mesh: THREE.Mesh; facelets: number[]}[] = [];	// facelets: facelet index per box face group (+x -x +y -y +z -z), or -1
	materials: THREE.Material[] = [];	// by facelet index (shared per colour)
	byColor: Record<string, THREE.Material> = {};
	facelets = "";	// the state painted
	// everything that turns with a layer: its lattice cubie and its rest pose in the cube group
	movable: {object: THREE.Object3D; lattice: number[]; position: THREE.Vector3; quaternion: THREE.Quaternion}[] = [];
	bodyMaterial: THREE.Material;
	disposables: {dispose: () => void}[] = [];
	sample: Sample;


	constructor (canvas: HTMLCanvasElement = document.createElement("canvas")) {
		this.canvas = canvas;
		this.renderer = new THREE.WebGLRenderer({canvas, antialias: true, preserveDrawingBuffer: true});
		this.renderer.outputEncoding = THREE.sRGBEncoding;
		this.renderer.setPixelRatio(1);
	}


	dispose (): void {
		this.clear();
		this.renderer.dispose();
	}


	clear (): void {
		this.disposables.forEach(item => item.dispose());
		this.disposables = [];
		this.stickerMeshes = [];
		this.cubies = [];
		this.materials = [];
		this.byColor = {};
		this.facelets = "";
		this.movable = [];
		this.scene = null;
	}


	load (sample: Sample): void {
		this.clear();
		this.sample = sample;
		const {width, height} = sample.image;
		const r = sample.render;

		this.renderer.setSize(width, height, false);
		this.scene = new THREE.Scene();
		// r126 writes a Color background as the clear colour, without output encoding: give it the sRGB value as is
		this.scene.background = new THREE.Color(r.background);

		// near/far hug the cube so depth precision separates the stickers from the cubie faces. Clipping is by depth
		// (camera z), not distance: off-centre framing puts the cube centre's depth below its distance, so bound the
		// cube (radius 1.5√3 < 2.7) by the centre's z.
		const depths = sample.views.map(view => view.translation[2]);
		this.camera = new THREE.PerspectiveCamera(sample.intrinsics.fovY, width / height,
			Math.max(0.1, Math.min(...depths) - 2.7), Math.max(...depths) + 2.7);

		// lights, given in the label camera frame (y down, z forward) → three.js camera frame (y up, z backward)
		const flip = ([x, y, z]: number[]) => new THREE.Vector3(x, -y, -z);
		this.scene.add(new THREE.AmbientLight(linear(r.ambient.color), r.ambient.intensity));
		const main = new THREE.DirectionalLight(linear(r.main.color), r.main.intensity);
		main.position.copy(flip(r.main.direction));
		this.scene.add(main);
		r.points.forEach(point => {
			const light = new THREE.PointLight(linear(point.color), point.intensity, point.distance, point.decay);
			light.position.copy(flip(point.position));
			this.scene.add(light);
		});

		// cube: 26 rounded cubies (the core never shows); stickered: + 54 sticker planes; stickerless: the cubie's box
		// face groups take the colours (each group runs to the 45° line on the rounded edges, so the colour wraps them)
		this.cube = new THREE.Group();
		this.scene.add(this.cube);

		const stickerless = r.style === "stickerless";
		const size = 1 - r.gap;
		const cubie = new RoundedBoxGeometry(size, size, size, 5, r.cubieRadius);
		this.bodyMaterial = new THREE.MeshStandardMaterial({color: linear(sample.cube.body), roughness: r.bodyRoughness, metalness: 0});
		this.disposables.push(cubie, this.bodyMaterial);

		const byColor = {};
		FACE_LETTERS.split("").forEach(face => {
			byColor[face] = new THREE.MeshStandardMaterial({color: linear(sample.cube.colors[face]), roughness: r.stickerRoughness, metalness: 0,
				polygonOffset: !stickerless, polygonOffsetFactor: -1, polygonOffsetUnits: -4});
			this.disposables.push(byColor[face]);
		});
		this.byColor = byColor;
		this.facelets = sample.cube.facelets;
		this.materials = Array.from(sample.cube.facelets, color => byColor[color]);

		if (r.style === "antipop") {
			this.buildAntipop(sample);
			this.paint(k => this.materials[k], this.bodyMaterial);
			this.collectMovable();
			return;
		}

		// which facelet each cubie face group shows
		const cubieAt = new Map<string, number[]>();
		for (let x = -1; x <= 1; ++x) {
			for (let y = -1; y <= 1; ++y) {
				for (let z = -1; z <= 1; ++z) {
					if (x || y || z)
						cubieAt.set([x, y, z].join(), Array(6).fill(-1));
				}
			}
		}
		const GROUP_FACES = "RLUDFB";	// BoxGeometry group order: +x -x +y -y +z -z
		const frames = sample.cube.faceFrames;
		const faceletFrame = (k: number) => {
			const face = FACE_LETTERS[Math.floor(k / 9)], row = Math.floor((k % 9) / 3), col = k % 3;
			const f = FACE_LETTERS.indexOf(face), axis = Math.floor(f / 2), sign = f % 2 ? 1 : -1;
			const right = new THREE.Vector3(...frames[face].right), down = new THREE.Vector3(...frames[face].down);
			const normal = new THREE.Vector3().setComponent(axis, sign);
			const centre = normal.clone().addScaledVector(right, col - 1).addScaledVector(down, row - 1);	// cubie centre
			return {face, right, down, normal, centre};
		};
		for (let k = 0; k < 54; ++k) {
			const {face, centre} = faceletFrame(k);
			cubieAt.get(centre.toArray().map(c => Math.round(c)).join())[GROUP_FACES.indexOf(face)] = k;
		}

		cubieAt.forEach((facelets, key) => {
			const mesh = new THREE.Mesh(cubie, this.bodyMaterial);
			mesh.position.set(...key.split(",").map(Number) as [number, number, number]);
			this.cube.add(mesh);
			this.cubies.push({mesh, facelets});
		});

		if (!stickerless) {
			const stickerGeometry = roundedSquare(r.sticker, r.stickerRadius);
			this.disposables.push(stickerGeometry);
			for (let k = 0; k < 54; ++k) {
				const {right, down, normal} = faceletFrame(k);
				const mesh = new THREE.Mesh(stickerGeometry, this.materials[k]);
				// shape x → right, shape y → up (= -down), shape z → outward normal: right × (-down) = normal
				mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, down.clone().negate(), normal));
				const row = Math.floor((k % 9) / 3), col = k % 3;
				mesh.position.copy(normal.clone().multiplyScalar(r.stickerPlane)).addScaledVector(right, col - 1).addScaledVector(down, row - 1);
				this.cube.add(mesh);
				this.stickerMeshes.push(mesh);
				mesh.userData.lattice = faceletFrame(k).centre.toArray().map(c => Math.round(c));
			}
		}

		this.paint(k => this.materials[k], this.bodyMaterial);
		this.collectMovable();
	}


	// the cube group's children with their lattice cubie (cubie meshes and anti-pop groups by position, stickers set
	// theirs) and rest poses
	collectMovable (): void {
		this.movable = this.cube.children.map(object => ({
			object,
			lattice: object.userData.lattice || object.userData.position || object.position.toArray().map(c => Math.round(c)),
			position: object.position.clone(),
			quaternion: object.quaternion.clone(),
		}));
	}


	// a frame's state and turning layer (views without them: the sample's state, no turn)
	setFrame (facelets: string, twist?: {axis: number; layer: number; angle: number}): void {
		if (facelets !== this.facelets) {
			this.facelets = facelets;
			this.materials = Array.from(facelets, color => this.byColor[color]);
			this.paint(k => this.materials[k], this.bodyMaterial);
		}
		const turn = twist && new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3().setComponent(twist.axis, 1), twist.angle);
		this.movable.forEach(({object, lattice, position, quaternion}) => {
			const moving = twist && lattice[twist.axis] === twist.layer - 1;
			object.position.copy(position);
			object.quaternion.copy(quaternion);
			if (moving) {
				object.position.applyQuaternion(turn);
				object.quaternion.premultiply(turn);
			}
		});
	}


	// Anti-pop cube: per cubie a group at its actual pose (lattice + offset, small rotation; render.cubies), holding a dark
	// core and its coloured tiles — extruded rounded squares whose corner radii depend on what the corner points at
	// (see AntipopBuild). The tile's top is the label plane (stickerPlane), its outline the label square (sticker), except
	// on the cube's edges: there a tile stops its own thickness short, so the two tiles of a cubie don't intersect, and
	// the core's rounded edge shows between them.
	buildAntipop (sample: Sample): void {
		const r = sample.render, a = r.antipop;
		const side = 1 - r.gap;
		const lift = a.depth + 2 * a.bevel;	// tile thickness above the core
		const core = new RoundedBoxGeometry(side - 2 * lift + 0.01, side - 2 * lift + 0.01, side - 2 * lift + 0.01, 4, lift * 0.8);
		this.disposables.push(core);
		const half = r.sticker / 2 - a.bevel;	// the bevel grows the shape by its size
		const tileGeometries = new Map<string, THREE.ExtrudeGeometry>();
		// radii: corners TL TR BR BL; extent: the sides' distances from the centre, left right bottom top (shape x → right,
		// y → up)
		const tile = (radii: number[], extent: number[]): THREE.ExtrudeGeometry => {
			const key = radii.concat(extent).map(x => x.toFixed(5)).join();
			if (tileGeometries.has(key))
				return tileGeometries.get(key);
			const [x0, x1, y0, y1] = [-extent[0], extent[1], -extent[2], extent[3]];
			const fit = Math.min(...extent);
			const [tl, tr, br, bl] = radii.map(x => Math.min(Math.max(x - a.bevel, 0.002), fit - 1e-4));
			const shape = new THREE.Shape();
			shape.moveTo(x0 + bl, y0);
			shape.lineTo(x1 - br, y0);
			shape.absarc(x1 - br, y0 + br, br, -Math.PI / 2, 0, false);
			shape.lineTo(x1, y1 - tr);
			shape.absarc(x1 - tr, y1 - tr, tr, 0, Math.PI / 2, false);
			shape.lineTo(x0 + tl, y1);
			shape.absarc(x0 + tl, y1 - tl, tl, Math.PI / 2, Math.PI, false);
			shape.lineTo(x0, y0 + bl);
			shape.absarc(x0 + bl, y0 + bl, bl, Math.PI, Math.PI * 1.5, false);
			const geometry = new THREE.ExtrudeGeometry(shape, {depth: a.depth, bevelEnabled: true, bevelThickness: a.bevel, bevelSize: a.bevel,
				bevelSegments: 4, curveSegments: 16});
			this.disposables.push(geometry);
			tileGeometries.set(key, geometry);
			return geometry;
		};
		const frames = sample.cube.faceFrames;
		const groups = new Map<string, THREE.Group>();
		(r.cubies || []).forEach(c => {
			const group = new THREE.Group();
			group.position.set(c.position[0] + c.offset[0], c.position[1] + c.offset[1], c.position[2] + c.offset[2]);
			group.quaternion.set(...c.quaternion);
			group.userData.position = c.position.slice();
			const mesh = new THREE.Mesh(core, this.bodyMaterial);
			group.add(mesh);
			this.cube.add(group);
			this.cubies.push({mesh, facelets: []});
			groups.set(c.position.join(), group);
		});
		this.stickerMeshes = Array(54).fill(null);
		for (let k = 0; k < 54; ++k) {
			const face = FACE_LETTERS[Math.floor(k / 9)], row = Math.floor((k % 9) / 3), col = k % 3;
			const f = Math.floor(k / 9), axis = Math.floor(f / 2), sign = f % 2 ? 1 : -1;
			const right = new THREE.Vector3(...frames[face].right), down = new THREE.Vector3(...frames[face].down);
			const normal = new THREE.Vector3().setComponent(axis, sign);
			const lattice = normal.clone().addScaledVector(right, col - 1).addScaledVector(down, row - 1);
			// towards the face centre, in (right, down); a corner (sx, sy) of the square in (right, down) is inner when it
			// points there (centre caps: all four)
			const dr = 1 - col, dd = 1 - row;
			const kind = dr === 0 && dd === 0 ? "centre" : dr === 0 || dd === 0 ? "edge" : "corner";
			const radii = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
				const inner = kind === "centre" || (kind === "edge" ? sx * dr + sy * dd > 0 : sx === dr && sy === dd);
				return (inner ? a[kind] : a.outer) * r.sticker;
			});
			// sides on the cube's edge (left: col 0, right: col 2, top: row 0, bottom: row 2) stop the tile's thickness short
			const extent = [col === 0, col === 2, row === 2, row === 0].map(onEdge => half - (onEdge ? lift : 0));
			const mesh = new THREE.Mesh(tile(radii, extent), this.materials[k]);
			mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, down.clone().negate(), normal));
			// in the cubie's frame: the tile's top (shape z = depth + bevel) on the label plane
			mesh.position.copy(normal.clone().multiplyScalar(r.stickerPlane - 1 - a.depth - a.bevel));
			groups.get(lattice.toArray().map(c => Math.round(c)).join()).add(mesh);
			this.stickerMeshes[k] = mesh;
		}
	}


	// Assign facelet k's material and the body material to stickers / cubie face groups.
	// eslint-disable-next-line no-unused-vars
	paint (facelet: (index: number) => THREE.Material, body: THREE.Material): void {
		if (this.sample.render.style === "stickerless")
			this.cubies.forEach(({mesh, facelets}) => mesh.material = facelets.map(k => k >= 0 ? facelet(k) : body));
		else {
			this.cubies.forEach(({mesh}) => mesh.material = body);
			this.stickerMeshes.forEach((mesh, k) => mesh.material = facelet(k));
		}
	}


	// Pose the cube as in view i: label (R, t) in the camera frame → three.js frame = diag(1, -1, -1)·(R, t).
	pose (index: number): void {
		const view = this.sample.views[index] as Sample["views"][0] & {facelets?: string; twist?: {axis: number; layer: number; angle: number}};
		this.setFrame(view.facelets || this.sample.cube.facelets, view.twist);
		const {rotation: R, translation: t} = view;
		this.cube.quaternion.setFromRotationMatrix(new THREE.Matrix4().set(
			R[0], R[1], R[2], 0,
			-R[3], -R[4], -R[5], 0,
			-R[6], -R[7], -R[8], 0,
			0, 0, 0, 1));
		this.cube.position.set(t[0], -t[1], -t[2]);
	}


	// PNG data URL of view i.
	renderView (index: number): string {
		this.pose(index);
		this.renderer.render(this.scene, this.camera);

		return this.canvas.toDataURL("image/png");
	}


	renderAll (): string[] {
		return this.sample.views.map((_, i) => this.renderView(i));
	}


	// Sticker-id mask of view i, rendered without multisampling so every pixel is exact: 0 background or cube body,
	// k + 1 where facelet k shows (red channel). Returns the RGBA pixels, top row first.
	renderMask (index: number): Uint8ClampedArray {
		const {width, height} = this.sample.image;
		const savedBackground = this.scene.background;
		const stickered = this.sample.render.style !== "stickerless";
		const flat = Array(54).fill(null).map((_, k) => new THREE.MeshBasicMaterial({color: new THREE.Color(maskColor(k) / 255, 0, 0),
			polygonOffset: stickered, polygonOffsetFactor: -1, polygonOffsetUnits: -4}));
		const black = new THREE.MeshBasicMaterial({color: 0x000000});
		const target = new THREE.WebGLRenderTarget(width, height);	// linear, not multisampled
		this.pose(index);	// first: a frame's own state repaints
		this.paint(k => flat[k], black);
		this.scene.background = new THREE.Color(0, 0, 0);

		this.renderer.setRenderTarget(target);
		this.renderer.render(this.scene, this.camera);
		const pixels = new Uint8Array(width * height * 4);
		this.renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels);
		this.renderer.setRenderTarget(null);

		this.scene.background = savedBackground;
		this.paint(k => this.materials[k], this.bodyMaterial);
		flat.forEach(material => material.dispose());
		black.dispose();
		target.dispose();

		// GL rows run bottom-up
		const result = new Uint8ClampedArray(width * height * 4);
		for (let y = 0; y < height; ++y)
			result.set(pixels.subarray((height - 1 - y) * width * 4, (height - y) * width * 4), y * width * 4);

		return result;
	}
}
