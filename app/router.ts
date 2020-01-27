
import Vue from "vue";
import VueRouter from "vue-router";



Vue.use(VueRouter);


const routes = [
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
];


const router = new VueRouter({
	routes,
});



export default router;
