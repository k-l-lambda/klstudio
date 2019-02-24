
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

	{
		name: "fifth-pitch-graph",
		path: "/documents/fifth-pitch-graph",
		title: "Fifth Pitch Graph",
	},

	{
		name: "equal-temperament",
		path: "/documents/equal-temperament",
		title: "12 Equal Temperament",
	},

	{
		name: "hyperbolic",
		path: "/documents/hyperbolic",
		title: "Hyperbolic",
	},

	{
		name: "curves-editor",
		path: "/curves-editor",
		title: "Curves Editor",
	},
].map(data => new Entry(data));
