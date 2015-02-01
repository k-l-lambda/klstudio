
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
Peris.Peer.prototype.LoadingSlot = false;


Peris.Peer.prototype.initialize = function () {
	this.Panel = $("<div class='peer fullscreen-panel'>"
		+ "<button class='prev'>&lt;</button>"
		+ "<button class='next'>&gt;</button>"
		+ "<button class='show-slider'></button>"
		+ "</div>");

	this.Panel.appendTo("body");

	var peer = this;

	this.Panel.click(function () { peer.onClick(event); });

	this.Panel.mouseup(function () { peer.onMouseUp(event); });
	this.Panel.mousemove(function () { peer.onMouseMove(event); });

	this.Panel.find(".prev").click(function () { peer.prev(); });
	this.Panel.find(".next").click(function () { peer.next(); });
	this.Panel.find(".show-slider").click(function () { peer.showSlider(); });

	$(document).keydown(function () {
		peer.onKeyDown(event);
	});
};

Peris.Peer.prototype.open = function (slot) {
	console.assert(slot.length <= 1, "multiple slot open in peer:", slot);

	if (this.LoadingSlot) {
		console.warn("Slot is loading, cannot open new one:", slot.data("path"));
		return;
	}

	var peer = this;

	if (slot.hasClass("filled"))
		this.initializePanel(slot);
	else
		this.Viewer.loadSlot(slot, function () {
			peer.LoadingSlot = true;
			peer.initializePanel(slot);
		});

	document.onmousewheel = function () {
		peer.onMouseWheel(event);
	};

	this.Showing = true;
	this.Zoom = 1;
	this.Translate = { x: 0, y: 0 };

	this.Viewer.focusSlot(slot);
};

Peris.Peer.prototype.close = function () {
	var peer = this;

	this.Panel.fadeOut(function () {
		peer.clearSlotBinding();
	});

	this.Showing = false;
};

Peris.Peer.prototype.clearSlotBinding = function () {
	var figures = this.Panel.find(".figure");

	if (figures.length > 1)
		console.warn("multiple figure bond to peer:", figures);

	figures.css({ transform: "none" });
	figures.unbind("mousedown");
	figures.unbind("mouseup");
	figures.unbind("mousemove");

	figures.detach();
	figures.appendTo(this.SourceSlot);

	this.SourceSlot.removeClass("hangout");
};

Peris.Peer.prototype.prev = function () {
	if (this.SourceSlot && this.SourceSlot.prev(".slot.ready").length && !this.LoadingSlot) {
		this.clearSlotBinding();
		this.open(this.SourceSlot.prev(".slot.ready"));
	}
};

Peris.Peer.prototype.next = function () {
	var next = this.SourceSlot.next(".slot.ready");

	if (this.SourceSlot && next.length && !this.LoadingSlot) {
		this.clearSlotBinding();

		if (!next.next(".slot.ready").length)
			this.Viewer.laySlotsRow();

		this.open(next);
	}
};

Peris.Peer.prototype.showSlider = function () {
};

Peris.Peer.prototype.initializePanel = function (slot) {
	console.log("open peer for", slot.data("path"));

	this.SourceSlot = slot;
	this.Figure = slot.find(".figure");

	this.Panel.fadeIn();

	slot.css({ height: slot.height() + "px" });
	slot.addClass("hangout");

	this.Figure.detach();
	this.Figure.appendTo(this.Panel);

	var peer = this;

	this.Figure.mousedown(function () {
		if (event.button == 0) {
			peer.HoldingFigure = true;

			event.preventDefault();
		}
	});

	this.LoadingSlot = false;
};

Peris.Peer.prototype.onClick = function (e) {
	if (this.Showing) {
		switch (e.button) {
			// left button
			case 0:
				if (!this.DraggingFigure && this.Panel.find("button:hover").length == 0) {
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
	if (this.HoldingFigure && e.movementX && e.movementY) {
		this.Translate.x += e.movementX / this.Zoom;
		this.Translate.y += e.movementY / this.Zoom;
		this.updateTransform();

		this.DraggingFigure = true;
		this.Figure.css({ transition: "none" });

		e.preventDefault();
	}
};

Peris.Peer.prototype.onKeyDown = function (e) {
	if (this.Showing) {
		var handled = true;

		var peer = this;

		switch (e.keyCode) {
			case 37: // left
				setTimeout(function () {
					peer.prev();
				}, 1);

				break;
			case 39: // right
				setTimeout(function () {
					peer.next();
				}, 1);

				break;
			default:
				handled = false;
				//console.log(e.keyCode);
		}

		if (handled)
			e.preventDefault();
	}
};

Peris.Peer.prototype.updateTransform = function (e) {
	this.Figure.css({ transform: "scale(" + this.Zoom + ", " + this.Zoom + ") translate(" + this.Translate.x + "px, " + this.Translate.y + "px)" });
};
