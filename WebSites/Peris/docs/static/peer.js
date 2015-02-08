
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
Peris.Peer.prototype.PostTagsHandle = null;
Peris.Peer.prototype.RecentPostList = new Peris.LocalDataEntry("RecentPostList");
Peris.Peer.prototype.RecentPostListLengthLimit = 1000;
Peris.Peer.prototype.LastTouch = null;


Peris.Peer.prototype.initialize = function () {
	this.Panel = $("<div class='peer fullscreen-panel'>"
		+ "<button class='prev'>&lt;</button>"
		+ "<button class='next'>&gt;</button>"
		+ "<button class='show-slider'></button>"
		+ "<div class='score-bar'><canvas class='score-gradient' width='1500' height='10'></canvas><div class='score-touch'><div class='score-touch-colored'></div></div></div>"
		+ "<div class='input-bar'><input class='input-score' type='text' readonly /><input class='input-tags' type='text' /><ol class='tag-list'></ol></div>"
		+ "</div>");

	this.Panel.appendTo("body");

	var peer = this;

	this.Panel.click(function () { peer.onClick(event); });

	this.Panel.mouseup(function () { peer.onMouseUp(event); });
	this.Panel.mousemove(function () { peer.onMouseMove(event); });

	this.Panel.bind("touchmove", function () {
		if (event.changedTouches[0]) {
			var touch = event.changedTouches[0];

			if (peer.LastTouch) {
				var deltaX = touch.pageX - peer.LastTouch.x;
				var deltaY = touch.pageY - peer.LastTouch.y;
				//console.log("touchmove", deltaX, deltaY);

				peer.updatePan(deltaX, deltaY);

				event.preventDefault();
			}

			peer.LastTouch = { x: touch.pageX, y: touch.pageY };
		}
	});
	this.Panel.bind("touchend", function () { peer.LastTouch = null; });

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
		var score = (peer.CurrentData && peer.CurrentData.score) ? peer.CurrentData.score : null;
		peer.setScoreTouchValue(score);
	});

	this.Panel.find(".input-tags").bind("textchange", function () {
		var inputTags = $(this);
		inputTags.addClass("dirty");

		if (peer.PostTagsHandle)
			clearTimeout(peer.PostTagsHandle);

		peer.PostTagsHandle = setTimeout(function () {
			if (inputTags.is(".dirty"))
				peer.postFigureData({ tags: inputTags.val() });

			peer.PostTagsHandle = null;
		}, 5000);
	});

	this.Panel.find(".input-tags").focusout(function () {
		if ($(this).is(".dirty"))
			peer.postFigureData({ tags: $(this).val() });
	});

	this.Panel.bind("gesturechange", function () {
		peer.updateZoom(Math.pow(event.scale, 0.1));

		peer.LastTouch = null;

		event.preventDefault();
	});

	this.TagList = new Peris.TagList();

	this.RecentPostList.load();
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
	this.HoldingFigure = false;

	this.Viewer.focusSlot(slot);

	var inputBar = this.Panel.find(".input-bar");
	inputBar.find(".input-score").val("");
	inputBar.find(".input-tags").val("");
	inputBar.find(".input-tags").removeClass("dirty");
	inputBar.addClass("disabled");

	this.setScoreTouchValue(0);

	this.CurrentHash = null;
	this.CurrentData = null;

	this.CurrentPath = slot.data("path");
	$.post("/query", { query: 'file-info', path: this.CurrentPath }, function (json, s, ajax) {
		if (json.result == "success") {
			inputBar.removeClass("disabled");

			peer.CurrentHash = json.data.hash;
			peer.CurrentData = { score: json.data.score, tags: json.data.tags };

			peer.setScoreTouchValue(Number(json.data.score));
			inputBar.find(".input-tags").val(json.data.tags);

			if (json.data.tags) {
				var tagsArray = json.data.tags.split("|");
				for (var i in tagsArray)
					peer.TagList.update(tagsArray[i], 1);
			}

			peer.renderTagList();
		}
		else if (json.result == "fail") {
			console.warn("query file info " + peer.CurrentPath + " failed:", json.error);
		}
		else
			console.error("unexpect json result:", json);
	}, "json");
};

Peris.Peer.prototype.close = function () {
	var peer = this;

	var inputTags = this.Panel.find(".input-tags");
	if (inputTags.is(".dirty"))
		peer.postFigureData({ tags: inputTags.val() });

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
		var colorStr = "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";

		var percent = score * 100 / 15;
		this.Panel.find(".score-touch-colored").css({ width: percent + "%", background: colorStr });
		this.Panel.find(".score-bar").removeClass("empty");
		this.Panel.find(".input-score").val(score);
	}
	else {
		this.Panel.find(".score-touch-colored").css({ width: 0, background: "transparent" });
		this.Panel.find(".score-bar").addClass("empty");
		this.Panel.find(".input-score").val("");
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
		this.updateZoom(Math.exp(e.wheelDelta / 400));
	}
};

Peris.Peer.prototype.onMouseUp = function (e) {
	this.HoldingFigure = false;
	this.Figure.css({ transition: "" });
};

Peris.Peer.prototype.onMouseMove = function (e) {
	if (this.HoldingFigure && e.movementX && e.movementY) {
		this.updatePan(e.movementX, e.movementY);

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

Peris.Peer.prototype.onTagItemClick = function (item) {
	var tagsArray = this.getCurrentTagArray();
	var tag = item.find(".text").text();

	if (item.is(".used")) {
		if (tagsArray.indexOf(tag) >= 0)
			tagsArray.splice(tagsArray.indexOf(tag), 1);
	}
	else
		tagsArray.push(tag);

	var tags = tagsArray.join("|");
	this.Panel.find(".input-tags").val(tags);
	this.Panel.find(".input-tags").addClass("dirty");
	this.postFigureData({ tags: tags });
};

Peris.Peer.prototype.updateTransform = function (e) {
	this.Figure.css({ transform: "scale(" + this.Zoom + ", " + this.Zoom + ") translate(" + this.Translate.x + "px, " + this.Translate.y + "px)" });
};

Peris.Peer.prototype.postFigureData = function (data) {
	if (!this.CurrentHash) {
		console.warn("CurrentHash is null, figure data post cancelled.");
		return;
	}

	if (data.tags) {
		var tags0 = this.getCurrentTagArray();
		var tags1 = data.tags.split("|");

		for (i in tags1)
			if (tags0.indexOf(tags1[i]) < 0) {
				this.TagList.update(tags1[i], 3);
			}
	}

	for (var k in data)
		this.CurrentData[k] = data[k];

	data.hash = this.CurrentHash;

	var peer = this;

	$.post("/update-figure", data, function (json, s, ajax) {
		if (json.result == "success") {
			console.log("figure data post:", data, json);

			if (data.tags || data.tags == "") {
				peer.Panel.find(".input-tags").removeClass("dirty");
				peer.renderTagList();
			}
		}
		else if (json.result == "fail") {
			console.warn("post figure failed:", json.error);
		}
		else
			console.error("unexpect json result:", json);
	}, "json");

	// update post list
	this.appendRecentPostList(this.CurrentPath);
};

Peris.Peer.prototype.renderTagList = function () {
	var list = this.TagList.getSortedList(false);
	var ol = this.Panel.find(".tag-list");
	ol.empty();

	var tagsArray = this.getCurrentTagArray();

	var peer = this;

	for (var i in list) {
		var item = $("<li><span class='icon'></span><span class='text'></span></li>");
		item.find(".text").text(list[i].key);

		var used = tagsArray.indexOf(list[i].key) >= 0;
		if (used)
			item.addClass("used");

		item.find(".icon").text(used ? "\u00d7" : "+");

		item.appendTo(ol);

		item.click(function () {
			peer.onTagItemClick($(this));
		});
	}
};

Peris.Peer.prototype.getCurrentTagArray = function () {
	var tagsArray = [];
	if (this.CurrentData.tags)
		tagsArray = this.CurrentData.tags.split("|");

	return tagsArray;
};

Peris.Peer.prototype.appendRecentPostList = function (path) {
	var index = this.RecentPostList.Data.indexOf(this.CurrentPath);
	if (index >= 0)
		this.RecentPostList.Data.splice(index, 1);
	this.RecentPostList.Data.unshift(this.CurrentPath);

	if (this.RecentPostList.Data.length > this.RecentPostListLengthLimit)
		this.RecentPostList.Data.splice(this.RecentPostListLengthLimit, this.RecentPostList.Data.length);

	this.RecentPostList.save();
};

Peris.Peer.prototype.updateZoom = function (zoom) {
	var oldZoom = this.Zoom;

	this.Zoom *= zoom;
	this.Zoom = Math.max(this.Zoom, 0.1);

	var delta = this.Zoom / oldZoom;

	this.Translate.x /= delta;
	this.Translate.y /= delta;

	this.updateTransform();
};

Peris.Peer.prototype.updatePan = function (x, y) {
	this.Translate.x += x / this.Zoom;
	this.Translate.y += y / this.Zoom;
	this.updateTransform();

	this.DraggingFigure = true;
	this.Figure.css({ transition: "none" });
};


Peris.TagList = function () {
	this.load();
};

Peris.TagList.prototype = new Peris.LocalDataEntry("TagList", {});

Peris.TagList.prototype.List = {};

Peris.TagList.prototype.LengthMax = 50;
Peris.TagList.prototype.FrequencyDecreaseFactor = 0.99;

Peris.TagList.prototype.load = function () {
	this.List = Peris.LocalDataEntry.prototype.load.call(this);
};

Peris.TagList.prototype.update = function (key, inc) {
	this.List[key] = this.List[key] || 0;
	this.List[key] += inc;

	for (var k in this.List) {
		if (k != key) {
			this.List[k] *= this.FrequencyDecreaseFactor;
		}
	}

	var sorted = this.getSortedList(true);
	for (var i in sorted) {
		if (Object.keys(this.List).length <= this.LengthMax)
			break;

		delete this.List[sorted[i].key];
	}

	this.save();
};

Peris.TagList.prototype.getSortedList = function (rise) {
	var list = [];

	for (var k in this.List) {
		list.push({ key: k, frequency: this.List[k] });
	}

	list.sort(function (a, b) {
		var sub = a.frequency - b.frequency;
		return rise ? sub : -sub;
	});

	return list;
};
