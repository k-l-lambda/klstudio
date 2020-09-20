var hoverZoomPlugins = hoverZoomPlugins || [];
hoverZoomPlugins.push({
	name:'feedly',
	prepareImgLinks: function (callback) {
		var mountImg = function (link, url) {
			link.data().hoverZoomGallerySrc = [[url]];
			link.data().hoverZoomGalleryCaption = [url];

			callback($([link]));
			hoverZoom.displayPicFromElement(link);
		};

		$('.visual-container').one('mouseenter', async function () {
			const title = $(this).parent().find(".content .title");
			const pageURL = title[0].href;
			const response = await fetch(pageURL);
			if (!response.ok) {
				console.warn("page fetching failed.");
			}
			else {
				const html = await response.text();
				//console.log("page content:", html);

				const doc = new DOMParser().parseFromString(html, "text/html");
				const img = doc.querySelector(".image-container picture img") || doc.querySelector(".content img");

				if (img)
					mountImg($(this).parent(), img.src);
			}
		});
	}
});
