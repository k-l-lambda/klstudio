
import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";

import "./env.js";



const mountAnalyzer = ({analyzerURL}) => {
	const styleSheet = document.createElement("style")
	styleSheet.type = "text/css"
	styleSheet.innerText = `
		html
		{
			overflow: hidden;
		}

		body
		{
			outline: 2px solid orange;
			margin: 2px;
		}

		.analyzer-frame
		{
			display: none;
			position: fixed;
			right: 0;
			top: 0;
			height: 100vh;
			min-width: 142vh;
			width: 40vw;
			border-right: 0;
			border-top: 0;
			border-bottom: 0;
		}

		body.analyzing
		{
			padding-right: max(40vw, 142vh);
			margin-right: 0 !important;
		}

		.analyzing .base-layout
		{
			padding-right: max(40vw, 142vh);
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

	let moveList = null;

	const listenMoveList = list => {
		list.addEventListener("DOMNodeInserted", () => {
			//console.log("DOMNodeInserted");
			syncGame();
		});
		console.debug("Listening to move list.");
	};

	const syncGame = () => {
		const list = document.querySelector("vertical-move-list") || document.querySelector("wc-vertical-move-list");
		if (!list) {
			console.debug("No move list found, sync game cancelled.");
			return;
		}

		if (list !== moveList) {
			moveList = list;
			listenMoveList(list);
		}

		const moves = [...list.querySelectorAll(".node")].map(node => {
			const icons = node.querySelectorAll(".icon-font-chess");
			[...icons].forEach(icon => icon.dataset.figurine && (icon.textContent = icon.dataset.figurine));

			return node.textContent;
		});
		//console.assert(frame.contentWindow.$view, "null $view:", frame, frame && frame.contentWindow);
		if (frame.contentWindow.$view)
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
				else {
					document.body.classList.add("analyzing");
					window.$analyzer = frame.contentWindow;

					syncGame();
				}
			}

				break;
			case "F10":
				syncGame();

				break;
		}
	});

	const waitToListen = async () => {
		while (!moveList) {
			moveList = document.querySelector("vertical-move-list") || document.querySelector("wc-vertical-move-list");
			if (moveList) {
				listenMoveList(moveList);

				return;
			}

			await new Promise(resolve => setTimeout(resolve, 500));
		}
	};
	waitToListen();

	console.debug("Analyzer mounted.");
};


const listenPage = page => {
	console.log("listenPage:", page._client._sessionId);

	//page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36");

	page.on("domcontentloaded", () => {
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


process.on('uncaughtException', err => {
	console.warn('Caught exception:', err);
});


main();
