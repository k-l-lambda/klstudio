
import {parse, evaluate, compileGLSL, complexAbs, complexArg} from "../app/inc/complexExpression";



const near = (actual: number, expect: number, tolerance = 1e-9): boolean => Math.abs(actual - expect) < tolerance;


const at = (source: string, re: number, im: number) => evaluate(parse(source), {re, im});


const assertValue = (source: string, z: [number, number], expect: [number, number], tolerance = 1e-9) => {
	const value = at(source, z[0], z[1]);
	console.assert(near(value.re, expect[0], tolerance) && near(value.im, expect[1], tolerance),
		`${source} at (${z}) = (${value.re}, ${value.im}), expected (${expect})`);
};


// --- arithmetic & precedence ---

assertValue("z", [2, 3], [2, 3]);
assertValue("z+1", [2, 3], [3, 3]);
assertValue("z*z", [0, 1], [-1, 0]);					// i^2 = -1
assertValue("1/z", [0, 2], [0, -0.5]);					// 1/2i = -i/2
assertValue("z^2", [2, 3], [-5, 12]);					// (2+3i)^2
assertValue("z^3", [1, 1], [-2, 2]);					// (1+i)^3
assertValue("(1+z^2)^-1", [0, 0], [1, 0]);
assertValue("(1+z^2)^-1", [2, 0], [0.2, 0]);			// 1/5
assertValue("(1+z^2)^-1", [0, 2], [-1 / 3, 0]);			// 1/(1-4)

// unary minus binds tighter than +, looser than ^: -z^2 is -(z^2)
assertValue("-z^2", [0, 1], [1, 0]);
assertValue("2-z", [1, 1], [1, -1]);
// ^ is right-associative: z^2^3 = z^(2^3) = z^8
assertValue("z^2^3", [0, 1], [1, 0]);					// i^8 = 1
// division is left-associative
assertValue("8/z/z", [2, 0], [2, 0]);

// implicit multiplication
assertValue("2z", [3, 0], [6, 0]);
assertValue("2i", [0, 0], [0, 2]);
assertValue("3iz", [0, 1], [-3, 0]);					// 3i * i = -3
assertValue("z(z+1)", [2, 0], [6, 0]);
assertValue("(z+1)(z-1)", [3, 0], [8, 0]);				// z^2 - 1

// constants
assertValue("pi", [0, 0], [Math.PI, 0]);
assertValue("e", [0, 0], [Math.E, 0]);
assertValue("i", [0, 0], [0, 1]);


// --- functions ---

assertValue("exp(z)", [0, Math.PI], [-1, 0], 1e-12);	// Euler
assertValue("log(z)", [1, 0], [0, 0]);
assertValue("log(z)", [-1, 0], [0, Math.PI]);			// principal branch
assertValue("sqrt(z)", [-1, 0], [0, 1]);
assertValue("sqrt(z)", [4, 0], [2, 0]);
assertValue("sin(z)", [0, 0], [0, 0]);
assertValue("sin(z)", [Math.PI / 2, 0], [1, 0]);
assertValue("cos(z)", [0, 0], [1, 0]);
assertValue("tan(z)", [Math.PI / 4, 0], [1, 0], 1e-12);
assertValue("sinh(z)", [0, Math.PI / 2], [0, 1], 1e-12);
assertValue("conj(z)", [2, 3], [2, -3]);
assertValue("re(z)", [2, 3], [2, 0]);
assertValue("im(z)", [2, 3], [3, 0]);
assertValue("abs(z)", [3, 4], [5, 0]);
assertValue("arg(z)", [0, 1], [Math.PI / 2, 0]);
assertValue("pow(z, 2)", [2, 3], [-5, 12], 1e-12);
assertValue("asin(z)", [1, 0], [Math.PI / 2, 0], 1e-7);
assertValue("atan(z)", [1, 0], [Math.PI / 4, 0], 1e-12);

// gamma: gamma(n) = (n-1)!, and gamma(1/2) = sqrt(pi)
assertValue("gamma(z)", [1, 0], [1, 0], 1e-9);
assertValue("gamma(z)", [5, 0], [24, 0], 1e-8);
assertValue("gamma(z)", [0.5, 0], [Math.sqrt(Math.PI), 0], 1e-9);
// the reflection branch: gamma(-0.5) = -2 sqrt(pi)
assertValue("gamma(z)", [-0.5, 0], [-2 * Math.sqrt(Math.PI), 0], 1e-8);


// --- pow edge cases: the shader takes the same branches, so they must agree here ---

assertValue("z^0", [0, 0], [1, 0]);
assertValue("z^2", [0, 0], [0, 0]);
console.assert(!Number.isFinite(complexAbs(at("z^-1", 0, 0))), "z^-1 at the origin should blow up");


// --- errors are reported, not silently absorbed ---

const assertThrows = (source: string, hint: string) => {
	let message = null;
	try {
		evaluate(parse(source), {re: 1, im: 0});
	}
	catch (error) {
		message = (error as Error).message;
	}
	console.assert(message !== null, `"${source}" should have failed (${hint})`);
};

assertThrows("", "empty");
assertThrows("z +", "dangling operator");
assertThrows("(z", "unclosed paren");
assertThrows("z)", "stray paren");
assertThrows("foo(z)", "unknown name");
assertThrows("q", "unknown variable");
assertThrows("sin(z, z)", "wrong arity");
assertThrows("sin z", "missing parens on a call");
assertThrows("z $ 1", "bad character");


// --- GLSL compilation: shape only; correctness of the helpers is covered by the shader itself ---

const glslOf = (source: string) => compileGLSL(source);

console.assert(glslOf("z") === "z", glslOf("z"));
console.assert(glslOf("z*z") === "cMul(z, z)", glslOf("z*z"));
// small integer powers inline to repeated multiplication rather than exp/log
console.assert(glslOf("z^2") === "cMul(z, z)", glslOf("z^2"));
console.assert(glslOf("z^3") === "cMul(cMul(z, z), z)", glslOf("z^3"));
console.assert(glslOf("z^-1") === "cDiv(vec2(1.0, 0.0), z)", glslOf("z^-1"));
console.assert(glslOf("z^0") === "vec2(1.0, 0.0)", glslOf("z^0"));
// a non-integer or large exponent falls back to the general form
console.assert(glslOf("z^0.5") === "cPow(z, vec2(5.000000000e-1, 0.0))", glslOf("z^0.5"));
console.assert(glslOf("z^9").startsWith("cPow("), glslOf("z^9"));
console.assert(glslOf("z^i") === "cPow(z, vec2(0.0, 1.0))", glslOf("z^i"));
console.assert(glslOf("gamma(z)") === "cGamma(z)", glslOf("gamma(z)"));
console.assert(glslOf("ln(z)") === "cLog(z)", glslOf("ln(z)"));

// every compiled expression must be free of leftover JS-only syntax
for (const source of ["(1+z^2)^-1", "log(z)", "gamma(z)/gamma(z+1)", "sin(1/z)", "(z^2-1)(z-2-i)^2/(z^2+2+2i)"]) {
	const glsl = compileGLSL(source);
	console.assert(!/undefined|NaN|Infinity/.test(glsl), `${source} compiled to ${glsl}`);
	// balanced parens
	let depth = 0;
	for (const char of glsl) {
		if (char === "(")
			++depth;
		else if (char === ")")
			--depth;
		console.assert(depth >= 0, `unbalanced parens in ${glsl}`);
	}
	console.assert(depth === 0, `unbalanced parens in ${glsl}`);
}


// --- the readout path: abs/arg agree with the coloring's inputs ---

const sample = at("(1+z^2)^-1", 0.5, 0.5);
console.assert(near(complexAbs(sample), Math.hypot(sample.re, sample.im)), "complexAbs mismatch");
console.assert(near(complexArg(sample), Math.atan2(sample.im, sample.re)), "complexArg mismatch");


console.log("complexExpression tests done.");
