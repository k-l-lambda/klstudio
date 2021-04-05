
const mountLog = () => {
	const log = document.createElement("div");
	log.innerHTML = `<div id="xbrowser-logs"></div>`;

	document.body.appendChild(log);

	const styleSheet = document.createElement("style")
	styleSheet.type = "text/css"
	styleSheet.innerText = `
		#xbrowser-logs
		{
			position: fixed;
			bottom: 2em;
			left: 0;
			font-weight: bold;
			font-size: 60px;
			background-color: white;
			padding: .2em;
			transition: background-color .6s ease-out;
			opacity: 0.7;
			z-index: 1010;
		}

		#xbrowser-logs.activated
		{
			background-color: #0f6;
			transition: background-color .01s;
		}

		#xbrowser-logs.error
		{
			background-color: red;
			transition: background-color .01s;
		}
	`;
	document.head.appendChild(styleSheet);
};


const showLog = result => {
	//console.log("result:", result);
	const logs = document.querySelector("#xbrowser-logs");
	if (result) {
		logs.innerHTML = result;
		logs.classList.remove("error");
		logs.classList.add("activated");
		setTimeout(() => logs.classList.remove("activated"), 100);
	}
	else {
		logs.innerHTML = "ERROR";
		logs.classList.add("error");
	}
};


const msDelay = ms => new Promise(resolve => setTimeout(resolve, ms));


const mountGallery = selector => {
	const imgs = document.querySelectorAll(selector);
	const urls = [...imgs].map(img => img.src);
	console.log("mountGallery:", urls);

	const gallery = document.createElement("div");
	gallery.innerHTML = `<div id="xbrowser-gallery">
		<img />
		<div class="number"><span class="index"></span> / <span class="total">${urls.length}</span></div>
	</div>`;

	document.body.appendChild(gallery);

	const styleSheet = document.createElement("style")
	styleSheet.type = "text/css"
	styleSheet.innerText = `
		#xbrowser-gallery
		{
			position: fixed;
			left: 0;
			top: 0;
			width: 100vw;
			height: 100vh;
			background: #000a;
			z-index: 1000;
		}

		#xbrowser-gallery img
		{
			position: absolute;
			left: 50%;
			top: 50%;
			transform: translate(-50%, -50%);
			max-width: 100vw;
			max-height: 100vh;
		}

		#xbrowser-gallery .number
		{
			position: absolute;
			right: 2em;
			top: .4em;
			font-size: 14px;
			color: white;
		}

		#xbrowser-gallery img.owned
		{
			outline-color: green !important;
		}
	`;
	document.head.appendChild(styleSheet);

	const image = gallery.querySelector("img");

	let index = 0;
	const updateImage = () => {
		image.src = urls[index];

		const owned = window.xbrowser_downloadedURLs && window.xbrowser_downloadedURLs.has(image.src);
		if (owned)
			image.classList.add("owned");
		else
			image.classList.remove("owned");

		gallery.querySelector(".number .index").innerHTML = (index + 1).toString();
	};

	gallery.addEventListener("mousewheel", event => {
		//console.log("mousewheel:", event);
		index += event.deltaY > 0 ? 1 : -1;
		if (index < 0)
			index += urls.length;
		if (index >= urls.length)
			index -= urls.length;

		updateImage();
	});

	updateImage();
};


const listenHzDownloads = async (page, callbacks) => {
	while (true) {
		const url = await page.evaluate(() => new Promise(resolve => {
			console.log("XBrowser.listenHzDownloads.");
			document.onkeydown = event => {
				console.log("onkeydown:", event);
				if (!["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
					switch (event.code) {
					case "KeyV":
						const hzImg = document.querySelector("#hzImg img");
						if (hzImg) {
							resolve(hzImg.src);

							event.preventDefault();
						}

						break;
					}
				}
			};
		}));

		callbacks.pickImage(url).then(result => {
			page.evaluate(showLog, result);
		});
	}
};


const xsnvTraverse = async (page, callbacks) => {
	let next = false;
	while (true) {
		const {url, end} = await page.evaluate(next => new Promise(resolve => {
			console.log("XBrowser.xsnvTraverse.");

			// timeout if long waiting
			const timeoutHandle = setTimeout(() => {
				console.debug("image loading timeout:", window.album_img_current_index);
				resolve({timeout: true, end: window.album_img_current_index >= imageCount});
			}, 20e+3);

			const imageCount = document.querySelectorAll(".swl-item").length;
			const pick = () => {
				const end = window.album_img_current_index >= imageCount;
				resolve({
					url: bigImg.src,
					end,
				});

				clearTimeout(timeoutHandle);
			};

			if (next)
				window.SetImgIndex(window.album_img_current_index + 1);

			const bigImg = document.querySelector("#bigImg");
			if (!next && bigImg.complete)
				pick();
			else {
				bigImg.onload = pick;
				bigImg.onerror = () => {
					const src = bigImg.src;
					bigImg.src = "";

					setTimeout(() => {
						bigImg.src = src;
						console.debug("reload:", src);
					}, 200);
				};
			}
		}), next);
		next = true;

		if (url)
			callbacks.pickImage(url).then(result => {
				page.evaluate(showLog, result);
			});

		if (end)
			break;

		await msDelay(800);
	}

	page.close();
};



export default {
	"xsnvshen\\.com\\/album\\/new\\/": (page, callbacks) => {
		console.log("xsnvshen.new content script loaded.");

		page.evaluate(mountLog);

		listenHzDownloads(page, callbacks);
	},


	"xsnvshen\\.com\\/album\\/\\d+": (page, callbacks) => {
		console.log("xsnvshen.new album content script loaded.");

		page.evaluate(mountLog);

		xsnvTraverse(page, callbacks);
	},


	"girlimg\\.epio\\.app": async (page, callbacks) => {
		console.log("girlimg.epio content script loaded.");

		page.evaluate(mountLog);

		const urlToFilename = url => {
			const segments = decodeURIComponent(url).split(",").pop().split("/");
			const longName = segments[segments.length - 1].replace(/[?=<>&";()|*:\\]/g, "");
			const fileName = longName.substr(0, 4) + longName.substr(longName.length - 42) + ".jpg";

			return fileName;
		};

		const listenDownloads = async () => {
			page.evaluate(() => window.xbrowser_downloadedURLs = new Set());

			while (true) {
				//await page.waitForNavigation();
				const url = await page.evaluate(() => new Promise(resolve => {
					console.log("XBrowser.listenDownload.");
					document.onkeydown = event => {
						if (!["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
							switch (event.code) {
							case "KeyV":
								const img = document.querySelector("img:hover");
								if (img)
									resolve(img.src);

								break;
							}
						}
					};
				}));

				const filename = urlToFilename(url);
				callbacks.pickImage(url, filename).then(result => {
					let html = result;
					if (html.length > 16)
						html = `<span title="${result}">${result.substr(4, 8)}...${result.substr(result.length - 3)}</span>`;

					page.evaluate(showLog, html);

					if (result)
						page.evaluate(url => window.xbrowser_downloadedURLs.add(url), url);
				});
			}
		};

		listenDownloads();

		const pageURL = page.url();
		//console.log("pageURL:", pageURL);
		if (/article\/detail/.test(pageURL))
			setTimeout(() => page.evaluate(mountGallery, "article img"), 600);
		else {
			//const pageHash = page.url().split("#").slice(1).join("");
			const pageHash = await page.evaluate(() => location.hash);
			const offsetCaptures = pageHash.match(/offset=(\d+)/);
			const offset = offsetCaptures && Number(offsetCaptures[1]);
			console.debug("pageHash:", page.url(), pageHash, offset);

			await page.setRequestInterception(true);
			page.on("request", request => {
				//console.log("interceptedRequest:", request);
				const url = request.url();
				if (offset && /api\/article/.test(url)) {
					//console.log("article request:", request);
					const filterCapture = url.match(/(?<=filter=).*/);
					if (!filterCapture) {
						console.warn("unexpected article API request:", url);
						request.continue();
						return;
					}
					const filter = JSON.parse(decodeURIComponent(filterCapture[0]));

					filter.skip += offset;

					const newURL = url.replace(/(?<=filter=).*/, encodeURIComponent(JSON.stringify(filter)));
					request.continue({url: newURL});

					console.debug("article request offset:", offset, filter);
				}
				else
					request.continue();
			});
		}
	},


	"feedly\\.com": async (page, callbacks) => {
		await page.setExtraHTTPHeaders({Referer: 'https://yande.re/'});
		console.debug("Referer overwrited.");

		page.evaluate(mountLog);
		listenHzDownloads(page, callbacks);
	},


	"yande\\.re": async (page, callbacks) => {
		page.evaluate(mountLog);
		listenHzDownloads(page, callbacks);
	},
};
