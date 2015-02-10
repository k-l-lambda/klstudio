
var Peris = Peris || {};


Peris.isIPad = (/ipad/i).test(navigator.userAgent);
Peris.isTouchDevice = "ontouchstart" in window;


Peris.LocalDataEntry = function (name, data) {
	this.Name = name;
	this.Data = data;
};

Peris.LocalDataEntry.prototype.load = function () {
	if (localStorage[this.Name])
		this.Data = $.parseJSON(localStorage[this.Name]);

	return this.Data;
};

Peris.LocalDataEntry.prototype.save = function () {
	localStorage[this.Name] = $.toJSON(this.Data);
};


Peris.showFileInFolder = function (path) {
	$.post("/exec", { command: "os.system(r'explorer /select,%(data_root)s" + path.replace(/\//g, "\\") + "')" }, function (json) {
		console.log(json);
	});
};


Peris.getImageData = function (url, callback) {
	var xmlHTTP = new XMLHttpRequest();
	xmlHTTP.open("GET", url, true);

	xmlHTTP.responseType = 'arraybuffer';

	xmlHTTP.onload = function (e) {
		var arr = new Uint8Array(this.response);
		var raw = String.fromCharCode.apply(null, arr);

		callback(raw);
	};

	xmlHTTP.send();
};
