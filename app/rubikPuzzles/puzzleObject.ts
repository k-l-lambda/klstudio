// Three.js scene object for one puzzle: piece meshes driven by a PuzzleState, animated layer twists and free
// (dragged) layer rotation that snaps to the nearest quarter turn on release.
import * as THREE from "three";

import {PuzzleKind, PuzzleState, Piece, Twist, normalizeTurns} from "./puzzle";
import {createPieceMeshes, PieceMesh} from "./meshes";
import {animationDelay} from "../delay.js";



const QUARTER = Math.PI / 2;
const AXES = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)];


const matrixQuaternion = (m: number[]): THREE.Quaternion => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().set(
	m[0], m[1], m[2], 0,
	m[3], m[4], m[5], 0,
	m[6], m[7], m[8], 0,
	0, 0, 0, 1,
));

const smoothStep = (t: number): number => 3 * t ** 2 - 2 * t ** 3;


export default class PuzzleObject {
	kind: PuzzleKind;
	state: PuzzleState;
	graph: THREE.Object3D;
	meshes: PieceMesh[];
	twistDuration: number;
	animation: Promise<void>;
	free: {axis: number; layers: number[]; angle: number; pieces: Piece[]} = null;


	constructor (kind: PuzzleKind, {twistDuration = 220} = {}) {
		this.kind = kind;
		this.state = new PuzzleState(kind);
		this.twistDuration = twistDuration;

		this.graph = new THREE.Object3D();
		this.meshes = createPieceMeshes(kind, this.state.pieces);
		this.meshes.forEach(mesh => this.graph.add(mesh));

		this.animation = Promise.resolve();
		this.updateGraph();
	}


	dispose (): void {
		this.meshes.forEach(mesh => {
			mesh.geometry.dispose();
			mesh.material.dispose();
		});
	}


	pieceOfMesh (object: THREE.Object3D): Piece {
		const index = this.meshes.indexOf(object as PieceMesh);
		return index >= 0 ? this.state.pieces[index] : null;
	}


	updateGraph (): void {
		this.state.pieces.forEach((piece, i) => this.meshes[i].quaternion.copy(matrixQuaternion(piece.matrix)));
	}


	setLayerAngle (pieces: Piece[], axis: number, angle: number): void {
		const rotation = new THREE.Quaternion().setFromAxisAngle(AXES[axis], angle);
		pieces.forEach(piece => {
			const mesh = this.meshes[this.state.pieces.indexOf(piece)];
			mesh.quaternion.copy(matrixQuaternion(piece.matrix)).premultiply(rotation);
		});
	}


	highlight (pieces: Piece[]): void {
		this.state.pieces.forEach((piece, i) => this.meshes[i].material.uniforms.highlighted.value = pieces.includes(piece) ? 0.35 : 0);
	}


	async animateLayer (pieces: Piece[], axis: number, from: number, to: number): Promise<void> {
		const duration = this.twistDuration * Math.min(2, Math.abs(to - from) / QUARTER);
		const start = performance.now();
		for (let now = start; now < start + duration; now = performance.now()) {
			this.setLayerAngle(pieces, axis, from + (to - from) * smoothStep((now - start) / duration));
			await animationDelay();
		}
	}


	// Queue an animated twist; resolves when it has been applied.
	twist (twist: Twist, {useAnimation = true} = {}): Promise<void> {
		if (!useAnimation) {
			this.state.twist(twist);
			this.updateGraph();

			return this.animation;
		}

		this.animation = this.animation.then(async () => {
			const pieces = this.state.piecesInTwist(twist);
			await this.animateLayer(pieces, twist.axis, 0, normalizeTurns(twist.turns) * QUARTER);
			this.state.twist(twist);
			this.updateGraph();
		});

		return this.animation;
	}


	beginFree (axis: number, layers: number[]): void {
		const pieces = this.state.piecesInTwist({axis, layers, turns: 0});
		this.free = {axis, layers, angle: 0, pieces};
		this.highlight(pieces);
	}


	moveFree (angle: number): void {
		if (this.free) {
			this.free.angle = angle;
			this.setLayerAngle(this.free.pieces, this.free.axis, angle);
		}
	}


	// Snap the dragged layer to the nearest quarter turn; resolves to the twist made, or null.
	releaseFree (): Promise<Twist> {
		const free = this.free;
		this.free = null;
		this.highlight([]);
		if (!free)
			return Promise.resolve(null);

		const turns = Math.round(free.angle / QUARTER);
		const twist = normalizeTurns(turns) ? {axis: free.axis, layers: free.layers, turns: normalizeTurns(turns)} : null;

		const result = this.animation.then(async () => {
			await this.animateLayer(free.pieces, free.axis, free.angle, turns * QUARTER);
			if (twist)
				this.state.twist(twist);
			this.updateGraph();

			return twist;
		});
		this.animation = result.then(() => undefined);

		return result;
	}
}
