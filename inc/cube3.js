
const cubeAlgebra = require("cube-algebra");


/*class UnitCube {
	constructor () {
		this.state = 0;
	}
};*/


const axis = {
	pX: 0,
	pY: 1,
	pZ: 2,
	nX: 3,
	nY: 4,
	nZ: 5,
};


const manipulationToAxisRotation = manipulation => ({
	axis: Math.floor(manipulation / 3),
	rotation: (manipulation % 3) + 3 * Math.floor(manipulation / 6) + 1,
});


class Cube3 {
	constructor () {
		this.units = Array(3 ** 3).fill(0);
	}


	manipulate (manipulation) {
		// TODO: select a face according to axis, substitute unit states by rotation.
	}
};



module.exports = {
	axis,
	Cube3,
};
