
import * as THREE from "three";

import {Geometry, Face3} from "./threeCompat";



const positions = [
	[-0.5, -0.5, -0.5],
	[-0.5, -0.5, +0.5],
	[-0.5, +0.5, +0.5],
	[-0.5, +0.5, -0.5],

	[+0.5, +0.5, -0.5],
	[+0.5, +0.5, +0.5],
	[+0.5, -0.5, +0.5],
	[+0.5, -0.5, -0.5],

	[+0.5, -0.5, -0.5],
	[+0.5, -0.5, +0.5],
	[-0.5, -0.5, +0.5],
	[-0.5, -0.5, -0.5],

	[-0.5, +0.5, -0.5],
	[-0.5, +0.5, +0.5],
	[+0.5, +0.5, +0.5],
	[+0.5, +0.5, -0.5],

	[+0.5, -0.5, -0.5],
	[-0.5, -0.5, -0.5],
	[-0.5, +0.5, -0.5],
	[+0.5, +0.5, -0.5],

	[+0.5, -0.5, +0.5],
	[+0.5, +0.5, +0.5],
	[-0.5, +0.5, +0.5],
	[-0.5, -0.5, +0.5],
].map(v => new THREE.Vector3(...v));


const uvs = ([
	[0, 0], [1, 0], [1, 1], [0, 1],
	[1, 1], [0, 1], [0, 0], [1, 0],
	[0, 0], [1, 0], [1, 1], [0, 1],
	[0, 0], [1, 0], [1, 1], [0, 1],
	[0, 0], [1, 0], [1, 1], [0, 1],
	[1, 0], [1, 1], [0, 1], [0, 0],
]).map(v => new THREE.Vector2(...v));


const normals = [
	[-1, 0, 0],
	[+1, 0, 0],
	[0, -1, 0],
	[0, +1, 0],
	[0, 0, -1],
	[0, 0, +1],
];



const geometries = Array(3 ** 3).fill().map(() => new Geometry());
geometries.forEach((geometry) => {
	geometry.vertices = positions;
	geometry.faces = [].concat(...Array(6).fill().map((_, i) => ({
		i4: i * 4,
		normal: normals[i],
		materialIndex: 0,
	})).map(data => [
		new Face3(data.i4, data.i4 + 1, data.i4 + 2, data.normal, undefined, data.materialIndex),
		new Face3(data.i4, data.i4 + 2, data.i4 + 3, data.normal, undefined, data.materialIndex),
	]));

	geometry.faceVertexUvs = [
		geometry.faces.map(({a, b, c}) => [uvs[a], uvs[b], uvs[c]]),
	];
});


const NULL_MATERIAL = new THREE.MeshBasicMaterial( {color: 0} );


export function createCube3Meshes (materials) {
	console.assert(materials.length === 26, "invalid materials:", materials);

	return geometries.map((geometry, i) => {
		const material = i === 13 ? NULL_MATERIAL : (i > 13 ? materials[i - 1] : materials[i]);

		return new THREE.Mesh(geometry.toBufferGeometry(), material);
	});
};


export const needTranslation = true;
