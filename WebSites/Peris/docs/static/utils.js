
var Peris = Peris || {};


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
