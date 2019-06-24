
import Vue from "vue";

import App from "../hyperbolic.vue";
import Wrapper from "../app-wrapper.vue";



Vue.component("Content", App);


new Vue({
	render: h => h(Wrapper),
}).$mount("body");
