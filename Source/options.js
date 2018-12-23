
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
