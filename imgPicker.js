
import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";

import "./env.js";

import contentScripts from "./imgPicker/contentScripts.js";



const imageMIMETypes = [
	"image/jpeg",
	"image/jpg",
	"image/webp",
];


const urlToFilename = url => {
	const segments = decodeURIComponent(url).split(",").pop().split("/");

	if (/248m\.cc/.test(url)) {
		return segments.at(-1).replace(/\.jpg_[.\w]+/, '.jpg');
	}
	else {
		const fileName = segments.slice(Math.max(1, segments.length - 2), segments.length)
			.join("_").replace(/[?=<>&";()|*:\\]/g, "").split("").reverse().slice(0, 120).reverse().join("");

		return fileName;
	}
};


const listenPage = page => {
	console.log("listenPage:", page._client._sessionId);

	const responseDict = new Map();

	const pickImage = async (url, fileName = null) => {
		console.log("pickImage:", url);

		fileName = fileName || urlToFilename(url);
		if (!fileName) {
			console.warn("empty filename:", url);
			return;
		}

		const response = responseDict.get(url);
		if (!response) {
			console.warn("response not cached for", url);
			return;
		}

		console.log("pick image:", fileName);

		const buffer = await response.buffer();
		const filePath = path.resolve(process.env.CACHE_DIR, fileName);
		try {
			const writeStream = fs.createWriteStream(filePath);
			writeStream.write(buffer);
		}
		catch (error) {
			console.warn("error writing file:", error);
			return;
		}

		return fileName;
	};

	page.on("response", async response => {
		if (!response.ok)
			return;

		const url = response.url();
		const type = response.headers()["content-type"];
		//const type = response.request().resourceType();
		//console.log("response:", type);
		if (imageMIMETypes.includes(type) || url.endsWith(".jpg_gzip.aspx")) {
			responseDict.set(url, response);
			console.log("image cached:", url);
		}
	});

	/*page.once("load", () => {
		console.debug("page load:", page.url());
	})*/

	Promise.race([
		new Promise(resolve => page.once("domcontentloaded", resolve)),
		new Promise(resolve => page.on("load", resolve)),
		new Promise(resolve => setTimeout(resolve, 5e+3)),
	]).then(() => {
		console.debug("page loaded:", page.url());

		for (const pattern in contentScripts) {
			if (new RegExp(pattern).test(page.url())) {
				const script = contentScripts[pattern];
				//page.evaluate(script);
				script(page, {pickImage});
			}
		}
	});
};


const main = async () => {
	const pathToExtension = [
		"HoverZoom",
		"Proxy-SwitchySharp",
		"Stylus",
	].map(dir => path.join(process.cwd(), "extensions/", dir)).join(",");

	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: null,
		userDataDir: "userData",
		args: [
			"--disable-web-security",
			`--disable-extensions-except=${pathToExtension}`,
			`--load-extension=${pathToExtension}`,
			"--disable-background-timer-throttling",
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


process.on('uncaughtException', err => {
	console.warn('Caught exception:', err);
});


main();
