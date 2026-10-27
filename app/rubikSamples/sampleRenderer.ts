// WebGL renderer for sampler.ts samples: builds the scene a Sample describes and renders its three views.
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
		this.materials = Array.from(sample.cube.facelets, color => byColor[color]);

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
			}
		}

		this.paint(k => this.materials[k], this.bodyMaterial);
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
		const {rotation: R, translation: t} = this.sample.views[index];
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
		this.paint(k => flat[k], black);
		this.scene.background = new THREE.Color(0, 0, 0);

		this.pose(index);
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
