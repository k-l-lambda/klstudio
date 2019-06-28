
import * as THREE from "three";

import { Cube3 } from "../inc/cube3.ts";
import { createCube3Meshes } from "./cubeMesh.js";



const POSITIONS = Array(3 ** 3).fill(null).map((_, i) => [i % 3 - 1, Math.floor(i / 3) % 3 - 1, Math.floor(i / 9) - 1]);



export default class CubeObject {
	constructor ({ materials }) {
		this.algebra = new Cube3();

		this.graph = new THREE.Object3D();
		this.graph.add(...createCube3Meshes(materials));

		this.graph.children.forEach((cube, i) => cube.scale.set(0.9, 0.9, 0.9));

		this.updateGraph();
	}


	updateGraph () {
		this.graph.children.forEach((cube, i) => cube.position.set(...POSITIONS[i]));
	}
};
