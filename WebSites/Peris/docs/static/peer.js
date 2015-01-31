
var Peris = Peris || {};


Peris.Peer = function (viewer) {
	this.Viewer = viewer;

	this.initialize();
};

Peris.Peer.prototype.initialize = function () {
	this.Panel = $("<div class='peer fullscreen-panel'></div>");

	this.Panel.appendTo("body");

	var peer = this;

	this.Panel.click(function () { peer.close(); });
};

Peris.Peer.prototype.open = function (slot) {
	var peer = this;

	if (slot.hasClass("filled"))
		this.initializePanel(slot);
	else
		this.Viewer.loadSlot(slot, function () {
			peer.initializePanel(slot);
		});
};

Peris.Peer.prototype.close = function () {
	var peer = this;

	this.Panel.fadeOut(function () {
		peer.Figure.detach();
		peer.Figure.appendTo(peer.SourceSlot);
	});
};

Peris.Peer.prototype.initializePanel = function (slot) {
	console.log("open peer for ", slot.data("path"));

	this.SourceSlot = slot;
	this.Figure = slot.find(".figure");

	this.Panel.fadeIn();

	this.Figure.detach();
	this.Figure.appendTo(this.Panel);
};
