
Viewer = function (container) {
	this.Container = container;

	this.initialize();
};

Viewer.prototype.PathList = [];

Viewer.prototype.ColumnBottom = [];

Viewer.prototype.SlotColumn = 5;
Viewer.prototype.SlotGap = 0.04;

Viewer.prototype.CacheHeight = 1600;


Viewer.prototype.initialize = function () {
	this.Container.addClass("viewer");

	var viewer = this;

	this.OldScrollTop = this.Container.parent().scrollTop();

	this.Container.parent().scroll(function () {
		viewer.updateLayout();

		viewer.OldScrollTop = viewer.Container.parent().scrollTop();
	});

	this.StyleTag = $("<style class='viewer-onfly-style'></style>");
	this.StyleTag.appendTo("body");

	this.updateStyle();

	this.Container.on("appear", ".slot.blank", function (e, slot) {
		viewer.loadSlot(slot);
	});
};

Viewer.prototype.update = function (data) {
	this.clear();

	for (var i in data) {
		this.PathList.push(data[i].path);
	}

	//this.laySlots(data.length);
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

	this.Container.find(".slot").remove();
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

	return slot;
};

Viewer.prototype.laySlots = function (count) {
	var start = this.Container.find(".slot").length;
	var until = Math.min(start + count, this.PathList.length);
	for (var i = start; i < until; ++i) {
		var slot = this.newSlot(this.PathList[i]);
		slot.appendTo(this.Container);
	}

	if (until > start)
		console.log("laySlots until:", until);
};

Viewer.prototype.getSlot = function (index) {
	return $(this.Container.find(".slot")[index]);
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
		left: ((shortest + this.SlotGap) * 100 / this.SlotColumn).toFixed(2) + "%",
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
	return this.Container.find(".slot").length >= this.PathList.length;
};

Viewer.prototype.updateLayout = function () {
	var readyBottom = this.getReadyBottom();
	var scrollTop = this.Container.parent().scrollTop();

	if (!this.slotCompleted()) {
		var newSlotCount = this.Container.find(".slot.new").length;
		if (scrollTop + this.Container.parent().height() > readyBottom) {
			while (newSlotCount < this.SlotColumn * 5) {
				this.laySlots(this.SlotColumn);
				newSlotCount += this.SlotColumn;
			}
		}
	}

	var upBound = scrollTop - this.CacheHeight;
	var bottomBound = scrollTop + this.Container.parent().height() + this.CacheHeight;

	var viewer = this;

	// unload outer slot
	this.Container.find(".slot.ready.filled").each(function (i, slot) {
		var $slot = $(slot);

		var top = $slot.position().top;
		var bottom = top + $slot.height();

		if (bottom < upBound || top > bottomBound)
			viewer.unloadSlot($slot);
	});

	/*// load inner slot
	this.Container.find(".slot.ready.blank").each(function (i, slot) {
	var $slot = $(slot);

	var top = $slot.position().top;
	var bottom = top + $slot.height();

	if (bottom >= upBound || top <= bottomBound)
	viewer.loadSlot($slot);
	});*/
	if (scrollTop < this.OldScrollTop || bottomBound < readyBottom)
		$.force_appear();
};
