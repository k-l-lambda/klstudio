
import fs from "fs";
import path from "path";
import sharp from "sharp";

import * as peris from "./perisDb.js";
//global.peris = peris;



const RAW_DATA_PATH = process.env.RAW_DATA_PATH;
const DATASET_PATH = process.env.DATASET_PATH;


const datasetImagePath = id => path.resolve(DATASET_PATH, `${id}.jpg`);


const formatItem = (inputPath, outputPath) => sharp(inputPath)
	.resize({width: 1024, height: 1024, fit: "contain"})
	.jpeg({quality: 80})
	.toFile(outputPath);


const updateItem = async id => {
	const file = (await peris.files.fetch({where: `hash = '${id}'`}))[0];
	if (!file)
		throw new Error("file not found");

	const inputPath = path.resolve(RAW_DATA_PATH, file.path);
	console.log("update item:", id, inputPath);

	return formatItem(inputPath, datasetImagePath(id));
};


const updateItems = async query => {
	const result = await new Promise((resolve, reject) => peris.connection.query(query, (err, result) => {
		if (err)
			reject(err);
		else
			resolve(result);
	}));

	result.forEach(item => {
		console.assert(item.id, "id is null.", item);
		console.assert(item.path, "path is null.", item);

		const inputPath = path.resolve(RAW_DATA_PATH, item.path);
		console.log("update item:", item.id, inputPath);

		return formatItem(inputPath, datasetImagePath(item.id));
	});
};
//global.updateItems = updateItems;


const copyItems = async (query, destDir) => {
	const result = await new Promise((resolve, reject) => peris.connection.query(query, (err, result) => {
		if (err)
			reject(err);
		else
			resolve(result);
	}));

	result.forEach(item => {
		console.assert(item.id, "id is null.", item);
		console.assert(item.path, "path is null.", item);

		const sourcePath = datasetImagePath(item.id);
		const destPath = path.resolve(destDir, `${item.id}.jpg`);

		if (fs.existsSync(sourcePath))
			fs.copyFile(sourcePath, destPath, err => err && console.warn("copy file error:", err));
		else
			console.warn("image not exist:", item.id);
	});
};
global.copyItems = copyItems;


const getItem = async id => {
	const imagePath = datasetImagePath(id);

	if (!fs.existsSync(imagePath))
		await updateItem(id);

	if (!fs.existsSync(imagePath))
		throw new Error(`peris item update failed: ${id}`);

	return fs.createReadStream(imagePath);
};


const exportLabels = async (fetchOptions, featureTags) => {
	let result = ["hash", "score", ...featureTags, "identity"].join(",") + "\n";

	const data = await peris.labels.fetch(fetchOptions);
	for (const item of data) {
		const tags = new Set((item.tags || "").split("|"));
		const features = featureTags.map(tag => tags.has(tag) ? 1 : 0);

		featureTags.forEach(tag => tags.delete(tag));
		console.assert(tags.size <= 1, "multiple identity:", [...tags]);
		const identity = [...tags].join("|");

		const fields = [item.hash, item.score, ...features, identity];

		result += fields.join(",") + "\n";
	}

	return result;
};



export {
	getItem,
	updateItems,
	exportLabels,
};
