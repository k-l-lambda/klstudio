
import * as THREE from "three";

import {NORMAL_ORIENTATIONS} from "../inc/cube-algebra";
import {Cube3, twistToAxisRotation, axisTimesToTwist} from "../inc/cube3";
import * as cubeMesh from "./cubeMesh.js";
import * as cubeMesh26 from "./cubeMesh26.js";
import * as sphericalCubeMesh from "./sphericalCubeMesh";
import {animationDelay} from "./delay.js";



type vector3 = [number, number, number];


const CUBE3 = 3 ** 3;

const POSITIONS : vector3[] = Array(CUBE3).fill(null).map((_, i) => [i % 3 - 1, Math.floor(i / 3) % 3 - 1, Math.floor(i / 9) - 1]);

const UNIT_SCALE = 0.92;

const RIGHT_ANGLE = Math.PI / 2;
const GRAPH_RELEASE_SPEED = Math.PI / 60;


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
	cube26: cubeMesh26,
	spherical: sphericalCubeMesh,
};



export default class CubeObject {
	algebra: Cube3;
	graph: THREE.Object3D;
	cubeMeshes: THREE.Mesh[];
	animation: Promise<void>;
	twistDuration: number;
	onChange: (algebra: Cube3) => void;
	startQuaternions?: THREE.Quaternion[];
	graphTwist: {axis: number, angle: number};


	constructor ({materials, twistDuration = 300, onChange = null, meshSchema = "cube"}) {
		this.algebra = new Cube3();

		this.twistDuration = twistDuration;
		this.onChange = onChange;

		this.graph = new THREE.Object3D();

		this.cubeMeshes = MeshFactory[meshSchema].createCube3Meshes(materials);

		this.cubeMeshes.forEach((cube, i) => {
			if (MeshFactory[meshSchema].needTranslation) {
				cube.position.set(...POSITIONS[i]);
				cube.scale.set(UNIT_SCALE, UNIT_SCALE, UNIT_SCALE);
			}

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


	twistGraph (axis: number, angle: number, {record = true} = {}) {
		const rot = new THREE.Quaternion().setFromAxisAngle(AXES[axis], angle * (axis % 2 ? 1 : -1));

		const movingIndices = this.algebra.faceIndicesFromAxis(axis);
		movingIndices.forEach(index => {
			const origin = new THREE.Quaternion(...QUATERNIONS[this.algebra.units[index]]);
			this.graph.children[index].quaternion.fromArray(origin.premultiply(rot).toArray());
		});

		if (record)
			this.graphTwist = {axis, angle};
	}


	releaseGraph () {
		if (this.graphTwist) {
			const times = Math.round(this.graphTwist.angle / RIGHT_ANGLE);
			const twist = axisTimesToTwist(this.graphTwist.axis, times * (this.graphTwist.axis % 2 ? 1 : -1));
			const endAngle = times * RIGHT_ANGLE;
			const direction = endAngle > this.graphTwist.angle ? 1 : -1;

			this.animation = this.animation.then(async () => {
				if (twist >= 0)
					this.algebra.twist(twist);

				let angle = this.graphTwist.angle;
				while ((endAngle - angle) * direction > 0) {
					angle += Math.min(GRAPH_RELEASE_SPEED, Math.abs(endAngle - angle)) * direction;
					this.twistGraph(this.graphTwist.axis, angle - times * RIGHT_ANGLE, {record: false});

					await animationDelay();
				}

				this.updateGraph();
			});
		}
	}
};
