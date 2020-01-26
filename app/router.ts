
import Vue from "vue";
import VueRouter from "vue-router";
import Home from "./views/Home.vue";



Vue.use(VueRouter);


const routes = [
	{
		path: "/writer/",
		name: "AI Writer",
		component: () => import(/* webpackChunkName: "writer" */ "./views/writer.vue"),
	},
];


const router = new VueRouter({
	routes,
});



export default router;
