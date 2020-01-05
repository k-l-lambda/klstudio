
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


const testExportLabel = async () => {
	const featureTags = process.env.FEATURE_TAGS.split(",");
	const labels = await dataset.exportLabels({limit: 1000}, featureTags);
	console.log("labels:", labels);
};
global.testExportLabel = testExportLabel;



export default {
	"/get-dataset-item": {
		get: handleGetDatasetItem,
	},
};
