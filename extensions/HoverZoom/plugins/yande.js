var hoverZoomPlugins = hoverZoomPlugins || [];
hoverZoomPlugins.push({
	name:'yande',
	prepareImgLinks: function (callback) {
		var mountImg = function (link, url) {
			link.data().hoverZoomGallerySrc = [[url]];
			link.data().hoverZoomGalleryCaption = [url];

			callback($([link]));
			hoverZoom.displayPicFromElement(link);
		};

		$('a.thumb').one('mouseenter', async function () {
			const img = this.querySelector('img');
			const link = this.href;
			//console.log("link:", link, img.src);

			const hash = img.src.match(/\w{32}/)[0];
			const index = link.match(/\d+/)[0];
			console.log("hash:", hash, index);

			const imgURL = `https://files.yande.re/sample/${hash}/yande-${index}.jpg`;
			mountImg($(this), imgURL);
		});
	}
});
