
import "../env.js";

import fs from "fs";
import path from "path";

import * as peris from "../perisDb.js";



//console.log("files:", peris.files);

const dump = async oldDbPath => {
	const oldDb = JSON.parse(fs.readFileSync(oldDbPath));
	//console.log("oldDb:", oldDb);

	const paths = [];

	for (const item of oldDb) {
		const preceding = new Date(item.date);
		const file = (await peris.files.fetch({where: `hash = '${item.hash}'`}))[0];
		if (!file && item.path) {
			const filename = item.path.split("/").pop();
			if (filename.length >= 8) {
				const nameHit = (await peris.files.fetch({where: `path like '%${filename}'`}))[0];
				if (nameHit)
					continue;
			}
			paths.push(item.path);
			console.log(item.path, item.date);
		}
	}

	fs.writeFileSync("./missing-paths.txt", paths.join("\n"));

	console.log("Done.");
};


const mkdirp = filepath => {
	const dirname = path.dirname(filepath);

	if (fs.existsSync(dirname))
		return true;

	mkdirp(dirname);
	fs.mkdirSync(dirname);
}


const copyFiles = (dataRoot, targetFolder) => {
	const missingContent = fs.readFileSync("./missing-paths.txt");
	const paths = missingContent.toString().split("\n");

	//console.log("paths:", paths);
	for (const item of paths) {
		const sourcePath = path.resolve(dataRoot, item);
		const targetPath = path.resolve(targetFolder, item);
		mkdirp(targetPath);

		console.log("copy:", sourcePath, targetPath);
		fs.copyFileSync(sourcePath, targetPath);
	}

	console.log("Done.");
};


global.fs = fs;
global.dump = dump;
global.copyFiles = copyFiles;



// keep inspector connected
setTimeout(() => console.log("done."), 1e+8);
