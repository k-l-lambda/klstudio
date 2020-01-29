
import * as math from "mathjs";
import * as THREE from "three";



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


const normals = [
	[-1, 0, 0],
	[+1, 0, 0],
	[0, -1, 0],
	[0, +1, 0],
	[0, 0, -1],
	[0, 0, +1],
];



const geometries = Array(3 ** 3).fill().map(() => new THREE.Geometry());
geometries.forEach((geometry, u) => {
	const pos = [u % 3 - 1, Math.floor(u / 3) % 3 - 1, Math.floor(u / 9) - 1];

	geometry.vertices = positions;
	geometry.faces = [].concat(...Array(6).fill().map((_, i) => ({
		i4: i * 4,
		normal: normals[i],
		materialIndex: math.dot(normals[i], pos) > 0 ? i : 6,
	})).map(data => [
		new THREE.Face3(data.i4, data.i4 + 1, data.i4 + 2, data.normal, undefined, data.materialIndex),
		new THREE.Face3(data.i4, data.i4 + 2, data.i4 + 3, data.normal, undefined, data.materialIndex),
	]));
});


export function createCube3Meshes (materials) {
	console.assert(materials.length === 7, "invalid materials:", materials);

	return geometries.map(geometry => new THREE.Mesh(geometry, materials));
};


export const needTranslation = true;
