
import * as THREE from "three";



const createVertex = (pos, normal = new THREE.Vector3(1, 0, 0), tu = 0, tv = 0) => ({
	Pos: pos,
	Normal: normal,
	TCoords: new THREE.Vector2(tu, tv),
});


const spherize = (v, k) => {
	const m = v.length();
	const r = Math.max(Math.abs(v.x), Math.max(Math.abs(v.y), Math.abs(v.z)));
	const radius = m * k + r * (1 - k);

	return new THREE.Vector3(v.x * radius / m, v.y * radius / m, v.z * radius / m);
};


const xyzToWuv = v3 => {
	const w = v3.length();
	const r = Math.sqrt(v3.x * v3.x + v3.z * v3.z);

	const v = Math.acos(-v3.y / w) / Math.PI;
	let u = r === 0 ? 0 : Math.acos(-v3.x / r) / (Math.PI * 2);
	if (v3.z < 0)
		u = 1 - u;

	return {w, u, v};
};


const eachRange2D = (ul, uh, vl, vh, elem) => {
	for (let u = ul; u <= uh; ++u) {
		for (let v = vl; v <= vh; ++v)
			elem(u, v);
	}
};


const createGeometries = ({segemnts = 12, sphericity = 0.4, chamferRadius = 0.1} = {}) => {
	const inv_grids = 1 / (segemnts + 2 / 3);

	const faceVerticesCount = (segemnts + 1) * (segemnts + 1);

	const getVertexIndex = (f, u, v) => faceVerticesCount * f + u * (segemnts + 1) + v;

	const indices = [];
	for (let f = 0; f < 6; ++f) {
		eachRange2D(0, segemnts - 1, 0, segemnts - 1, (u, v) => {
			indices.push(getVertexIndex(f, u, v));
			indices.push(getVertexIndex(f, u + 1, v + 1));
			indices.push(getVertexIndex(f, u + 1, v));

			indices.push(getVertexIndex(f, u, v));
			indices.push(getVertexIndex(f, u, v + 1));
			indices.push(getVertexIndex(f, u + 1, v + 1));
		});
	}

	const mendIndicesMap = {};
	let mendIndicesInitialized = false;

	const units = [];

	// traverse all units
	for (let az = -1; az <= 1; ++az) {
		for (let ay = -1; ay <= 1; ++ay) {
			for (let ax = -1; ax <= 1; ++ax) {
				const boxpos = [];
				const vertices = [];

				const [xl, xh] = [ax * (segemnts + 1) - segemnts / 2, ax * (segemnts + 1) + segemnts / 2];
				const [yl, yh] = [ay * (segemnts + 1) - segemnts / 2, ay * (segemnts + 1) + segemnts / 2];
				const [zl, zh] = [az * (segemnts + 1) - segemnts / 2, az * (segemnts + 1) + segemnts / 2];

				eachRange2D(yl, yh, zl, zh, (y, z) => {
					const pos = new THREE.Vector3(xl, y, z).multiplyScalar(inv_grids); boxpos.push(pos); vertices.push(createVertex(spherize(pos, sphericity)));
				});
				eachRange2D(zl, zh, yl, yh, (z, y) => {
					const pos = new THREE.Vector3(xh, y, z).multiplyScalar(inv_grids); boxpos.push(pos); vertices.push(createVertex(spherize(pos, sphericity)));
				});
				eachRange2D(zl, zh, xl, xh, (z, x) => {
					const pos = new THREE.Vector3(x, yl, z).multiplyScalar(inv_grids); boxpos.push(pos); vertices.push(createVertex(spherize(pos, sphericity)));
				});
				eachRange2D(xl, xh, zl, zh, (x, z) => {
					const pos = new THREE.Vector3(x, yh, z).multiplyScalar(inv_grids); boxpos.push(pos); vertices.push(createVertex(spherize(pos, sphericity)));
				});
				eachRange2D(xl, xh, yl, yh, (x, y) => {
					const pos = new THREE.Vector3(x, y, zl).multiplyScalar(inv_grids); boxpos.push(pos); vertices.push(createVertex(spherize(pos, sphericity)));
				});
				eachRange2D(yl, yh, xl, xh, (y, x) => {
					const pos = new THREE.Vector3(x, y, zh).multiplyScalar(inv_grids); boxpos.push(pos); vertices.push(createVertex(spherize(pos, sphericity)));
				});

				let mended = 0;

				const backVectors = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)];

				for (let f = 0; f < 6; ++f) {
					const backVector = backVectors[f].clone().multiplyScalar(inv_grids);

					eachRange2D(0, segemnts, 0, segemnts, (u, v) => {
						const index = getVertexIndex(f, u, v);
						const vertex = vertices[index];

						// chamfer position on edge
						if (u === 0 || u === segemnts || v === 0 || v === segemnts) {
							const pos = boxpos[index].clone();
							pos.add(backVector.clone().multiplyScalar(chamferRadius));
							if (u === 0)
								pos.add(boxpos[getVertexIndex(f, u + 1, v)].clone().sub(boxpos[index]).multiplyScalar(chamferRadius));
							if (u === segemnts)
								pos.add(boxpos[getVertexIndex(f, u - 1, v)].clone().sub(boxpos[index]).multiplyScalar(chamferRadius));
							if (v === 0)
								pos.add(boxpos[getVertexIndex(f, u, v + 1)].clone().sub(boxpos[index]).multiplyScalar(chamferRadius));
							if (v === segemnts)
								pos.add(boxpos[getVertexIndex(f, u, v - 1)].clone().sub(boxpos[index]).multiplyScalar(chamferRadius));

							vertex.Pos = spherize(pos, sphericity);
						}

						// compute normal, tangent & binormal
						const pos = vertex.Pos;
						const normals = [];
						const back = spherize(boxpos[index].clone().add(backVector), sphericity).sub(pos).normalize();

						const L = (u > 0) ? (vertices[getVertexIndex(f, u - 1, v)].Pos.clone().sub(pos)) : back;
						const R = (u < segemnts) ? (vertices[getVertexIndex(f, u + 1, v)].Pos.clone().sub(pos)) : back;
						const U = (v > 0) ? (vertices[getVertexIndex(f, u, v - 1)].Pos.clone().sub(pos)) : back;
						const D = (v < segemnts) ? (vertices[getVertexIndex(f, u, v + 1)].Pos.clone().sub(pos)) : back;

						normals.push(U.clone().cross(L));
						normals.push(L.clone().cross(D));
						normals.push(R.clone().cross(U));
						normals.push(D.clone().cross(R));

						vertex.Normal = new THREE.Vector3(0, 0, 0);
						normals.forEach(n => vertex.Normal.add(n.clone().normalize()));
						//vertex.Normal.multiplyScalar(1 / normals.length);
						vertex.Normal.normalize();

						vertex.Tangent = R.clone().add(L.clone().multiplyScalar(-1));
						vertex.Tangent.normalize();
						vertex.Binormal = D.clone().add(U.clone().multiplyScalar(-1));
						vertex.Binormal.normalize();

						const wuv = xyzToWuv(pos);
						vertex.TCoords.x = wuv.u;
						vertex.TCoords.y = wuv.v;

						// append a mend vertex
						if (pos.z === 0) {
							++mended;

							if (!mendIndicesInitialized)
								mendIndicesMap[getVertexIndex(f, u, v)] = vertices.length;

							let newVertex = vertex;
							if (vertex.TCoords.x === 0) {
								newVertex = {
									Pos: vertex.Pos,
									Normal: vertex.Normal,
									Tangent: vertex.Tangent,
									Binormal: vertex.Binormal,
									TCoords: new THREE.Vector2(1, vertex.TCoords.y),
								};
							}

							vertices.push(newVertex);
						}
					});
				}

				units.push({vertices, indices, mended, translation: [ax, ay, az]});

				mendIndicesInitialized = mendIndicesInitialized || mended > 0;
			}
		}
	}

	// build mendIndices
	const mendIndices = [];
	for (let f = 0; f < 6; ++f) {
		eachRange2D(0, segemnts - 1, 0, segemnts - 1, (u, v) => {
			const i00 = getVertexIndex(f, u, v);
			let i10 = getVertexIndex(f, u + 1, v);
			let i01 = getVertexIndex(f, u, v + 1);
			let i11 = getVertexIndex(f, u + 1, v + 1);

			switch(f) {
			case 0:
			case 3:
				i01 = mendIndicesMap[i01] || i01;
				i11 = mendIndicesMap[i11] || i11;

				break;
			case 1:
			case 2:
				i10 = mendIndicesMap[i10] || i10;
				i11 = mendIndicesMap[i11] || i11;

				break;
			}

			mendIndices.push(i00);
			mendIndices.push(i11);
			mendIndices.push(i10);

			mendIndices.push(i00);
			mendIndices.push(i01);
			mendIndices.push(i11);
		});
	}

	units.forEach(unit => {
		if (unit.mended)
			unit.indices = mendIndices;
	});

	return units.map(unit => {
		const geometry = new THREE.BufferGeometry();
		geometry.setIndex(unit.indices);
		geometry.addAttribute( "position", new THREE.Float32BufferAttribute( [].concat(...unit.vertices.map(v => [v.Pos.x, v.Pos.y, v.Pos.z])), 3 ) );
		geometry.addAttribute( "normal", new THREE.Float32BufferAttribute( [].concat(...unit.vertices.map(v => [v.Normal.x, v.Normal.y, v.Normal.z])), 3 ) );
		geometry.addAttribute( "uv", new THREE.Float32BufferAttribute( [].concat(...unit.vertices.map(v => [v.TCoords.x, v.TCoords.y])), 2 ) );

		geometry.addGroup(0, unit.indices.length, 0);

		//geometry.translate(-unit.translation[0], -unit.translation[1], -unit.translation[2]);

		return geometry;
		//return new THREE.BoxBufferGeometry( 1, 1, 1 );
	});
};


const createCube3Meshes = materials => createGeometries().map(geometry => new THREE.Mesh(geometry, materials));



export {
	createGeometries,
	createCube3Meshes,
};
