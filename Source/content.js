
const rules = [
	{
		pattern: /people\.com\.cn/,
		profile: "renminribao",
	},
];


const getRule = () => {
	for (const rule of rules)
		if (rule.pattern.test(location.href))
			return rule;
};


window.onload = function () {
	//console.log("crawler content.js");

	const rule = getRule();
	if (rule) {
		switch (rule.profile) {
			case "renminribao":
				const text_c = document.querySelector(".text_c");
				if (text_c) {
					const text = text_c.textContent;
					chrome.extension.sendRequest({ action: "got", text });
				}

				break;
		}

		chrome.extension.sendRequest({ action: "standby", profile: rule.profile, url: location.href });
	}
};


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	//console.log("request:", request);
	switch(request.action) {
		case "navigate":
			const date = new Date(request.options.date);

			const url = `/rmrb/html/${date.format('yyyy-MM')}/${date.format('dd')}/nw.D110000renmrb_${date.format('yyyyMMdd')}_${request.options.page}-${(request.options.section < 10 ? '0' : '') + request.options.section}.htm`;
			//console.log("navigating to", url);
			location.href = url;

			break;
		default:
			console.log("onMessage:", request);
	}
});
