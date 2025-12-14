<template>
	<div v-resize="onResize" class="globe-cube3">
		<Cube3 ref="cube3"
			class="viewer"
			:size="size"
			:code.sync="code"
			:material="cubeMaterial"
			:highlightMaterial="cubeHighlightMaterial"
			meshSchema="spherical"
			@fps="onFps"
			@sceneInitialized="onSceneInitialized"
			@beforeRender="onBeforeRender"
			@afterRender="onAfterRender"
		/>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";
	import * as THREE from "three";
	import {markRaw} from "vue";

	// Post-processing imports
	import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer.js";
	import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass.js";
	import {UnrealBloomPass} from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
	import {ShaderPass} from "three/examples/jsm/postprocessing/ShaderPass.js";
	import {FXAAShader} from "three/examples/jsm/shaders/FXAAShader.js";

	import Cube3 from "../components/cube3.vue";

	import QuitClearner from "../mixins/quit-cleaner";
	import Accelerometer from "../mixins/accelerometer.js";


	const cubeTextureNames = ["px", "nx", "py", "ny", "pz", "nz"];

	// Upgraded to PBR material config
	// Dark ocean with strong environment reflection, but land visible
	const materialConfig = {
		color: "#1a2a3a",      // Slightly brighter for land visibility
		metalness: 0.85,       // High metalness for reflection
		roughness: 0.08,       // Very smooth for clear env reflections
		envMapIntensity: 2.0,  // Strong environment reflection
	};

	// Hover material config - bright realistic Earth with land/ocean differentiation
	const hoverMaterialConfig = {
		color: "#4a7ab0",      // Bright blue-green tone
		metalness: 0.5,        // Base metalness (adjusted by metalnessMap)
		roughness: 0.7,        // Base roughness (will be 0 for ocean via inverted map)
		envMapIntensity: 1.2,  // Moderate environment reflection
	};

	// Vignette shader for cinematic effect
	const VignetteShader = {
		uniforms: {
			tDiffuse: {value: null},
			offset: {value: 1.0},
			darkness: {value: 1.2},
		},
		vertexShader: `
			varying vec2 vUv;
			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			}
		`,
		fragmentShader: `
			uniform sampler2D tDiffuse;
			uniform float offset;
			uniform float darkness;
			varying vec2 vUv;
			void main() {
				vec4 texel = texture2D(tDiffuse, vUv);
				vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
				float vignette = clamp(1.0 - dot(uv, uv), 0.0, 1.0);
				texel.rgb *= mix(1.0, vignette, darkness);
				gl_FragColor = texel;
			}
		`,
	};

	// Fresnel rim light shader chunk for atmosphere glow
	// Note: In MeshStandardMaterial, we inject after normal_fragment_maps where 'normal' and 'vViewPosition' are available
	const fresnelShaderChunk = `
		vec3 viewDirection = normalize(vViewPosition);
		float fresnelTerm = pow(1.0 - abs(dot(viewDirection, normal)), 3.0);
		outgoingLight += vec3(0.2, 0.5, 1.0) * fresnelTerm * 0.5;
	`;

	const SENSOR_SENSITIVITY = 1e-3;



	export default {
		name: "globe-cube3",


		props: {
			rendererActive: {
				type: Boolean,
				default: true,
			},
		},


		directives: {
			resize,
		},


		mixins: [
			QuitClearner,
			Accelerometer,
		],


		components: {
			Cube3,
		},


		data () {
			// Use PBR MeshStandardMaterial for better lighting response
			// markRaw prevents Vue from making Three.js objects reactive (causes Proxy conflicts)
			const cubeMaterial = markRaw(new THREE.MeshStandardMaterial(materialConfig));

			// Independent hover material with land/ocean differentiation
			const cubeHighlightMaterial = markRaw(new THREE.MeshStandardMaterial(hoverMaterialConfig));

			return {
				size: undefined,
				fps: null,
				code: null,
				cubeMaterial,
				cubeHighlightMaterial,
				composer: null,
			};
		},


		mounted () {
			//window.$cube = this.$refs.cube3.cube;

			if (!this.rendererActive)
				this.$refs.cube3.rendererActive = this.rendererActive;
		},


		methods: {
			onResize () {
				this.size = {width: this.$el.clientWidth, height: this.$el.clientHeight};
			},


			onFps (data) {
				//console.log("fps:", data);
				this.fps = data.fps;
			},


			async onSceneInitialized (cube3) {
				cube3.camera.near = 0.1;
				cube3.camera.position.set(0, 0, 4.5);

				// Minimal soft lighting - no harsh specular
				const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
				cube3.scene.add(ambientLight);

				// Soft directional for subtle shading
				const mainLight = new THREE.DirectionalLight(0xffffff, 0.3);
				mainLight.position.set(0, 0, 10);
				cube3.scene.add(mainLight);

				cube3.scene.add(cube3.camera);

				this.textureLoader = markRaw(new THREE.TextureLoader());

				// Load textures
				const normalMap = await this.loadTexture("earth/earth_normal.jpg");
				const specularMap = await this.loadTexture("earth/earth_specular.jpg");

				// Environment map for reflections
				const skyTexturePaths = cubeTextureNames.map(name => new URL(`../assets/skybox-space/${name}.jpg`, import.meta.url).href);
				const skyTexture = new THREE.CubeTextureLoader().load(skyTexturePaths);

				// Configure default material (dark mysterious)
				this.cubeMaterial.normalMap = normalMap;
				this.cubeMaterial.envMap = skyTexture;
				this.cubeMaterial.needsUpdate = true;

				// Add Fresnel rim light effect to default material
				this.cubeMaterial.onBeforeCompile = (shader) => {
					shader.fragmentShader = shader.fragmentShader.replace(
						"#include <output_fragment>",
						`${fresnelShaderChunk}
						#include <output_fragment>`
					);
				};

				// Configure hover material (bright realistic Earth)
				// Use specularMap as metalnessMap to differentiate land/ocean:
				// ocean(white) = high metalness (reflective), land(dark) = low metalness (diffuse)
				// Create inverted roughnessMap: ocean=smooth, land=rough (no specular)
				this.cubeHighlightMaterial.normalMap = normalMap;
				this.cubeHighlightMaterial.envMap = skyTexture;
				this.cubeHighlightMaterial.metalnessMap = specularMap;

				// Invert specular map for roughnessMap using canvas
				const invertedRoughnessMap = await this.createInvertedTexture(specularMap);
				this.cubeHighlightMaterial.roughnessMap = invertedRoughnessMap;
				this.cubeHighlightMaterial.needsUpdate = true;

				// === Post-Processing Setup (disabled for transparency) ===
				// this.setupPostProcessing(cube3);
			},


			setupPostProcessing (cube3) {
				const {renderer, scene, camera} = cube3;
				const size = renderer.getSize(new THREE.Vector2());

				// Create effect composer - use markRaw to prevent Vue proxy conflicts
				this.composer = markRaw(new EffectComposer(renderer));

				// Render pass
				const renderPass = new RenderPass(scene, camera);
				this.composer.addPass(renderPass);

				// Bloom pass for glow effect
				const bloomPass = markRaw(new UnrealBloomPass(
					new THREE.Vector2(size.x, size.y),
					0.4,   // strength
					0.5,   // radius
					0.7    // threshold
				));
				this.composer.addPass(bloomPass);
				this.bloomPass = bloomPass;

				// FXAA anti-aliasing
				const fxaaPass = markRaw(new ShaderPass(FXAAShader));
				fxaaPass.uniforms["resolution"].value.set(1 / size.x, 1 / size.y);
				this.composer.addPass(fxaaPass);
				this.fxaaPass = fxaaPass;

				// Vignette for cinematic look
				const vignettePass = new ShaderPass(VignetteShader);
				vignettePass.uniforms["offset"].value = 0.95;
				vignettePass.uniforms["darkness"].value = 0.8;
				this.composer.addPass(vignettePass);
			},


			onBeforeRender (cube3) {
				cube3.scene.rotation.set(0, Date.now() * 40e-6, 0);

				if (this.sensorVelocity) {
					cube3.cube.graph.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), this.sensorVelocity[0] * SENSOR_SENSITIVITY * 0.1);
					cube3.cube.graph.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), this.sensorVelocity[2] * SENSOR_SENSITIVITY);
					cube3.cube.graph.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), this.sensorVelocity[1] * SENSOR_SENSITIVITY * 0.2);
				}
			},


			onAfterRender () {
				// Use post-processing composer for final render
				if (this.composer) {
					this.composer.render();
				}
			},


			async loadTexture (assetPath) {
				const path = new URL(`../assets/${assetPath}`, import.meta.url).href;
				return new Promise(resolve => this.textureLoader.load(path, texture => resolve(texture)));
			},


			// Create inverted texture for roughnessMap (ocean=dark=smooth, land=bright=rough)
			async createInvertedTexture (sourceTexture) {
				const image = sourceTexture.image;
				const canvas = document.createElement("canvas");
				canvas.width = image.width;
				canvas.height = image.height;
				const ctx = canvas.getContext("2d");
				ctx.drawImage(image, 0, 0);
				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				const data = imageData.data;
				// Invert RGB values
				for (let i = 0; i < data.length; i += 4) {
					data[i] = 255 - data[i];       // R
					data[i + 1] = 255 - data[i + 1]; // G
					data[i + 2] = 255 - data[i + 2]; // B
					// Alpha stays the same
				}
				ctx.putImageData(imageData, 0, 0);
				const invertedTexture = new THREE.CanvasTexture(canvas);
				invertedTexture.colorSpace = sourceTexture.colorSpace;
				return markRaw(invertedTexture);
			},
		},


		watch: {
			rendererActive (value) {
				this.$refs.cube3.rendererActive = value;
				if (value)
					this.$refs.cube3.render();
			},

			size (value) {
				// Update post-processing on resize
				if (this.composer && value) {
					this.composer.setSize(value.width, value.height);
					if (this.fxaaPass) {
						this.fxaaPass.uniforms["resolution"].value.set(1 / value.width, 1 / value.height);
					}
					if (this.bloomPass) {
						this.bloomPass.resolution.set(value.width, value.height);
					}
				}
			},
		},
	};
</script>

<style scoped>
	.globe-cube3
	{
		width: 100%;
		height: 100%;
	}
</style>
