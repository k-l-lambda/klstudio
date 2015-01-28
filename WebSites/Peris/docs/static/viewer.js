
Viewer = function (container) {
	this.Container = container;

	this.PathList = [];
};

Viewer.prototype.update = function (data) {
	this.clear();

	for (var i in data) {
		this.PathList.push(data[i].path);
	}

	this.laySlots(data.length);
};

Viewer.prototype.clear = function (data) {
	this.PathList = [];

	this.Container.empty();
};

Viewer.newSlot = function (path) {
	var slot = $("<div class='slot' data-path='" + path + "'><div>");
	slot.css({ height: "200px" });

	return slot;
};

Viewer.prototype.laySlots = function (until) {
	var start = this.Container.find(".slot").length;
	for (var i = start; i < until; ++i) {
		var slot = Viewer.newSlot(this.PathList[i]);
		slot.appendTo(this.Container);

		this.showSlot(i);
	}
};

Viewer.prototype.getSlot = function (index) {
	return $(this.Container.find(".slot")[index]);
};

Viewer.prototype.showSlot = function (index) {
	var slot = this.getSlot(index);
	slot.empty();

	var path = this.PathList[index];

	slot.append("<img class='figure' src='/images/" + path + "' alt='" + path + "' />");
	slot.css({ height: "auto" });
};
