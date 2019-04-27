
import path from "path";

import * as peris from "./perisDb.js";



const test = async () => {
	updateItem("0011d8f2a2a2b8c7e0996430b88d12a7");
};


const updateItem = async id => {
	const file = (await peris.files.fetch({where: `hash = '${id}'`}))[0];
	if (!file)
		throw new Error("file not found");

	console.log("path:", path.resolve(process.env.RAW_DATA_PATH, file.path));
};



export {
	test,
};
