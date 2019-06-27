
class Entry {
	name: string;
	path: string;
	filename: string;
	title: string;


	constructor (fields) {
		Object.assign(this, fields);
	}


	get _filename () : string {
		return this.filename || this.path.substr(1);
	}
};



export default [
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

	{
		name: "cube3-player",
		path: "/cube3-player",
		title: "3-order Magic Cube Player",
	},

	{
		name: "spiral-piano",
		path: "/spiral-piano",
		title: "Spiral Piano",
	},
].map(data => new Entry(data));
