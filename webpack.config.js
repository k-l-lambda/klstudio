
const path = require("path");
const webpack = require("webpack");
const VueLoaderPlugin = require('vue-loader/lib/plugin');

const entries = require("./entries.js");



const mode = process.env.NODE_ENV == "development" ? "development" : "production";


module.exports = {
	entry: entries.reduce((result, entry) => (result[entry.name] = path.resolve(__dirname, `app/entries/${entry.name}.js`), result), {}),

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
				/*options: {
					loaders: {
						scss: "vue-style-loader!css-loader!postcss-loader",
					},
				},*/
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
			{
				test: /\.css$/,
				loader: "style-loader!css-loader",
			},
			{
				test: /\.(png|jpg|svg)$/,
				include: [
					path.resolve(__dirname, "app/images"),
				],
				loader: "url-loader",
				options: {
					limit: 0x40000,	// 256KB
				},
			},
		],
	},

	plugins: [
		new webpack.DefinePlugin({
			"process.env": {
				NODE_ENV: JSON.stringify(process.env.NODE_ENV),
			},
		}),
		new VueLoaderPlugin(),
	],

	mode,
};