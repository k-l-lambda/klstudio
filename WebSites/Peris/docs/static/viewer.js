
Viewer = function (container) {
	this.Container = container;

	this.initialize();
};

Viewer.prototype.PathList = [];

Viewer.prototype.ColumnBottom = [];

Viewer.prototype.SlotColumn = 5;
Viewer.prototype.SlotGap = 0.04;


Viewer.prototype.initialize = function () {
	this.Container.addClass("viewer");

	var viewer = this;

	this.Container.parent().scroll(function () {
		viewer.updateLayout();
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
		height: "200px",
		width: (((1 - this.SlotGap) / this.SlotColumn) * 100).toFixed(2) + "%",
		margin: (this.SlotGap * 0.5 / this.SlotColumn * 100).toFixed(2) + "%"
	});

	var img = $("<img class='figure' src='/images/" + escape(path) + "' alt='" + path + "' />");
	img.appendTo(slot);

	var viewer = this;

	img.load(function () {
		var slot = $(event.currentTarget).parent();

		slot.css({ height: "auto" });

		viewer.mountSlot(slot);
	});

	img.error(function () {
		var slot = $(event.currentTarget).parent();

		slot.css({ height: "4em" });

		viewer.mountSlot(slot);
	});

	return slot;
};

Viewer.prototype.laySlots = function (count) {
	var start = this.Container.find(".slot").length;
	var until = start + count;
	for (var i = start; i < Math.min(until, this.PathList.length); ++i) {
		var slot = this.newSlot(this.PathList[i]);
		slot.appendTo(this.Container);
	}

	if (until > start)
		console.log("laySlots until:", until);
};

Viewer.prototype.getSlot = function (index) {
	return $(this.Container.find(".slot")[index]);
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
		height: slot.find(".figure").height().toFixed(0) + "px"
	});

	slot.removeClass("new");
	slot.addClass("ready");

	this.ColumnBottom[shortest] = slot.position().top + slot.height();
};

Viewer.prototype.getReadyBottom = function () {
	var bottom = 0;
	for (var i = 0; i < this.SlotColumn; ++i) {
		bottom = Math.max(bottom, this.ColumnBottom[i]);
	}

	return bottom;
};

Viewer.prototype.slotCompleted = function () {
	return this.Container.find(".slot").length >= this.PathList.length;
};

Viewer.prototype.updateLayout = function () {
	if (!this.slotCompleted()) {
		var newSlotCount = this.Container.find(".slot.new").length;
		if (this.Container.parent().scrollTop() + this.Container.parent().height() > this.getReadyBottom()) {
			while (newSlotCount < this.SlotColumn * 5) {
				this.laySlots(this.SlotColumn);
				newSlotCount += this.SlotColumn;
			}
		}
	}
};
