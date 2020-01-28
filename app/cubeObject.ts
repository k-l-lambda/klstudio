
import * as THREE from "three";

import {NORMAL_ORIENTATIONS} from "../inc/cube-algebra";
import {Cube3, twistToAxisRotation} from "../inc/cube3";
import * as cubeMesh from "./cubeMesh.js";
import * as sphericalCubeMesh from "./sphericalCubeMesh";
import {animationDelay} from "./delay.js";



const POSITIONS = Array(3 ** 3).fill(null).map((_, i) => [i % 3 - 1, Math.floor(i / 3) % 3 - 1, Math.floor(i / 9) - 1]);

const UNIT_SCALE = 0.92;


const QUATERNIONS = NORMAL_ORIENTATIONS.map(o => o.toQuaternion());

const AXES = [
	new THREE.Vector3(-1, 0, 0),
	new THREE.Vector3(-1, 0, 0),
	new THREE.Vector3(0, -1, 0),
	new THREE.Vector3(0, -1, 0),
	new THREE.Vector3(0, 0, -1),
	new THREE.Vector3(0, 0, -1),
];


const MeshFactory = {
	cube: cubeMesh,
	spherical: sphericalCubeMesh,
};



export default class CubeObject {
	algebra: Cube3;
	graph: THREE.Object3D;
	animation: Promise<void>;
	twistDuration: number;
	onChange: (algebra: Cube3) => void;


	constructor ({materials, twistDuration = 300, onChange = null, meshSchema = "cube"}) {
		this.algebra = new Cube3();

		this.twistDuration = twistDuration;
		this.onChange = onChange;

		this.graph = new THREE.Object3D();

		MeshFactory[meshSchema].createCube3Meshes(materials).forEach((cube, i) => {
			if (MeshFactory[meshSchema].needTranslation)
				cube.position.set(...POSITIONS[i]);
			cube.scale.set(UNIT_SCALE, UNIT_SCALE, UNIT_SCALE);

			const proxy = new THREE.Object3D();
			proxy.add(cube);
			this.graph.add(proxy);
		});

		this.updateGraph();

		this.animation = Promise.resolve();
	}


	updateGraph () {
		this.graph.children.forEach((cube, i) => {
			const q = QUATERNIONS[this.algebra.units[i]];
			if (q)
				cube.quaternion.set(...q);
		});

		if (this.onChange)
			this.onChange(this.algebra);
	}


	reset () {
		this.algebra.reset();
		this.updateGraph();
	}


	setState (code) {
		this.algebra.decode(code);
		console.assert(this.algebra.validate(), "invalid cube state:", code);

		this.updateGraph();
	}


	twist (twist, {useAnimation = true} = {}) {
		if (!useAnimation) {
			this.algebra.twist(twist);
			this.updateGraph();

			return;
		}

		this.animation = this.animation.then(async () => {
			this.algebra.twist(twist);

			const endTime = Date.now() + this.twistDuration;

			const {axis, rotation} = twistToAxisRotation(twist);
			const movingIndices = this.algebra.faceIndicesFromAxis(axis);
			const span = [Math.PI * -0.5, Math.PI * 0.5, Math.PI][Math.floor((rotation - 1) / 3)];
			const rot = new THREE.Quaternion().setFromAxisAngle(AXES[axis], span);

			let now = Date.now();
			while (now < endTime) {
				const progress = 1 - (endTime - now) / this.twistDuration;
				const smooth = 3 * progress ** 2 - 2 * progress ** 3;

				movingIndices.forEach(index => {
					const end = new THREE.Quaternion(...QUATERNIONS[this.algebra.units[index]]);
					const start = end.clone();
					start.premultiply(rot);

					THREE.Quaternion.slerp(start, end, this.graph.children[index].quaternion, smooth);
				});

				await animationDelay();
				now = Date.now();
			}

			this.updateGraph();

			await animationDelay();
		});

		return this.animation;
	}
};
