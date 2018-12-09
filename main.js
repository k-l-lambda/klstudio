
const express = require("express");
const http = require("http");

require("./env.js");
const hot = require("./hot.js");



const development = process.env.NODE_ENV == "development";


const simpleTemplate = (script, {title = "", preDoc = ""} = {}) => `
<!DOCTYPE html>
<html>
	<head>
		<title>${title}</title>
	</head>
	<body>
		${preDoc}
		<script src="${script}"></script>
	</body>
</html>
`;


const stringHandle = function(content, type) {
	return (req, res) => {
		res.writeHead(200, {"Content-Type": type});
		res.write(content);
		res.end();
	};
};


const app = express();


//express.static.mime.define({"application/wasm": ["wasm"]});

app.use("/", express.static("./static"));


const pageRouters = {
	"/": {
		get: stringHandle(simpleTemplate("/bundles/home.bundle.js", {title: "K.L. Studio"}), "text/html"),
	},
};

if (development)
	hot(app);
else
	Object.entries({...pageRouters}).forEach(([path, value]) => Object.entries(value).forEach(([method, handler]) => app[method](path, handler)));


const httpServer = http.createServer(app);

const port = Number(process.env.PORT);
httpServer.listen(port, "127.0.0.1", () => {
	console.log("K.L. Studio server online:", `http://localhost:${port}`);
});
