
var Peris = Peris || {};


Peris.Peer = function (viewer) {
	this.Viewer = viewer;

	this.initialize();
};

Peris.Peer.prototype.Showing = false;
Peris.Peer.prototype.Zoom = 1;
Peris.Peer.prototype.Translate = {x: 0, y: 0};
Peris.Peer.prototype.Rotation = 0;
Peris.Peer.prototype.HoldingFigure = false;
Peris.Peer.prototype.DraggingFigure = false;
Peris.Peer.prototype.LoadingSlot = false;
Peris.Peer.prototype.FadeDuration = 300;
Peris.Peer.prototype.PostTagsHandle = null;
Peris.Peer.prototype.TagsAutoSaveWaiting = 15000;
Peris.Peer.prototype.RefreshTagLabelsHandle = null;
Peris.Peer.prototype.TagsAutoRefreshWaiting = 200;
Peris.Peer.prototype.RecentPostList = new Peris.LocalDataEntry("RecentPostList", []);
Peris.Peer.prototype.RecentPostListLengthLimit = 1000;
Peris.Peer.prototype.LastTouch = null;
Peris.Peer.prototype.FigureClear = true;


var paintScoreGradient = function (ctx) {
	/*var gradient = ctx.createLinearGradient(0, 0, 1500, 0);
	gradient.addColorStop(0, "#400");
	gradient.addColorStop(2.5 / 15, "#cc0");
	gradient.addColorStop(2.50000001 / 15, "#ff0");
	gradient.addColorStop(5. / 15, "#0c0");
	gradient.addColorStop(5.00000001 / 15, "#0f0");
	gradient.addColorStop(7.5 / 15, "#22c");
	gradient.addColorStop(7.50000001 / 15, "#00f");
	gradient.addColorStop(10 / 15, "#90c");
	gradient.addColorStop(10.0000001 / 15, "#c0f");
	gradient.addColorStop(1, "white");
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 1500, 10);*/

	var gradient1 = ctx.createLinearGradient(0, 0, 250, 0);
	gradient1.addColorStop(0, "#400");
	gradient1.addColorStop(1, "#cc0");
	ctx.fillStyle = gradient1;
	ctx.fillRect(0, 0, 250, 10);

	var gradient2 = ctx.createLinearGradient(250, 0, 500, 0);
	gradient2.addColorStop(0, "#ff0");
	gradient2.addColorStop(1, "#0c0");
	ctx.fillStyle = gradient2;
	ctx.fillRect(250, 0, 500, 10);

	var gradient3 = ctx.createLinearGradient(500, 0, 750, 0);
	gradient3.addColorStop(0, "#0f0");
	gradient3.addColorStop(1, "#22c");
	ctx.fillStyle = gradient3;
	ctx.fillRect(500, 0, 750, 10);

	var gradient4 = ctx.createLinearGradient(750, 0, 1000, 0);
	gradient4.addColorStop(0, "#00f");
	gradient4.addColorStop(1, "#90c");
	ctx.fillStyle = gradient4;
	ctx.fillRect(750, 0, 1000, 10);

	var gradient5 = ctx.createLinearGradient(1000, 0, 1500, 0);
	gradient5.addColorStop(0, "#c0f");
	gradient5.addColorStop(1, "white");
	ctx.fillStyle = gradient5;
	ctx.fillRect(1000, 0, 1500, 10);
};


Peris.Peer.prototype.initialize = function () {
	this.Panel = $("<div class='peer fullscreen-panel'>"
		+ "<div class='controls'>"
		+ "<button class='prev'>&lt;</button>"
		+ "<button class='next'>&gt;</button>"
		+ "<button class='show-slider'></button>"
		+ "<div class='score-bar'><canvas class='score-gradient' width='1500' height='10'></canvas><div class='score-touch'><div class='score-touch-colored'></div></div></div>"
		+ "<div class='input-bar'><input class='input-score' type='text' readonly /><input class='input-tags' type='text' /><ol class='tag-list'></ol></div>"
		+ "</div></div>");

	this.Panel.appendTo("body");

	this.Panel.find(".controls").hide();
	this.Panel.hide();

	var peer = this;

	this.Panel.click(function () { peer.onClick(event); });

	this.Panel.mousedown(function () { peer.onMouseDown(event); });
	this.Panel.mouseup(function () { peer.onMouseUp(event); });
	this.Panel.mousemove(function () { peer.onMouseMove(event); });

	this.Panel.bind("touchmove", function () {
		if (event.changedTouches[0] && !peer.Panel.find(".score-bar").is(":hover")) {
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
	paintScoreGradient(canvas[0].getContext("2d"));

	this.Panel.find(".score-bar").mousemove(function () {
		var score = event.x * 15 / $(this).width();
		peer.setScoreTouchValue(score);
	});

	this.Panel.find(".score-bar").bind("touchmove", function () {
		var x = event.changedTouches[0].pageX;
		var score = x * 15 / $(this).width();
		peer.setScoreTouchValue(score);

		event.preventDefault();
	});

	this.Panel.find(".score-bar").click(function () {
		var score = Number((event.x * 15 / $(this).width()).toPrecision(4));
		peer.setScoreTouchValue(score);

		peer.postFigureData({ score: score });
	});

	this.Panel.find(".score-bar").bind("touchend", function () {
		var x = event.changedTouches[0].pageX;
		var score = Number((x * 15 / $(this).width()).toPrecision(4));
		peer.setScoreTouchValue(score);

		peer.postFigureData({ score: score });

		event.preventDefault();
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
		}, peer.TagsAutoSaveWaiting);

		if (peer.RefreshTagLabelsHandle)
			clearTimeout(peer.RefreshTagLabelsHandle);

		peer.RefreshTagLabelsHandle = setTimeout(function () {
			peer.renderTagList();

			peer.RefreshTagLabelsHandle = null;
		}, peer.TagsAutoRefreshWaiting);
	});

	this.Panel.find(".input-tags").focusout(function () {
		if ($(this).is(".dirty") && !peer.Panel.find(".tag-list li:hover").length)
			peer.postFigureData({ tags: $(this).val() });
	});

	this.Panel.bind("gesturestart", function () {
		peer.BeginRotation = peer.Rotation;
	});

	this.Panel.bind("gesturechange", function () {
		if (event.rotation)
			peer.Rotation = peer.BeginRotation + event.rotation;
		if (Math.abs(peer.Rotation) < 5)
			peer.Rotation = 0;
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
	this.Rotation = 0;
	this.Translate = { x: 0, y: 0 };
	this.HoldingFigure = false;

	this.Viewer.focusSlot(slot);

	var inputBar = this.Panel.find(".input-bar");
	inputBar.find(".input-score").val("");
	inputBar.find(".input-tags").val("");
	inputBar.find(".input-tags").removeClass("dirty");
	inputBar.addClass("disabled");

	this.Panel.find(".tag-list").empty();

	this.setScoreTouchValue(0);

	this.CurrentHash = null;
	this.CurrentData = null;

	this.CurrentPath = slot.data("path");
	$.post("/query", { query: 'file-info', path: this.CurrentPath }, function (json, s, ajax) {
		if (json.result == "success") {
			inputBar.removeClass("disabled");

			if (json.data)
				peer.updateData(json.data);

			if (!json.data || !json.data.thumb) {
				$.post("/check-file", { path: peer.CurrentPath }, function (json) {
					console.log("Check file result:", json);

					if (json.data) {
						if (peer.CurrentData)
							peer.CurrentData.thumb = json.data.thumb;
						slot.removeClass("raw");
					}
				});
				console.log("Checking file:", peer.CurrentPath);
			}
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

	this.Panel.find(".controls").fadeOut(this.FadeDuration, function () {
		peer.Panel.hide();
		peer.clearSlotBinding();
	});

	// animate figure to source slot
	var targetPosition = this.SourceSlot.offset();
	var targetSize = { width: this.SourceSlot.width(), height: this.SourceSlot.height() };
	targetPosition.x = targetPosition.left + targetSize.width / 2;
	targetPosition.y = targetPosition.top + targetSize.height / 2;

	var currentPosition = { x: $(window).width() / 2, y: $(window).height() / 2 };
	var currentSize = { width: Math.min($(window).width(), this.Figure[0].naturalWidth), height: Math.min($(window).height(), this.Figure[0].naturalHeight) };

	var scale = 1 / Math.min(currentSize.width / targetSize.width, currentSize.height / targetSize.height);
	var translation = { x: (targetPosition.x - currentPosition.x) / scale, y: (targetPosition.y - currentPosition.y) / scale };
	this.Figure.css({ transform: "scale(" + scale + ", " + scale + ") translate(" + translation.x + "px, " + translation.y + "px)" });

	this.Showing = false;

	this.FigureClear = true;
};

Peris.Peer.prototype.updateData = function (data, options) {
	options = options || {};

	this.CurrentHash = data.hash;
	this.CurrentData = { score: data.score, tags: data.tags, thumb: data.thumb };

	this.setScoreTouchValue(Number(data.score));
	this.Panel.find(".input-bar .input-tags").val(data.tags);

	if (data.tags) {
		var tagsArray = data.tags.split("|");
		for (var i in tagsArray)
			this.TagList.update(tagsArray[i], 1);
	}

	if (options.refreshUI || $(".tag-list li").length == 0)
		this.renderTagList();
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

	figures.removeClass("holding");

	this.SourceSlot.removeClass("hangout");

	this.Figure = null;
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
		statIndex = this.Viewer.indexOfPath(this.SourceSlot.data("path"));
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

	this.Panel.show();
	this.Panel.find(".controls").fadeIn(this.FadeDuration);

	slot.css({ height: slot.height() + "px" });
	slot.addClass("hangout");

	var oldPosition = this.Figure.offset();
	var oldSize = { width: this.Figure.width(), height: this.Figure.height() };
	oldPosition.x = oldPosition.left + oldSize.width / 2;
	oldPosition.y = oldPosition.top + oldSize.height / 2;

	var newPosition = { x: $(window).width() / 2, y: $(window).height() / 2 };
	var newSize = { width: Math.min($(window).width(), this.Figure[0].naturalWidth), height: Math.min($(window).height(), this.Figure[0].naturalHeight) };

	var scale = 1 / Math.min(newSize.width / oldSize.width, newSize.height / oldSize.height);
	var translation = { x: (oldPosition.x - newPosition.x) / scale, y: (oldPosition.y - newPosition.y) / scale };
	if (this.FigureClear)
		this.Figure.css({ transform: "scale(" + scale + ", " + scale + ") translate(" + translation.x + "px, " + translation.y + "px)" });

	this.Figure.detach();
	this.Figure.appendTo(this.Panel);

	var peer = this;

	if (this.FigureClear) {
		setTimeout(function () {
			peer.Figure.css({ transform: "scale(1,1) translate(0, 0)" });
		}, 1);
	}

	this.Figure.mousedown(function () {
		if (event.button == 0 && !peer.Panel.find(".score-bar").is(":hover")) {
			peer.HoldingFigure = true;

			$(this).addClass("holding");

			event.preventDefault();
		}
	});

	this.FigureClear = false;
	this.LoadingSlot = false;
};

Peris.Peer.prototype.getScoreColor = function (score) {
	if (score) {
		var canvas = this.Panel.find(".score-gradient");
		var ctx = canvas[0].getContext("2d");
		var color = ctx.getImageData(score * 100, 0, 1, 1).data;
		return "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";
	}

	return "";
}

Peris.Peer.prototype.setScoreTouchValue = function (score) {
	if (score) {
		var colorStr = this.getScoreColor(score);

		var percent = score * 100 / 15;
		this.Panel.find(".score-touch-colored").css({ width: percent + "%", background: colorStr });
		this.Panel.find(".score-bar").removeClass("empty");
		this.Panel.find(".input-score").val(score.toPrecision(4));
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
			/*// middle button
			case 1:
				this.Translate = { x: 0, y: 0 };

				this.Zoom = this.Figure[0].naturalWidth / this.Figure.width();
				this.updateTransform();

				break;*/
		}
	}
};

Peris.Peer.prototype.onMouseWheel = function (e) {
	if (this.Showing) {
		this.updateZoom(Math.exp(e.wheelDelta / 400));
	}
};

Peris.Peer.prototype.onMouseDown = function (e) {
	if (this.Showing) {
		switch (e.button) {
			// middle button
			case 1:
				this.Translate = { x: 0, y: 0 };

				this.Zoom = this.Figure[0].naturalWidth / this.Figure.width();
				this.updateTransform();

				break;
		}
	}
};

Peris.Peer.prototype.onMouseUp = function (e) {
	this.HoldingFigure = false;

	if (this.Figure)
		this.Figure.removeClass("holding");
};

Peris.Peer.prototype.onMouseMove = function (e) {
	if (this.HoldingFigure && (e.movementX || e.movementY)) {
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
			case 120: // F9
				Peris.showFileInFolder(this.CurrentPath);

				break;
			case 121: // F10,	show similar figures
				var deep = e.ctrlKey;

				if (this.CurrentData && this.CurrentData.thumb) {
					Peris.openSimilarQuery(this.CurrentData.thumb, deep ? 2 : 1);
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

Peris.Peer.prototype.onTagItemClick = function (item, e) {
	var tagsArray = this.getCurrentTagArray();
	var tag = item.find(".text").text();

	if (e.ctrlKey) {
		var sql = "select path from file_register left join album on file_register.hash = album.hash\nwhere tags like '%" + tag + "%'\norder by score desc";
		open("#expandViewer&sql=" + encodeURIComponent(sql), "_blank");
	}
	else {
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
	}
};

Peris.Peer.prototype.updateTransform = function (e) {
	this.Figure.css({ transform: "scale(" + this.Zoom + ", " + this.Zoom + ") translate(" + this.Translate.x + "px, " + this.Translate.y + "px) rotate(" + this.Rotation + "deg)" });
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

	var inputTagsArray = this.Panel.find(".input-tags").val().split("|");

	var peer = this;

	for (var i in list) {
		var item = $("<li><span class='icon'></span><span class='text'></span></li>");
		item.find(".text").text(list[i].key);

		var used = tagsArray.indexOf(list[i].key) >= 0;
		if (used)
			item.addClass("used");
		else if ($(".input-tags").is(":focus"))
			for (var ii in inputTagsArray) {
				if (inputTagsArray[ii].length > 0 && list[i].key.indexOf(inputTagsArray[ii]) >= 0)
					item.addClass("contained");
			}

		item.find(".icon").text(used ? "\u00d7" : "+");

		item.appendTo(ol);

		item.click(function () {
			peer.onTagItemClick($(this), event);
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
};


Peris.TagList = function () {
	this.load();
};

Peris.TagList.prototype = new Peris.LocalDataEntry("TagList", {});

Peris.TagList.prototype.List = {};

Peris.TagList.prototype.LengthMax = 100;
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
