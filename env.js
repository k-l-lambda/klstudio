
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";



const appRoot = fs.realpathSync(process.cwd());


const dotenvName = path.resolve(appRoot, ".env");


const dotenvFiles = [
	`${dotenvName}.local`,
	dotenvName,
].filter(Boolean);


dotenvFiles.forEach(path => {
	if (fs.existsSync(path))
		dotenvExpand(dotenv.config({ path }));
});
