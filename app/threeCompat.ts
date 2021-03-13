
import * as THREE from "three";



class Face3 {
	a: number;
	b: number;
	c: number;
	normal: THREE.Vector3;
	color: THREE.Color;
	materialIndex: number;
	uvs: THREE.Vector2[];


	constructor (a: number, b: number, c: number, normal: THREE.Vector3, color: THREE.Color, materialIndex: number) {
		Object.assign(this, {a, b, c, normal, color, materialIndex});
	}
};


const cc = <T>(a: T[][]): T[] => [].concat(...a);


class Geometry {
	vertices: THREE.Vector3[];
	faces: Face3[];
	faceVertexUvs: THREE.Vector2[][][];


	toBufferGeometry (): THREE.BufferGeometry {
		if (!this.vertices || !this.faces)
			return null;

		const face0 = this.faces[0];
		if (!face0)
			return null;

		//console.log("faceVertexUvs:", this.faceVertexUvs);
		if (this.faceVertexUvs) {
			const uvs = cc(this.faceVertexUvs);
			this.faces.forEach((face, i) => face.uvs = uvs[i]);
		}

		const indexedFaces = Array(this.vertices.length).fill(null);
		this.faces.forEach(face => {
			indexedFaces[face.a] = {
				normal: face.normal,
				color: face.color,
				uv: face.uvs && face.uvs[0],
			};
			indexedFaces[face.b] = {
				normal: face.normal,
				color: face.color,
				uv: face.uvs && face.uvs[1],
			};
			indexedFaces[face.c] = {
				normal: face.normal,
				color: face.color,
				uv: face.uvs && face.uvs[2],
			};
		});

		const bgeo = new THREE.BufferGeometry();
		bgeo.setIndex([].concat(...this.faces.map(face => [face.a, face.b, face.c])));
		bgeo.addAttribute( "position", new THREE.Float32BufferAttribute( [].concat(...this.vertices.map(pos => [pos.x, pos.y, pos.z])), 3 ) );

		if (face0.normal) {
			const buffer = [].concat(...indexedFaces.map(face => face.normal));
			bgeo.addAttribute( "normal", new THREE.Float32BufferAttribute( buffer, 3 ) );
		}

		if (face0.color) {
			bgeo.addAttribute( "color", new THREE.Float32BufferAttribute( [].concat(...indexedFaces
				.map(face => [face.color.r, face.color.g, face.color.b])), 3 ) );
		}

		if (face0.uvs) {
			bgeo.addAttribute( "uv", new THREE.Float32BufferAttribute( [].concat(...indexedFaces
				.map(face => cc([face.uv.x, face.uv.y]))), 2 ) );
		}

		let startIndex = 0;
		let materialIndex = -1;
		for (let i = 0; i < this.faces.length; ++i) {
			const face = this.faces[i];
			if (face.materialIndex !== materialIndex) {
				if (i > startIndex) {
					bgeo.addGroup(startIndex * 3, (i - startIndex) * 3, materialIndex);
					startIndex = i;
				}
				materialIndex = face.materialIndex;
			}
		}
		if (startIndex < this.faces.length)
			bgeo.addGroup(startIndex * 3, (this.faces.length - startIndex) * 3, materialIndex);

		return bgeo;
	}
};



export {
	Geometry,
	Face3,
};
