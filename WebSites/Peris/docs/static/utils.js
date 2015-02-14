
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


Peris.extendFigurePath = function (path) {
	return "{data_root}" + path.replace(/\//g, "\\");
};

Peris.showFileInFolder = function (path) {
	$.post("/exec", { command: "os.system(r'explorer /select," + Peris.extendFigurePath(path) + "')" }, function (json) {
		console.log(json);
	});
};

Peris.moveDuplicatedFigureFiles = function (data) {
	for (var i in data) {
		if (i > 0 && data[i].hash == data[i - 1].hash) {
			var path = Peris.extendFigurePath(data[i].path);

			$.post("/exec", { command: "os.system(r'move \"" + path + "\"  {data_root} ')" }, function (json, s, xhr) {
				console.log(json);

				$.post("/check-file", { path: xhr.user_path }, function (json) {
					console.log(json);
				});
			}).user_path = data[i].path;
		}
	}
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


var hexBlurPattern = function (c, distance) {
	var center = parseInt(c, 16);
	var chars = "";
	for (var i = Math.max(center - distance, 0); i <= Math.min(center + distance, 15); ++i)
		chars += i.toString(16);

	return chars;
};

Peris.fingerprintBlurPattern = function (fingerprint, distance) {
	distance = distance || 1;

	var pattern = "";

	for (var i in fingerprint) {
		pattern += "[" + hexBlurPattern(fingerprint[i], distance) + "]";
	}

	return pattern;
};

Peris.mirrorFingerprint = function (fingerprint) {
	var result = fingerprint.substr(0, 4).split("").reverse().join("");
	result += fingerprint.substr(4, 4).split("").reverse().join("");
	result += fingerprint.substr(8, 4).split("").reverse().join("");
	result += fingerprint.substr(12, 4).split("").reverse().join("");

	return result;
};
