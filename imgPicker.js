
import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";



const imageMIMETypes = [
	"image/jpeg",
	"image/jpg",
	"image/webp",
];


const urlToFilename = url => {
	const segments = decodeURIComponent(url).split(",").pop().split("/");
	const fileName = segments.slice(Math.max(1, segments.length - 2), segments.length)
		.join("_").replace(/[?=<>&";()|*:\\]/g, "").split("").reverse().slice(0, 120).reverse().join("");

	return fileName;
};


const listenPage = page => {
	console.log("listenPage:", page._client._sessionId);

	page.on("response", async response => {
		if (!response.ok)
			return;

		const url = response.url();
		const type = response.headers()["content-type"];
		//const type = response.request().resourceType();
		//console.log("response:", type);
		if (imageMIMETypes.includes(type)) {
			const fileName = urlToFilename(url);
			if (!fileName) {
				console.log("empty filename:", url);
				return;
			}
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
		userDataDir: "userData",
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

	pages[0].goto("chrome-search://local-ntp/local-ntp.html");
};


main();
