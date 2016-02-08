
var GE = GE || {};


GE.SLOT_WIDTH = 240;
GE.SLOT_HEIGHT = 280;


GE.ImagePatterns = [/\.jpg$/i, /\.jpeg$/i, /\.bmp$/i, /\.png$/i, /\.gif$/i];
GE.VideoPatterns = [/\.avi$/i, /\.mp4$/i, /\.wmv$/i, /\.rm$/i, /\.rmvb$/i, /\.flv$/i, /\.m4v$/i, /\.mkv$/i, /\.mpg$/i, /\.vob$/i];

GE.isInType = function (filename, patterns) {
	for (var i in patterns)
		if (patterns[i].test(filename))
			return true;

	return false;
};

GE.isImage = function (filename) {
	return GE.isInType(filename, GE.ImagePatterns);
};

GE.isVideo = function (filename) {
	return GE.isInType(filename, GE.VideoPatterns);
};


GE.Viewer = function (container) {
	this.Container = container;

	this.SlotStream = $("<div class='slot-stream'></div>");
	this.SlotStream.appendTo(this.Container);
};


GE.Viewer.prototype.update = function (root, data) {
	this.SlotStream.empty();

	for (var i in data.dirs) {
		var name = data.dirs[i];
		var link = "#" + root + name + "/";

		var slot = this.newSlot({ name: name, type: "dir", link: link });
		slot.appendTo(this.SlotStream);

		slot.addClass("loading");

		$.get("dir?root=" + encodeURIComponent(root + name + "/"), function (data, s, xhr) {
			data = JSON.parse(data);

			//console.log(xhr.user_data.name, data);
			for (var i in data.files) {
				var name = data.files[i];
				if (GE.isImage(name)) {
					var link = "docs/" + xhr.user_data.root + name;
					xhr.user_data.slot.find(".slot-icon").append("<img src='" + link + "' />");

					break;
				}
			}

			xhr.user_data.slot.removeClass("loading");
		}).user_data = { name: name, slot: slot, root: root + name + "/" };
	}

	for (var i in data.files) {
		var name = data.files[i];
		if (GE.isImage(name) || GE.isVideo(name)) {
			var type = GE.isImage(name) ? "image" : "video";
			var link = "docs/" + root + name;

			var slot = this.newSlot({ name: name, type: type, link: link });
			slot.appendTo(this.SlotStream);
		}
	}

	this.updateLayout();
};


GE.Viewer.prototype.updateLayout = function () {
	var containerWidth = this.Container.innerWidth();
	var colomns = Math.max(Math.floor(containerWidth / GE.SLOT_WIDTH), 1);
	var colomnWidth = containerWidth / colomns;

	this.SlotStream.find(".slot").each(function (i, s) {
		var slot = $(s);
		var row = Math.floor(i / colomns);
		var colomn = i % colomns;

		slot.css({
			top: row * GE.SLOT_HEIGHT,
			left: (colomn + 0.5) * colomnWidth - GE.SLOT_WIDTH * 0.5
		});
	});
};

GE.Viewer.prototype.newSlot = function (data) {
	var slot = $("<div class='slot new'><div class='slot-icon'><div class='slot-loading'></div></div><div class='slot-label'><a class='slot-label-link'></a></div></div>");

	slot.addClass(data.type);

	slot.find(".slot-label-link").text(data.name);
	slot.find(".slot-label-link").attr("href", data.link);

	slot.find(".slot-icon").click(function () {
		$(this).parent().find(".slot-label-link")[0].click();
	});

	if (data.type == "image")
		slot.find(".slot-icon").append("<img src='" + data.link + "' />");

	return slot;
};