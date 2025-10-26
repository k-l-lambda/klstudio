
import {createApp} from "vue";

import App from "./home.vue";
import router from "./router";

createApp(App)
    .use(router)
    .mount("body");
