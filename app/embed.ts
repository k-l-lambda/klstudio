
import {createApp} from "vue";
import {createRouter, createWebHashHistory} from "vue-router";

import App from "./embed.vue";

import {routes} from "./router";



const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        ...routes,
        {path: "/", redirect: "/globe-cube3"},
    ],
});


createApp(App)
	.use(router)
	.mount("#app");
