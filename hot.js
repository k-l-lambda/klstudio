
const webpack = require("webpack");
const webpackMerge = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const devMiddleware = require("webpack-dev-middleware");
const hotMiddleware = require("webpack-hot-middleware");
const FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin");
const ip = require("ip");

const webpackBase = require("./webpack.config.js");



const hotUrl = mark => `webpack-hot-middleware/client?name=${mark}?timeout=2000&overlay=true&reload=true`;

const entries = Object.keys(webpackBase.entry).reduce((result, key) => {
	const value = webpackBase.entry[key];
	const hm = hotUrl(key);

	result[key] = Array.isArray(value) ? [...value, hm] : [value, hm];

	return result;
}, {});


const config = webpackMerge(webpackBase, {
	entry: entries,
	devtool: "eval-cheap-source-map",
	optimization: {
		noEmitOnErrors: true,
	},
	plugins: [
		new HtmlWebpackPlugin({
			inject: true,
			filename: "index.html",
			template: "./html/CommonTemplate.html",
			title: "dev - K.L. Studio",
			chunks: "home",
		}),

		new FriendlyErrorsWebpackPlugin({
			compilationSuccessInfo: {
				messages: [`The application is running: http://${ip.address()}:${process.env.PORT}.`],
			},
		}),
		new webpack.HotModuleReplacementPlugin(),
	],
});

const compiler = webpack(config);



module.exports = function (app) {
	app.use(devMiddleware(compiler, {
		publicPath: webpackBase.output.publicPath,
		stats: "minimal",
	}));

	app.use(hotMiddleware(compiler, {log: false}));
};
