
import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";

import "./env.js";



const mountAnalyzer = ({analyzerURL}) => {
	const styleSheet = document.createElement("style")
	styleSheet.type = "text/css"
	styleSheet.innerText = `
		body
		{
			outline: 2px solid orange;
		}

		.analyzer-frame
		{
			display: none;
			position: fixed;
			right: 0;
			top: 0;
			height: 100vh;
			min-width: 120vh;
			width: 40vw;
		}

		body.analyzing
		{
			padding-right: 40vw;
		}

		.analyzing .base-layout
		{
			padding-right: 40vw;
		}

		.analyzing .analyzer-frame
		{
			display: block;
		}
	`;
	document.head.appendChild(styleSheet);

	const frame = document.createElement("iframe");
	frame.classList.add("analyzer-frame");
	frame.src = analyzerURL;

	const syncGame = () => {
		const moves = [...document.querySelectorAll("vertical-move-list .node")].map(node => node.textContent);
		frame.contentWindow.$view.setHistory(moves);
	};

	//document.body.classList.add("analyzing");
	document.body.appendChild(frame);

	document.addEventListener("keydown", event => {
		switch (event.code) {
			case "F9": {
				const analyzing = document.body.classList.contains("analyzing");
				if (analyzing)
					document.body.classList.remove("analyzing");
				else
					document.body.classList.add("analyzing");
			}

				break;
			case "F10":
				syncGame();

				break;
		}
	});

	console.debug("Analyzer mounted.");
};


const listenPage = page => {
	console.log("listenPage:", page._client._sessionId);

	page.on("load", () => {
		//console.log("page load:", page.url());

		page.evaluate(mountAnalyzer, {analyzerURL: process.env.ANALYZER_URL});
	});
};


const main = async () => {
	const pathToExtension = [
		"Proxy-SwitchySharp",
		"Stylus",
	].map(dir => path.join(process.cwd(), "extensions/", dir)).join(",");

	const browser = await puppeteer.launch({
		ignoreHTTPSErrors: true,
		headless: false,
		defaultViewport: null,
		userDataDir: "userData",
		args: [
			"--disable-web-security",
			`--disable-extensions-except=${pathToExtension}`,
			`--load-extension=${pathToExtension}`,
			"--disable-features=site-per-process",
		],
	});
	browser.on("targetcreated", async target => {
		const page = await target.page();
		if (page)
			listenPage(page);
	});

	const pages = await browser.pages();
	pages.forEach(listenPage);

	if (process.env.HOME_URL)
		pages[0].goto(process.env.HOME_URL);
};


main();
