
var Peris = Peris || {};


Peris.Viewer = function (container) {
	this.Container = container;

	this.initialize();
};

Peris.Viewer.prototype.ColumnBottom = [];

Peris.Viewer.prototype.SlotColumn = 5;
Peris.Viewer.prototype.SlotGap = 0.04;

Peris.Viewer.prototype.CacheHeight = 1600;

Peris.Viewer.prototype.FocusSlot = null;

Peris.Viewer.prototype.ScrollDeltaFromLastForceAppear = 0;

Peris.Viewer.prototype.Data = [];

Peris.Viewer.prototype.OnSlotsLayFinished = [];

Peris.Viewer.prototype.LastColumn = 0;

Peris.Viewer.prototype.SlotsLaying = false;


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

	this.Data = data;

	for (var i in this.Data) {
		if (typeof this.Data[i] === "string")
			this.Data[i] = {path: this.Data[i]};
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

Peris.Viewer.prototype.clear = function () {
	this.ColumnBottom = [];
	for (var i = 0; i < this.SlotColumn; ++i)
		this.ColumnBottom[i] = 0;

	this.SlotStream.find(".slot").remove();

	this.setStatusBar(null);

	this.LastColumn = 0;

	this.SlotsLaying = false;
};

Peris.Viewer.prototype.focusSlot = function (slot) {
	console.assert(slot.length, "Empty slot:", slot);

	this.Container.clearQueue();
	this.Container.scrollTo(slot.position().top + slot.height() / 2 - this.Container.height() / 2, 200);

	this.SlotStream.find(".slot.focus").removeClass("focus");
	slot.addClass("focus");
};

Peris.Viewer.prototype.newSlot = function (data, options) {
	var slot = $("<div class='slot new'></div>");
	slot.data("path", data.path);
	slot.data("index", options.index);
	slot.css({
		height: "200px"
	});

	slot.append("<div class='checker icon-image'></div>");
	var checker = slot.find(".checker");

	if (data.selected)
		slot.addClass("selected");

	var viewer = this;

	slot.onload = function () {
		var slot = $(event.currentTarget).parent();

		slot.css({ height: "auto" });

		viewer.mountSlot(slot, data.sub);

		if (options.onMounted)
			options.onMounted("load");
	};

	slot.onerror = function () {
		var slot = $(event.currentTarget).parent();

		slot.css({ height: "4em" });

		viewer.mountSlot(slot, data.sub);

		slot.addClass("failure");

		$.post("/check-file", { path: slot.data("path") }, function (json) {
			console.log("Check error figure:", json);

			if (json.result == "delete")
				slot.addClass("removed");
		});

		if (options.onMounted)
			options.onMounted("error");
	};

	if(!options.noLoad)
		setTimeout(function () {
			viewer.loadSlot(slot, slot.onload, slot.onerror);
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

		if (slot.find(".checker").is(":hover"))
			return;

		if (slot.hasClass("filled"))
			viewer.Peer.open(slot);
	});

	slot.bind("gestureend", function () {
		if (!viewer.Peer.Showing && event.scale > 1) {
			var slot = $(this);

			if (slot.hasClass("filled"))
				viewer.Peer.open(slot);
		}
	});

	checker.click(function () {
		var slot = $(this).parent();
		if (slot.is(".selected"))
			slot.removeClass("selected");
		else
			slot.addClass("selected");

		var index = viewer.indexOfPath(slot.data("path"));
		viewer.Data[index].selected = slot.is(".selected");
	});

	return slot;
};

Peris.Viewer.prototype.querySlot = function (slot) {
	var path = slot.data("path");
	$.post("/query", { query: 'file-info', path: path }, function (json, s, ajax) {
		if (json.result == "success") {
			if (json.data) {
				viewer.StatusBar.find(".status-date").text(json.data.date ? json.data.date : "?");
				viewer.StatusBar.find(".status-score").text(json.data.score ? json.data.score : "--");
				viewer.StatusBar.find(".status-tags").text(json.data.tags ? json.data.tags : "");

				var scoreColor = viewer.Peer.getScoreColor(json.data.score);
				viewer.StatusBar.find(".status-score").css("color", scoreColor);
			}
			else {
				slot.addClass("raw");

				$.post("/check-file", { path: slot.data("path") }, function (json) {
					console.log("Check raw figure:", json);

					if (json.success) {
						slot.removeClass("raw");
						slot.addClass("registered");
					}
				});
			}

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
}

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

		this.querySlot($slot);

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

	var lastSlot = null;
	var headSlot = null;

	var start = this.SlotStream.find(".slot").length;
	var until = Math.min(start + count, this.Data.length);
	for (var i = start; i < until; ++i) {
		var options = { latency: i - start, noLoad: true, index: i };
		var slot = this.newSlot(this.Data[i], options);
		slot.appendTo(this.SlotStream);
		//console.log("lay:", this.Data[i]);

		(function () {
			var s = slot;
			options.onMounted = function () {
				//console.log("onMounted:", s[0]);
				var next = s.nextSlot;
				if (next)
					viewer.loadSlot(next, next.onload, next.onerror);
				else {
					if (viewer.OnSlotsLayFinished[0])
						viewer.OnSlotsLayFinished.shift()();
					else
						viewer.SlotsLaying = false;
				}
			}
		})();

		if (!headSlot)
			headSlot = slot;

		if (lastSlot)
			lastSlot.nextSlot = slot;

		lastSlot = slot;
	}

	this.OnSlotsLayFinished.push(function () {
		//console.log("OnSlotsLayFinished:", headSlot);
		if (headSlot)
			viewer.loadSlot(headSlot, headSlot.onload, headSlot.onerror);
		else
			viewer.SlotsLaying = false;
	});

	if (!this.SlotsLaying) {
		this.SlotsLaying = true;
		this.OnSlotsLayFinished.shift()();	// start loading
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

Peris.Viewer.prototype.shortestColumn = function () {
	var shortest = 0;
	for (var i = 0; i < this.SlotColumn; ++i) {
		if (this.ColumnBottom[i] < this.ColumnBottom[shortest])
			shortest = i;
	}
	//console.log("shortest: ", shortest, this.ColumnBottom);

	return shortest;
};

Peris.Viewer.prototype.mountSlot = function (slot, followLast) {
	var column = followLast ? this.LastColumn : this.shortestColumn();

	//console.log("mountSlot:", this.indexOfPath(slot.data("path")), column, followLast);

	slot.css({
		top: (this.ColumnBottom[column] + 10).toFixed(0) + "px",
		left: ((column + this.SlotGap * 0.5) * 100 / this.SlotColumn).toFixed(2) + "%",
		height: "auto"
	});

	slot.removeClass("new");
	slot.addClass("ready");

	this.ColumnBottom[column] = slot.position().top + slot.height();

	this.LastColumn = column;
};

Peris.Viewer.prototype.getReadyBottom = function () {
	var bottom = this.ColumnBottom[0];
	for (var i = 0; i < this.SlotColumn; ++i) {
		bottom = Math.min(bottom, this.ColumnBottom[i]);
	}

	return bottom;
};

Peris.Viewer.prototype.isSlotCompleted = function () {
	return this.SlotStream.find(".slot").length >= this.Data.length;
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

Peris.Viewer.prototype.checkAll = function () {
	var viewer = this;

	var check;
	check = function () {
		$.post("/check-file", { path: viewer.Data[viewer.CheckAllIndex].path, fix_extension: true }, function (json) {
			var leftCount = viewer.Data.length - viewer.CheckAllIndex;

			if (json.success) {
				console.log(leftCount, json.description, json.data && json.data || json);
				if (json.rename)
					console.log("renamed:", json.path, "->", json.rename);
			}
			else
				console.warn(leftCount, json);

			++viewer.CheckAllIndex;
			if (viewer.CheckAllIndex < viewer.Data.length)
				check();
			else {
				console.log("Viewer checkAll completed.");
			}
		});
	};

	this.CheckAllIndex = 0;
	check();
};

Peris.Viewer.prototype.checkAllShown = function () {
	var viewer = this;
	this.SlotStream.find(".slot").each(function (i, slot) {
		viewer.querySlot($(slot));
	});
}

Peris.Viewer.prototype.indexOfPath = function(path) {
	for(var i in this.Data) {
		if(this.Data[i].path == path)
			return i;
	}

	return -1;
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
			case 17: // Ctrl	show slot data
				if (!e.repeat) {
					var index = this.indexOfPath(this.CurrentData.path);
					if(index >= 0)
						console.log("data:", index, this.Data[index]);
				}

				break;
			case 27: // ESC,	exit expand mode
				if (this.Container.hasClass("expand")) {
					this.Container.removeClass("expand");
					this.onResized();
				}

				break;
			case 118: // F7,	start slider
				var focus = this.SlotStream.find(".slot:hover");
				if (!focus.length)
					focus = this.SlotStream.find(".slot.focus");

				var statIndex = focus.length ? this.indexOfPath(focus.data("path")) : 0;
				this.Slider.open({ startIndex: statIndex });

				break;
			case 120: // F9
				Peris.showFileInFolder(this.CurrentData.path);

				break;
			case 121: // F10,	show similar figures
				var deep = e.ctrlKey;

				if (this.CurrentData) {
					if (this.CurrentData.thumb) {
						Peris.openSimilarQuery(this.CurrentData.thumb, deep ? 2 : 1);
					}
					else {
						$.post("/check-file", { path: this.CurrentData.path }, function (json) {
							if (json.success) {
								Peris.openSimilarQuery(json.data.thumb, deep ? 2 : 1);
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

ORIENTATION_DEGREES = {
	[1]: 0,
	[3]: 180,
	[6]: 90,
	[8]: 270,
};

Peris.Viewer.prototype.loadMetaData = async function (slot) {
	//console.log("loadMetaData:", slot);
	if (slot.data("meta-loaded"))
		return;

	const figure = slot.find(".figure");

	const path = slot.data("path");
	const response = await fetch(`/images/${path}`);
	if (!response.ok)
		return;

	const blob = await response.blob();

	return new Promise(resolve => {
		loadImage.parseMetaData(blob, data => {
			slot.data("meta-loaded", true);

			//console.log("meta:", data);
			if (data.exif) {
				const orientation = data.exif.get("Orientation");
				if (Number.isInteger(orientation)) {
					//console.log("figure:", orientation, figure);
					figure.addClass(`orientation-${orientation}`);
					figure.data("rotate", ORIENTATION_DEGREES[orientation] || 0);

					if (ORIENTATION_DEGREES[orientation])
						this.Data[slot.data("index")].rotate = ORIENTATION_DEGREES[orientation];

					switch (orientation) {
						case 6:
						case 8:
							figure.addClass("orientation-upset");
					}

					slot.data("orientation", orientation);
				}
			}

			resolve();
		});
	});
};

Peris.Viewer.prototype.loadMetaDataByIndex = async function (index) {
	if (this.SlotStream.find(".slot").length <= index) {
		console.warn("invalid slot index:", index, this.SlotStream.find(".slot").length);
		return;
	}

	const slot = $(this.SlotStream.find(".slot")[index]);
	//console.log("slot:", slot);

	return this.loadMetaData(slot);
};
