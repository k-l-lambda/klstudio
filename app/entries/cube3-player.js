
import Vue from "vue";

import App from "../cube3-player.vue";
import Wrapper from "../app-wrapper.vue";



Vue.component("Content", App);


new Vue({
	render: h => h(Wrapper),
}).$mount("body");