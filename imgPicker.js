
import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";



const listenPage = page => {
	console.log("listenPage:", page);

	page.on("response", async response => {
		const url = response.url();
		const type = response.request().resourceType();
		//console.log("response:", type);
		if (type === "image") {
			let fileName = decodeURIComponent(url.split("/").pop()).replace(/[?=<>&"]/g, "");
			if (fileName.length > 12)
				fileName = fileName.substr(fileName.length - 12, 12);
			if (!fileName)
				return;
			console.log("fileName:", fileName);

			const file = await response.buffer();
			const filePath = path.resolve("./cache/", fileName);
			try {
				const writeStream = fs.createWriteStream(filePath);
				writeStream.write(file);
			}
			catch (error) {
				console.warn("error writing file:", error);
			}
		}
	});
};


const main = async () => {
	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: null,
		args: [
			"--disable-web-security",
		],
	});
	browser.on("targetcreated", async target => {
		const page = await target.page();
		if (page)
			listenPage(page);
	});

	const pages = await browser.pages();
	pages.forEach(listenPage);
};


main();
