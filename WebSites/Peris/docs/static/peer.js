
var Peris = Peris || {};


Peris.Peer = function (viewer) {
	this.Viewer = viewer;
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

Peris.Peer.prototype.initializePanel = function (slot) {
	console.log("open peer for ", slot.data("path"));
};
