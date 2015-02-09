
var Peris = Peris || {};


Peris.isIPad = (/ipad/i).test(navigator.userAgent);
Peris.isTouchDevice = "ontouchstart" in window;


Peris.LocalDataEntry = function (name, data) {
	this.Name = name;
	this.Data = data;
};

Peris.LocalDataEntry.prototype.load = function () {
	if (localStorage[this.Name])
		this.Data = $.parseJSON(localStorage[this.Name]);

	return this.Data;
};

Peris.LocalDataEntry.prototype.save = function () {
	localStorage[this.Name] = $.toJSON(this.Data);
};


Peris.showFileInFolder = function (path) {
	$.post("/exec", { command: "os.system(r'explorer /select,%(data_root)s" + path.replace("/", "\\") + "')" }, function (json) {
		console.log(json);
	});
};
