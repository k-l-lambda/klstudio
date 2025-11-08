
const htmlCommonTemplate = "./app/html/CommonTemplate.html";
const path = require("path");



module.exports = {
	publicPath: "./",
	outputDir: "docs",
	productionSourceMap: false,
	parallel: false,
	configureWebpack: {
		resolve: {
			alias: {
				vue: "@vue/compat",
				"vue-resize-directive": path.resolve(__dirname, "app/compat/vue-resize-directive.js"),
				"@k-l-lambda/lotus$": path.resolve(__dirname, "node_modules/@k-l-lambda/lotus/index.browser.ts"),
			},
			fallback: {
				url: require.resolve("url/"),
			},
		},
	},
	pages: {
		index: {
			entry: "./app/home.ts",
			template: htmlCommonTemplate,
			title: "K.L. Studio",
		},
		inner: {
			filename: "inner",
			entry: "./app/common-viewer.ts",
			template: htmlCommonTemplate,
			title: "K.L. Studio X",
		},
		embed: {
			filename: "embed.html",
			entry: "./app/embed.ts",
			template: htmlCommonTemplate,
			title: "K.L. Studio",
		},
	},
	chainWebpack: config => {
		config.cache(false);
		// remove FriendlyErrorsPlugin to avoid node-ipc usage in restricted environments
		config.plugins.delete("friendly-errors");
		// remove prefetch links for home page
		config.plugins.delete("prefetch-index");

		// disable TypeScript/Eslint checker and progress (reduce IPC/memory)
		config.plugins.delete("fork-ts-checker");
		config.plugins.delete("progress");

		// binary file loader
		config.module
			.rule("raw-binary")
			.test(/\.(dat|gltf)$/)
			.use("url-loader")
			.loader("url-loader");

		config.module
			.rule("text-url")
			.test(/\.(yaml)$/)
			.use("url-loader")
			.loader("url-loader");

		// ignore third-party packed js
		config.module
			.rule("js")
			.exclude
			.add(/.*\.min\.js$/)
			.end();
	},
		css: {
			loaderOptions: {
				sass: {
					// Vue CLI 5 + sass-loader v12
					additionalData: "",
				},
				scss: {
					additionalData: "",
				},
			},
		},
	devServer: {
		//proxy: `http://localhost:${process.env.PORT}`,
		https: !!process.env.HTTPS,
	},
};
