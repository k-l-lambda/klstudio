
chrome.tabs.getSelected(null, function (tab) {
	var whiteList = JSON.parse(localStorage.whiteList || null) || [];

	var hostname = new URL(tab.url).hostname;
	$("#host").text(hostname);

	var active = whiteList.indexOf(hostname) >= 0;

	$("#enabled").attr({ checked: active });

	$("#enabled").change(function () {
		var active = this.checked;

		chrome.pageAction.setIcon({ tabId: tab.id, path: active ? "logo16.png" : "logo16-inactive.png" });

		var index = whiteList.indexOf(hostname);

		if (active && index < 0)
			whiteList.push(hostname);
		else if (!active && index >= 0)
			whiteList.splice(index, 1);

		localStorage.whiteList = JSON.stringify(whiteList);

		console.log("Host", hostname, active ? "activated." : "deactivated.");
	});
});
