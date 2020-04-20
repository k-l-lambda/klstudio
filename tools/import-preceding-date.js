
import "../env.js";

import fs from "fs";
import path from "path";

import * as peris from "../perisDb.js";



//console.log("files:", peris.files);

const importDate = async oldDbPath => {
	const oldDb = JSON.parse(fs.readFileSync(oldDbPath));
	//console.log("oldDb:", oldDb);

	for (const item of oldDb) {
		const preceding = new Date(item.date);
		const file = (await peris.files.fetch({where: `hash = '${item.hash}'`}))[0];
		if (!file)
			console.warn("missing file:", item);
		else {
			//console.log("date:", file.path, preceding.toISOString(), file.date.toISOString());
			//console.log(preceding < file.date ? "early" : "late", preceding.toISOString(), file.date.toISOString(), file.path);

			if (preceding < file.date) {
				const itemPath = path.resolve(process.env.RAW_DATA_PATH, file.path);
				fs.utimesSync(itemPath, 0, preceding);
				console.log("mtime updated:", preceding.toISOString(), "<-", file.date.toISOString(), itemPath);
			}
		}
	}

	console.log("importDate done.");
};

global.fs = fs;
global.importDate = importDate;



// keep inspector connected
setTimeout(() => console.log("done."), 1e+8);
