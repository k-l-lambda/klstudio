
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


var processedImages = {};


var surveyImage = function (image) {
	var wrapper = image.parent();
	wrapper.addClass("Peris-loading");

	var src = image.attr("src");

	console.log("Surveying image:", src);

	var queryBtn = wrapper.find(".Peris-quety");
	queryBtn.text("");

	Peris.getImageFingerprint(src, function (json) {
		//console.log("Fingerprint for", src, ":", json);

		if (json.fingerprint) {
			wrapper.data("fingerprint", json.fingerprint);

			queryBtn.attr({ title: json.fingerprint });

			var sql = Peris.fingerprintSimilarQuery(json.fingerprint);
			$.post(Peris.PERIS_WEB_HOST + "/query", { sql: sql }, function (json, s, ajax) {
				if (json.data) {
					ajax.userData.queryBtn.text(json.data.length);

					if (json.data.length)
						ajax.userData.queryBtn.addClass("Peris-matched");
				}

				wrapper.removeClass("Peris-loading");
			}, "json").userData = { queryBtn: queryBtn, wrapper: wrapper };

			queryBtn.click(function () {
				//console.log("fingerprint:", $(this).parent().data("fingerprint"));
				var sql = Peris.fingerprintSimilarQuery($(this).parent().data("fingerprint"));
				open(Peris.PERIS_WEB_HOST + "#expandViewer&sql=" + encodeURIComponent(sql), "_blank");

				event.preventDefault();
			});
		}
	});
};


var wrapImage = function () {
	var image = $(this);

	var src = image.attr("src");

	if (processedImages[src])
		return;

	processedImages[src] = true;
	//console.log(src, "loaded.");

	if (this.naturalWidth >= Peris.SURVEY_IMG_DIMENSION_MIN && this.naturalHeight >= Peris.SURVEY_IMG_DIMENSION_MIN) {
		image.addClass("Peris-img");
		image.wrap("<span class='Peris-img-wrapper'></span>");

		var wrapper = image.parent();

		var queryBtn = $("<button class='Peris-quety'>Q</button>");
		queryBtn.appendTo(wrapper);

		if (image.is(":visible") && Math.min(this.naturalWidth, this.naturalHeight) <= Peris.SURVEY_IMG_AUTO_SURVEY_DIMENSION_MAX)
			surveyImage(image);
		else {
			queryBtn.click(function () {
				var queryBtn = $(this);
				queryBtn.unbind("click");

				surveyImage(queryBtn.parent().find(".Peris-img"));

				event.preventDefault();
			});
		}
	}
	else {
		image.addClass("Peris-exclude-img");
		//console.log("Drop too small image:", this.naturalWidth, this.naturalHeight);
	}
};


var wrapImages = function (parent) {
	var images = parent.is("img") ? parent : parent.find("img");

	images.each(function(i, image) {
		if (image.complete)
			wrapImage.call(image);
		else
			$(image).load(wrapImage);
	});
};


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	switch (request.action) {
		case "activate":
			console.log("Peris Chrome Extension activated.");

			$("head").append("<link type='text/css' rel='stylesheet' href='" + chrome.extension.getURL("peris.css") + "'>");

			wrapImages($("body"));

			$("body").live("DOMNodeInserted", function (ev) {
				wrapImages($(ev.target));
			});

			break;
	}
});

chrome.extension.sendRequest({ action: "load", hostname: location.hostname });
