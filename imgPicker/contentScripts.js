
export default {
	"xsnvshen\\.com\\/album\\/new\\/": page => {
		console.log("xsnvshen.new content script loaded.");

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

				console.log("url:", url);
			}
		};

		listenDownloads();
		/*console.log("XBrowser content script loaded.", imageMIMETypes);

		document.onwheel = event => {
			//console.log("onwheel:", event);
			const delta = event.deltaY > 0 ? 1 : -1;

			SetImgIndex(album_img_current_index + delta);

			event.preventDefault();
		};*/
	},
};
