
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
Peris.Peer.prototype.FadeDuration = 300;


Peris.Peer.prototype.initialize = function () {
	this.Panel = $("<div class='peer fullscreen-panel'>"
		+ "<button class='prev'>&lt;</button>"
		+ "<button class='next'>&gt;</button>"
		+ "<button class='show-slider'></button>"
		+ "<div class='score-bar'><canvas class='score-gradient' width='1500' height='10'></canvas><div class='score-touch'></div></div>"
		+ "<div class='input-bar'><input class='input-tags' type='text' /><input class='input-score' type='text' /></div>"
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

	// paint score gradient
	var canvas = this.Panel.find(".score-gradient");
	var ctx = canvas[0].getContext("2d");
	var gradient = ctx.createLinearGradient(0, 0, 1500, 0);
	gradient.addColorStop(0, "#400");
	gradient.addColorStop(2.5 / 15, "#cc0");
	gradient.addColorStop(2.5000001 / 15, "#ff0");
	gradient.addColorStop(5. / 15, "#0c0");
	gradient.addColorStop(5.0000001 / 15, "#0f0");
	gradient.addColorStop(7.5 / 15, "#22c");
	gradient.addColorStop(7.5000001 / 15, "#00f");
	gradient.addColorStop(10 / 15, "#90c");
	gradient.addColorStop(10.0000001 / 15, "#c0f");
	gradient.addColorStop(1, "white");
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 1500, 10);

	this.Panel.find(".score-bar").mousemove(function () {
		var score = event.x * 15 / $(this).width();
		peer.setScoreTouchValue(score);
	});

	this.Panel.find(".score-bar").click(function () {
		var score = Number((event.x * 15 / $(this).width()).toPrecision(4));
		peer.Panel.find(".input-score").val(score);

		peer.postFigureData({ score: score });
	});

	this.Panel.find(".score-bar").mouseleave(function () {
		var score = peer.Panel.find(".input-score").val();
		score = (score == "") ? null : Number(score);
		peer.setScoreTouchValue(score);
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

	var inputBar = this.Panel.find(".input-bar");
	inputBar.find(".input-score").val("");
	inputBar.find(".input-tags").val("");
	inputBar.addClass("disabled");

	this.setScoreTouchValue(0);

	this.CurrentHash = null;

	var path = slot.data("path");
	$.post("/query", { query: 'file-info', path: path }, function (json, s, ajax) {
		if (json.result == "success") {
			inputBar.removeClass("disabled");

			peer.CurrentHash = json.data.hash;

			inputBar.find(".input-score").val(json.data.score);
			inputBar.find(".input-tags").val(json.data.tags);

			peer.setScoreTouchValue(Number(json.data.score));
		}
		else if (json.result == "fail") {
			console.warn("query file info " + path + " failed:", json.error);
		}
		else
			console.error("unexpect json result:", json);
	}, "json");
};

Peris.Peer.prototype.close = function () {
	var peer = this;

	this.Panel.fadeOut(this.FadeDuration, function () {
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
	var statIndex = 0;
	if (this.Showing) {
		statIndex = this.Viewer.PathList.indexOf(this.SourceSlot.data("path"));
	}

	var peer = this;

	this.Viewer.Slider.open({ startIndex: statIndex,
		onClose: function () {
			var slot = peer.Viewer.SlotStream.find(".slot.focus");
			if (slot.length) {
				peer.clearSlotBinding();
				peer.open(slot);
			}
		}
	});
};

Peris.Peer.prototype.initializePanel = function (slot) {
	console.log("open peer for", slot.data("path"));

	this.SourceSlot = slot;
	this.Figure = slot.find(".figure");

	this.Panel.fadeIn(this.FadeDuration);

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

Peris.Peer.prototype.setScoreTouchValue = function (score) {
	if (score) {
		var canvas = this.Panel.find(".score-gradient");
		var ctx = canvas[0].getContext("2d");
		var color = ctx.getImageData(score * 100, 0, 1, 1).data;
		var colorStr = "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";

		var percent = score * 100 / 15;
		this.Panel.find(".score-touch").css({ backgroundImage: "-webkit-gradient(linear,left center,right center,from(" + colorStr + "),color-stop(" + percent + "%, " + colorStr + "),color-stop(" + percent + "%, transparent),to(transparent))" });
		this.Panel.find(".score-bar").attr({ title: score.toPrecision(4) });
	}
	else {
		this.Panel.find(".score-touch").css({ backgroundImage: "none" });
		this.Panel.find(".score-bar").removeAttr("title");
	}
};

Peris.Peer.prototype.onClick = function (e) {
	if (this.Showing) {
		switch (e.button) {
			// left button
			case 0:
				if (!this.DraggingFigure && this.Panel.find("button:hover, .input-bar:hover, .score-bar:hover").length == 0) {
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
	if (this.Showing && !this.Viewer.Slider.Showing) {
		var handled = true;

		var peer = this;

		switch (e.keyCode) {
			case 27: // esc
				this.close();

				break;
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

Peris.Peer.prototype.postFigureData = function (data) {
	if (!this.CurrentHash) {
		console.warn("CurrentHash is null, figure data post cancelled.");
		return;
	}

	data.hash = this.CurrentHash;

	$.post("/update-figure", data, function (json, s, ajax) {
		if (json.result == "success") {
			console.log("figure data post:", data, json);
		}
		else if (json.result == "fail") {
			console.warn("post figure failed:", json.error);
		}
		else
			console.error("unexpect json result:", json);
	}, "json");
};
