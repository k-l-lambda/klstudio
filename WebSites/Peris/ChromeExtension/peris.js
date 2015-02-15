
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


var surveryImage = function () {
	var image = $(this);

	//if (image.is(".Peris-survey-img, .Peris-exclude-img"))
	//	return;

	var src = image.attr("src");

	if (processedImages[src])
		return;

	processedImages[src] = true;
	//console.log(src, "loaded.");

	if (this.naturalWidth >= Peris.SURVEY_IMG_DIMENSION_MIN && this.naturalHeight >= Peris.SURVEY_IMG_DIMENSION_MIN) {
		image.addClass("Peris-survey-img");
		image.wrap("<span class='Peris-img-wrapper'></span>");

		var wrapper = image.parent();

		var queryBtn = $("<button class='Peris-quety'></button>");
		queryBtn.appendTo(wrapper);

		wrapper.addClass("Peris-loading");

		Peris.getImageFingerprint(src, function (json) {
			//console.log("Fingerprint for", src, ":", json);

			if (json.fingerprint) {
				wrapper.data("fingerprint", json.fingerprint);

				queryBtn.attr({ title: json.fingerprint });

				var sql = Peris.fingerprintSimilarQuery(json.fingerprint);
				$.post(Peris.PERIS_WEB_HOST + "/query", { sql: sql }, function (json, s, ajax) {
					if (json.data) {
						ajax.userData.queryBtn.text(json.data.length);
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
	}
	else {
		image.addClass("Peris-exclude-img");
		//console.log("Drop too small image:", this.naturalWidth, this.naturalHeight);
	}
};


var surveyImages = function (parent) {
	var images = parent.is("img") ? parent : parent.find("img");

	images.each(function(i, image) {
		if (image.complete)
			surveryImage.call(image);
		else
			$(image).load(surveryImage);
	});
};


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	switch (request.action) {
		case "activate":
			console.log("Peris Chrome Extension activated.");

			$("head").append("<link type='text/css' rel='stylesheet' href='" + chrome.extension.getURL("peris.css") + "'>");

			surveyImages($("body"));

			$("body").live("DOMNodeInserted", function (ev) {
				surveyImages($(ev.target));
			});

			break;
	}
});

chrome.extension.sendRequest({ action: "load", hostname: location.hostname });
