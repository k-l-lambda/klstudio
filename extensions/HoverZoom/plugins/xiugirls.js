var hoverZoomPlugins = hoverZoomPlugins || [];
hoverZoomPlugins.push({
	name:'xiugirls',
	prepareImgLinks: function (callback) {
		var mountImg = function (img, url, count_) {
			var count = count_ || 100;

			img.data().hoverZoomGallerySrc = [];
			img.data().hoverZoomGalleryCaption = [];

			for (var i = 0; i < count; ++i) {
				var p = i >= 100 ? "" : (i >= 10 ? "0" : "00");

				img.data().hoverZoomGallerySrc.push([url.replace(/(\d+\.jpg)$/, p + i + ".jpg")]);
				img.data().hoverZoomGalleryCaption.push(i);
			}
			callback($([img]));
			hoverZoom.displayPicFromElement(img);

			if (count_)
				hoverZoom.preloadImages();
		};

		$('img[src*=".com/album/"]').one('mouseenter', function () {
			//console.log("hm:", window.album_imgs);
			var img = $(this);

			var count = Number($("#time").text().match(/\s(\d+)\s/)[1]);

			mountImg(img, img[0].src, count);
		});

		$('img[src*=".com/thumb_"]').one('mouseenter', function () {
			var img = $(this);

			var path = img[0].src.replace(/thumb_[^\/]+\//, "").replace("cover.jpg", "000.jpg");

			var countSpan = img.parent().find(".num");
			var count = countSpan ? Number(countSpan.text()) : null;

			mountImg(img, path, count);
		});
	}
});
