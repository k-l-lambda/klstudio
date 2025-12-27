
/**
 * Cube Tetris - Three.js Renderer
 */

import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";

import type {GameConfig, Point3D} from "./types";
import {CubeGrid} from "./CubeGrid";
import {TetrisPiece} from "./TetrisPiece";
import {GAME_CONFIG} from "./constants";


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

	private blockGeometry: THREE.BoxGeometry;
	private ghostMaterial: THREE.MeshStandardMaterial;

	private animationFrameId: number | null = null;
	private isDisposed: boolean = false;


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
		const boardCenter = {
			x: this.config.boardWidth / 2,
			y: this.config.boardHeight / 3,
			z: this.config.boardDepth / 2,
		};
		this.camera.position.set(
			boardCenter.x + 8,
			boardCenter.y + 6,
			boardCenter.z + 8
		);
		this.camera.lookAt(boardCenter.x, boardCenter.y, boardCenter.z);

		// Setup controls
		this.controls = new OrbitControls(this.camera, canvas);
		this.controls.target.set(boardCenter.x, boardCenter.y, boardCenter.z);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.05;
		this.controls.minDistance = 5;
		this.controls.maxDistance = 30;
		this.controls.maxPolarAngle = Math.PI * 0.9;
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

		// Shared geometry and materials
		this.blockGeometry = new THREE.BoxGeometry(0.95, 0.95, 0.95);
		this.ghostMaterial = new THREE.MeshStandardMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 0.2,
			wireframe: false,
		});

		// Setup scene
		this.setupLighting();
		this.setupBoundary();
		this.setupFloor();

		// Background
		this.scene.background = new THREE.Color(0x111122);
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

		// Create wireframe box for boundary
		const boundaryGeometry = new THREE.BoxGeometry(boardWidth, boardHeight, boardDepth);
		const edges = new THREE.EdgesGeometry(boundaryGeometry);
		const lineMaterial = new THREE.LineBasicMaterial({
			color: 0x444466,
			transparent: true,
			opacity: 0.5,
		});
		const boundaryLines = new THREE.LineSegments(edges, lineMaterial);
		boundaryLines.position.set(boardWidth / 2 - 0.5, boardHeight / 2 - 0.5, boardDepth / 2 - 0.5);
		this.boundaryGroup.add(boundaryLines);

		// Corner posts
		const postGeometry = new THREE.CylinderGeometry(0.05, 0.05, boardHeight, 8);
		const postMaterial = new THREE.MeshStandardMaterial({color: 0x666688});

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
}
