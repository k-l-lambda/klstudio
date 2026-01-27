
import * as THREE from "three";
import {RoundedBoxGeometry} from "three/examples/jsm/geometries/RoundedBoxGeometry.js";


// RoundedBoxGeometry with proper edge radius
const roundedGeometry = new RoundedBoxGeometry(1, 1, 1, 4, 0.08);


// Material colors array order:
// 0: Left (-X) Orange
// 1: Right (+X) Red
// 2: Down (-Y) Yellow
// 3: Up (+Y) White
// 4: Back (-Z) Blue
// 5: Front (+Z) Green
// 6: Base (black) - for internal faces

// Normal vectors for determining external faces
const FACE_NORMALS = [
	[+1, 0, 0],  // +X -> Right (Red)
	[-1, 0, 0],  // -X -> Left (Orange)
	[0, +1, 0],  // +Y -> Up (White)
	[0, -1, 0],  // -Y -> Down (Yellow)
	[0, 0, +1],  // +Z -> Front (Green)
	[0, 0, -1],  // -Z -> Back (Blue)
];

// Map face normal index to material color index
// Normal index: +X=0, -X=1, +Y=2, -Y=3, +Z=4, -Z=5
// Material index: Left=0, Right=1, Down=2, Up=3, Back=4, Front=5
const NORMAL_TO_MATERIAL = [1, 0, 3, 2, 5, 4];


// Custom shader material that colors based on normal direction
function createNormalColorMaterial(faceColors, baseColor) {
	return new THREE.ShaderMaterial({
		uniforms: {
			colorPosX: {value: faceColors[0].clone()},  // +X
			colorNegX: {value: faceColors[1].clone()},  // -X
			colorPosY: {value: faceColors[2].clone()},  // +Y
			colorNegY: {value: faceColors[3].clone()},  // -Y
			colorPosZ: {value: faceColors[4].clone()},  // +Z
			colorNegZ: {value: faceColors[5].clone()},  // -Z
			baseColor: {value: baseColor.clone()},
			highlighted: {value: 0.0},
			ambientIntensity: {value: 0.35},
			diffuseIntensity: {value: 0.7},
			specularIntensity: {value: 0.8},
			shininess: {value: 64.0},
			// Main light from top-right-front
			lightDir1: {value: new THREE.Vector3(10, 20, 10).normalize()},
			// Back fill light
			lightDir2: {value: new THREE.Vector3(-10, -10, -10).normalize()},
		},
		vertexShader: `
			varying vec3 vNormal;
			varying vec3 vObjectNormal;
			varying vec3 vViewPosition;

			void main() {
				vNormal = normalize(normalMatrix * normal);
				vObjectNormal = normal;  // Keep object-space normal for face color
				vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
				vViewPosition = -mvPosition.xyz;
				gl_Position = projectionMatrix * mvPosition;
			}
		`,
		fragmentShader: `
			uniform vec3 colorPosX, colorNegX;
			uniform vec3 colorPosY, colorNegY;
			uniform vec3 colorPosZ, colorNegZ;
			uniform vec3 baseColor;
			uniform float highlighted;
			uniform float ambientIntensity;
			uniform float diffuseIntensity;
			uniform float specularIntensity;
			uniform float shininess;
			uniform vec3 lightDir1;
			uniform vec3 lightDir2;

			varying vec3 vNormal;
			varying vec3 vObjectNormal;
			varying vec3 vViewPosition;

			void main() {
				vec3 normal = normalize(vNormal);
				// Use object-space normal for face color determination
				vec3 objNormal = normalize(vObjectNormal);
				vec3 absNormal = abs(objNormal);

				// Find dominant axis using object-space normal
				vec3 faceColor;
				if (absNormal.x >= absNormal.y && absNormal.x >= absNormal.z) {
					faceColor = objNormal.x > 0.0 ? colorPosX : colorNegX;
				} else if (absNormal.y >= absNormal.x && absNormal.y >= absNormal.z) {
					faceColor = objNormal.y > 0.0 ? colorPosY : colorNegY;
				} else {
					faceColor = objNormal.z > 0.0 ? colorPosZ : colorNegZ;
				}

				// Apply highlight boost
				faceColor = mix(faceColor, faceColor * 1.3 + vec3(0.1), highlighted);

				vec3 viewDir = normalize(vViewPosition);

				// Main light (bright, from top-right)
				float diffuse1 = max(dot(normal, lightDir1), 0.0);
				vec3 halfDir1 = normalize(lightDir1 + viewDir);
				float specular1 = pow(max(dot(normal, halfDir1), 0.0), shininess);

				// Back fill light (dimmer)
				float diffuse2 = max(dot(normal, lightDir2), 0.0) * 0.3;
				vec3 halfDir2 = normalize(lightDir2 + viewDir);
				float specular2 = pow(max(dot(normal, halfDir2), 0.0), shininess) * 0.2;

				// Combine lighting
				float totalDiffuse = diffuse1 + diffuse2;
				float totalSpecular = specular1 + specular2;

				// Fresnel-like rim highlight for edges
				float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0) * 0.15;

				vec3 finalColor = faceColor * (ambientIntensity + diffuseIntensity * totalDiffuse)
					+ vec3(1.0) * (specularIntensity * totalSpecular + fresnel);

				gl_FragColor = vec4(finalColor, 1.0);
			}
		`,
	});
}


export function createCube3Meshes(materials) {
	console.assert(materials.length === 7, "invalid materials:", materials);

	// Extract colors from materials
	const faceColors = materials.slice(0, 6).map(mat => mat.color);
	const baseColor = materials[6].color;

	const meshes = [];

	// Create 27 meshes (3x3x3)
	for (let u = 0; u < 27; u++) {
		const pos = [u % 3 - 1, Math.floor(u / 3) % 3 - 1, Math.floor(u / 9) - 1];

		// Determine which faces are external for this cubie
		const externalFaces = FACE_NORMALS.map((normal, i) => {
			const dot = normal[0] * pos[0] + normal[1] * pos[1] + normal[2] * pos[2];
			return dot > 0 ? NORMAL_TO_MATERIAL[i] : -1;  // -1 means internal (black)
		});

		// Create colors array for this cubie (6 face directions)
		// Order: +X, -X, +Y, -Y, +Z, -Z
		const cubieColors = [
			externalFaces[0] >= 0 ? faceColors[externalFaces[0]] : baseColor,  // +X
			externalFaces[1] >= 0 ? faceColors[externalFaces[1]] : baseColor,  // -X
			externalFaces[2] >= 0 ? faceColors[externalFaces[2]] : baseColor,  // +Y
			externalFaces[3] >= 0 ? faceColors[externalFaces[3]] : baseColor,  // -Y
			externalFaces[4] >= 0 ? faceColors[externalFaces[4]] : baseColor,  // +Z
			externalFaces[5] >= 0 ? faceColors[externalFaces[5]] : baseColor,  // -Z
		];

		const material = createNormalColorMaterial(cubieColors, baseColor);
		const mesh = new THREE.Mesh(roundedGeometry, material);

		// Store methods to set highlight state
		mesh.setHighlight = (value) => {
			material.uniforms.highlighted.value = value ? 1.0 : 0.0;
		};

		meshes.push(mesh);
	}

	return meshes;
}


export const needTranslation = true;
