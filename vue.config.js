
const htmlCommonTemplate = "./app/html/CommonTemplate.html";



module.exports = {
	publicPath: "./",
	outputDir: "docs",
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
		// remove prefetch links for home page
		config.plugins.delete("prefetch-index");

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
	/*css: {
		loaderOptions: {
			css: {
				// disabled css url module parsing
				url: false,
			},
		},
	},*/
	devServer: {
		//proxy: `http://localhost:${process.env.PORT}`,
		https: !!process.env.HTTPS,
	},
};
