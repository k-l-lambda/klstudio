
import Vue from "vue";
import VueRouter from "vue-router";

import App from "./embed.vue";

import {routes} from "./router";



const router = new VueRouter({
	routes: [
		...routes,
		{path: "/", redirect: "/globe-cube3"},
	],
});


new Vue({
	router,
	render: h => h(App),
}).$mount("body");
