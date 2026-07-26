<template>
	<div class="s3-simulator" v-resize="onResize">
		<canvas ref="canvas" tabindex="0" />
		<div class="hud">
			<h1>S<sup>3</sup> Hypersphere Simulator</h1>
			<p class="hint">Flat perspective, S<sup>3</sup>-adjusted world transform. The puppet casts two images — the near arc ahead and the far arc behind (upside-down, from antipodal light).</p>
			<p class="tip">WASD to move through S<sup>3</sup>, drag to look, scroll to glide forward. Move past the puppet and it reappears behind you; travel far enough and you loop back to where you started.</p>
		</div>
	</div>
</template>

<script lang="ts">
	import {markRaw} from "vue";
	import * as THREE from "three";
	import resize from "vue-resize-directive";

	import {createPuppet} from "../s3/puppet";
	import {buildImageMatrix} from "../s3/hyperTransform";
	import {S3Camera, pointAhead, Vec4} from "../s3/camera";



	// S^3 radius: the great circle has circumference 2*pi*R. Traversing it shrinks
	// the puppet to the equator, looms it toward the antipode, merges, and returns.
	const S3_RADIUS = 1000;
	const TWO_PI = 2 * Math.PI;

	// Render-distance multiplier: the embedding uses angle-as-distance (0..pi), so
	// scale the whole scene out to frame the ~4-unit puppet. Distance-only, so the
	// 1/sin(theta) apparent-size law is preserved.
	const VIEW_SCALE = 8;

	// Sky color, shared by the fog and the background clear color.
	const SKY_COLOR = 0x8cb3d9;

	// Fog: render depth is proportional to the great-circle arc distance
	// (depth = (arc/R)*VIEW_SCALE), so plain linear depth fog fogs by S^3 distance.
	// A full circumference (arc = 2000*pi) maps to render depth 2*pi*VIEW_SCALE;
	// pick fogFar so that depth blends in 70% sky color there (fogFactor 0.3).
	const FOG_FAR = (2 * Math.PI * VIEW_SCALE) / 0.70;

	// Where the puppet sits on S^3: a geodesic angle ahead of the origin.
	const PUPPET_ANGLE = TWO_PI * 0.12;

	// Movement rates.
	const MOVE_RATE = 0.6;             // WASD glide, radians of arc per second
	const TURN_RATE = 0.005;           // drag look, radians per pixel
	const SCROLL_STEP = TWO_PI / 240;  // one wheel notch, radians of forward travel

	// Ground: a fixed patch of an S^3 great-2-sphere below the camera start,
	// projected per-vertex each frame (so it flows and curves as you move). Kept to
	// a small angular patch (rho < pi everywhere) so it never needs a far/wrap image.
	const GROUND_HALF = 1.2;    // angular half-extent of the patch, radians
	const GROUND_DIV = 24;      // grid cells per side
	const GROUND_HEIGHT = 0.31; // camera height above the patch, radians (~2.5 render units)


	// Exponential map on S^3 at base point b, for a tangent s*e1 + t*e2 (e1, e2
	// orthonormal tangents at b). Returns the unit 4-vector geodesic endpoint.
	const expMapS3 = (b: Vec4, e1: Vec4, e2: Vec4, s: number, t: number): Vec4 => {
		const rho = Math.hypot(s, t);
		if (rho < 1e-9)
			return [b[0], b[1], b[2], b[3]];
		const c = Math.cos(rho);
		const k = Math.sin(rho) / rho;
		return [
			c * b[0] + k * (s * e1[0] + t * e2[0]),
			c * b[1] + k * (s * e1[1] + t * e2[1]),
			c * b[2] + k * (s * e1[2] + t * e2[2]),
			c * b[3] + k * (s * e1[3] + t * e2[3]),
		];
	};


	export default {
		name: "s3-simulator",


		directives: {
			resize,
		},


		data () {
			return {
				size: {width: 800, height: 600},
			};
		},


		mounted () {
			this.initScene();
			this.animate();
		},


		beforeUnmount () {
			this.rendererActive = false;
			const canvas = this.$refs.canvas as HTMLCanvasElement;
			if (canvas) {
				canvas.removeEventListener("pointerdown", this.onPointerDown);
				canvas.removeEventListener("wheel", this.onWheel);
			}
			window.removeEventListener("pointermove", this.onPointerMove);
			window.removeEventListener("pointerup", this.onPointerUp);
			window.removeEventListener("keydown", this.onKeyDown);
			window.removeEventListener("keyup", this.onKeyUp);
			if (this.puppet)
				this.puppet.dispose();
			if (this.farMaterial)
				this.farMaterial.dispose();
			if (this.groundGeometry)
				this.groundGeometry.dispose();
			if (this.groundMaterial)
				this.groundMaterial.dispose();
			if (this.renderer)
				this.renderer.dispose();
		},


		methods: {
			onResize () {
				this.size = {width: this.$el.clientWidth, height: this.$el.clientHeight};
			},


			initScene () {
				this.onResize();

				const canvas = this.$refs.canvas as HTMLCanvasElement;

				this.renderer = markRaw(new THREE.WebGLRenderer({canvas, antialias: true}));
				this.renderer.setPixelRatio(window.devicePixelRatio || 1);
				this.renderer.setSize(this.size.width, this.size.height, false);

				const scene = markRaw(new THREE.Scene());
				scene.background = new THREE.Color(SKY_COLOR);
				scene.fog = new THREE.Fog(SKY_COLOR, 0, FOG_FAR);
				this.scene = scene;

				// The three.js camera stays at the origin looking down -z; all S^3
				// motion is baked into the image transforms. The far plane is large
				// because the near-antipode image is legitimately magnified.
				const aspect = this.size.width / Math.max(this.size.height, 1);
				this.camera = markRaw(new THREE.PerspectiveCamera(70, aspect, 0.02, 40000));
				this.camera.position.set(0, 0, 0);
				scene.add(this.camera);

				// Lighting rides with the camera so both images stay lit as you turn.
				this.camera.add(new THREE.AmbientLight(0xffffff, 0.6));
				const key = new THREE.DirectionalLight(0xffffff, 0.9);
				key.position.set(5, 10, 7);
				this.camera.add(key);
				const rim = new THREE.DirectionalLight(0x88aaff, 0.45);
				rim.position.set(-6, 4, -8);
				this.camera.add(rim);

				// The S^3 camera frame (SO(4)) and the puppet's fixed point on S^3.
				this.s3cam = markRaw(new S3Camera());
				this.puppetPoint = pointAhead(PUPPET_ANGLE);
				this.spin = 0;
				this.keys = markRaw({} as Record<string, boolean>);
				this.lastTime = performance.now();

				// Ground: a fixed S^3 great-2-sphere patch, projected per-vertex each
				// frame so it flows and curves as you move (see updateGround).
				scene.add(this.buildGround());

				// The puppet supplies the geometry for both S^3 images.
				const puppet = markRaw(createPuppet());
				this.puppet = puppet;

				// Near image = the puppet's own group (upright, outer surface).
				this.nearGroup = puppet.group;
				this.nearGroup.matrixAutoUpdate = false;
				scene.add(this.nearGroup);

				// Far image = a clone sharing the geometry. The long-arc transform is a
				// point inversion (upside-down + depth-reversed, det < 0), so it is drawn
				// with BackSide to keep the outer surface facing the viewer.
				this.farMaterial = markRaw(new THREE.MeshStandardMaterial({
					map: puppet.texture,
					roughness: 0.85,
					metalness: 0.05,
					side: THREE.BackSide,
				}));
				this.farGroup = markRaw(new THREE.Group());
				puppet.group.traverse((node: THREE.Object3D) => {
					const mesh = node as THREE.Mesh;
					if (!mesh.isMesh)
						return;
					const clone = new THREE.Mesh(mesh.geometry, this.farMaterial);
					clone.position.copy(mesh.position);
					clone.quaternion.copy(mesh.quaternion);
					clone.scale.copy(mesh.scale);
					this.farGroup.add(clone);
				});
				this.farGroup.matrixAutoUpdate = false;
				scene.add(this.farGroup);

				// Scratch objects reused every frame.
				this.spinQuat = markRaw(new THREE.Quaternion());
				this.negDir = markRaw(new THREE.Vector3());
				this.localMatrix = markRaw(new THREE.Matrix4());
				this.upAxis = markRaw(new THREE.Vector3(0, 1, 0));

				canvas.addEventListener("pointerdown", this.onPointerDown);
				canvas.addEventListener("wheel", this.onWheel, {passive: false});
				window.addEventListener("pointermove", this.onPointerMove);
				window.addEventListener("pointerup", this.onPointerUp);
				window.addEventListener("keydown", this.onKeyDown);
				window.addEventListener("keyup", this.onKeyUp);

				this.rendererActive = true;
			},


			/** Build the ground as a fixed grid of points on an S^3 great-2-sphere. */
			buildGround () {
				// Base point sits GROUND_HEIGHT below the camera start (identity frame),
				// with horizontal tangents along the start fwd/right axes.
				const b: Vec4 = [0, -Math.sin(GROUND_HEIGHT), 0, Math.cos(GROUND_HEIGHT)];
				const e1: Vec4 = [0, 0, 1, 0]; // start fwd
				const e2: Vec4 = [1, 0, 0, 0]; // start right

				const n = GROUND_DIV + 1;
				const pts: Vec4[] = [];
				for (let i = 0; i < n; ++i) {
					const s = -GROUND_HALF + (2 * GROUND_HALF * i) / GROUND_DIV;
					for (let j = 0; j < n; ++j) {
						const t = -GROUND_HALF + (2 * GROUND_HALF * j) / GROUND_DIV;
						pts.push(expMapS3(b, e1, e2, s, t));
					}
				}

				// Line segments: connect each vertex to its +row and +col neighbour.
				const index: number[] = [];
				const at = (i: number, j: number): number => i * n + j;
				for (let i = 0; i < n; ++i) {
					for (let j = 0; j < n; ++j) {
						if (j < n - 1)
							index.push(at(i, j), at(i, j + 1));
						if (i < n - 1)
							index.push(at(i, j), at(i + 1, j));
					}
				}

				const geometry = new THREE.BufferGeometry();
				geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts.length * 3), 3));
				geometry.setIndex(index);
				this.groundMaterial = markRaw(new THREE.LineBasicMaterial({color: 0x24405e}));
				const lines = markRaw(new THREE.LineSegments(geometry, this.groundMaterial));
				lines.frustumCulled = false;

				this.groundPoints = markRaw(pts);
				this.groundGeometry = markRaw(geometry);
				return lines;
			},


			/** Re-project every ground vertex through the current camera pose. */
			updateGround () {
				const attr = this.groundGeometry.attributes.position;
				const arr = attr.array as Float32Array;
				for (let k = 0; k < this.groundPoints.length; ++k) {
					const {theta, dir} = this.s3cam.bearingTo(this.groundPoints[k]);
					const d = theta * VIEW_SCALE;
					arr[k * 3] = dir.x * d;
					arr[k * 3 + 1] = dir.y * d;
					arr[k * 3 + 2] = dir.z * d;
				}
				attr.needsUpdate = true;
			},


			onPointerDown (event: PointerEvent) {
				(this.$refs.canvas as HTMLCanvasElement).focus();
				this.dragging = true;
				this.lastPointer = {x: event.clientX, y: event.clientY};
			},


			onPointerMove (event: PointerEvent) {
				if (!this.dragging)
					return;
				const dx = event.clientX - this.lastPointer.x;
				const dy = event.clientY - this.lastPointer.y;
				this.lastPointer = {x: event.clientX, y: event.clientY};
				// Drag right -> yaw right; drag up -> pitch up.
				this.s3cam.yaw(dx * TURN_RATE);
				this.s3cam.pitch(-dy * TURN_RATE);
			},


			onPointerUp () {
				this.dragging = false;
			},


			onWheel (event: WheelEvent) {
				event.preventDefault();
				this.s3cam.moveForward(-Math.sign(event.deltaY) * SCROLL_STEP);
			},


			onKeyDown (event: KeyboardEvent) {
				const k = event.key.toLowerCase();
				if (["w", "a", "s", "d"].includes(k)) {
					this.keys[k] = true;
					event.preventDefault();
				}
			},


			onKeyUp (event: KeyboardEvent) {
				this.keys[event.key.toLowerCase()] = false;
			},


			/** Apply held WASD keys as geodesic motion for this frame. */
			applyMovement (dt: number) {
				const step = MOVE_RATE * dt;
				if (this.keys.w)
					this.s3cam.moveForward(step);
				if (this.keys.s)
					this.s3cam.moveForward(-step);
				if (this.keys.d)
					this.s3cam.strafe(step);
				if (this.keys.a)
					this.s3cam.strafe(-step);
				this.s3cam.orthonormalize();
			},


			/**
			 * Recompute both image transforms from the CURRENT camera pose. As the
			 * camera moves, the bearing (direction + geodesic distance) to the puppet
			 * changes, so both images' positions relative to the camera are updated
			 * every frame: near along +dir at distance theta, far along -dir at
			 * distance 2*pi - theta.
			 */
			updateImages () {
				this.spinQuat.setFromAxisAngle(this.upAxis, this.spin);

				const {theta, dir} = this.s3cam.bearingTo(this.puppetPoint);

				const near = buildImageMatrix(theta * S3_RADIUS, S3_RADIUS, dir, this.spinQuat, false, this.localMatrix, VIEW_SCALE);
				this.nearGroup.matrix.copy(near.matrix);

				this.negDir.copy(dir).multiplyScalar(-1);
				const far = buildImageMatrix((TWO_PI - theta) * S3_RADIUS, S3_RADIUS, this.negDir, this.spinQuat, true, this.localMatrix, VIEW_SCALE);
				this.farGroup.matrix.copy(far.matrix);
			},


			animate () {
				if (!this.rendererActive)
					return;
				requestAnimationFrame(() => this.animate());

				const now = performance.now();
				const dt = Math.min((now - this.lastTime) / 1000, 0.1);
				this.lastTime = now;

				this.spin += 0.004;
				this.applyMovement(dt);
				this.updateGround();
				this.updateImages();
				this.renderer.render(this.scene, this.camera);
			},
		},


		watch: {
			size (value: {width: number; height: number}) {
				const aspect = value.width / Math.max(value.height, 1);
				this.camera.aspect = aspect;
				this.camera.updateProjectionMatrix();
				this.renderer.setPixelRatio(window.devicePixelRatio || 1);
				this.renderer.setSize(value.width, value.height, false);
			},
		},
	};
</script>

<style scoped>
.s3-simulator
{
	position: relative;
	width: 100%;
	height: 100%;
	overflow: hidden;
	background: #8cb3d9;
}

canvas
{
	display: block;
	width: 100%;
	height: 100%;
	outline: none;
}

.hud
{
	position: absolute;
	top: 0;
	left: 0;
	padding: 1rem 1.25rem;
	max-width: 30rem;
	color: #dfe6f2;
	font-family: Arial, Helvetica, sans-serif;
	text-shadow: 0 1px 3px #000a;
	pointer-events: none;
}

.hud h1
{
	margin: 0;
	font-size: 1.4rem;
	font-weight: 700;
}

.hud .hint
{
	margin: .3rem 0 .8rem;
	font-size: .82rem;
	opacity: .8;
}

.tip
{
	margin: .6rem 0 0;
	font-size: .76rem;
	opacity: .7;
}
</style>
