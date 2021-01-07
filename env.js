
import fs from "fs";
import path from "path";

import dotenvEx from "dotenv-expand";
import dotenv from "dotenv";



const appRoot = fs.realpathSync(".");


let scriptName = process.argv[process.argv.length - 1];
scriptName = scriptName && scriptName.match(/([\w_]+)\.\w+$/);
scriptName = scriptName && scriptName[1];

const dotenvName = path.resolve(appRoot, ".env");


const dotenvFiles = [
	`${dotenvName}.${scriptName}.local`,
	`${dotenvName}.local`,
	dotenvName,
].filter(Boolean);


dotenvFiles.forEach(path => {
	if (fs.existsSync(path))
		dotenvEx(dotenv.config({ path }));
});
