
Viewer = function (container) {
	this.Container = container;

	this.initialize();
};

Viewer.prototype.PathList = [];

Viewer.prototype.ColumnBottom = [];

Viewer.prototype.SlotColumn = 5;
Viewer.prototype.SlotGap = 0.04;

Viewer.prototype.CacheHeight = 1600;

Viewer.prototype.FocusSlot = null;


Viewer.prototype.initialize = function () {
	this.Container.addClass("viewer");

	this.SlotStream = $("<div class='slot-stream'></div>");
	this.SlotStream.appendTo(this.Container);

	this.StatusBar = $("<div class='viewer-statius'>"
		+ "<span class='status-path'></span>"
		+ "<span class='status-score'></span>"
		+ "<span class='status-labels'></span>"
		+ "<span class='status-counter'><span class='status-lay-count'></span> / <span class='status-total'></span></span></div>");
	this.StatusBar.appendTo(this.Container);

	var viewer = this;

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
};

Viewer.prototype.update = function (data) {
	this.clear();

	for (var i in data) {
		this.PathList.push(data[i].path);
	}

	this.StatusBar.find(".status-total").text(data.length);

	this.updateLayout();
};

Viewer.prototype.updateStyle = function () {
	this.StyleTag.text(".slot { width: " + (((1 - this.SlotGap) / this.SlotColumn) * 100).toFixed(2) + "%; }");
};

Viewer.prototype.clear = function (data) {
	this.PathList = [];

	this.ColumnBottom = [];
	for (var i = 0; i < this.SlotColumn; ++i)
		this.ColumnBottom[i] = 0;

	this.SlotStream.find(".slot").remove();
};

Viewer.prototype.newSlot = function (path) {
	var slot = $("<div class='slot new' data-path='" + path + "'><div>");
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

	this.loadSlot(slot, onload, onerror);

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

	return slot;
};

Viewer.prototype.onFocusSlotChanged = function () {
	this.StatusBar.find(".status-path").text(this.FocusSlot ? $(this.FocusSlot).data("path") : "");

	var viewer = this;

	if (this.FocusSlot) {
		var path = $(this.FocusSlot).data("path");
		$.post("query", { query: 'file-info', path: path }, function (json, s, ajax) {
			if (json.result == "success") {
				viewer.StatusBar.find(".status-score").text(json.data.score ? json.data.score : ".");
				viewer.StatusBar.find(".status-labels").text(json.data.labels ? json.data.labels : "");
			}
			else if (json.result == "fail") {
				console.warn("query file info " + path + " failed:", json.error);
			}
			else
				console.error("unexpect json result:", json);
		}, "json");
	}
};

Viewer.prototype.laySlots = function (count) {
	var start = this.SlotStream.find(".slot").length;
	var until = Math.min(start + count, this.PathList.length);
	for (var i = start; i < until; ++i) {
		var slot = this.newSlot(this.PathList[i]);
		slot.appendTo(this.SlotStream);
	}

	if (until > start)
		this.StatusBar.find(".status-lay-count").text(until);
};

Viewer.prototype.getSlot = function (index) {
	return $(this.SlotStream.find(".slot")[index]);
};

Viewer.prototype.loadSlot = function (slot, onload, onerror) {
	var path = slot.data("path");

	var img = $("<img class='figure' src='/images/" + encodeURI(path) + "' alt='" + path + "' />");
	img.appendTo(slot);

	if (onload)
		img.load(onload);

	if (onerror)
		img.error(onerror);

	slot.removeClass("blank");
	slot.addClass("filled");
};

Viewer.prototype.unloadSlot = function (slot) {
	slot.css({ height: slot.height() + "px" });

	slot.find(".figure").remove();

	slot.removeClass("filled");
	slot.addClass("blank");

	slot.appear();
};

Viewer.prototype.mountSlot = function (slot) {
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

Viewer.prototype.getReadyBottom = function () {
	var bottom = this.ColumnBottom[0];
	for (var i = 0; i < this.SlotColumn; ++i) {
		bottom = Math.min(bottom, this.ColumnBottom[i]);
	}

	return bottom;
};

Viewer.prototype.slotCompleted = function () {
	return this.SlotStream.find(".slot").length >= this.PathList.length;
};

Viewer.prototype.updateLayout = function () {
	var readyBottom = this.getReadyBottom();
	var scrollTop = this.Container.scrollTop();

	if (!this.slotCompleted()) {
		var newSlotCount = this.SlotStream.find(".slot.new").length;
		if (scrollTop + this.Container.height() > readyBottom) {
			while (newSlotCount < this.SlotColumn * 5) {
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
	if (scrollTop < this.OldScrollTop || bottomBound < readyBottom)
		$.force_appear();
};
