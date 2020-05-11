
import fs from "fs";
import path from "path";

import dotenvEx from "dotenv-expand";
import dotenv from "dotenv";



const appRoot = fs.realpathSync(".");


const dotenvName = path.resolve(appRoot, ".env");


const dotenvFiles = [
	`${dotenvName}.local`,
	dotenvName,
].filter(Boolean);


dotenvFiles.forEach(path => {
	if (fs.existsSync(path))
		dotenvEx(dotenv.config({ path }));
});
