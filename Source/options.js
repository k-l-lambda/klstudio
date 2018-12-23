
const createTextDownloadUrl = text =>
	URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));


window.onload = function () {
	document.querySelector("#renminribao .date-from").value = new Date(Date.now() - 86400000 * 30).format("yyyy-MM-dd");
	document.querySelector("#renminribao .date-to").value = new Date().format("yyyy-MM-dd");


	document.querySelector("#renminribao .start").addEventListener("click", () => {
		//open("http://paper.people.com.cn/rmrb/html/2018-12/01/nw.D110000renmrb_20181201_1-01.htm");
		const options = {
			dateFrom: document.querySelector("#renminribao .date-from").value,
			dateTo: document.querySelector("#renminribao .date-to").value,
			pageFrom: document.querySelector("#renminribao .page-from").value,
			pageTo: document.querySelector("#renminribao .page-to").value,
			sectionFrom: document.querySelector("#renminribao .section-from").value,
			sectionTo: document.querySelector("#renminribao .section-to").value,
		};
		chrome.extension.sendRequest({ action: "startTask", profile: "renminribao", options });
	});
};


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	//console.log("request:", request);
	switch (request.action) {
		case "result":
			switch (request.profile) {
				case "renminribao":
					console.log("result:", request.text);
					document.querySelector("#renminribao .result").value = request.text;

					document.querySelector("#renminribao .link").href = createTextDownloadUrl(request.text);

					break;
			}

			break;
		default:
			console.log("onMessage:", request);
	}
});
