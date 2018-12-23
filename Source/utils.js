
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).Format("yyyy-M-d h:m:s.S")	  ==> 2006-7-2 8:9:4.18
Date.prototype.format = function (fmt) { //author: meizz
	var o = {
		"M+": this.getMonth() + 1, //月份
		"d+": this.getDate(), //日
		"h+": this.getHours(), //小时
		"m+": this.getMinutes(), //分
		"s+": this.getSeconds(), //秒
		"q+": Math.floor((this.getMonth() + 3) / 3), //季度
		"S": this.getMilliseconds() //毫秒
	};
	if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	for (var k in o)
	if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
	return fmt;
}


Object.map = function(obj, func, keyMap = (k => k)) {
	return Object.keys(obj).reduce((o, key) => (o[keyMap(key)] = func(obj[key]), o), {});
};


Object.pick = function(obj, fields) {
	return fields.reduce((result, key) => (obj[key] !== undefined && (result[key] = obj[key]), result), {});
};


if (typeof File === "function") {
	File.prototype.readAs = function(type) {
		return new Promise(resolve => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result);

			reader[`readAs${type}`](this);
		});
	};
}


// browser detection
if (typeof window === "object") {
	window.navigator.isChrome = /.*Chrome.*/.test(window.navigator.userAgent);
	window.navigator.isSafari = /.*AppleWebKit.*/.test(window.navigator.userAgent) && !/.*Chrome.*/.test(window.navigator.userAgent);
	window.navigator.isMac = /.*Macintosh.*/.test(window.navigator.userAgent);
}
