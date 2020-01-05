
import fs from "fs";

import * as dataset from "./dataset.js";



const handleGetDatasetItem = async function (req, res) {
	try {
		const inputStram = await dataset.getItem(req.query.id);

		res.writeHead(200, {
			"Content-Type": "image/jpeg",
		});
		inputStram.pipe(res);
	}
	catch (error) {
		console.warn("handleGetDatasetItem error:", error);

		res.writeHead(404);
		res.write(error);
		res.end();
	}
};


/*const testExportLabel = async () => {
	const featureTags = process.env.FEATURE_TAGS.split(",");
	const labels = await dataset.exportLabels({limit: 1000}, featureTags);
	console.log("labels:", labels);
};
global.testExportLabel = testExportLabel;*/


const handleExportLabels = async function (req, res) {
	const featureTags = process.env.FEATURE_TAGS.split(",");
	const labels = await dataset.exportLabels({}, featureTags);

	//fs.writeFileSync("./labels.csv", labels);

	res.writeHead(200, {
		"Content-Type": "text/csv",
	});
	res.write(labels);
	res.end();
};



export default {
	"/get-dataset-item": {
		get: handleGetDatasetItem,
	},


	"/export-labels": {
		post: handleExportLabels,
	},
};
