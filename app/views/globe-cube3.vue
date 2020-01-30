<template>
	<div v-resize="onResize" class="globe-cube3">
		<Cube3 ref="cube3"
			class="viewer"
			:size="size"
			:code.sync="code"
			:material="cubeMaterial"
			meshSchema="spherical"
			@fps="onFps"
			@sceneInitialized="onSceneInitialized"
			@beforeRender="onBeforeRender"
		/>
	</div>
</template>

<script>
	import resize from "vue-resize-directive";
	import * as THREE from "three";

	import Cube3 from "../components/cube3.vue";



	const cubeTextureNames = ["px", "nx", "py", "ny", "pz", "nz"];



	export default {
		name: "globe-cube3",


		directives: {
			resize,
		},


		props: {
			rendererActive: true,
		},


		components: {
			Cube3,
		},


		data () {
			return {
				size: undefined,
				fps: null,
				code: null,
				cubeMaterial: new THREE.MeshPhongMaterial({
					ambient: "#000",
					color: "#1340a7",
					specular: "#fff1a6",
					shininess: 8,
					shading: THREE.SmoothShading,
				}),
			};
		},


		mounted () {
			window.$cube = this.$refs.cube3.cube;
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
				cube3.camera.position.set(0, 0, 3);

				const mainLight = new THREE.DirectionalLight(0xffffff, 1.6);
				mainLight.position.set(0, 0, 10);
				mainLight.target = cube3.cube.graph;
				cube3.scene.add(mainLight);

				cube3.scene.add(cube3.camera);

				this.textureLoader = new THREE.TextureLoader();

				this.cubeMaterial.specularMap = await this.loadTexture("earth/earth_specular.jpg");
				this.cubeMaterial.needsUpdate = true;

				this.cubeMaterial.normalMap = await this.loadTexture("earth/earth_normal.jpg");
				this.cubeMaterial.needsUpdate = true;

				const skyTexturePaths = (await Promise.all(cubeTextureNames.map(name => import(`../assets/skybox-space/${name}.jpg`)))).map(({default: path}) => path);
				const skyTexture = new THREE.CubeTextureLoader().load(skyTexturePaths);
				this.cubeMaterial.envMap = skyTexture;
				this.cubeMaterial.needsUpdate = true;
			},


			onBeforeRender (cube3) {
				cube3.scene.rotation.set(0, Date.now() * 40e-6, 0);
			},


			async loadTexture (assetPath) {
				const {default: path} = await import(`../assets/${assetPath}`);
				return new Promise(resolve => this.textureLoader.load(path, texture => resolve(texture)));
			},
		},


		watch: {
			rendererActive (value) {
				this.$refs.cube3.rendererActive = value;
				if (value)
					this.$refs.cube3.render();
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
