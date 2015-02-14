
var Peris = Peris || {};


$("head").append("<link type='text/css' rel='stylesheet' href='" + chrome.extension.getURL("peris.css") + "'>");

chrome.extension.sendRequest({ action: "setPageAction", visible: true });


var surveryImage = function () {
	var image = $(this);
	image.addClass("Peris-survey");

	console.log(image.attr("src"), "loaded.");
};


var surveyImages = function (parent) {
	var images = parent.is("img") ? parent : parent.find("img");
	if (images.length) {
		console.log(images.length, "images found.");

		images.load(surveryImage);
	}
};


surveyImages($("body"));


$("body").live("DOMNodeInserted", function (ev) {
	surveyImages($(ev.target));
});
