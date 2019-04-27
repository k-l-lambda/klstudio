
import * as peris from "./perisDb.js";



const test = async () => {
	const f1 = await peris.files.fetch({where: "hash = '0011d8f2a2a2b8c7e0996430b88d12a7'"});
	console.log("test:", f1);
};



export {
	test,
};
