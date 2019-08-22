


//const isOrigin = cube => cube.units.reduce((sum, unit) => sum + unit, 0) === 0;
const isOrigin = cube => {
	for (const unit of cube.units)
		if (unit)
			return false;

	return true;
};


const cubeLoop = cube => {
	let length = 1;
	for (let c = cube.clone(); !isOrigin(c); c = c.multiply(cube))
		++length;

	return length;
};



export {
	cubeLoop,
};
