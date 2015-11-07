
function(data){
	var cc = function(a,b){
		if (a < b) return -1;
		if (a > b) return 1;
		return 0;
	};

	var comparePath = function(path1, path2){
		var seg1 = path1.split("/");
		var seg2 = path2.split("/");
		
		if(seg1.length == seg2.length)
			return cc(seg1[seg1.length - 1].length, seg2[seg2.length - 1].length);
		else
			return cc(seg2.length, seg1.length);
	};

	var compare = function(d1, d2){
		if(d1.hash == d2.hash)
			return comparePath(d1.path, d2.path);
		else
			return cc(d1.hash, d2.hash);
	};
	
	data.sort(compare);

	data = data.filter(function(d, i){return (i < data.length - 1 && d.hash == data[i+1].hash) || (i > 0 && d.hash == data[i-1].hash);});

	return data;
}
