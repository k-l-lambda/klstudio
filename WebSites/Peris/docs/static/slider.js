
var Peris = Peris || {};


Peris.Slider = function (viewer) {
	this.Viewer = viewer;

	this.initialize();
};

Peris.Peer.prototype.Showing = false;
Peris.Peer.prototype.CurrentIndex = 0;
Peris.Peer.prototype.PathList = [];


Peris.Slider.prototype.initialize = function () {
	this.Panel = $("<div class='slider fullscreen-panel'>"
		+ "<button class='exit'></button>"
		+ "</div>");

	this.Panel.appendTo("body");

	var slider = this;

	this.Panel.click(function () { slider.onClick(event); });

	$(document).keydown(function () {
		slider.onKeyDown(event);
	});

	this.Panel.find(".exit").click(function () { slider.close(); });
};

Peris.Slider.prototype.open = function (startIndex) {
	console.log("Slider open at", startIndex);

	this.CurrentIndex = startIndex;
	this.PathList = this.Viewer.PathList;

	this.Panel.fadeIn();

	this.Showing = true;
};

Peris.Slider.prototype.close = function () {
	this.Panel.fadeOut();

	this.Showing = false;
};

Peris.Slider.prototype.currentPath = function () {
	return this.PathList[this.CurrentIndex];
};

Peris.Slider.prototype.onClick = function (e) {
};

Peris.Slider.prototype.onKeyDown = function (e) {
	if (this.Showing) {
		var handled = true;

		switch (e.keyCode) {
			case 27: // esc
				this.close();

				break;
			default:
				handled = false;
				console.log(e.keyCode);
		}

		if (handled)
			e.preventDefault();
	}
};
