
/**
 * Cube Tetris - Three.js Renderer
 * Based on original CubeTetris visual style
 */

import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";

import type {GameConfig, Point3D} from "./types";
import {CubeGrid} from "./CubeGrid";
import {TetrisPiece} from "./TetrisPiece";
import {GAME_CONFIG, PIECE_DEFINITIONS, coordKey} from "./constants";


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


/**
 * Create unified piece geometry for a set of blocks.
 * Internal faces between adjacent cubes are removed.
 * Beveled edges only appear on exterior surfaces.
 * Matches original CubeTetris mesh geometry (cube0.mesh.xml)
 */
function createUnifiedPieceGeometry(blocks: Point3D[], cubeSize: number = 1.003): THREE.BufferGeometry {
	const s = cubeSize / 2;        // half size (≈0.5015)
	const inner = s * 0.82;        // inner flat area (≈0.411)
	const outer = s * 0.91;        // bevel edge (≈0.456)

	const vertices: number[] = [];
	const normals: number[] = [];
	const indices: number[] = [];

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

	// Helper to add a quad face
	const addFace = (v0: number[], v1: number[], v2: number[], v3: number[], normal: number[]) => {
		const baseIdx = vertices.length / 3;
		vertices.push(...v0, ...v1, ...v2, ...v3);
		normals.push(...normal, ...normal, ...normal, ...normal);
		indices.push(baseIdx, baseIdx + 1, baseIdx + 2, baseIdx, baseIdx + 2, baseIdx + 3);
	};

	// Process each block
	for (const block of blocks) {
		const ox = block.x;  // offset x
		const oy = block.y;  // offset y
		const oz = block.z;  // offset z

		// Determine which faces are exterior
		const exterior: Record<FaceDir, boolean> = {
			"+x": !hasNeighbor(block, "+x"),
			"-x": !hasNeighbor(block, "-x"),
			"+y": !hasNeighbor(block, "+y"),
			"-y": !hasNeighbor(block, "-y"),
			"+z": !hasNeighbor(block, "+z"),
			"-z": !hasNeighbor(block, "-z"),
		};

		// +Y face (top)
		if (exterior["+y"]) {
			// Inner flat area (CCW when viewed from above)
			addFace(
				[ox - inner, oy + s, oz + inner], [ox + inner, oy + s, oz + inner],
				[ox + inner, oy + s, oz - inner], [ox - inner, oy + s, oz - inner],
				[0, 1, 0]
			);
			// Beveled edges - only if edge is exterior
			if (exterior["-x"]) {
				addFace(
					[ox - inner, oy + s, oz + inner], [ox - inner, oy + s, oz - inner],
					[ox - outer, oy + outer, oz - outer], [ox - outer, oy + outer, oz + outer],
					[-0.716, 0.698, 0]
				);
			}
			if (exterior["+x"]) {
				addFace(
					[ox + inner, oy + s, oz - inner], [ox + inner, oy + s, oz + inner],
					[ox + outer, oy + outer, oz + outer], [ox + outer, oy + outer, oz - outer],
					[0.716, 0.698, 0]
				);
			}
			if (exterior["+z"]) {
				addFace(
					[ox + inner, oy + s, oz + inner], [ox - inner, oy + s, oz + inner],
					[ox - outer, oy + outer, oz + outer], [ox + outer, oy + outer, oz + outer],
					[0, 0.698, 0.716]
				);
			}
			if (exterior["-z"]) {
				addFace(
					[ox - inner, oy + s, oz - inner], [ox + inner, oy + s, oz - inner],
					[ox + outer, oy + outer, oz - outer], [ox - outer, oy + outer, oz - outer],
					[0, 0.698, -0.716]
				);
			}
		}

		// -Y face (bottom)
		if (exterior["-y"]) {
			// Inner flat area (CCW when viewed from below)
			addFace(
				[ox - inner, oy - s, oz - inner], [ox + inner, oy - s, oz - inner],
				[ox + inner, oy - s, oz + inner], [ox - inner, oy - s, oz + inner],
				[0, -1, 0]
			);
			// Beveled edges
			if (exterior["-x"]) {
				addFace(
					[ox - inner, oy - s, oz - inner], [ox - inner, oy - s, oz + inner],
					[ox - outer, oy - outer, oz + outer], [ox - outer, oy - outer, oz - outer],
					[-0.716, -0.698, 0]
				);
			}
			if (exterior["+x"]) {
				addFace(
					[ox + inner, oy - s, oz + inner], [ox + inner, oy - s, oz - inner],
					[ox + outer, oy - outer, oz - outer], [ox + outer, oy - outer, oz + outer],
					[0.716, -0.698, 0]
				);
			}
			if (exterior["+z"]) {
				addFace(
					[ox - inner, oy - s, oz + inner], [ox + inner, oy - s, oz + inner],
					[ox + outer, oy - outer, oz + outer], [ox - outer, oy - outer, oz + outer],
					[0, -0.698, 0.716]
				);
			}
			if (exterior["-z"]) {
				addFace(
					[ox + inner, oy - s, oz - inner], [ox - inner, oy - s, oz - inner],
					[ox - outer, oy - outer, oz - outer], [ox + outer, oy - outer, oz - outer],
					[0, -0.698, -0.716]
				);
			}
		}

		// +Z face (front)
		if (exterior["+z"]) {
			// Inner flat area
			addFace(
				[ox - inner, oy - inner, oz + s], [ox + inner, oy - inner, oz + s],
				[ox + inner, oy + inner, oz + s], [ox - inner, oy + inner, oz + s],
				[0, 0, 1]
			);
			// Beveled edges - all 4 sides
			if (exterior["-x"]) {
				addFace(
					[ox - inner, oy - inner, oz + s], [ox - inner, oy + inner, oz + s],
					[ox - outer, oy + outer, oz + outer], [ox - outer, oy - outer, oz + outer],
					[-0.716, 0, 0.698]
				);
			}
			if (exterior["+x"]) {
				addFace(
					[ox + inner, oy + inner, oz + s], [ox + inner, oy - inner, oz + s],
					[ox + outer, oy - outer, oz + outer], [ox + outer, oy + outer, oz + outer],
					[0.716, 0, 0.698]
				);
			}
			if (exterior["+y"]) {
				addFace(
					[ox - inner, oy + inner, oz + s], [ox + inner, oy + inner, oz + s],
					[ox + outer, oy + outer, oz + outer], [ox - outer, oy + outer, oz + outer],
					[0, 0.716, 0.698]
				);
			}
			if (exterior["-y"]) {
				addFace(
					[ox + inner, oy - inner, oz + s], [ox - inner, oy - inner, oz + s],
					[ox - outer, oy - outer, oz + outer], [ox + outer, oy - outer, oz + outer],
					[0, -0.716, 0.698]
				);
			}
		}

		// -Z face (back)
		if (exterior["-z"]) {
			// Inner flat area
			addFace(
				[ox + inner, oy - inner, oz - s], [ox - inner, oy - inner, oz - s],
				[ox - inner, oy + inner, oz - s], [ox + inner, oy + inner, oz - s],
				[0, 0, -1]
			);
			// Beveled edges - all 4 sides
			if (exterior["+x"]) {
				addFace(
					[ox + inner, oy - inner, oz - s], [ox + inner, oy + inner, oz - s],
					[ox + outer, oy + outer, oz - outer], [ox + outer, oy - outer, oz - outer],
					[0.716, 0, -0.698]
				);
			}
			if (exterior["-x"]) {
				addFace(
					[ox - inner, oy + inner, oz - s], [ox - inner, oy - inner, oz - s],
					[ox - outer, oy - outer, oz - outer], [ox - outer, oy + outer, oz - outer],
					[-0.716, 0, -0.698]
				);
			}
			if (exterior["+y"]) {
				addFace(
					[ox + inner, oy + inner, oz - s], [ox - inner, oy + inner, oz - s],
					[ox - outer, oy + outer, oz - outer], [ox + outer, oy + outer, oz - outer],
					[0, 0.716, -0.698]
				);
			}
			if (exterior["-y"]) {
				addFace(
					[ox - inner, oy - inner, oz - s], [ox + inner, oy - inner, oz - s],
					[ox + outer, oy - outer, oz - outer], [ox - outer, oy - outer, oz - outer],
					[0, -0.716, -0.698]
				);
			}
		}

		// +X face (right)
		if (exterior["+x"]) {
			// Inner flat area
			addFace(
				[ox + s, oy - inner, oz + inner], [ox + s, oy - inner, oz - inner],
				[ox + s, oy + inner, oz - inner], [ox + s, oy + inner, oz + inner],
				[1, 0, 0]
			);
			// Beveled edges - all 4 sides
			if (exterior["+y"]) {
				addFace(
					[ox + s, oy + inner, oz + inner], [ox + s, oy + inner, oz - inner],
					[ox + outer, oy + outer, oz - outer], [ox + outer, oy + outer, oz + outer],
					[0.698, 0.716, 0]
				);
			}
			if (exterior["-y"]) {
				addFace(
					[ox + s, oy - inner, oz - inner], [ox + s, oy - inner, oz + inner],
					[ox + outer, oy - outer, oz + outer], [ox + outer, oy - outer, oz - outer],
					[0.698, -0.716, 0]
				);
			}
			if (exterior["+z"]) {
				addFace(
					[ox + s, oy - inner, oz + inner], [ox + s, oy + inner, oz + inner],
					[ox + outer, oy + outer, oz + outer], [ox + outer, oy - outer, oz + outer],
					[0.698, 0, 0.716]
				);
			}
			if (exterior["-z"]) {
				addFace(
					[ox + s, oy + inner, oz - inner], [ox + s, oy - inner, oz - inner],
					[ox + outer, oy - outer, oz - outer], [ox + outer, oy + outer, oz - outer],
					[0.698, 0, -0.716]
				);
			}
		}

		// -X face (left)
		if (exterior["-x"]) {
			// Inner flat area
			addFace(
				[ox - s, oy - inner, oz - inner], [ox - s, oy - inner, oz + inner],
				[ox - s, oy + inner, oz + inner], [ox - s, oy + inner, oz - inner],
				[-1, 0, 0]
			);
			// Beveled edges - all 4 sides
			if (exterior["+y"]) {
				addFace(
					[ox - s, oy + inner, oz - inner], [ox - s, oy + inner, oz + inner],
					[ox - outer, oy + outer, oz + outer], [ox - outer, oy + outer, oz - outer],
					[-0.698, 0.716, 0]
				);
			}
			if (exterior["-y"]) {
				addFace(
					[ox - s, oy - inner, oz + inner], [ox - s, oy - inner, oz - inner],
					[ox - outer, oy - outer, oz - outer], [ox - outer, oy - outer, oz + outer],
					[-0.698, -0.716, 0]
				);
			}
			if (exterior["+z"]) {
				addFace(
					[ox - s, oy + inner, oz + inner], [ox - s, oy - inner, oz + inner],
					[ox - outer, oy - outer, oz + outer], [ox - outer, oy + outer, oz + outer],
					[-0.698, 0, 0.716]
				);
			}
			if (exterior["-z"]) {
				addFace(
					[ox - s, oy - inner, oz - inner], [ox - s, oy + inner, oz - inner],
					[ox - outer, oy + outer, oz - outer], [ox - outer, oy - outer, oz - outer],
					[-0.698, 0, -0.716]
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


/**
 * Create beveled cube geometry for a single cube (used for board blocks)
 */
function createBeveledCubeGeometry(size: number = 1.003): THREE.BufferGeometry {
	// Use unified piece geometry with a single block
	return createUnifiedPieceGeometry([{x: 0, y: 0, z: 0}], size);
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
	 * Update current piece visualization using unified piece mesh
	 */
	updatePiece(piece: TetrisPiece | null): void {
		// Clear existing piece meshes
		while (this.pieceGroup.children.length > 0) {
			const child = this.pieceGroup.children[0];
			this.pieceGroup.remove(child);
			if (child instanceof THREE.Mesh) {
				child.geometry?.dispose();
				(child.material as THREE.Material).dispose();
			}
		}

		if (!piece) return;

		// Get the piece's local blocks (relative positions)
		const localBlocks = piece.getLocalBlocks();
		const blocks = piece.getWorldBlocks();
		if (blocks.length === 0) return;

		// Create unified geometry for the piece's local shape
		const geometry = createUnifiedPieceGeometry(localBlocks);

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

		// Position at piece position
		mesh.position.set(piece.position.x, piece.position.y, piece.position.z);

		this.pieceGroup.add(mesh);
	}


	/**
	 * Update ghost piece visualization (drop preview) using unified mesh
	 */
	updateGhost(piece: TetrisPiece | null, ghostPosition: Point3D | null): void {
		// Clear existing ghost meshes
		while (this.ghostGroup.children.length > 0) {
			const child = this.ghostGroup.children[0];
			this.ghostGroup.remove(child);
			if (child instanceof THREE.Mesh) {
				child.geometry?.dispose();
			}
		}

		if (!piece || !ghostPosition) return;

		// Get the piece's local blocks (relative positions)
		const localBlocks = piece.getLocalBlocks();
		if (localBlocks.length === 0) return;

		// Create unified geometry for the ghost piece
		const geometry = createUnifiedPieceGeometry(localBlocks);

		// Create single mesh for the ghost
		const mesh = new THREE.Mesh(geometry, this.ghostMaterial);
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
	 * @param blocks Array of block positions to animate
	 * @param color Color of the blocks being cleared
	 */
	startClearingAnimation(blocks: Array<{point: Point3D; color: string}>): void {
		for (const {point, color} of blocks) {
			const key = coordKey(point.x, point.y, point.z);

			// Skip if already animating this block
			if (this.clearingBlocks.has(key)) {
				continue;
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
			const mesh = new THREE.Mesh(this.blockGeometry, material);
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
