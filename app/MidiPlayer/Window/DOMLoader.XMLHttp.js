/*
	sendRequest({
		url: "./dir/something.extension",
		data: "test!",
		onerror: function(event) {
			console.log(event);
		},
		onload: function(response) {
			console.log(response.responseText);
		},
		onprogress: function (event) {
			var percent = event.loaded / event.total * 100 >> 0;
			loader.message("loading: " + percent + "%");
		}
	});

*/


export default function sendRequest (conf) {
	fetch(conf.url, conf.data).then(res => res.text()).then(data => {
		//console.log("data:", data);
		if (conf.onload)
			conf.onload({responseText: data});
	}).catch(e => {
		console.warn("DOMLoader.sendRequest error:", e);

		if (conf.onerror)
			conf.onerror(event, false);
	});
};
