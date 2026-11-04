// WebGL renderer for sampler.ts samples: builds the scene a Sample describes and renders its three views (or a
// video's frames: a frame with its own `facelets` is painted with them, a frame with a `twist` has that layer turned).
// Also renders exact sticker-id masks (per pixel: which facelet shows), which the browser test uses to check that
// the label corners sit on the rendered stickers.
import * as THREE from "three";
import {RoundedBoxGeometry} from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {RoomEnvironment} from "three/examples/jsm/environments/RoomEnvironment.js";

import {Studio, applyImaging, drawBackdrop, drawLogo, drawWindow} from "./realism";
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


// three.js frame (y up, z backward) of a label camera-frame direction (y down, z forward)
const flipped = ([x, y, z]: number[]): THREE.Vector3 => new THREE.Vector3(x, -y, -z);


// The studio's room as an environment scene (realism.ts Studio): a box of walls / floor / ceiling (dim, linear) and
// the emitters — a window with mullions, ceiling lamps — at HDR intensity, as three's RoomEnvironment does. In the
// three.js camera frame (the camera at the origin looking down −z; the cube turns, the room stays).
const studioScene = (st: Studio): {scene: THREE.Scene; dispose: () => void} => {
	const scene = new THREE.Scene();
	const owned: {dispose: () => void}[] = [];
	const R = 20;
	const box = new THREE.BoxGeometry(2 * R, 2 * R, 2 * R);
	const shade = (hex: string, k: number) => new THREE.MeshBasicMaterial({color: linear(hex).multiplyScalar(k), side: THREE.BackSide});
	// group order +x −x +y −y +z −z; +y is up (ceiling), −y the floor
	const walls = [shade(st.walls, 0.9), shade(st.walls, 0.75), shade(st.ceiling, 1), shade(st.floor, 0.6), shade(st.walls, 0.6), shade(st.walls, 0.8)];
	scene.add(new THREE.Mesh(box, walls));
	owned.push(box, ...walls);
	const facing = (mesh: THREE.Mesh, direction: number[], distance: number) => {
		mesh.position.copy(flipped(direction).normalize().multiplyScalar(distance));
		mesh.lookAt(0, 0, 0);
		scene.add(mesh);
	};
	const D = R * 0.9;
	const canvas = document.createElement("canvas");
	canvas.width = 256;
	canvas.height = 192;
	drawWindow(canvas, st.window);
	const texture = new THREE.CanvasTexture(canvas);
	texture.encoding = THREE.sRGBEncoding;
	const windowMaterial = new THREE.MeshBasicMaterial({map: texture, side: THREE.DoubleSide});
	windowMaterial.color.setScalar(st.window.intensity);
	const windowPlane = new THREE.PlaneGeometry(2 * D * Math.tan(st.window.width / 2), 2 * D * Math.tan(st.window.height / 2));
	facing(new THREE.Mesh(windowPlane, windowMaterial), st.window.direction, D);
	owned.push(texture, windowMaterial, windowPlane);
	st.lamps.forEach(lamp => {
		const disc = new THREE.CircleGeometry(D * Math.tan(lamp.size), 24);
		const material = new THREE.MeshBasicMaterial({side: THREE.DoubleSide});
		material.color.setScalar(lamp.intensity);
		facing(new THREE.Mesh(disc, material), lamp.direction, D);
		owned.push(disc, material);
	});
	return {scene, dispose: () => owned.forEach(item => item.dispose())};
};


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
	mainLight: THREE.DirectionalLight = null;
	disposables: {dispose: () => void}[] = [];
	// realism (render.realism): the desk behind the cube, drawn in its own pass, and the camera's imaging after
	backdropScene: THREE.Scene = null;
	backdropCamera: THREE.PerspectiveCamera = null;
	backdropPlane: THREE.Mesh = null;
	backdropTexture: THREE.CanvasTexture = null;
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
		this.backdropScene = null;
		this.backdropPlane = null;
		this.backdropTexture = null;
		this.byColor = {};
		this.facelets = "";
		this.movable = [];
		this.scene = null;
		this.mainLight = null;
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
		const realism = r.realism;
		const studio = realism && realism.studio;
		// level 2 (studio): filmic tone mapping and shadows; else as before
		this.renderer.toneMapping = studio ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping;
		this.renderer.toneMappingExposure = studio ? studio.exposure : 1;
		this.renderer.shadowMap.enabled = Boolean(studio && studio.shadows);
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		if (realism) {
			// reflections of a room (gloss): the scene's own room (studio), else three's generic one; the desk behind
			const pmrem = new THREE.PMREMGenerator(this.renderer);
			let environment: THREE.Texture;
			if (studio) {
				const room = studioScene(studio);
				environment = pmrem.fromScene(room.scene, 0.02).texture;
				room.dispose();
			}
			else
				environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
			this.scene.environment = environment;
			this.disposables.push(pmrem, environment);
			const canvas = document.createElement("canvas");
			canvas.width = canvas.height = 1024;
			drawBackdrop(canvas, realism.backdrop);
			this.backdropTexture = new THREE.CanvasTexture(canvas);
			this.backdropTexture.encoding = THREE.sRGBEncoding;
			this.backdropTexture.wrapS = this.backdropTexture.wrapT = THREE.MirroredRepeatWrapping;
			this.backdropTexture.repeat.set(1, 1);
			this.backdropTexture.center.set(0.5, 0.5);
			const plane = new THREE.PlaneGeometry(1, 1);
			const material = new THREE.MeshBasicMaterial({map: this.backdropTexture, color: linear(r.main.color).multiplyScalar(Math.min(1.2, 0.55 + 0.35 * r.main.intensity)),
				toneMapped: false});	// the desk as drawn, with or without the studio's tone mapping
			this.backdropPlane = new THREE.Mesh(plane, material);
			this.backdropScene = new THREE.Scene();
			this.backdropScene.add(this.backdropPlane);
			this.backdropCamera = new THREE.PerspectiveCamera(sample.intrinsics.fovY, width / height, 0.1, 1000);
			this.disposables.push(this.backdropTexture, plane, material);
		}

		// near/far hug the cube so depth precision separates the stickers from the cubie faces. Clipping is by depth
		// (camera z), not distance: off-centre framing puts the cube centre's depth below its distance, so bound the
		// cube (radius 1.5√3 < 2.7) by the centre's z.
		const depths = sample.views.map(view => view.translation[2]);
		this.camera = new THREE.PerspectiveCamera(sample.intrinsics.fovY, width / height,
			Math.max(0.1, Math.min(...depths) - 2.7), Math.max(...depths) + 2.7);

		// lights, given in the label camera frame (y down, z forward) → three.js camera frame (y up, z backward)
		const flip = flipped;
		// the studio's room lights the cube too (its irradiance): the ambient and the main light lowered
		this.scene.add(new THREE.AmbientLight(linear(r.ambient.color), r.ambient.intensity * (studio ? 0.35 : 1)));
		const main = new THREE.DirectionalLight(linear(r.main.color), r.main.intensity * (studio ? 0.75 : 1));
		main.position.copy(flip(r.main.direction));
		this.scene.add(main);
		this.mainLight = main;
		if (studio && studio.shadows) {
			// cubies shading each other (the gaps, a turning layer); the light's box follows the cube (pose)
			main.castShadow = true;
			main.shadow.mapSize.set(1024, 1024);
			const c = main.shadow.camera as THREE.OrthographicCamera;
			c.left = c.bottom = -3;
			c.right = c.top = 3;
			c.near = 1;
			c.far = 30;
			main.shadow.bias = -0.0005;
			main.shadow.normalBias = 0.01;
			this.scene.add(main.target);
		}
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
		// realism: glossy plastic (a clear coat, the room's reflections)
		// studio: its own gloss (calibrated on phone dumps: soft reflections across whole tiles)
		const gloss = studio ? studio.surface : realism && realism.gloss;
		const surface = (color: string, roughness: number, extra: object = {}): THREE.Material => realism
			? new THREE.MeshPhysicalMaterial({color: linear(color), roughness, metalness: 0, clearcoat: gloss.clearcoat,
				clearcoatRoughness: gloss.clearcoatRoughness, envMapIntensity: gloss.envIntensity, ...extra})
			: new THREE.MeshStandardMaterial({color: linear(color), roughness, metalness: 0, ...extra});
		this.bodyMaterial = surface(sample.cube.body, studio ? studio.surface.bodyRoughness : r.bodyRoughness);
		this.disposables.push(cubie, this.bodyMaterial);

		const byColor = {};
		FACE_LETTERS.split("").forEach(face => {
			byColor[face] = surface(sample.cube.colors[face], studio ? studio.surface.roughness : r.stickerRoughness,
				{polygonOffset: !stickerless, polygonOffsetFactor: -1, polygonOffsetUnits: -4});
			this.disposables.push(byColor[face]);
		});
		this.byColor = byColor;
		this.facelets = sample.cube.facelets;
		this.materials = Array.from(sample.cube.facelets, color => byColor[color]);

		if (r.style === "antipop") {
			this.buildAntipop(sample);
			this.finishStudio(sample);
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

		this.finishStudio(sample);
		this.paint(k => this.materials[k], this.bodyMaterial);
		this.collectMovable();
	}


	// studio: the printed logo on the brightest (white) centre (it turns with its layer; a centre keeps its colour), and
	// every cube mesh casting / receiving shadows
	finishStudio (sample: Sample): void {
		const r = sample.render, studio = r.realism && r.realism.studio;
		if (!studio)
			return;
		const logo = studio.logo;
		if (logo) {
			const luminance = (hex: string) => {
				const c = linear(hex);
				return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
			};
			const face = FACE_LETTERS.split("").reduce((best, f) => luminance(sample.cube.colors[f]) > luminance(sample.cube.colors[best]) ? f : best);
			const k = FACE_LETTERS.indexOf(face) * 9 + 4;
			const canvas = document.createElement("canvas");
			canvas.width = canvas.height = 256;
			drawLogo(canvas, logo);
			const texture = new THREE.CanvasTexture(canvas);
			texture.encoding = THREE.sRGBEncoding;
			const material = new THREE.MeshPhysicalMaterial({map: texture, transparent: true, roughness: studio.surface.roughness, metalness: 0,
				clearcoat: studio.surface.clearcoat, clearcoatRoughness: studio.surface.clearcoatRoughness, envMapIntensity: studio.surface.envIntensity,
				polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8});
			const size = r.sticker * logo.size;
			const plane = new THREE.PlaneGeometry(size, size);
			const mesh = new THREE.Mesh(plane, material);
			mesh.userData.logo = true;
			if (r.style === "stickerless") {
				// on the centre cubie's face: in the cubie's frame the face at normal · stickerPlane − 1
				const f = FACE_LETTERS.indexOf(face), axis = Math.floor(f / 2), sign = f % 2 ? 1 : -1;
				const right = new THREE.Vector3(...sample.cube.faceFrames[face].right), down = new THREE.Vector3(...sample.cube.faceFrames[face].down);
				const normal = new THREE.Vector3().setComponent(axis, sign);
				const cubie = this.cubies.find(c => c.mesh.position.distanceTo(normal) < 0.01);
				mesh.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(right, down.clone().negate(), normal));
				mesh.position.copy(normal.clone().multiplyScalar(r.stickerPlane - 1 + 0.002));
				cubie.mesh.add(mesh);
			}
			else {
				// on the sticker / tile: its shape frame (z outward); an anti-pop tile's top at depth + bevel
				mesh.position.z = r.style === "antipop" ? r.antipop.depth + r.antipop.bevel + 0.002 : 0.001;
				this.stickerMeshes[k].add(mesh);
			}
			this.disposables.push(texture, material, plane);
		}
		if (studio.shadows) {
			this.cube.traverse(object => {
				if ((object as THREE.Mesh).isMesh) {
					object.castShadow = !object.userData.logo;
					object.receiveShadow = true;
				}
			});
		}
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
		if (this.mainLight && this.mainLight.castShadow) {
			this.mainLight.target.position.copy(this.cube.position);
			this.mainLight.position.copy(this.cube.position).add(flipped(this.sample.render.main.direction).multiplyScalar(12));
		}
	}


	// view i as a data URL: PNG, or with realism the desk behind, the camera's imaging and JPEG.
	renderView (index: number): string {
		this.pose(index);
		const realism = this.sample.render.realism;
		if (!realism) {
			this.renderer.render(this.scene, this.camera);
			return this.canvas.toDataURL("image/png");
		}
		// the desk: a tilted plane behind the cube in the camera frame, this view's patch of its texture
		const view = this.sample.views[index] as Sample["views"][0] & {motion?: {length: number; angle: number}};
		const b = realism.backdrop;
		const depth = view.translation[2] + b.depth;
		const tanY = Math.tan(THREE.MathUtils.degToRad(this.sample.intrinsics.fovY) / 2);
		// the frame shows about the texture's width (its clutter at the size it was drawn for)
		const size = 2 * depth * tanY * Math.max(1, this.sample.image.width / this.sample.image.height) * 1.4;
		this.backdropPlane.position.set(0, 0, -depth);
		this.backdropPlane.rotation.set(-b.tilt, 0, 0);
		this.backdropPlane.scale.set(size, size, 1);
		const patch = view.backdrop || {u: 0, v: 0, turn: 0};
		this.backdropTexture.offset.set(patch.u * 0.4, patch.v * 0.4);
		this.backdropTexture.rotation = patch.turn;
		const background = this.scene.background;
		this.renderer.autoClear = false;
		this.renderer.clear();
		this.renderer.render(this.backdropScene, this.backdropCamera);
		this.renderer.clearDepth();
		this.scene.background = null;
		this.renderer.render(this.scene, this.camera);
		this.scene.background = background;
		this.renderer.autoClear = true;
		return applyImaging(this.canvas, realism.imaging, this.sample.seed * 31 + index, view.motion);
	}


	renderAll (): string[] {
		return this.sample.views.map((_, i) => this.renderView(i));
	}


	// Glare of view i (studio): the view rendered with every colour's albedo black (gloss, lights and room kept), so a
	// pixel holds only the reflection over the sticker's colour, tone mapped and encoded like the image; per visible
	// sticker over its label quad: the mean of that reflection (0–1, luminance) and the share of its pixels above
	// GLARE_LEVEL (a highlight that washes the colour out). Null without the studio.
	renderGlare (index: number): {mean: number; share: number}[] {
		const studio = this.sample.render.realism && this.sample.render.realism.studio;
		if (!studio)
			return null;
		const GLARE_LEVEL = 0.25;
		const {width, height} = this.sample.image;
		this.pose(index);
		const black = new Map<THREE.Material, THREE.Material>();
		const blackOf = (m: THREE.Material) => {
			if (!black.has(m)) {
				const c = (m as THREE.MeshPhysicalMaterial).clone();
				c.color.setRGB(0, 0, 0);
				black.set(m, c);
			}
			return black.get(m);
		};
		const restore: [THREE.Mesh, THREE.Material | THREE.Material[]][] = [];
		this.cube.traverse(object => {
			const mesh = object as THREE.Mesh;
			if (mesh.isMesh && !mesh.userData.logo) {
				restore.push([mesh, mesh.material]);
				mesh.material = Array.isArray(mesh.material) ? mesh.material.map(blackOf) : blackOf(mesh.material);
			}
		});
		const background = this.scene.background;
		this.scene.background = new THREE.Color(0, 0, 0);
		const target = new THREE.WebGLRenderTarget(width, height, {encoding: THREE.sRGBEncoding});
		this.renderer.setRenderTarget(target);
		this.renderer.render(this.scene, this.camera);
		const pixels = new Uint8Array(width * height * 4);
		this.renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels);
		this.renderer.setRenderTarget(null);
		this.scene.background = background;
		restore.forEach(([mesh, material]) => mesh.material = material);
		black.forEach(material => material.dispose());
		target.dispose();
		// per sticker over its label quad (pixels top row first: GL rows bottom-up)
		const view = this.sample.views[index];
		return view.stickers.map(st => {
			if (!st.visible)
				return {mean: 0, share: 0};
			const q = st.corners;
			const xs = q.map(p => p[0]), ys = q.map(p => p[1]);
			const x0 = Math.max(0, Math.floor(Math.min(...xs))), x1 = Math.min(width - 1, Math.ceil(Math.max(...xs)));
			const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(height - 1, Math.ceil(Math.max(...ys)));
			let area = 0;
			for (let i = 0; i < 4; ++i)
				area += q[i][0] * q[(i + 1) % 4][1] - q[(i + 1) % 4][0] * q[i][1];
			const sgn = area >= 0 ? 1 : -1;
			let n = 0, sum = 0, high = 0;
			for (let y = y0; y <= y1; ++y) {
				for (let x = x0; x <= x1; ++x) {
					let inside = true;
					for (let i = 0; i < 4 && inside; ++i) {
						const [ax, ay] = q[i], [bx, by] = q[(i + 1) % 4];
						inside = sgn * ((bx - ax) * (y + 0.5 - ay) - (by - ay) * (x + 0.5 - ax)) >= 0;
					}
					if (!inside)
						continue;
					const o = ((height - 1 - y) * width + x) * 4;
					const l = (0.2126 * pixels[o] + 0.7152 * pixels[o + 1] + 0.0722 * pixels[o + 2]) / 255;
					n++;
					sum += l;
					high += l > GLARE_LEVEL ? 1 : 0;
				}
			}
			return n ? {mean: Number((sum / n).toFixed(4)), share: Number((high / n).toFixed(4))} : {mean: 0, share: 0};
		});
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
