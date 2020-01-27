
import Vue from "vue";

import App from "./common-viewer.vue";

import router from "./router";



new Vue({
	router,
	render: h => h(App),
}).$mount("body");
