
var Peris = Peris || {};


Peris.Slider = function (viewer) {
	this.Viewer = viewer;

	this.initialize();
};

Peris.Slider.prototype.Showing = false;
Peris.Slider.prototype.CurrentIndex = 0;
Peris.Slider.prototype.PathList = [];
Peris.Slider.prototype.SwitchDuration = 800;
Peris.Slider.prototype.FastSwitchDuration = 300;
Peris.Slider.prototype.SwitchInterval = 4000;
Peris.Slider.prototype.SwitchHandle = null;
Peris.Slider.prototype.Switching = false;
Peris.Slider.prototype.LastSwitchTime = Date.now();


Peris.Slider.prototype.initialize = function () {
	this.Panel = $("<div class='slider fullscreen-panel'>"
		+ "<button class='exit'></button>"
		+ "<div class='prev'></div>"
		+ "<div class='next'></div>"
		+ "<div class='current'></div>"
		+ "</div>");

	this.Panel.appendTo("body");

	var slider = this;

	this.Panel.click(function () { slider.onClick(event); });

	$(document).keydown(function () {
		slider.onKeyDown(event);
	});

	this.Panel.find(".exit").click(function () { slider.close(); });

	this.Prev = this.Panel.find(".prev");
	this.Next = this.Panel.find(".next");
	this.Current = this.Panel.find(".current");
};

Peris.Slider.prototype.open = function (options) {
	options = options || {};
	options.startIndex = options.startIndex || 0;

	console.log("Slider open at", options.startIndex);

	this.CurrentIndex = options.startIndex;
	this.PathList = this.Viewer.PathList;
	this.OnClose = options.onClose;

	this.Panel.fadeIn();

	var slider = this;

	this.OldOnmouseWheel = document.onmousewheel;
	document.onmousewheel = function () {
		slider.onMouseWheel(event);
	};

	this.Prev.empty();
	this.Next.empty();
	this.Current.empty();

	this.Prev.append(this.newFigure(this.CurrentIndex - 1));
	this.Current.append(this.newFigure(this.CurrentIndex));
	this.Next.append(this.newFigure(this.CurrentIndex + 1));

	this.Current.find(".figure").fadeIn(this.SwitchDuration, function () {
		slider.onSwitched();
	});

	this.startSwitching();

	this.Showing = true;
};

Peris.Slider.prototype.close = function () {
	this.Panel.fadeOut();

	document.onmousewheel = this.OldOnmouseWheel;

	this.stopSwitching();

	this.Showing = false;

	if (this.OnClose)
		this.OnClose();
};

Peris.Slider.prototype.startSwitching = function () {
	var slider = this;

	this.stopSwitching();

	this.SwitchHandle = setInterval(function () {
		if (Date.now() - slider.LastSwitchTime >= (slider.SwitchInterval - slider.SwitchDuration) * 0.9)
			slider.switchFigure({loop: true});
	}, this.SwitchInterval);
};

Peris.Slider.prototype.stopSwitching = function () {
	if (this.SwitchHandle) {
		clearInterval(this.SwitchHandle);
		this.SwitchHandle = null;
	}
};

Peris.Slider.prototype.prev = function (options) {
	options = options || {};
	options.backwars = true;

	this.switchFigure(options);
};

Peris.Slider.prototype.next = function (options) {
	this.switchFigure(options);
};

Peris.Slider.prototype.switchFigure = function (options) {
	options = options || {};

	if (this.Switching)
		return;

	duration = options.duration || (options.manually ? this.FastSwitchDuration : this.SwitchDuration);

	var slider = this;

	this.Switching = true;

	this.Current.find(".figure").fadeOut(duration)
	if (options.manually)
		this.Current.find(".figure").animate({ left: options.backwars ? "+=60px" : "-=60px" }, { duration: duration, queue: false });

	if (!options.backwars) {
		this.Next.find(".figure").fadeIn(duration, function () {
			var f1 = slider.Current.find(".figure");
			var f2 = slider.Next.find(".figure");

			slider.Prev.empty();

			f1.detach();
			f1.css({ left: "", transform: "scale(1, 1)", "-webkittransform": "scale(1, 1)" });
			f1.appendTo(slider.Prev);

			f2.detach();
			f2.appendTo(slider.Current);

			slider.Next.append(slider.newFigure(slider.CurrentIndex + 1));

			slider.Switching = false;

			slider.onSwitched();
		});

		if (this.CurrentIndex < this.PathList.length)
			++this.CurrentIndex;
		else if (options.loop)
			this.CurrentIndex = 0;
	}
	else {
		this.Prev.find(".figure").fadeIn(duration, function () {
			var f1 = slider.Current.find(".figure");
			var f2 = slider.Prev.find(".figure");

			slider.Next.empty();

			f1.detach();
			f1.css({ left: "", transform: "scale(1, 1)", "-webkittransform": "scale(1, 1)" });
			f1.appendTo(slider.Next);

			f2.detach();
			f2.appendTo(slider.Current);

			slider.Prev.append(slider.newFigure(slider.CurrentIndex - 1));

			slider.Switching = false;

			slider.onSwitched();
		});

		if (this.CurrentIndex > 0)
			--this.CurrentIndex;
		else if (options.loop)
			this.CurrentIndex = this.PathList.length - 1;
	}
};

Peris.Slider.prototype.currentPath = function () {
	return this.PathList[this.CurrentIndex];
};

Peris.Slider.prototype.newFigure = function (index, onFinish) {
	index = Math.min(index, this.PathList.length - 1);
	index = Math.max(index, 0);

	var path = this.PathList[index];
	var figure = $("<img class='figure' src=\"/images/" + encodeURI(path) + "\" alt='" + path + "'>");
	figure.hide();

	figure.load(function () {
		var figure = $(this);
		var vertical = this.naturalHeight / this.naturalWidth > $(window).height() / $(window).width();

		figure.addClass(vertical ? "vertical-full" : "horizontal-full");

		if (onFinish)
			onFinish(true);
	});

	figure.error(function () {
		if (onFinish)
			onFinish(false);
	});

	return figure;
};

Peris.Slider.prototype.onClick = function (e) {
	if (this.Showing) {
		if (e.x / this.Panel.width() < 0.3)
			this.prev({manually: true});
		else
			this.next({manually: true});

		e.preventDefault();
	}
};

Peris.Slider.prototype.onMouseWheel = function (e) {
	if (this.Showing) {
		if (e.wheelDelta > 0)
			this.prev({manually: true});
		else if (e.wheelDelta < 0)
			this.next({manually: true});
	}
};

Peris.Slider.prototype.onKeyDown = function (e) {
	if (this.Showing) {
		var handled = true;

		var slider = this;

		switch (e.keyCode) {
			case 27: // esc
				this.close();

				break;
			case 37: // left
				setTimeout(function () {
					slider.prev({ manually: true });
				}, 1);

				break;
			case 39: // right
				setTimeout(function () {
					slider.next({ manually: true });
				}, 1);

				break;
			case 13: // enter
				this.switchFigure();

				break;
			case 32: // space
				if (this.SwitchHandle)
					this.stopSwitching();
				else {
					this.switchFigure();
					this.startSwitching();
				}

				break;
			default:
				handled = false;
				console.log(e.keyCode);
		}

		if (handled)
			e.preventDefault();
	}
};

Peris.Slider.prototype.onSwitched = function () {
	var slots = this.Viewer.SlotStream.find(".slot");
	var index = Math.max(Math.min(this.CurrentIndex, slots.length - 1), 0);

	this.Viewer.focusSlot($(slots[index]));

	var figure = this.Current.find(".figure");
	if (!Peris.isIPad)
		figure.css({ transform: "scale(1.3, 1.3)" });

	this.LastSwitchTime = Date.now();
};
