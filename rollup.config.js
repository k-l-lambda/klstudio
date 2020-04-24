
import path from "path";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";



export default [
	"index",
].map(entry => ({
	input: `./${entry}.js`,

	output: {
		format: "iife",
		file: path.posix.join("dist", `${entry}.bundle.js`),
	},

	plugins: [
		resolve({
			browser: true,
		}),
		commonjs({
			include: 'node_modules/**',
		}),
	],
}));
