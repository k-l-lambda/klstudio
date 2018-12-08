
const path = require("path");
const webpack = require("webpack");
const VueLoaderPlugin = require('vue-loader/lib/plugin');



module.exports = {
	entry: {
		"home": path.resolve(__dirname, "app/home.vue"),
	},

	output: {
		path: path.resolve(__dirname, "static/bundles"),
		filename: "[name].bundle.js",
	},

	module: {
		rules: [
			{
				test: /\.vue$/,
				include: path.resolve(__dirname, "app"),
				loader: "vue-loader",
			},
		],
	},

	plugins: [
		new VueLoaderPlugin(),
	],
};
