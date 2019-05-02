
import "./env.js";

import express from "express";
import http from "http";

import service from "./service.js";



const app = express();

const httpServer = http.createServer(app);

const port = process.env.PORT;


Object.entries(service)
	.forEach(([path, value]) => Object.entries(value)
		.forEach(([method, handler]) => app[method](path, handler)));


httpServer.listen(port, "0.0.0.0", () => {
	console.log("Peris.node online:", `http://localhost:${port}`);
});
