
class Item {
	constructor (unit, exponent) {
		this.unit = unit;
		this.exponent = exponent;
	}


	toString () {
		let postfix;

		switch (this.exponent) {
		case 0:
			return "1";

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

		return "ijk"[this.unit] + postfix;
	}


	normalized () {
		let exponent = this.exponent % 4;

		switch (this.exponent) {
		case 3:
			exponent = -1;

			break;
		case -3:
			exponent = 1;

			break;
		case -2:
			exponent = 2;

			break;
		}

		return new Item(this.unit, exponent);
	}


	mul (other) {
		console.assert(this.unit === other.unit);

		return new Item(this.unit, this.exponent + other.exponent);
	}
};


class Orientation {
	constructor (items = []) {
		this.items = items;
	}


	toString () {
		if (!this.items.length)
			return "1";

		return this.items.map(item => item.toString()).join("");
	}


	normalize () {
		// merge continous units
		for (let i = 1; i < this.items.length; ++i) {
			if (this.items[i].unit === this.items[i - 1].unit) {
				this.items.splice(i - 1, 2, this.items[i - 1].mul(this.items[i]));
				--i;
			}
		}

		this.items = this.items.map(item => item.normalized());

		return this;
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
	Item,
	Orientation,

	I, I_, I2, J, J_, J2, K, K_, K2,
};
