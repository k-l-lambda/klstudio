
import path from "path";
import sharp from "sharp";

import * as peris from "./perisDb.js";



const test = async () => {
	updateItem("0011d8f2a2a2b8c7e0996430b88d12a7");
};


const updateItem = async id => {
	const file = (await peris.files.fetch({where: `hash = '${id}'`}))[0];
	if (!file)
		throw new Error("file not found");

	const path_input = path.resolve(process.env.RAW_DATA_PATH, file.path);
	console.log("path:", path_input);

	const image = sharp(path_input)
		.resize({width: 1024, height: 1024, fit: "contain"})
		.jpeg({quality: 80})
		.toFile(path.resolve(process.env.DATASET_PATH, `${id}.jpg`));
	//console.log("image:", image);

	return image;
};



export {
	test,
};
