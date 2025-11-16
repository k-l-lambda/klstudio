
import {createApp} from "vue";

import App from "../spiral-piano.vue";
import Wrapper from "../app-wrapper.vue";



// Vue 3: register Content as global component via app


const app = createApp(Wrapper);
app.component("Content", App);
app.mount("body");
