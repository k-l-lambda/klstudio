
var Peris = Peris || {};


Peris.getImageFingerprint = function (url, callback) {
	var xmlHTTP = new XMLHttpRequest();
	xmlHTTP.open("GET", url, true);

	xmlHTTP.responseType = 'arraybuffer';

	xmlHTTP.onload = function (e) {
		var arr = new Uint8Array(this.response);

		$.ajax({
			url: Peris.PERIS_WEB_HOST + "/fingerprint",
			type: 'POST',
			contentType: 'application/octet-stream',
			data: arr,
			processData: false,
			dataType: "json",
			complete: function (xhr) {
				callback(JSON.parse(xhr.responseText));
			}
		});
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


Peris.fingerprintSimilarQuery = function (fingerprint, tolerance) {
	var pattern1 = Peris.fingerprintBlurPattern(fingerprint, tolerance);
	var pattern2 = Peris.fingerprintBlurPattern(Peris.mirrorFingerprint(fingerprint), tolerance);
	var sql = "select path from file_register\nwhere fingerprint regexp '" + pattern1 + "' or fingerprint regexp '" + pattern2 + "'";

	return sql;
};


$("head").append("<link type='text/css' rel='stylesheet' href='" + chrome.extension.getURL("peris.css") + "'>");

chrome.extension.sendRequest({ action: "setPageAction", visible: true });


var surveryImage = function () {
	var image = $(this);

	var src = image.attr("src");

	//console.log(src, "loaded.");

	if (this.naturalWidth >= Peris.SURVEY_IMG_DIMENSION_MIN && this.naturalHeight >= Peris.SURVEY_IMG_DIMENSION_MIN) {
		Peris.getImageFingerprint(src, function (json) {
			//console.log("Fingerprint for", src, ":", json);

			if (json.fingerprint) {
				image.addClass("Peris-survey-img");
				image.wrap("<span class='Peris-img-wrapper'></span>");

				var wrapper = image.parent();

				wrapper.data("fingerprint", json.fingerprint);

				var queryBtn = $("<button>Q</button>");
				queryBtn.appendTo(wrapper);

				var sql = Peris.fingerprintSimilarQuery(json.fingerprint);
				$.post(Peris.PERIS_WEB_HOST + "/query", { sql: sql }, function (json, s, ajax) {
					if (json.data) {
						ajax.userData.queryBtn.text(json.data.length);
					}
				}, "json").userData = { queryBtn: queryBtn };

				queryBtn.click(function () {
					//console.log("fingerprint:", $(this).parent().data("fingerprint"));
					var sql = Peris.fingerprintSimilarQuery($(this).parent().data("fingerprint"));
					open(Peris.PERIS_WEB_HOST + "#expandViewer&sql=" + encodeURIComponent(sql), "_blank");
				});
			}
		});
	}
	else {
		console.log("Drop too small image:", this.naturalWidth, this.naturalHeight);
	}
};


var surveyImages = function (parent) {
	var images = parent.is("img") ? parent : parent.find("img");
	if (images.length) {
		//console.log(images.length, "images found.");

		images.load(surveryImage);
	}
};

surveyImages($("body"));


$("body").live("DOMNodeInserted", function (ev) {
	surveyImages($(ev.target));
});
