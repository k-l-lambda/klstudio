
const path = require("path");
const webpack = require("webpack");
const VueLoaderPlugin = require('vue-loader/lib/plugin');



const mode = process.env.NODE_ENV == "development" ? "development" : "production";


module.exports = {
	entry: {
		"home": path.resolve(__dirname, "app/entries/home.js"),
	},

	output: {
		path: path.resolve(__dirname, "static/bundles"),
		filename: "[name].bundle.js",
		publicPath: "/",
	},

	module: {
		rules: [
			{
				test: /\.vue$/,
				include: path.resolve(__dirname, "app"),
				loader: "vue-loader",
			},
			{
				test: /\.js$/,
				include: path.resolve(__dirname, "app"),
				use: {
					loader: "babel-loader",
					options: {
						cacheDirectory: true,
					},
				},
			},
		],
	},

	plugins: [
		new VueLoaderPlugin(),
	],

	mode,
};
