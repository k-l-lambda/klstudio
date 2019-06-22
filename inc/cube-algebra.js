
class Item {
	constructor(unit, exponent) {
		this.unit = unit;
		this.exponent = exponent;
	}


	toString() {
		let postfix;

		switch (this.exponent) {
			case -1:
				postfix = "'";

				break;
			case 1:
				postfix = "";

				break;
			default:
				postfix = this.exponent.toString();

				break;
		}

		return 'ijk'[this.unit] + postfix;
	}
};


class Orientation {
	constructor(items = []) {
		this.items = items;
	}


	toString() {
		if (!this.items.length)
			return "1";

		return this.items.map(item => item.toString()).join("");
	}
};


const _i = 0;
const _j = 1;
const _k = 2;

const I = new Item(_i, 1);
const I_ = new Item(_i, -1);
const I2 = new Item(_i, 2);
const J = new Item(_j, 1);
const J_ = new Item(_j, -1);
const J2 = new Item(_k, 2);
const K = new Item(_k, 1);
const K_ = new Item(_k, -1);
const K2 = new Item(_k, 2);


module.exports = {
	Orientation,

	I, I_, I2, J, J_, J2, K, K_, K2,
};
