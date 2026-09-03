/**
 * Complex-function expressions for the domain-coloring plot.
 *
 * A user string like `(1+z^2)^-1` is tokenized and parsed once into an AST, and that single AST
 * feeds both consumers: `compileGLSL` emits the body of a `vec2 f(vec2 z)` for the fragment shader,
 * and `evaluate` runs the same tree on the CPU for the cursor readout. Sharing the AST is what
 * keeps the picture and the printed number from disagreeing.
 *
 * The grammar is small and deliberately permissive about implicit multiplication (`2z`, `z(z+1)`),
 * because that is how these formulas are written by hand. `z` and `x` both name the variable.
 */



export interface Complex {
	re: number;
	im: number;
}


type Node =
	| {type: "num", re: number, im: number}
	| {type: "var"}
	| {type: "neg", arg: Node}
	| {type: "bin", op: string, left: Node, right: Node}
	| {type: "call", name: string, args: Node[]};


interface Token {
	type: string;		// "num" | "ident" | "op" | "(" | ")" | "," | "end"
	value: string;
	num?: number;
	pos: number;
}


/** The variable, spelled either way: `z` is conventional, `x` is what most people type. */
const VARIABLE_NAMES = ["z", "x"];


const CONSTANTS: {[key: string]: Complex} = {
	i: {re: 0, im: 1},
	j: {re: 0, im: 1},
	pi: {re: Math.PI, im: 0},
	e: {re: Math.E, im: 0},
};


/** name -> [arity, GLSL helper]. `ln` is an alias of `log`; both are the principal branch. */
const FUNCTIONS: {[key: string]: [number, string]} = {
	exp: [1, "cExp"],
	log: [1, "cLog"],
	ln: [1, "cLog"],
	sqrt: [1, "cSqrt"],
	abs: [1, "cAbs"],
	arg: [1, "cArg"],
	conj: [1, "cConj"],
	re: [1, "cReal"],
	im: [1, "cImag"],
	sin: [1, "cSin"],
	cos: [1, "cCos"],
	tan: [1, "cTan"],
	cot: [1, "cCot"],
	sec: [1, "cSec"],
	csc: [1, "cCsc"],
	sinh: [1, "cSinh"],
	cosh: [1, "cCosh"],
	tanh: [1, "cTanh"],
	asin: [1, "cAsin"],
	acos: [1, "cAcos"],
	atan: [1, "cAtan"],
	gamma: [1, "cGamma"],
	pow: [2, "cPow"],
};


export const FUNCTION_NAMES = Object.keys(FUNCTIONS);


const NUMBER_RE = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;
const IDENT_RE = /^[A-Za-z]+/;


/**
 * Every name the tokenizer will recognize, longest first.
 *
 * A run of letters is split by longest match against this list rather than taken greedily, so `3iz`
 * lexes as `i` `z` (and multiplies implicitly) instead of becoming one unknown name `iz`. Longest
 * match is what keeps `sinh` from splitting into `sin` + `h`, and `pi` from becoming `p` + `i`.
 */
const KNOWN_NAMES = [...Object.keys(FUNCTIONS), ...Object.keys(CONSTANTS), ...VARIABLE_NAMES]
	.sort((a, b) => b.length - a.length);


const tokenize = (source: string): Token[] => {
	const tokens: Token[] = [];
	let pos = 0;

	while (pos < source.length) {
		const rest = source.substr(pos);

		if (/^\s/.test(rest)) {
			++pos;
			continue;
		}

		const number = NUMBER_RE.exec(rest);
		if (number) {
			tokens.push({type: "num", value: number[0], num: Number(number[0]), pos});
			pos += number[0].length;
			continue;
		}

		const ident = IDENT_RE.exec(rest);
		if (ident) {
			const run = ident[0].toLowerCase();
			const name = KNOWN_NAMES.find(candidate => run.startsWith(candidate));
			if (!name)
				throw new Error(`unknown name "${run}" at ${pos + 1}`);

			tokens.push({type: "ident", value: name, pos});
			pos += name.length;
			continue;
		}

		const char = rest[0];
		if ("+-*/^".includes(char))
			tokens.push({type: "op", value: char, pos});
		else if (char === "(" || char === ")" || char === ",")
			tokens.push({type: char, value: char, pos});
		else if (char === "π")		// a pasted π
			tokens.push({type: "ident", value: "pi", pos});
		else
			throw new Error(`unexpected character "${char}" at ${pos + 1}`);

		++pos;
	}

	tokens.push({type: "end", value: "", pos: source.length});

	return tokens;
};


/**
 * Recursive descent over the token list. Precedence, loosest first: additive, multiplicative,
 * unary minus, then exponent.
 * `^` is right-associative and its exponent is a unary expression, so `z^-1` and `z^-(1/2)` parse
 * the way they read.
 */
const parseTokens = (tokens: Token[]): Node => {
	let cursor = 0;

	const peek = (): Token => tokens[cursor];
	const next = (): Token => tokens[cursor++];

	const expect = (type: string, what: string): Token => {
		const token = peek();
		if (token.type !== type)
			throw new Error(`expected ${what} at ${token.pos + 1}${token.value ? `, got "${token.value}"` : ""}`);

		return next();
	};

	// A primary may follow another primary as implicit multiplication: 2z, 3(z+1), z conj(z).
	const startsPrimary = (token: Token): boolean => token.type === "num" || token.type === "ident" || token.type === "(";

	function parsePrimary (): Node {
		const token = peek();

		switch (token.type) {
		case "num":
			next();

			// A number immediately followed by `i` is an imaginary literal: 2i, 0.5i.
			if (peek().type === "ident" && (peek().value === "i" || peek().value === "j")) {
				next();

				return {type: "num", re: 0, im: token.num as number};
			}

			return {type: "num", re: token.num as number, im: 0};
		case "ident": {
			next();
			const name = token.value;

			if (FUNCTIONS[name]) {
				const [arity ] = FUNCTIONS[name];
				expect("(", `"(" after ${name}`);

				const args = [parseExpression()];
				while (peek().type === ",") {
					next();
					args.push(parseExpression());
				}
				expect(")", `")" closing ${name}(`);

				if (args.length !== arity)
					throw new Error(`${name} takes ${arity} argument${arity > 1 ? "s" : ""}, got ${args.length}`);

				return {type: "call", name, args};
			}

			if (VARIABLE_NAMES.includes(name))
				return {type: "var"};

			if (CONSTANTS[name])
				return {type: "num", ...CONSTANTS[name]};

			throw new Error(`unknown name "${name}" at ${token.pos + 1}`);
		}
		case "(": {
			next();
			const inner = parseExpression();
			expect(")", "\")\"");

			return inner;
		}
		}

		throw new Error(`unexpected ${token.type === "end" ? "end of expression" : `"${token.value}"`} at ${token.pos + 1}`);
	}

	function parsePower (): Node {
		const base = parsePrimary();
		if (peek().type === "op" && peek().value === "^") {
			next();

			return {type: "bin", op: "^", left: base, right: parseUnary()};
		}

		return base;
	}

	function parseUnary (): Node {
		if (peek().type === "op" && (peek().value === "-" || peek().value === "+")) {
			const sign = next().value;
			const arg = parseUnary();

			if (sign !== "-")
				return arg;

			// Fold the sign into a literal, so `z^-1` carries a numeric exponent and can compile to an
			// exact reciprocal instead of going through exp(-log z).
			if (arg.type === "num")
				return {type: "num", re: -arg.re, im: -arg.im};

			return {type: "neg", arg};
		}

		return parsePower();
	}

	function parseTerm (): Node {
		let left = parseUnary();

		for (;;) {
			const token = peek();
			if (token.type === "op" && (token.value === "*" || token.value === "/")) {
				next();
				left = {type: "bin", op: token.value, left, right: parseUnary()};
			}
			else if (startsPrimary(token))
				left = {type: "bin", op: "*", left, right: parsePower()};
			else
				break;
		}

		return left;
	};

	function parseExpression (): Node {
		let left = parseTerm();

		while (peek().type === "op" && (peek().value === "+" || peek().value === "-")) {
			const op = next().value;
			left = {type: "bin", op, left, right: parseTerm()};
		}

		return left;
	}

	const root = parseExpression();
	if (peek().type !== "end")
		throw new Error(`unexpected "${peek().value}" at ${peek().pos + 1}`);

	return root;
};


export const parse = (source: string): Node => {
	if (!source || !source.trim())
		throw new Error("empty expression");

	return parseTokens(tokenize(source));
};


const glslFloat = (value: number): string => {
	if (!Number.isFinite(value))
		throw new Error(`cannot encode ${value} as a shader constant`);

	return Number.isInteger(value) && Math.abs(value) < 1e7 ? `${value}.0` : value.toExponential(9);
};


/**
 * `z^3` as cMul(cMul(z, z), z) rather than exp(3 log z): exact at z = 0, and free of the branch cut
 * that the exp/log form carries. Only worth inlining while the base expression stays short, since
 * this duplicates its code once per factor.
 */
const INLINE_POWER_LIMIT = 6;
const INLINE_BASE_LENGTH = 24;


const compileNode = (node: Node): string => {
	switch (node.type) {
	case "num":
		return `vec2(${glslFloat(node.re)}, ${glslFloat(node.im)})`;
	case "var":
		return "z";
	case "neg":
		return `(-${compileNode(node.arg)})`;
	case "bin": {
		const left = compileNode(node.left);
		const right = compileNode(node.right);

		switch (node.op) {
		case "+":
			return `(${left} + ${right})`;
		case "-":
			return `(${left} - ${right})`;
		case "*":
			return `cMul(${left}, ${right})`;
		case "/":
			return `cDiv(${left}, ${right})`;
		case "^": {
			const exponent = node.right;
			if (exponent.type === "num" && exponent.im === 0 && Number.isInteger(exponent.re)
						&& Math.abs(exponent.re) <= INLINE_POWER_LIMIT && left.length <= INLINE_BASE_LENGTH) {
				const count = Math.abs(exponent.re);
				if (count === 0)
					return "vec2(1.0, 0.0)";

				let product = left;
				for (let i = 1; i < count; ++i)
					product = `cMul(${product}, ${left})`;

				return exponent.re > 0 ? product : `cDiv(vec2(1.0, 0.0), ${product})`;
			}

			return `cPow(${left}, ${right})`;
		}
		}

		throw new Error(`unsupported operator "${node.op}"`);
	}
	case "call":
		return `${FUNCTIONS[node.name][1]}(${node.args.map(compileNode).join(", ")})`;
	}

	throw new Error("malformed expression tree");
};


/** The GLSL expression for f(z), assuming `z` is in scope and the helpers below are declared. */
export const compileGLSL = (source: string): string => compileNode(parse(source));


const cAdd = (a: Complex, b: Complex): Complex => ({re: a.re + b.re, im: a.im + b.im});
const cSub = (a: Complex, b: Complex): Complex => ({re: a.re - b.re, im: a.im - b.im});
const cMul = (a: Complex, b: Complex): Complex => ({re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re});


const cDiv = (a: Complex, b: Complex): Complex => {
	const d = b.re * b.re + b.im * b.im;

	return {re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d};
};


const cAbs = (a: Complex): number => Math.hypot(a.re, a.im);
const cArg = (a: Complex): number => Math.atan2(a.im, a.re);


const cExp = (a: Complex): Complex => {
	const r = Math.exp(a.re);

	return {re: r * Math.cos(a.im), im: r * Math.sin(a.im)};
};


const cLog = (a: Complex): Complex => ({re: Math.log(cAbs(a)), im: cArg(a)});


const cPow = (a: Complex, b: Complex): Complex => {
	if (a.re === 0 && a.im === 0) {
		if (b.re === 0 && b.im === 0)
			return {re: 1, im: 0};

		return b.re < 0 ? {re: Infinity, im: 0} : {re: 0, im: 0};
	}

	return cExp(cMul(b, cLog(a)));
};


const cSqrt = (a: Complex): Complex => {
	const m = cAbs(a);
	if (m === 0)
		return {re: 0, im: 0};

	const re = Math.sqrt(0.5 * (m + a.re));
	const im = Math.sqrt(0.5 * (m - a.re));

	return {re, im: a.im < 0 ? -im : im};
};


const cSin = (a: Complex): Complex => ({re: Math.sin(a.re) * Math.cosh(a.im), im: Math.cos(a.re) * Math.sinh(a.im)});
const cCos = (a: Complex): Complex => ({re: Math.cos(a.re) * Math.cosh(a.im), im: -Math.sin(a.re) * Math.sinh(a.im)});
const cSinh = (a: Complex): Complex => ({re: Math.sinh(a.re) * Math.cos(a.im), im: Math.cosh(a.re) * Math.sin(a.im)});
const cCosh = (a: Complex): Complex => ({re: Math.cosh(a.re) * Math.cos(a.im), im: Math.sinh(a.re) * Math.sin(a.im)});


const ONE: Complex = {re: 1, im: 0};
const I: Complex = {re: 0, im: 1};


const cAsin = (a: Complex): Complex => {
	// -i log(iz + sqrt(1 - z^2))
	const root = cSqrt(cSub(ONE, cMul(a, a)));

	return cMul({re: 0, im: -1}, cLog(cAdd(cMul(I, a), root)));
};


const cAtan = (a: Complex): Complex => {
	// (1 / 2i) log((1 + iz) / (1 - iz))
	const iz = cMul(I, a);

	return cMul({re: 0, im: -0.5}, cLog(cDiv(cAdd(ONE, iz), cSub(ONE, iz))));
};


const LANCZOS = [
	0.99999999999980993,
	676.5203681218851,
	-1259.1392167224028,
	771.32342877765313,
	-176.61502916214059,
	12.507343278686905,
	-0.13857109526572012,
	9.9843695780195716e-6,
	1.5056327351493116e-7,
];


const SQRT_2PI = Math.sqrt(2 * Math.PI);


/** Lanczos approximation (g = 7), with the reflection formula covering the left half-plane. */
const cGamma = (a: Complex): Complex => {
	if (a.re < 0.5) {
		// pi / (sin(pi z) gamma(1 - z))
		const reflected = cGamma(cSub(ONE, a));

		return cDiv({re: Math.PI, im: 0}, cMul(cSin(cMul({re: Math.PI, im: 0}, a)), reflected));
	}

	const zm1 = cSub(a, ONE);
	let x: Complex = {re: LANCZOS[0], im: 0};
	for (let k = 1; k < LANCZOS.length; ++k)
		x = cAdd(x, cDiv({re: LANCZOS[k], im: 0}, cAdd(zm1, {re: k, im: 0})));

	const t = cAdd(zm1, {re: 7.5, im: 0});

	return cMul(cMul({re: SQRT_2PI, im: 0}, cPow(t, cAdd(zm1, {re: 0.5, im: 0}))), cMul(cExp({re: -t.re, im: -t.im}), x));
};


const EVALUATORS: {[key: string]: typeof cPow} = {
	exp: cExp,
	log: cLog,
	ln: cLog,
	sqrt: cSqrt,
	abs: a => ({re: cAbs(a), im: 0}),
	arg: a => ({re: cArg(a), im: 0}),
	conj: a => ({re: a.re, im: -a.im}),
	re: a => ({re: a.re, im: 0}),
	im: a => ({re: a.im, im: 0}),
	sin: cSin,
	cos: cCos,
	tan: a => cDiv(cSin(a), cCos(a)),
	cot: a => cDiv(cCos(a), cSin(a)),
	sec: a => cDiv(ONE, cCos(a)),
	csc: a => cDiv(ONE, cSin(a)),
	sinh: cSinh,
	cosh: cCosh,
	tanh: a => cDiv(cSinh(a), cCosh(a)),
	asin: cAsin,
	acos: a => cSub({re: Math.PI / 2, im: 0}, cAsin(a)),
	atan: cAtan,
	gamma: cGamma,
	pow: cPow,
};


const evaluateNode = (node: Node, z: Complex): Complex => {
	switch (node.type) {
	case "num":
		return {re: node.re, im: node.im};
	case "var":
		return z;
	case "neg": {
		const arg = evaluateNode(node.arg, z);

		return {re: -arg.re, im: -arg.im};
	}
	case "bin": {
		const left = evaluateNode(node.left, z);
		const right = evaluateNode(node.right, z);

		switch (node.op) {
		case "+":
			return cAdd(left, right);
		case "-":
			return cSub(left, right);
		case "*":
			return cMul(left, right);
		case "/":
			return cDiv(left, right);
		case "^":
			return cPow(left, right);
		}

		throw new Error(`unsupported operator "${node.op}"`);
	}
	case "call": {
		// Arity was checked while parsing, so a unary entry never reads the second operand.
		const operands = node.args.map(arg => evaluateNode(arg, z));

		return EVALUATORS[node.name](operands[0], operands[1]);
	}
	}

	throw new Error("malformed expression tree");
};


/** f(z) on the CPU, for the cursor readout. Pass a tree from `parse` to avoid re-parsing per pixel. */
export const evaluate = (node: Node, z: Complex): Complex => evaluateNode(node, z);


export const complexAbs = cAbs;
export const complexArg = cArg;


/**
 * The GLSL prelude: complex arithmetic over vec2, plus the HSL conversion the coloring needs.
 *
 * Written against GLSL ES 1.00 (WebGL 1), so there are no `sinh`/`cosh`/`isnan` builtins to lean on
 * and no array constructors — hence the hand-rolled hyperbolics and the unrolled Lanczos sum. The
 * `!(m < LARGE)` idiom is the portable stand-in for isnan/isinf: it is true for both.
 */
export const GLSL_PRELUDE = `
	const float PI = 3.141592653589793;
	const float SQRT_2PI = 2.5066282746310002;

	float fSinh (float x) { return 0.5 * (exp(x) - exp(-x)); }
	float fCosh (float x) { return 0.5 * (exp(x) + exp(-x)); }

	vec2 cMul (vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }

	vec2 cDiv (vec2 a, vec2 b) {
		float d = dot(b, b);
		return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / d;
	}

	vec2 cConj (vec2 a) { return vec2(a.x, -a.y); }
	vec2 cReal (vec2 a) { return vec2(a.x, 0.0); }
	vec2 cImag (vec2 a) { return vec2(a.y, 0.0); }
	vec2 cAbs (vec2 a) { return vec2(length(a), 0.0); }
	vec2 cArg (vec2 a) { return vec2(atan(a.y, a.x), 0.0); }

	vec2 cExp (vec2 a) {
		float r = exp(a.x);
		return vec2(r * cos(a.y), r * sin(a.y));
	}

	vec2 cLog (vec2 a) { return vec2(log(length(a)), atan(a.y, a.x)); }

	vec2 cPow (vec2 a, vec2 b) {
		if (dot(a, a) == 0.0) {
			if (dot(b, b) == 0.0)
				return vec2(1.0, 0.0);
			// a pole rather than a zero, so it must read as one.
			return b.x < 0.0 ? vec2(1e20, 0.0) : vec2(0.0);
		}
		return cExp(cMul(b, cLog(a)));
	}

	vec2 cSqrt (vec2 a) {
		float m = length(a);
		if (m == 0.0)
			return vec2(0.0);
		float re = sqrt(max(0.5 * (m + a.x), 0.0));
		float im = sqrt(max(0.5 * (m - a.x), 0.0));
		return vec2(re, a.y < 0.0 ? -im : im);
	}

	vec2 cSin (vec2 a) { return vec2(sin(a.x) * fCosh(a.y), cos(a.x) * fSinh(a.y)); }
	vec2 cCos (vec2 a) { return vec2(cos(a.x) * fCosh(a.y), -sin(a.x) * fSinh(a.y)); }
	vec2 cTan (vec2 a) { return cDiv(cSin(a), cCos(a)); }
	vec2 cCot (vec2 a) { return cDiv(cCos(a), cSin(a)); }
	vec2 cSec (vec2 a) { return cDiv(vec2(1.0, 0.0), cCos(a)); }
	vec2 cCsc (vec2 a) { return cDiv(vec2(1.0, 0.0), cSin(a)); }

	vec2 cSinh (vec2 a) { return vec2(fSinh(a.x) * cos(a.y), fCosh(a.x) * sin(a.y)); }
	vec2 cCosh (vec2 a) { return vec2(fCosh(a.x) * cos(a.y), fSinh(a.x) * sin(a.y)); }
	vec2 cTanh (vec2 a) { return cDiv(cSinh(a), cCosh(a)); }

	vec2 cAsin (vec2 a) {
		vec2 root = cSqrt(vec2(1.0, 0.0) - cMul(a, a));
		return cMul(vec2(0.0, -1.0), cLog(cMul(vec2(0.0, 1.0), a) + root));
	}

	vec2 cAcos (vec2 a) { return vec2(0.5 * PI, 0.0) - cAsin(a); }

	vec2 cAtan (vec2 a) {
		vec2 iz = cMul(vec2(0.0, 1.0), a);
		return cMul(vec2(0.0, -0.5), cLog(cDiv(vec2(1.0, 0.0) + iz, vec2(1.0, 0.0) - iz)));
	}

	// Lanczos, g = 7. Valid for Re(z) >= 0.5; cGamma reflects the rest into it.
	vec2 cGammaCore (vec2 z) {
		vec2 zm1 = z - vec2(1.0, 0.0);
		vec2 x = vec2(0.99999999999980993, 0.0);
		x += cDiv(vec2(676.5203681218851, 0.0), zm1 + vec2(1.0, 0.0));
		x += cDiv(vec2(-1259.1392167224028, 0.0), zm1 + vec2(2.0, 0.0));
		x += cDiv(vec2(771.32342877765313, 0.0), zm1 + vec2(3.0, 0.0));
		x += cDiv(vec2(-176.61502916214059, 0.0), zm1 + vec2(4.0, 0.0));
		x += cDiv(vec2(12.507343278686905, 0.0), zm1 + vec2(5.0, 0.0));
		x += cDiv(vec2(-0.13857109526572012, 0.0), zm1 + vec2(6.0, 0.0));
		x += cDiv(vec2(9.9843695780195716e-6, 0.0), zm1 + vec2(7.0, 0.0));
		x += cDiv(vec2(1.5056327351493116e-7, 0.0), zm1 + vec2(8.0, 0.0));

		vec2 t = zm1 + vec2(7.5, 0.0);

		return cMul(cMul(vec2(SQRT_2PI, 0.0), cPow(t, zm1 + vec2(0.5, 0.0))), cMul(cExp(-t), x));
	}

	vec2 cGamma (vec2 z) {
		if (z.x >= 0.5)
			return cGammaCore(z);

		return cDiv(vec2(PI, 0.0), cMul(cSin(cMul(vec2(PI, 0.0), z)), cGammaCore(vec2(1.0, 0.0) - z)));
	}

	vec3 hue2rgb (float h) {
		h = fract(h);
		return clamp(vec3(abs(h * 6.0 - 3.0) - 1.0, 2.0 - abs(h * 6.0 - 2.0), 2.0 - abs(h * 6.0 - 4.0)), 0.0, 1.0);
	}

	vec3 hsl2rgb (float h, float s, float l) {
		float c = (1.0 - abs(2.0 * l - 1.0)) * s;
		return (hue2rgb(h) - 0.5) * c + l;
	}
`;
