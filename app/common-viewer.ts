
import {createApp, configureCompat} from "vue";

import App from "./common-viewer.vue";
import router from "./router";

// Configure Vue 3 compat mode for better Vue 2 library compatibility
configureCompat({
	MODE: 2,
	WATCH_ARRAY: false,
});

createApp(App)
	.use(router)
	.mount("#app");
