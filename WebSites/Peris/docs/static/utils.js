
var Peris = Peris || {};


Peris.isIPad = (/ipad/i).test(navigator.userAgent);
Peris.isTouchDevice = "ontouchstart" in window;


Date.prototype.format = function (format) {
	/*
	* eg:format="yyyy-MM-dd hh:mm:ss";
	*/
	var o = {
		"M+": this.getMonth() + 1,  //month
		"d+": this.getDate(),     //day
		"h+": this.getHours(),    //hour
		"m+": this.getMinutes(),  //minute
		"s+": this.getSeconds(), //second
		"q+": Math.floor((this.getMonth() + 3) / 3),  //quarter
		"S": this.getMilliseconds() //millisecond
	};

	if (/(y+)/.test(format)) {
		format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	}

	for (var k in o) {
		if (new RegExp("(" + k + ")").test(format)) {
			format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
		}
	}
	return format;
};


Peris.parseQueries = function (source) {
	var m = source.match(/^.*\?(.*)$|^([^\?]*)$/);
	var q = m[1] || m[2];

	var queries = q.match(/[^#\&\?]+/g);

	var dict = {};
	for (var i in queries) {
		var pair = queries[i].split("=");
		dict[pair[0]] = pair[1];
	}

	return dict;
};


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

Peris.moveDuplicatedFigureFiles = function (data, targetDir) {
	if (targetDir === undefined)
		targetDir = "{data_root}";

	for (var i in data) {
		if (i > 0 && data[i].hash == data[i - 1].hash) {
			var path = Peris.extendFigurePath(data[i].path);

			$.post("/exec", { command: "os.system(r'move \"" + path + "\"  " + targetDir + " ')" }, function (json, s, xhr) {
				console.log("exec:", json);

				$.post("/check-file", { path: xhr.user_path }, function (json) {
					console.log("check:", json);
				});
			}).user_path = data[i].path;
		}
	}
};

Peris.batchProcessFiles = function (data, command, options) {
	options = options || {};

	if (options.checkPath === undefined)
		options.checkPath = ["{path}"];

	var date = new Date().format("yyyyMMddThhmmss");

	for (var i in data) {
		if (options.filter && !options.filter(data[i]))
			continue;

		(function () {
			var ii = i;
			var path = Peris.extendFigurePath(data[ii].path);
			var dirs = data[ii].path.split("/");
			var filename = dirs ? dirs[dirs.length - 1] : "";
			var segs = filename.match(/(.*)\.([^\.]*)/);
			var stem = segs ? segs[1] : "";
			var ext = segs ? segs[2] : "";
			var cmd = command.replace(/{path}/g, path);
			cmd = cmd.replace(/{filename}/g, filename);
			cmd = cmd.replace(/{stem}/g, stem);
			cmd = cmd.replace(/{ext}/g, ext);
			cmd = cmd.replace(/{date}/g, date);

			setTimeout(function () {
				$.post("/exec", { command: "os.system(r'" + cmd + "')" }, function (json, s, xhr) {
					console.log(data.length - xhr.user_data.index, "exec:", json);

					for (var ip in options.checkPath) {
						var ck = options.checkPath[ip].replace(/{path}/g, xhr.user_data.path);
						ck = ck.replace(/{filename}/g, xhr.user_data.filename);
						ck = ck.replace(/{stem}/g, xhr.user_data.stem);
						ck = ck.replace(/{ext}/g, xhr.user_data.ext);
						ck = ck.replace(/{date}/g, date);

						$.post("/check-file", { path: ck }, function (json) {
							console.log("check:", json);
						});
					}
				}).user_data = { index: ii, path: data[ii].path, filename: filename, stem: stem, ext: ext };
			}, ii * 60);
		})();
	}
};


Peris.getImageData = function (url, callback) {
	var xmlHTTP = new XMLHttpRequest();
	xmlHTTP.open("GET", url, true);

	xmlHTTP.responseType = 'arraybuffer';

	xmlHTTP.onload = function (e) {
		var arr = new Uint8Array(this.response);
		var raw = String.fromCharCode.apply(null, arr);

		callback(raw, this.response);
	};

	xmlHTTP.send();
};


Peris.getImageFingerprint = function (url, callback) {
	Peris.getImageData(url, function (raw, arr) {
		$.ajax({
			url: "/fingerprint",
			type: 'POST',
			contentType: 'application/octet-stream',
			data: arr,
			processData: false,
			dataType: "json",
			complete: function (xhr) {
				callback(xhr.responseJSON);
			}
		});
	});
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


Peris.openSimilarQuery = function (fingerprint, tolerance) {
	var pattern1 = Peris.fingerprintBlurPattern(fingerprint, tolerance);
	var pattern2 = Peris.fingerprintBlurPattern(Peris.mirrorFingerprint(fingerprint), tolerance);
	var sql = "select path from file_register left join cbir on file_register.hash = cbir.hash\nwhere thumb regexp '" + pattern1 + "' or thumb regexp '" + pattern2 + "'";

	open("#expandViewer&sql=" + encodeURIComponent(sql), "_blank");
};
