
const webpack = require("webpack");
const webpackMerge = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const devMiddleware = require("webpack-dev-middleware");
const hotMiddleware = require("webpack-hot-middleware");
const FriendlyErrorsWebpackPlugin = require("friendly-errors-webpack-plugin");
const ip = require("ip");

const webpackBase = require("./webpack.config.js");
const entries = require("./entries.js");



const hotUrl = mark => `webpack-hot-middleware/client?name=${mark}?timeout=2000&overlay=true&reload=true`;

const webpackEntry = entries.reduce((result, entry) => {
	const value = webpackBase.entry[entry.name];
	const hm = hotUrl(entry.name);

	result[entry.name] = Array.isArray(value) ? [...value, hm] : [value, hm];

	return result;
}, {});


const config = webpackMerge(webpackBase, {
	entry: webpackEntry,
	devtool: "eval-cheap-source-map",
	optimization: {
		noEmitOnErrors: true,
	},
	plugins: [
		...entries.map(entry => new HtmlWebpackPlugin({
			inject: true,
			filename: entry._filename,
			template: "./html/CommonTemplate.html",
			title: entry.title,
			chunks: [entry.name],
		})),

		new FriendlyErrorsWebpackPlugin({
			compilationSuccessInfo: {
				messages: [`The application is running: http://${ip.address()}:${process.env.PORT}.`],
			},
		}),
		new webpack.HotModuleReplacementPlugin(),
	],
});



module.exports = function (app) {
	const compiler = webpack(config);

	app.use(devMiddleware(compiler, {
		publicPath: webpackBase.output.publicPath,
		stats: "minimal",
	}));

	app.use(hotMiddleware(compiler, { log: false }));
};
