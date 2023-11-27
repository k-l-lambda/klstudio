
import Vue from "vue";
import VueRouter from "vue-router";



Vue.use(VueRouter);


export const routes = [
	{
		path: "/writer/",
		name: "AI Writer",
		component: () => import(/* webpackChunkName: "writer" */ "./views/writer.vue"),
	},
	{
		path: "/documents/fifth-pitch-graph",
		name: "Fifth Pitch Graph",
		component: () => import(/* webpackChunkName: "fifth-pitch-graph" */ "./views/fifth-pitch-graph.vue"),
	},
	{
		path: "/documents/equal-temperament",
		name: "12 Equal Temperament",
		component: () => import(/* webpackChunkName: "equal-temperament" */ "./views/equal-temperament.vue"),
	},
	{
		path: "/documents/hyperbolic",
		name: "Hyperbolic",
		component: () => import(/* webpackChunkName: "hyperbolic" */ "./views/hyperbolic.vue"),
	},
	{
		path: "/documents/mesh-viewer",
		name: "Mesh Viewer",
		component: () => import(/* webpackChunkName: "mesh-viewer" */ "./views/mesh-viewer.vue"),
		props: route => route.query.param ? JSON.parse(route.query.param) : {},
	},
	{
		path: "/documents/mesh-viewer-demo::config",
		name: "Mesh Viewer Demo",
		component: () => import(/* webpackChunkName: "mesh-viewer-demo" */ "./views/mesh-viewer-demo.vue"),
		props: true,
	},
	{
		path: "/documents/flipping-cube",
		name: "Flipping Cube",
		component: () => import(/* webpackChunkName: "flipping-cube" */ "./views/flipping-cube.vue"),
	},
	{
		path: "/documents/flipping-cube-demo",
		name: "Flipping Cube Demo",
		component: () => import(/* webpackChunkName: "flipping-cube" */ "./views/flipping-cube.vue"),
		props: {demo: true},
	},
	{
		path: "/documents/cube-multiplication",
		name: "Cube Multiplication",
		component: () => import(/* webpackChunkName: "cube-multiplication" */ "./views/cube-multiplication.vue"),
	},
	{
		path: "/documents/cube-multiplication-demo",
		name: "Cube Multiplication Demo",
		component: () => import(/* webpackChunkName: "cube-multiplication" */ "./views/cube-multiplication.vue"),
		props: {demo: true},
	},
	{
		path: "/documents/static-labeled-cube3",
		name: "Static Labeled Cube3",
		component: () => import(/* webpackChunkName: "static-labeled-cube3" */ "./views/static-labeled-cube3.vue"),
	},
	{
		path: "/documents/static-labeled-cube3-demo",
		name: "Static Labeled Cube3 Demo",
		component: () => import(/* webpackChunkName: "static-labeled-cube3" */ "./views/static-labeled-cube3.vue"),
		props: {demo: true},
	},
	{
		path: "/documents/dynamic-labeled-cube3",
		name: "Cube & Matrix",
		component: () => import(/* webpackChunkName: "dynamic-labeled-cube3" */ "./views/dynamic-labeled-cube3.vue"),
	},
	{
		path: "/documents/dynamic-labeled-cube3-demo",
		name: "Dynamic Labeled Cube3 Demo",
		component: () => import(/* webpackChunkName: "dynamic-labeled-cube3" */ "./views/dynamic-labeled-cube3.vue"),
		props: {demo: true},
	},
	{
		path: "/documents/dynamic-labeled-cube3-twists::demoPath",
		name: "Dynamic Labeled Cube3 Twists",
		component: () => import(/* webpackChunkName: "dynamic-labeled-cube3" */ "./views/dynamic-labeled-cube3.vue"),
		props: true,
	},
	{
		path: "/documents/cube3-multiplication",
		name: "Cube3 Multiplication",
		component: () => import(/* webpackChunkName: "cube3-multiplication" */ "./views/cube3-multiplication.vue"),
	},
	{
		path: "/documents/cube3-multiplication-demo",
		name: "Cube3 Multiplication Demo",
		component: () => import(/* webpackChunkName: "cube3-multiplication" */ "./views/cube3-multiplication.vue"),
		props: {demo: true},
	},
	{
		path: "/documents/stylegan-mapping",
		name: "StyleGAN Mapping Visualization",
		component: () => import(/* webpackChunkName: "stylegan-mapping" */ "./views/stylegan-mapping.vue"),
	},
	{
		path: "/curves-editor",
		name: "Curves Editor",
		component: () => import(/* webpackChunkName: "curves-editor" */ "./views/curves-editor.vue"),
	},
	{
		path: "/cube3-player",
		name: "3-order Magic Cube Player",
		component: () => import(/* webpackChunkName: "cube3-player" */ "./views/cube3-player.vue"),
	},
	{
		path: "/cube3-solver",
		name: "Cube3 Solver",
		component: () => import(/* webpackChunkName: "cube3-solver" */ "./views/cube3-solver.vue"),
	},
	{
		path: "/spiral-piano",
		name: "Spiral Piano",
		component: () => import(/* webpackChunkName: "spiral-piano", webpackPrefetch: true */ "./views/spiral-piano.vue"),
	},
	{
		path: "/cube-cayley-graph",
		name: "Cube Cayley Graph",
		component: () => import(/* webpackChunkName: "cube-cayley-graph" */ "./views/cube-cayley-graph.vue"),
	},
	{
		path: "/globe-cube3",
		name: "Cube Globe",
		component: () => import(/* webpackChunkName: "globe-cube3", webpackPrefetch: true */ "./views/globe-cube3.vue"),
	},
	{
		path: "/pca-playground",
		name: "PCA Playgound",
		component: () => import(/* webpackChunkName: "pca-playground", */ "./views/pca-playground.vue"),
	},
	{
		path: "/tools/webm-fixer",
		name: "WEBM Fixer",
		component: () => import(/* webpackChunkName: "webm-fixer", */ "./views/webm-fixer.vue"),
	},
	{
		path: "/chess-lab",
		name: "Chess Lab",
		component: () => import(/* webpackChunkName: "chess-lab", */ "./views/chess-lab.vue"),
	},
	{
		path: "/midi-player",
		name: "MIDI Player",
		component: () => import(/* webpackChunkName: "midi-player", */ "./views/midi-player.vue"),
	},
	{
		path: "/lotus",
		name: "Lotus Player",
		component: () => import(/* webpackChunkName: "lotus", */ "./views/lotus.vue"),
	},
];


const router = new VueRouter({
	routes,
});



export default router;
