
import * as THREE from "three";

import {animationDelay, msDelay} from "./delay";



interface QuaternionRollerOptions {
	onSegment: () => boolean;
	segmentDuration: number;
	segmentInterval: number;
	pitchSpan: number;
	rollSpan: number;
};


export default async (quaternion: THREE.Quaternion, options: Partial<QuaternionRollerOptions> = {}): Promise<void> => {
	let yaw = 0;

	const pitchSpan = options.pitchSpan || 2.4;
	const rollSpan = options.rollSpan || 0.2;

	while (options.onSegment()) {
		yaw += (1 + (Math.random() - 0.5) * (Math.random() - 0.5) * 4) * Math.PI;

		const begin = quaternion.clone();
		const target = new THREE.Quaternion()
			.setFromEuler(new THREE.Euler((Math.random() - 0.5) * pitchSpan, yaw, (Math.random() - 0.5) * rollSpan, "YXZ"));

		const start = Date.now();
		let now = start;
		while (now - start < options.segmentDuration) {
			const progress = (now - start) / options.segmentDuration;
			const t = 3 * progress ** 2 - 2 * progress ** 3;
			THREE.Quaternion.slerp(begin, target, quaternion, t);

			await animationDelay();
			now = Date.now();
		}

		await msDelay(options.segmentInterval);

		await animationDelay();
	}
};
