
let task = null;


chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
	switch (request.action) {
		case "startTask":
			console.log("startTask:", request, sender);
			/*chrome.browser.openTab({ url: "http://paper.people.com.cn/rmrb/html/2018-12/01/nw.D110000renmrb_20181201_1-01.htm" }, x => {
				console.log("tab opened:", x);
			});*/
			//open("http://paper.people.com.cn/rmrb/html/2018-12/01/nw.D110000renmrb_20181201_1-01.htm");

			switch (request.profile) {
				case "renminribao":
					task = {
						sponsor: sender.tab.id,
						profile: request.profile,
						options: request.options,
						status: {
							date: new Date(request.options.dateFrom).getTime(),
							page: Number(request.options.pageFrom),
							section: Number(request.options.sectionFrom),
						},
						result: "",
					};

					open("http://paper.people.com.cn");

					break;
				default:
					console.warn("unknown profile:", request.profile);
			}

			break;
		case "standby":
			//console.log("standby:", sender, request, task);
			if (task && request.profile == task.profile) {
				switch (task.profile) {
					case "renminribao":
						const captures = request.url.match(/renmrb_(\d\d\d\d)(\d\d)(\d\d)_(\d)-(\d\d)/);
						if (captures) {
							//console.log("captures:", captures);
							let [_, year, month, day, page, section] = captures;
							let date = new Date(`${year}-${month}-${day}`).getTime();
							page = Number(page);
							section = Number(section);

							++section;
							if (section > task.options.sectionTo) {
								section = Number(task.options.sectionFrom);
								++page;
							}

							if (page > task.options.pageTo) {
								page = Number(task.options.pageFrom);
								date += 86400e+3;
							}

							if (date > new Date(task.options.dateTo).getTime()) {
								console.log("task finished.");
								chrome.tabs.sendMessage(task.sponsor, { action: "result", profile: task.profile, text: task.result });

								return;
							}

							task.status = {
								date, page, section,
							};
						}

						console.log("navigate to:", task.status, request.url);
						chrome.tabs.sendMessage(sender.tab.id, { action: "navigate", options: task.status });

						break;
				}
			}

			break;
		case "got":
			//console.log("text got:", request.text);
			task.result += request.text;

			break;
	}
});
