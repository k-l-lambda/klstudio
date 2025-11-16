import {defineConfig, loadEnv} from "vite";
import vue from "@vitejs/plugin-vue";
import {viteStaticCopy} from "vite-plugin-static-copy";
import {fileURLToPath} from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
	// Load env file based on `mode` in the current working directory.
	// Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
	const env = loadEnv(mode, process.cwd(), '');

	return {
		assetsInclude: ["**/*.dat", "**/*.gltf", "**/*.yaml"],
		plugins: [
			vue({
				template: {
					compilerOptions: {
						compatConfig: {
							MODE: 2, // Vue 2 compat mode
						},
					},
				},
			}),
			viteStaticCopy({
				targets: [
					{
						src: "public/*",
						dest: ".",
					},
				],
			}),
		],
		resolve: {
			alias: {
				vue: "@vue/compat",
				"vue-resize-directive": path.resolve(__dirname, "app/compat/vue-resize-directive.js"),
				"@k-l-lambda/lotus$": path.resolve(__dirname, "node_modules/@k-l-lambda/lotus/index.browser.ts"),
			},
		},
		optimizeDeps: {
			exclude: ["plotly.min.js"],
			esbuildOptions: {
				define: {
					global: "globalThis",
				},
			},
		},
		build: {
			outDir: "docs",
			rollupOptions: {
				input: {
					index: path.resolve(__dirname, "index.html"),
					inner: path.resolve(__dirname, "inner.html"),
					embed: path.resolve(__dirname, "embed.html"),
				},
			},
			assetsDir: "assets",
			commonjsOptions: {
				include: [/node_modules/],
				transformMixedEsModules: true,
			},
		},
		server: {
			host: env.HOST || "localhost",
			port: parseInt(env.PORT) || 8080,
			https: !!env.HTTPS,
		},
		define: {
			__VUE_OPTIONS_API__: true,
			__VUE_PROD_DEVTOOLS__: false,
			__VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
			global: "globalThis",
			"process.env": {
				NODE_ENV: JSON.stringify(process.env.NODE_ENV || "production"),
				VUE_APP_DORME: JSON.stringify(env.VUE_APP_DORME || ""),
				VUE_APP_GOOGLE_ANALYTICS_ID: JSON.stringify(env.VUE_APP_GOOGLE_ANALYTICS_ID || ""),
			},
		},
	};
});
