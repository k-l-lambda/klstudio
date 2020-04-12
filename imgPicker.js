
const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");



const main = async () => {
	const browser = await puppeteer.launch({headless: false, args: [
		"--disable-web-security",
	]});
	const page = await browser.newPage();

	page.on("response", async response => {
		const url = response.url();
		const type = response.request().resourceType();
		//console.log("response:", type);
		if (type === "image") {
			let fileName = decodeURI(url.split("/").pop()).replace(/[?=<>&]/g, "");
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

	await page.goto("https://www.douban.com/", {waitUntil: "networkidle2"});
};


main();
