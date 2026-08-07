
import * as express from "express";
import * as http from "http";
import * as https from "https";
import * as path from "path";
import * as fs from "fs";
//import {hideConsole} from "node-hide-console-window";

import "./env.js";
//import hot from "./hot";
//import entries from "./entries";



//const development = process.env.NODE_ENV === "development";


const HAS_HTTPS = !!process.env.HTTPS;

//hideConsole();


const credentials = HAS_HTTPS ? {
	key: fs.readFileSync(path.resolve("./certificates/key.pem"), "utf8"),
	cert: fs.readFileSync(path.resolve("./certificates/cert.pem"), "utf8"),
} : null;


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

// Long-lived cache for the large fixed-path assets (soundfont ~38 MB, chess opening libraries,
// FluidSynth/OpenCV wasm) so self-hosted deployments don't re-download them. On static hosts (GitHub
// Pages) this Express layer doesn't run; the asset cache service worker (public/asset-cache-sw.js)
// handles caching there. These mirror the SW's RULES table. Bounded max-age (not immutable) since the
// filenames are unversioned.
const longCache = {maxAge: "30d"};
app.use("/soundfont", express.static("./docs/soundfont", longCache));
app.use("/fluid", express.static("./docs/fluid", longCache));
app.use("/chess/open-games", express.static("./docs/chess/open-games", longCache));
app.use("/opencv.min.wasm", express.static("./docs/opencv.min.wasm", longCache));

app.use("/", express.static("./docs"));


/*if (development)
	hot(app);
else {
	entries.forEach(entry => app.get(entry.path, stringHandle(simpleTemplate(`/bundles/${entry.name}.bundle.js`, { title: entry.title }), "text/html")));
}*/


const httpServer = http.createServer(app);
const httpsServer = HAS_HTTPS ? https.createServer(credentials!, app) : null;

const port = Number(process.env.PORT);

if (HAS_HTTPS) {
	httpsServer!.listen(port, process.env.HOST, () => {
		console.log("K.L. Studio server online:", `https://${process.env.HOST}:${port}`);
	});
}
else {
	httpServer.listen(port, process.env.HOST, () => {
		console.log("K.L. Studio server online:", `http://${process.env.HOST}:${port}`);
	});
}
