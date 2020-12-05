
import * as THREE from "three";



type Vector3 = [number, number, number];
type Position2 = {x: number, y: number};


export default class Label3D {
	graphNode: THREE.Object3D
	camera: THREE.Camera;

	content: string;
	_pos: Position2;


	constructor (parent: THREE.Object3D, camera: THREE.Camera, {content, offset = [0, 1.3, 0]}: {content?: string, offset?: Vector3} = {}) {
		this.camera = camera;
		this.content = content;

		this.graphNode = new THREE.Object3D();
		this.graphNode.position.set(...offset);
		parent.add(this.graphNode);

		this._pos = null;
	}


	get position (): Position2 {
		if (!this._pos)
			this.updatePosition();

		return this._pos;
	}


	updatePosition () {
		const p = this.graphNode.getWorldPosition(new THREE.Vector3()).project(this.camera);

		this._pos = this._pos || {x: null, y: null};
		this._pos.x = (p.x + 1) / 2;
		this._pos.y = (-p.y + 1) / 2;
	}
};
