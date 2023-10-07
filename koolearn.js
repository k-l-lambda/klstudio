
import path from "path";
import puppeteer from "puppeteer";

import "./env.js";



const listenPage = async page => {
	console.log("listenPage:", page._client._sessionId);

	//page.evaluate(() => document.write = function (...x) { console.debug('document.write:', x); });

	while (true) {
		await Promise.race([
			new Promise(resolve => page.once("domcontentloaded", resolve)),
			new Promise(resolve => page.on("load", resolve)),
			//new Promise(resolve => setTimeout(resolve, 5e+3)),
		]).then(() => {
			console.debug("page loaded:", page.url());

			page.evaluate(() => {
				if (window.checkHandle)
					return;

				window.checkHandle = setInterval(() => {
					console.log("check:", new Date());
					const next = document.querySelector(".jp-next-url.prac-btn");
					if (next) {
						next.click();
						return;
					}
					const c = document.querySelector("button[i='close']");
					c && (console.log("close"), c.click());
					const f = document.querySelector(".p-close-app i");
					f && (console.log("fold"), f.click());
					const p = document.querySelector("div[class^='playkoolearn']");
					p && p.style.display == "block" && (console.log("play"), p.click());
				}, 10e+3);
			});
		});
	}
};


const main = async () => {
	const pathToExtension = [
		"ScreenRecorder",
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
			//"--no-sandbox", "--disable-gpu",
		],
		executablePath: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
	});
	browser.on("targetcreated", async target => {
		const page = await target.page();
		if (page)
			listenPage(page);
	});

	const pages = await browser.pages();
	pages.forEach(listenPage);
};


process.on('uncaughtException', err => {
	console.warn('Caught exception:', err);
});


main();
