
import * as THREE from "three";

import { NORMAL_ORIENTATIONS } from "../inc/cube-algebra.ts";
import { Cube3 } from "../inc/cube3.ts";
import { createCube3Meshes } from "./cubeMesh.js";



const POSITIONS = Array(3 ** 3).fill(null).map((_, i) => [i % 3 - 1, Math.floor(i / 3) % 3 - 1, Math.floor(i / 9) - 1]);

const UNIT_SCALE = 0.92;


const QUATERNIONS = NORMAL_ORIENTATIONS.map(o => o.toQuaternion());



export default class CubeObject {
	constructor ({ materials, twistDuration = 300 }) {
		this.algebra = new Cube3();

		this.twistDuration = twistDuration;

		this.graph = new THREE.Object3D();

		createCube3Meshes(materials).forEach((cube, i) => {
			cube.position.set(...POSITIONS[i]);
			cube.scale.set(UNIT_SCALE, UNIT_SCALE, UNIT_SCALE);

			const proxy = new THREE.Object3D();
			proxy.add(cube);
			this.graph.add(proxy);
		});

		this.updateGraph();
	}


	updateGraph () {
		this.graph.children.forEach((cube, i) => {
			const q = QUATERNIONS[this.algebra.units[i]];
			cube.quaternion.set(...q);
		});
	}


	twist (twist) {
		this.algebra.twist(twist);
		this.updateGraph();
	}
};
