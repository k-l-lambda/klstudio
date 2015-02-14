
chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
	switch (request.action) {
		case "setPageAction":
			if (request.visible)
				chrome.pageAction.show(sender.tab.id);
			else
				chrome.pageAction.hide(sender.tab.id);

			break;
		case "downloadImage":
			chrome.downloads.download({ url: request.url });
			console.log("image downloading: " + request.url);

			break;
	}
});
