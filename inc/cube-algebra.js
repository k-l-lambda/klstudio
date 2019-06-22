
const _i = 0;
const _j = 1;
const _k = 2;


class Item {
	constructor (unit, exponent) {
		this.unit = unit;
		this.exponent = exponent;
	}


	toString () {
		let postfix;

		switch (this.exponent) {
		case 0:
			return "";

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

		switch (exponent) {
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

		if (exponent === this.exponent)
			return this;

		return new Item(this.unit, exponent);
	}


	mul (other) {
		console.assert(this.unit === other.unit);

		return new Item(this.unit, this.exponent + other.exponent);
	}


	static supplementaryUnit (item1, item2) {
		return 3 - item1.unit - item2.unit;
	}


	static sqauredReduce (item1, item2) {
		if (item1.exponent === 2 && item2.exponent === 2)
			return new Item(this.supplementaryUnit(item1, item2), 2);

		return null;
	}


	static exchangeReduce (item1, item2) {
		if (item1.unit === _i)
			return null;

		if (item1.unit === item2.unit)
			return null;

		const obey = (item2.unit - item1.unit + 3) % 3 === 1;
		const u2 = obey ? _j : _k;

		const otherExponent = item1.exponent * item2.exponent * (obey ? 1 : -1);
		const otherUnit = Item.supplementaryUnit(item1, item2);
		const otherItem = new Item(otherUnit, otherExponent);

		const exps = [item1, item2, otherItem].reduce((map, item) => (map[item.unit] = item.exponent, map), []);

		return [new Item(_i, exps[_i]), new Item(u2, exps[u2])];
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
		//console.log("step0:", this.toString());

		this.items = this.items.map(item => item.normalized());

		// expand squred items
		for (let i = 0; i < this.items.length; ++i) {
			if (this.items[i].exponent === 2) {
				const unit = new Item(this.items[i].unit, 1);
				this.items.splice(i, 1, unit, unit);

				++i;
			}
		}
		//console.log("step1:", this.toString());

		// substitute by exchange formulas
		while (true) {
			let reduced = null;
			for (let i = 1; i < this.items.length; ++i) {
				reduced = Item.exchangeReduce(this.items[i - 1], this.items[i]);
				if (reduced) {
					//console.log("exchange reduced:", new Orientation([this.items[i - 1], this.items[i]]).toString(), new Orientation(reduced).toString());

					this.items.splice(i - 1, 2, ...reduced);
					break;
				}
			}

			if (!reduced)
				break;
		}
		//console.log("step2:", this.toString());

		// merge continous units
		for (let i = 1; i < this.items.length; ++i) {
			if (this.items[i].unit === this.items[i - 1].unit) {
				this.items.splice(i - 1, 2, this.items[i - 1].mul(this.items[i]));
				--i;
			}
		}
		//console.log("step3:", this.toString());

		this.items = this.items.map(item => item.normalized()).filter(item => item.exponent !== 0);

		// substitute by squared formulas
		if (this.items.length >= 2) {
			const reduced = Item.sqauredReduce(...this.items);
			if (reduced)
				this.items.splice(0, 2, reduced);
		}

		return this;
	}
};


const I = new Item(_i, 1);
const I_ = new Item(_i, -1);
const I2 = new Item(_i, 2);
const J = new Item(_j, 1);
const J_ = new Item(_j, -1);
const J2 = new Item(_j, 2);
const K = new Item(_k, 1);
const K_ = new Item(_k, -1);
const K2 = new Item(_k, 2);


module.exports = {
	Item,
	Orientation,

	I, I_, I2, J, J_, J2, K, K_, K2,
};