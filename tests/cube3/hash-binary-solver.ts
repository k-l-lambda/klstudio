
import {Cube3} from "../../inc/cube3";
import {solveCubeBinary} from "../../inc/cube3-hash";



const randomPath = length => Array(length).fill(null).map(() => ~~(Math.random() * 12));


for (let i = 0; i < 10; ++i) {
	const path = randomPath(7);
	const cube = new Cube3({path: path});
	const solution = solveCubeBinary(cube);

	console.log("solution:", path, solution);
}
