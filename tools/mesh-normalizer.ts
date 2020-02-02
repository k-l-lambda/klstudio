
import {argv} from "yargs";
import * as fs from "fs";



const normalizer = ({xmin, xmax, ymin, ymax, zmin, zmax}) => ([x, y, z]) => [
	(x - (xmin + xmax) / 2) * 2 / (xmax - xmin),
	(y - (ymin + ymax) / 2) * 2 / (ymax - ymin),
	(z - (zmin + zmax) / 2) * 2 / (zmax - zmin),
];


const main = async inputFile => {
	const content = fs.readFileSync(inputFile);
	const json = JSON.parse(content);
	//console.log(json.geometries[0].data.attributes.position.array);

	const positions = [];

	for (const geometry of json.geometries) {
		const {array} = geometry.data.attributes.position;
		for (let i = 0; i < array.length / 3; ++i)
			positions.push(array.slice(i * 3, (i + 1) * 3));
	}

	//console.log("positions:", positions);
	const xs = positions.map(p => p[0]);
	const ys = positions.map(p => p[1]);
	const zs = positions.map(p => p[2]);

	const traits = {
		xmin: Math.min(...xs),
		xmax: Math.max(...xs),
		ymin: Math.min(...ys),
		ymax: Math.max(...ys),
		zmin: Math.min(...zs),
		zmax: Math.max(...zs),
	};
	//console.log("traits:", traits);

	const norm = normalizer(traits);

	for (const geometry of json.geometries) {
		const {array} = geometry.data.attributes.position;
		for (let i = 0; i < array.length / 3; ++i) {
			const pos = norm(array.slice(i * 3, (i + 1) * 3));
			array[i * 3] = pos[0];
			array[i * 3 + 1] = pos[1];
			array[i * 3 + 2] = pos[2];
		}
	}

	const outputText = JSON.stringify(json);
	fs.writeFileSync(inputFile.replace(/.\w+$/, "_normalized.json"), outputText);

	console.log("Done.");
};

//console.log("argv:", argv);
main(argv._[0]);
