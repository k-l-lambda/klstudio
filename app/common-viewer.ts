
import {createApp} from "vue";

import App from "./common-viewer.vue";
import router from "./router";

createApp(App)
    .use(router)
    .mount("body");
