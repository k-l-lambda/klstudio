
(function () {
	const CELL_WIDTH = 768;
	const CELL_HEIGHT = 1024;

	const banners = {};
	const fullLinks = {};

	const cropImg = (source, x, y, w, h) => {
		const canvas = document.createElement("canvas");
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext("2d");
		ctx.drawImage(source, -x, -y);
		return new Promise(resolve => canvas.toBlob(resolve, "webp"));
	};

	const tables = document.querySelectorAll("table");
	tables.forEach(table => {
		const trs = table.querySelectorAll("tbody tr");
		trs.forEach(tr => {
			const key = tr.dataset.key;

			tr.onmouseenter = () => {
				if (!banners[key]) {
					banners[key] = new Promise(async resolve => {
						const res = await fetch(`./full/${key}.webp`);
						const blob = await res.blob();
						const img = document.createElement("img");
						img.onload = () => resolve(img);
						img.src = URL.createObjectURL(blob);
					});
				}
			};

			const tds = tr.querySelectorAll("td");
			tds.forEach((td, i) => {
				const linkKey = `${key}_${i}`;
				td.onclick = async () => {
					if (!fullLinks[linkKey]) {
						await banners[key].then(async img => {
							const blob = await cropImg(img, CELL_WIDTH * i, 0, CELL_WIDTH, CELL_HEIGHT);
							fullLinks[linkKey] = URL.createObjectURL(blob);
						});
					}
					open(fullLinks[linkKey]);
				};
			});
		});
	});
})();
