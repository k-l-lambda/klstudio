
import {createApp} from "vue";

import App from "../fifth-pitch-graph.vue";
import Wrapper from "../app-wrapper.vue";



const app = createApp(Wrapper);
app.component("Content", App);


app.mount("body");
