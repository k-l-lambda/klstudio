
class Entry {
	constructor(fields) {
		Object.assign(this, fields);
	}


	get _filename() {
		return this.filename || this.path.substr(1);
	}
};



module.exports = [
	{
		name: "home",
		path: "/",
		filename: "index.html",
		title: "K.L. Studio",
	},
	{
		name: "writer",
		path: "/writer/",
		title: "AI Writer",
	},
].map(data => new Entry(data));
