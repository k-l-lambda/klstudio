
export default {
	"xsnvshen\\.com\\/album\\/new\\/": (page, callbacks) => {
		console.log("xsnvshen.new content script loaded.");

		page.evaluate(() => {
			const log = document.createElement("div");
			log.innerHTML = `<div id="xbrowser-logs"></div>`;

			document.body.appendChild(log);

			const styleSheet = document.createElement("style")
			styleSheet.type = "text/css"
			styleSheet.innerText = `
				#xbrowser-logs
				{
					position: fixed;
					bottom: 6em;
					left: 0;
					font-weight: bold;
					font-size: 360%;
					background-color: white;
					padding: .2em;
					transition: background-color .6s ease-out;
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
		});

		const listenDownloads = async () => {
			while (true) {
				const url = await page.evaluate(() => new Promise(resolve => {
					console.log("XBrowser.listenDownload.");
					document.onkeydown = event => {
						if (!["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
							switch (event.code) {
							case "KeyV":
								const hzImg = document.querySelector("#hzImg img");
								if (hzImg)
									resolve(hzImg.src);

								break;
							}
						}
					};
				}));

				callbacks.pickImage(url).then(result => {
					page.evaluate(result => {
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
					}, result);
				});
			}
		};

		listenDownloads();
	},
};
