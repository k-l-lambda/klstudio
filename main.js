
import "./env.js";

import express from "express";
import http from "http";

import * as dataset from "./dataset.js";



const app = express();

const httpServer = http.createServer(app);

const port = process.env.PORT;


httpServer.listen(port, "0.0.0.0", () => {
	console.log("Peris.node online:", `http://localhost:${port}`);
});


dataset.test();
