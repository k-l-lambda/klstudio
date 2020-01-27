
import * as express from "express";
import * as http from "http";

import "./env.js";
//import hot from "./hot";
//import entries from "./entries";



const development = process.env.NODE_ENV === "development";


/*const simpleTemplate = (script, { title = "", preDoc = "" } = {}) => `
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


const stringHandle = function (content, type) {
	return (req, res) => {
		res.writeHead(200, { "Content-Type": type });
		res.write(content);
		res.end();
	};
};*/


const app = express();


//express.static.mime.define({"application/wasm": ["wasm"]});

app.use("/", express.static("./static"));


/*if (development)
	hot(app);
else {
	entries.forEach(entry => app.get(entry.path, stringHandle(simpleTemplate(`/bundles/${entry.name}.bundle.js`, { title: entry.title }), "text/html")));
}*/


const httpServer = http.createServer(app);

const port = Number(process.env.PORT);
httpServer.listen(port, process.env.HOST, () => {
	console.log("K.L. Studio server online:", `http://${process.env.HOST}:${port}`);
});
