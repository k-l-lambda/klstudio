
import {createApp} from "vue";

import App from "../cube-cayley-graph.vue";
import Wrapper from "../app-wrapper.vue";



const app = createApp(Wrapper);
app.component("Content", App);


app.mount("body");
