
var Peris = Peris || {};


Peris.Peer = function (viewer) {
	this.Viewer = viewer;

	this.initialize();
};

Peris.Peer.prototype.Showing = false;
Peris.Peer.prototype.Zoom = 1;
Peris.Peer.prototype.Translate = {x: 0, y: 0};
Peris.Peer.prototype.HoldingFigure = false;
Peris.Peer.prototype.DraggingFigure = false;


Peris.Peer.prototype.initialize = function () {
	this.Panel = $("<div class='peer fullscreen-panel'></div>");

	this.Panel.appendTo("body");

	var peer = this;

	this.Panel.click(function () { peer.onClick(event); });

	this.Panel.mouseup(function () { peer.onMouseUp(event); });
	this.Panel.mousemove(function () { peer.onMouseMove(event); });
};

Peris.Peer.prototype.open = function (slot) {
	var peer = this;

	if (slot.hasClass("filled"))
		this.initializePanel(slot);
	else
		this.Viewer.loadSlot(slot, function () {
			peer.initializePanel(slot);
		});

	document.onmousewheel = function () {
		peer.onMouseWheel(event);
	};

	this.Showing = true;
	this.Zoom = 1;
	this.Translate = { x: 0, y: 0 };
};

Peris.Peer.prototype.close = function () {
	var peer = this;

	this.Panel.fadeOut(function () {
		peer.Figure.css({ transform: "none" });
		peer.Figure.unbind("mousedown");
		peer.Figure.unbind("mouseup");
		peer.Figure.unbind("mousemove");

		peer.Figure.detach();
		peer.Figure.appendTo(peer.SourceSlot);
	});

	this.Showing = false;
};

Peris.Peer.prototype.initializePanel = function (slot) {
	console.log("open peer for", slot.data("path"));

	this.SourceSlot = slot;
	this.Figure = slot.find(".figure");

	this.Panel.fadeIn();

	this.Figure.detach();
	this.Figure.appendTo(this.Panel);

	var peer = this;

	this.Figure.mousedown(function () {
		if (event.button == 0) {
			peer.HoldingFigure = true;

			event.preventDefault();
		}
	});
};

Peris.Peer.prototype.onClick = function (e) {
	if (this.Showing) {
		switch (e.button) {
			// left button
			case 0:
				if (!this.DraggingFigure) {
					this.close();
				}

				this.DraggingFigure = false;

				break;
			// middle button
			case 1:
				this.Translate = { x: 0, y: 0 };

				this.Zoom = this.Figure[0].naturalWidth / this.Figure.width();
				this.updateTransform();

				break;
		}
	}
};

Peris.Peer.prototype.onMouseWheel = function (e) {
	if (this.Showing) {
		var oldZoom = this.Zoom;

		this.Zoom *= Math.exp(e.wheelDelta / 400);
		this.Zoom = Math.max(this.Zoom, 0.1);

		var delta = this.Zoom / oldZoom;

		this.Translate.x /= delta;
		this.Translate.y /= delta;

		this.updateTransform();
	}
};

Peris.Peer.prototype.onMouseUp = function (e) {
	this.HoldingFigure = false;
	this.Figure.css({ transition: "" });
};

Peris.Peer.prototype.onMouseMove = function (e) {
	if (this.HoldingFigure) {
		this.Translate.x += e.movementX / this.Zoom;
		this.Translate.y += e.movementY / this.Zoom;
		this.updateTransform();

		this.DraggingFigure = true;
		this.Figure.css({ transition: "none" });

		e.preventDefault();
	}
};

Peris.Peer.prototype.updateTransform = function (e) {
	this.Figure.css({ transform: "scale(" + this.Zoom + ", " + this.Zoom + ") translate(" + this.Translate.x + "px, " + this.Translate.y + "px)" });
};
