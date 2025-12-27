
/**
 * Cube Tetris - Three.js Renderer
 * Based on original CubeTetris visual style
 */

import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";

import type {GameConfig, Point3D} from "./types";
import {CubeGrid} from "./CubeGrid";
import {TetrisPiece} from "./TetrisPiece";
import {GAME_CONFIG} from "./constants";


/**
 * Create beveled cube geometry similar to original game
 * The original cube0.mesh has beveled edges at ~0.455892 with inner flat face
 */
function createBeveledCubeGeometry(size: number = 0.95, bevel: number = 0.08): THREE.BufferGeometry {
	const s = size / 2;      // half size
	const b = bevel;          // bevel amount
	const inner = s - b;      // inner flat area

	const vertices: number[] = [];
	const normals: number[] = [];
	const indices: number[] = [];

	// Helper to add a face
	const addFace = (v0: number[], v1: number[], v2: number[], v3: number[], normal: number[]) => {
		const baseIdx = vertices.length / 3;
		vertices.push(...v0, ...v1, ...v2, ...v3);
		normals.push(...normal, ...normal, ...normal, ...normal);
		indices.push(baseIdx, baseIdx + 1, baseIdx + 2, baseIdx, baseIdx + 2, baseIdx + 3);
	};

	// Helper to add a beveled edge quad
	const addBevelQuad = (v0: number[], v1: number[], v2: number[], v3: number[], n: number[]) => {
		addFace(v0, v1, v2, v3, n);
	};

	// Top face (+Y) - inner flat area
	addFace(
		[-inner, s, -inner], [inner, s, -inner], [inner, s, inner], [-inner, s, inner],
		[0, 1, 0]
	);
	// Top face bevels
	addBevelQuad([-inner, s, -inner], [-s, s - b, -s], [-s, s - b, s], [-inner, s, inner], [-0.707, 0.707, 0]);
	addBevelQuad([inner, s, inner], [s, s - b, s], [s, s - b, -s], [inner, s, -inner], [0.707, 0.707, 0]);
	addBevelQuad([-inner, s, inner], [inner, s, inner], [s, s - b, s], [-s, s - b, s], [0, 0.707, 0.707]);
	addBevelQuad([inner, s, -inner], [-inner, s, -inner], [-s, s - b, -s], [s, s - b, -s], [0, 0.707, -0.707]);

	// Bottom face (-Y) - inner flat area
	addFace(
		[-inner, -s, inner], [inner, -s, inner], [inner, -s, -inner], [-inner, -s, -inner],
		[0, -1, 0]
	);
	// Bottom face bevels
	addBevelQuad([-inner, -s, inner], [-s, -s + b, s], [-s, -s + b, -s], [-inner, -s, -inner], [-0.707, -0.707, 0]);
	addBevelQuad([inner, -s, -inner], [s, -s + b, -s], [s, -s + b, s], [inner, -s, inner], [0.707, -0.707, 0]);
	addBevelQuad([inner, -s, inner], [s, -s + b, s], [-s, -s + b, s], [-inner, -s, inner], [0, -0.707, 0.707]);
	addBevelQuad([-inner, -s, -inner], [-s, -s + b, -s], [s, -s + b, -s], [inner, -s, -inner], [0, -0.707, -0.707]);

	// Front face (+Z) - inner flat area
	addFace(
		[-inner, -inner, s], [inner, -inner, s], [inner, inner, s], [-inner, inner, s],
		[0, 0, 1]
	);
	// Front face side bevels
	addBevelQuad([-inner, -inner, s], [-s, -s + b, s], [-s, s - b, s], [-inner, inner, s], [-0.707, 0, 0.707]);
	addBevelQuad([inner, inner, s], [s, s - b, s], [s, -s + b, s], [inner, -inner, s], [0.707, 0, 0.707]);

	// Back face (-Z) - inner flat area
	addFace(
		[inner, -inner, -s], [-inner, -inner, -s], [-inner, inner, -s], [inner, inner, -s],
		[0, 0, -1]
	);
	// Back face side bevels
	addBevelQuad([inner, -inner, -s], [s, -s + b, -s], [s, s - b, -s], [inner, inner, -s], [0.707, 0, -0.707]);
	addBevelQuad([-inner, inner, -s], [-s, s - b, -s], [-s, -s + b, -s], [-inner, -inner, -s], [-0.707, 0, -0.707]);

	// Right face (+X) - inner flat area
	addFace(
		[s, -inner, inner], [s, -inner, -inner], [s, inner, -inner], [s, inner, inner],
		[1, 0, 0]
	);

	// Left face (-X) - inner flat area
	addFace(
		[-s, -inner, -inner], [-s, -inner, inner], [-s, inner, inner], [-s, inner, -inner],
		[-1, 0, 0]
	);

	// Create corner bevels (8 corners)
	const addCornerBevel = (sx: number, sy: number, sz: number) => {
		const x = sx * s, y = sy * s, z = sz * s;
		const ix = sx * inner, iy = sy * inner, iz = sz * inner;
		const bx = sx * (s - b), by = sy * (s - b), bz = sz * (s - b);
		// Small triangular corner bevel
		const n = [sx * 0.577, sy * 0.577, sz * 0.577];
		const baseIdx = vertices.length / 3;
		vertices.push(bx, y, bz);
		vertices.push(x, by, bz);
		vertices.push(bx, by, z);
		normals.push(...n, ...n, ...n);
		indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
	};
	addCornerBevel(1, 1, 1);
	addCornerBevel(-1, 1, 1);
	addCornerBevel(1, -1, 1);
	addCornerBevel(-1, -1, 1);
	addCornerBevel(1, 1, -1);
	addCornerBevel(-1, 1, -1);
	addCornerBevel(1, -1, -1);
	addCornerBevel(-1, -1, -1);

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
	geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
	geometry.setIndex(indices);

	return geometry;
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

	private animationFrameId: number | null = null;
	private isDisposed: boolean = false;

	// Auto-rotate camera for demo mode
	private autoRotate: boolean = false;
	private autoRotateSpeed: number = 0.3;
	private autoRotateAngle: number = 0;
	private boardCenter: THREE.Vector3;


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
		this.blockGeometry = createBeveledCubeGeometry(0.95, 0.06);
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
	 * Create a block mesh with given color
	 */
	private createBlockMesh(color: string): THREE.Mesh {
		const material = new THREE.MeshStandardMaterial({
			color: new THREE.Color(color),
			metalness: 0.3,
			roughness: 0.4,
		});
		const mesh = new THREE.Mesh(this.blockGeometry, material);
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

		// Add blocks from board
		for (const {point, data} of board.toPointList()) {
			const mesh = this.createBlockMesh(data.color);
			mesh.position.set(point.x, point.y, point.z);
			this.boardGroup.add(mesh);
		}
	}


	/**
	 * Update current piece visualization
	 */
	updatePiece(piece: TetrisPiece | null): void {
		// Clear existing piece meshes
		while (this.pieceGroup.children.length > 0) {
			const child = this.pieceGroup.children[0];
			this.pieceGroup.remove(child);
			if (child instanceof THREE.Mesh) {
				(child.material as THREE.Material).dispose();
			}
		}

		if (!piece) return;

		// Add blocks from piece
		for (const {point, data} of piece.getWorldBlocks()) {
			const mesh = this.createBlockMesh(data.color);
			mesh.position.set(point.x, point.y, point.z);
			this.pieceGroup.add(mesh);
		}
	}


	/**
	 * Update ghost piece visualization (drop preview)
	 */
	updateGhost(piece: TetrisPiece | null, ghostPosition: Point3D | null): void {
		// Clear existing ghost meshes
		while (this.ghostGroup.children.length > 0) {
			const child = this.ghostGroup.children[0];
			this.ghostGroup.remove(child);
		}

		if (!piece || !ghostPosition) return;

		// Create ghost piece at drop position
		const ghostPiece = piece.clone();
		ghostPiece.position = ghostPosition;

		for (const {point} of ghostPiece.getWorldBlocks()) {
			const mesh = new THREE.Mesh(this.blockGeometry, this.ghostMaterial);
			mesh.position.set(point.x, point.y, point.z);
			this.ghostGroup.add(mesh);
		}
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
	render(): void {
		if (this.isDisposed) return;

		// Auto-rotate camera if enabled
		if (this.autoRotate) {
			this.autoRotateAngle += this.autoRotateSpeed * 0.01;
			const radius = 12;
			const height = this.boardCenter.y + 5;
			this.camera.position.x = this.boardCenter.x + Math.cos(this.autoRotateAngle) * radius;
			this.camera.position.z = this.boardCenter.z + Math.sin(this.autoRotateAngle) * radius;
			this.camera.position.y = height;
			this.camera.lookAt(this.boardCenter);
			this.controls.target.copy(this.boardCenter);
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
			this.render();
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

		// Dispose all meshes in groups
		const disposeGroup = (group: THREE.Group) => {
			group.traverse((child) => {
				if (child instanceof THREE.Mesh) {
					child.geometry?.dispose();
					if (child.material instanceof THREE.Material) {
						child.material.dispose();
					} else if (Array.isArray(child.material)) {
						child.material.forEach(m => m.dispose());
					}
				}
			});
			group.clear();
		};

		disposeGroup(this.boardGroup);
		disposeGroup(this.pieceGroup);
		disposeGroup(this.ghostGroup);
		disposeGroup(this.boundaryGroup);

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
}
