
import fs from "fs";
import path from "path";
import sharp from "sharp";

import * as peris from "./perisDb.js";



const RAW_DATA_PATH = process.env.RAW_DATA_PATH;
const DATASET_PATH = process.env.DATASET_PATH;


/*const test = async () => {
	updateItem("0011d8f2a2a2b8c7e0996430b88d12a7");
};*/


const updateItem = async id => {
	const file = (await peris.files.fetch({where: `hash = '${id}'`}))[0];
	if (!file)
		throw new Error("file not found");

	const inputPath = path.resolve(RAW_DATA_PATH, file.path);
	console.log("update item:", id, inputPath);

	const image = sharp(inputPath)
		.resize({width: 1024, height: 1024, fit: "contain"})
		.jpeg({quality: 80})
		.toFile(path.resolve(DATASET_PATH, `${id}.jpg`));

	return image;
};


const getItem = async id => {
	const imagePath = path.resolve(DATASET_PATH, `${id}.jpg`);

	if (!fs.existsSync(imagePath))
		await updateItem(id);

	if (!fs.existsSync(imagePath))
		throw new Error(`peris item update failed: ${id}`);

	return fs.createReadStream(imagePath);
};



export {
	getItem,
};
