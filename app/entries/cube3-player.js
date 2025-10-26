
import {createApp} from "vue";

import App from "../cube3-player.vue";
import Wrapper from "../app-wrapper.vue";



const app = createApp(Wrapper);
app.component("Content", App);


app.mount("body");
