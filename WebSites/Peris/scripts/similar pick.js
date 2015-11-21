select path, cbir.thumb as thumb, width, height
from (file_register left join album on file_register.hash = album.hash) left join cbir on file_register.hash = cbir.hash
where path not like '%.gif'
order by thumb

function(data){
	data = data.filter(function(d, i){
		d.sub = (i > 0 && d.thumb == data[i-1].thumb);

		if(i < data.length - 1 && d.thumb == data[i+1].thumb && d.width < data[i+1].width && d.height < data[i+1].height)
			d.selected = true;

		if(i > 0 && d.thumb == data[i-1].thumb && d.width < data[i-1].width && d.height < data[i-1].height)
			d.selected = true;

		return (i < data.length - 1 && d.thumb == data[i+1].thumb) || (i > 0 && d.thumb == data[i-1].thumb);});

	return data;
}
