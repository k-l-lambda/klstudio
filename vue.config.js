
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
	},
	/*devServer: {
		proxy: `http://localhost:${process.env.PORT}`,
	},*/
};
