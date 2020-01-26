
import Vue from "vue";

import App from "./views/home.vue";

import router from "./router";



new Vue({
	router,
	render: h => h(App),
}).$mount("body");
