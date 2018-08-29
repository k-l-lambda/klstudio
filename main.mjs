
import express from "express";
import http from "http";



const app = express();

const httpServer = http.createServer(app);

const port = process.env.PORT || 8101;


httpServer.listen(port, "0.0.0.0", () => {
	console.log("Peris.node online:", `http://localhost:${port}`);
});
