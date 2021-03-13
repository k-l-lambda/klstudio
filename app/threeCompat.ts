
import * as THREE from "three";



class Face3 {
	i1: number;
	i2: number;
	i3: number;
	normal: THREE.Vector3;
	color: THREE.Color;
	materialIndex: number;


	constructor (i1: number, i2: number, i3: number, normal: THREE.Vector3, color: THREE.Color, materialIndex: number) {
		Object.assign(this, {i1, i2, i3, normal, color, materialIndex});
	}
};


class Geometry {
	vertices: THREE.Vector3[];
	faces: Face3[];


	toBufferGeometry (): THREE.BufferGeometry {
		if (!this.vertices || !this.faces)
			return null;

		const face0 = this.faces[0];
		if (!face0)
			return null;

		const indexedFaces = Array(this.vertices.length).fill(null);
		this.faces.forEach(face => {
			indexedFaces[face.i1] = face;
			indexedFaces[face.i2] = face;
			indexedFaces[face.i3] = face;
		});

		const bgeo = new THREE.BufferGeometry();
		bgeo.setIndex([].concat(...this.faces.map(face => [face.i1, face.i2, face.i3])));
		bgeo.addAttribute( "position", new THREE.Float32BufferAttribute( [].concat(...this.vertices.map(pos => [pos.x, pos.y, pos.z])), 3 ) );

		if (face0.normal) {
			const buffer = [].concat(...indexedFaces.map(face => face.normal));
			bgeo.addAttribute( "normal", new THREE.Float32BufferAttribute( buffer, 3 ) );
		}

		if (face0.color) {
			bgeo.addAttribute( "color", new THREE.Float32BufferAttribute( [].concat(...indexedFaces
				.map(face => [face.color.r, face.color.g, face.color.b])), 3 ) );
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
