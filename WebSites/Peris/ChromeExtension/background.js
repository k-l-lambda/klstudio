
chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
	switch (request.action) {
		case "load":
			var whiteList = JSON.parse(localStorage.whiteList || null) || [];
			var active = whiteList.indexOf(request.hostname) >= 0;

			if (active)
				console.log("in-list tab load:", request.hostname);

			chrome.pageAction.setIcon({ tabId: sender.tab.id, path: active ? "logo16.png" : "logo16-inactive.png" });
			chrome.pageAction.show(sender.tab.id);

			if (active)
				chrome.tabs.sendMessage(sender.tab.id, { action: "activate" });

			break;
		case "downloadImage":
			chrome.downloads.download({ url: request.url });
			console.log("image downloading: " + request.url);

			break;
	}
});
