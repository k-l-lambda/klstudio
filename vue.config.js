
const htmlCommonTemplate = "./app/html/CommonTemplate.html";



module.exports = {
	publicPath: "./",
	outputDir: "docs",
	pages: {
		index: {
			entry: "./app/main.ts",
			template: htmlCommonTemplate,
			title: "K.L. Studio",
		},
	},
	/*devServer: {
		proxy: `http://localhost:${process.env.PORT}`,
	},*/
};
