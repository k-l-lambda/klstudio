
const htmlCommonTemplate = "./app/html/CommonTemplate.html";



module.exports = {
	pages: {
		index: {
			entry: "./app/entries/home.ts",
			template: htmlCommonTemplate,
			title: "K.L. Studio",
		},
	},
	/*devServer: {
		proxy: `http://localhost:${process.env.PORT}`,
	},*/
};
