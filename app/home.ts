
import Vue from "vue";

import App from "./home.vue";

import router from "./router";



new Vue({
	router,
	render: h => h(App),
}).$mount("body");
