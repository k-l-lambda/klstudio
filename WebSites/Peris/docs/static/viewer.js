
var Peris = Peris || {};


Peris.Viewer = function (container) {
	this.Container = container;

	this.initialize();
};

Peris.Viewer.prototype.PathList = [];

Peris.Viewer.prototype.ColumnBottom = [];

Peris.Viewer.prototype.SlotColumn = 5;
Peris.Viewer.prototype.SlotGap = 0.04;

Peris.Viewer.prototype.CacheHeight = 1600;

Peris.Viewer.prototype.FocusSlot = null;

Peris.Viewer.prototype.ScrollDeltaFromLastForceAppear = 0;


Peris.Viewer.prototype.initialize = function () {
	this.Container.addClass("viewer");

	var viewer = this;

	this.SlotStream = $("<div class='slot-stream'></div>");
	this.SlotStream.appendTo(this.Container);

	this.StatusBar = $("<div class='viewer-status'>"
		+ "<span class='status-path'></span>"
		+ "<span class='status-dimensions'></span>"
		+ "<span class='status-size'></span>"
		+ "<span class='status-date'></span>"
		+ "<span class='status-score'></span>"
		+ "<span class='status-tags'></span>"
		+ "<span class='status-operation'></span>"
		+ "<span class='status-counter'><span class='status-lay-count'></span> / <span class='status-total'></span></span></div>");
	this.StatusBar.appendTo(this.Container);

	var expandButton = $("<button class='expand-button'></button>");
	expandButton.appendTo(this.Container);
	expandButton.click(function () {
		if (viewer.Container.hasClass("expand"))
			viewer.Container.removeClass("expand");
		else
			viewer.Container.addClass("expand");

		viewer.onResized();
	});

	this.OldScrollTop = this.Container.scrollTop();

	this.Container.scroll(function () {
		viewer.updateLayout();

		viewer.OldScrollTop = viewer.Container.scrollTop();
	});

	this.StyleTag = $("<style class='viewer-onfly-style'></style>");
	this.StyleTag.appendTo("body");

	this.updateStyle();

	this.SlotStream.on("appear", ".slot.blank", function (e, slot) {
		viewer.loadSlot(slot);
	});

	this.Peer = new Peris.Peer(this);
	this.Slider = new Peris.Slider(this);

	this.Container.click(function () {
		viewer.updateLayout();
		$.force_appear();
	});

	this.Container.smoothWheel();

	this.OldWindowSize = { w: $(window).width(), h: $(window).height() };
	$(window).resize(function () {
		if ($(window).width() != viewer.OldWindowSize.w)
			viewer.onResized();

		viewer.OldWindowSize = { w: $(window).width(), h: $(window).height() };
	});

	$(document).keydown(function () {
		viewer.onKeyDown(event);
	});
};

Peris.Viewer.prototype.update = function (data) {
	this.clear();

	this.PathList = [];
	for (var i in data) {
		if (data[i].path)
			this.PathList.push(data[i].path);
	}

	this.StatusBar.find(".status-total").text(data.length);

	this.updateLayout();
};

Peris.Viewer.prototype.setColumn = function (column) {
	this.SlotColumn = Number(column);

	this.clear();
	this.updateStyle();
	this.updateLayout();
};

Peris.Viewer.prototype.updateStyle = function () {
	this.StyleTag.text(".slot { width: " + (((1 - this.SlotGap) / this.SlotColumn) * 100).toFixed(2) + "%; }");
};

Peris.Viewer.prototype.clear = function (data) {
	this.ColumnBottom = [];
	for (var i = 0; i < this.SlotColumn; ++i)
		this.ColumnBottom[i] = 0;

	this.SlotStream.find(".slot").remove();

	this.setStatusBar(null);
};

Peris.Viewer.prototype.focusSlot = function (slot) {
	console.assert(slot.length, "Empty slot:", slot);

	this.Container.clearQueue();
	this.Container.scrollTo(slot.position().top + slot.height() / 2 - this.Container.height() / 2, 200);

	this.SlotStream.find(".slot.focus").removeClass("focus");
	slot.addClass("focus");
};

Peris.Viewer.prototype.newSlot = function (path, options) {
	var slot = $("<div class='slot new'></div>");
	slot.data("path", path);
	slot.css({
		height: "200px"
	});

	var viewer = this;

	var onload = function () {
		var slot = $(event.currentTarget).parent();

		slot.css({ height: "auto" });

		viewer.mountSlot(slot);
	};

	var onerror = function () {
		var slot = $(event.currentTarget).parent();

		slot.css({ height: "4em" });

		viewer.mountSlot(slot);
	};

	setTimeout(function () {
		viewer.loadSlot(slot, onload, onerror);
	}, options.latency || 0);

	slot.mouseenter(function (e) {
		viewer.FocusSlot = e.currentTarget;

		viewer.onFocusSlotChanged();
	});
	slot.mouseleave(function (e) {
		if (viewer.FocusSlot == e.currentTarget) {
			viewer.FocusSlot = null;

			viewer.onFocusSlotChanged();
		}
	});

	slot.click(function () {
		var slot = $(this);

		if (slot.hasClass("filled"))
			viewer.Peer.open(slot);
	});

	return slot;
};

Peris.Viewer.prototype.onFocusSlotChanged = function () {
	var $slot = this.FocusSlot ? $(this.FocusSlot) : null;

	var figure = $slot ? $slot.find(".figure")[0] : null;
	this.StatusBar.find(".status-path").html($slot ? "<strong>" + $slot.data("path") + "</strong>" : "");
	this.StatusBar.find(".status-dimensions").html(figure ? "(" + figure.naturalWidth + "&times;" + figure.naturalHeight + ")" : "");

	if (this.StatusBar.find(".status-path").width() > this.StatusBar.find(".status-dimensions").position().left - 12)
		this.StatusBar.addClass("higher");
	else
		this.StatusBar.removeClass("higher");

	var viewer = this;

	this.StatusBar.find(".status-date").text("");
	this.StatusBar.find(".status-score").text("");
	this.StatusBar.find(".status-tags").text("");
	this.StatusBar.find(".status-size").text("");

	if ($slot) {
		$(".viewer-status").addClass("shown");

		var path = $slot.data("path");
		$.post("/query", { query: 'file-info', path: path }, function (json, s, ajax) {
			if (json.result == "success") {
				viewer.StatusBar.find(".status-date").text(json.data.date ? json.data.date : "?");
				viewer.StatusBar.find(".status-score").text(json.data.score ? json.data.score : "--");
				viewer.StatusBar.find(".status-tags").text(json.data.tags ? json.data.tags : "");

				viewer.CurrentData = json.data;
			}
			else if (json.result == "fail") {
				console.warn("query file info " + path + " failed:", json.error);
			}
			else
				console.error("unexpect json result:", json);

			viewer.setStatusBar(null);
		}, "json");

		this.setStatusBar("QUERYING");

		if (figure) {
			$.get(figure.src, function (d, s, xhr) {
				viewer.StatusBar.find(".status-size").text(Number(xhr.getResponseHeader('Content-Length')).toLocaleString() + " bytes");
			});
		}
	}
	else {
		$(".viewer-status").removeClass("shown");
	}
};

Peris.Viewer.prototype.laySlots = function (count) {
	var viewer = this;

	var start = this.SlotStream.find(".slot").length;
	var until = Math.min(start + count, this.PathList.length);
	for (var i = start; i < until; ++i) {
		var slot = this.newSlot(this.PathList[i], { latency: i - start });
		slot.appendTo(this.SlotStream);
	}

	if (until > start)
		this.StatusBar.find(".status-lay-count").text(until);
};

Peris.Viewer.prototype.laySlotsRow = function () {
	this.laySlots(this.SlotColumn);
};

Peris.Viewer.prototype.getSlot = function (index) {
	return $(this.SlotStream.find(".slot")[index]);
};

Peris.Viewer.prototype.loadSlot = function (slot, onload, onerror) {
	var path = slot.data("path");

	slot.find(".figure").remove();
	var img = $("<img class='figure' src=\"/images/" + encodeURI(path) + "\" alt='" + path + "' />");
	img.appendTo(slot);

	if (onload)
		img.load(onload);
	if (onerror)
		img.error(onerror);

	var onLoadEnd = function () {
		slot.removeClass("loading");
	};

	img.load(onLoadEnd);
	img.error(onLoadEnd);

	slot.removeClass("blank");
	slot.addClass("filled");
	slot.addClass("loading");
};

Peris.Viewer.prototype.unloadSlot = function (slot) {
	slot.css({ height: slot.height() + "px" });

	slot.find(".figure").remove();

	slot.removeClass("filled");
	slot.addClass("blank");

	slot.appear();
};

Peris.Viewer.prototype.mountSlot = function (slot) {
	var shortest = 0;
	for (var i = 0; i < this.SlotColumn; ++i) {
		if (this.ColumnBottom[i] < this.ColumnBottom[shortest])
			shortest = i;
	}
	//console.log("shortest: ", shortest, this.ColumnBottom);

	slot.css({
		top: (this.ColumnBottom[shortest] + 10).toFixed(0) + "px",
		left: ((shortest + this.SlotGap * 0.5) * 100 / this.SlotColumn).toFixed(2) + "%",
		height: "auto"
	});

	slot.removeClass("new");
	slot.addClass("ready");

	this.ColumnBottom[shortest] = slot.position().top + slot.height();
};

Peris.Viewer.prototype.getReadyBottom = function () {
	var bottom = this.ColumnBottom[0];
	for (var i = 0; i < this.SlotColumn; ++i) {
		bottom = Math.min(bottom, this.ColumnBottom[i]);
	}

	return bottom;
};

Peris.Viewer.prototype.isSlotCompleted = function () {
	return this.SlotStream.find(".slot").length >= this.PathList.length;
};

Peris.Viewer.prototype.updateLayout = function () {
	var readyBottom = this.getReadyBottom();
	var scrollTop = this.Container.scrollTop();
	var delta = scrollTop - this.OldScrollTop;

	if (!this.isSlotCompleted()) {
		var newSlotCount = this.SlotStream.find(".slot.new").length;
		if (scrollTop + this.Container.height() > readyBottom) {
			while (newSlotCount < this.SlotColumn * Math.max(this.SlotColumn * 0.4, 1)) {
				this.laySlots(this.SlotColumn);
				newSlotCount += this.SlotColumn;
			}
		}
	}

	var upBound = scrollTop - this.CacheHeight;
	var bottomBound = scrollTop + this.Container.height() + this.CacheHeight;

	var viewer = this;

	// unload outer slots
	this.SlotStream.find(".slot.ready.filled").each(function (i, slot) {
		var $slot = $(slot);

		var top = $slot.position().top;
		var bottom = top + $slot.height();

		if (bottom < upBound || top > bottomBound)
			viewer.unloadSlot($slot);
	});

	// load appeared slots
	if (delta < 0 || (bottomBound - delta < readyBottom)) {
		this.ScrollDeltaFromLastForceAppear += delta;

		if (Math.abs(this.ScrollDeltaFromLastForceAppear) > this.Container.height() * 0.3) {
			$.force_appear();
			this.ScrollDeltaFromLastForceAppear = 0;
		}
	}
};

Peris.Viewer.prototype.setStatusBar = function (operation) {
	if (operation) {
		this.StatusBar.find(".status-operation").text(operation);
		this.StatusBar.addClass("loading");
	}
	else {
		this.StatusBar.find(".status-operation").text("");
		this.StatusBar.removeClass("loading");
	}
};


Peris.Viewer.prototype.onResized = function () {
	// recreate stream
	this.clear();
	this.updateLayout();
};

Peris.Viewer.prototype.onKeyDown = function (e) {
	if (!this.Peer.Showing && !this.Slider.Showing) {
		var handled = true;

		var viewer = this;

		switch (e.keyCode) {
			case 27: // esc,	exit expand mode
				if (this.Container.hasClass("expand")) {
					this.Container.removeClass("expand");
					this.onResized();
				}

				break;
			case 118: // F7,	start slider
				var focus = this.SlotStream.find(".slot:hover");
				if (!focus.length)
					focus = this.SlotStream.find(".slot.focus");

				var statIndex = focus.length ? this.PathList.indexOf(focus.data("path")) : 0;
				this.Slider.open({ startIndex: statIndex });

				break;
			case 120: // F9
				Peris.showFileInFolder(this.CurrentData.path);

				break;
			case 121: // F10,	show similar figures
				var deep = e.ctrlKey;

				var openQuery = function (fingerprint) {
					var pattern1 = Peris.fingerprintBlurPattern(fingerprint, deep ? 2 : 1);
					var pattern2 = Peris.fingerprintBlurPattern(Peris.mirrorFingerprint(fingerprint), deep ? 2 : 1);
					var sql = "select path from file_register\nwhere fingerprint regexp '" + pattern1 + "' or fingerprint regexp '" + pattern2 + "'";

					open("#expandViewer&sql=" + encodeURIComponent(sql), "_blank");
				};

				if (this.CurrentData) {
					if (this.CurrentData.fingerprint) {
						openQuery(this.CurrentData.fingerprint);
					}
					else {
						$.post("/check-file", { path: this.CurrentData.path }, function (json) {
							if (json.result == "success") {
								//console.log("check file", viewer.CurrentData.path, "success, fingerprint:", json.data.fingerprint);
								openQuery(json.data.fingerprint);
							}
							else {
								console.log("check file", viewer.CurrentData.path, "failed:", json);
							}

							viewer.setStatusBar(null);
						});
						console.log("checking file:", viewer.CurrentData.path);

						this.setStatusBar("CHECKING");
					}
				}

				break;
			default:
				handled = false;
				//console.log(e.keyCode);
		}

		if (handled)
			e.preventDefault();
	}
};
