import{S as we,ak as be,al as Me,az as Ee,V as ie,M as ze,P as Se}from"./three.module-B96IhAFS.js";import{_ as Te,y as Ce,w as I,c as p,o as d,a as c,p as S,j as R,F as _,g as W,C as v,M as Ae,q as ne,h as q,A as X,D as oe,z as T}from"./router-BuZb88XI.js";import{r as Ne}from"./vue-resize-directive-CDf_Yp3t.js";const de=["z","x"],Z={i:{re:0,im:1},j:{re:0,im:1},pi:{re:Math.PI,im:0},e:{re:Math.E,im:0}},j={exp:[1,"cExp"],log:[1,"cLog"],ln:[1,"cLog"],sqrt:[1,"cSqrt"],abs:[1,"cAbs"],arg:[1,"cArg"],conj:[1,"cConj"],re:[1,"cReal"],im:[1,"cImag"],sin:[1,"cSin"],cos:[1,"cCos"],tan:[1,"cTan"],cot:[1,"cCot"],sec:[1,"cSec"],csc:[1,"cCsc"],sinh:[1,"cSinh"],cosh:[1,"cCosh"],tanh:[1,"cTanh"],asin:[1,"cAsin"],acos:[1,"cAcos"],atan:[1,"cAtan"],gamma:[1,"cGamma"],pow:[2,"cPow"]},Ie=/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/,Re=/^[A-Za-z]+/,Pe=[...Object.keys(j),...Object.keys(Z),...de].sort((e,t)=>t.length-e.length),Fe=e=>{const t=[];let r=0;for(;r<e.length;){const s=e.substr(r);if(/^\s/.test(s)){++r;continue}const i=Ie.exec(s);if(i){t.push({type:"num",value:i[0],num:Number(i[0]),pos:r}),r+=i[0].length;continue}const o=Re.exec(s);if(o){const n=o[0].toLowerCase(),m=Pe.find(b=>n.startsWith(b));if(!m)throw new Error(`unknown name "${n}" at ${r+1}`);t.push({type:"ident",value:m,pos:r}),r+=m.length;continue}const u=s[0];if("+-*/^".includes(u))t.push({type:"op",value:u,pos:r});else if(u==="("||u===")"||u===",")t.push({type:u,value:u,pos:r});else if(u==="π")t.push({type:"ident",value:"pi",pos:r});else throw new Error(`unexpected character "${u}" at ${r+1}`);++r}return t.push({type:"end",value:"",pos:e.length}),t},ke=e=>{let t=0;const r=()=>e[t],s=()=>e[t++],i=(h,l)=>{const x=r();if(x.type!==h)throw new Error(`expected ${l} at ${x.pos+1}${x.value?`, got "${x.value}"`:""}`);return s()},o=h=>h.type==="num"||h.type==="ident"||h.type==="(";function u(){const h=r();switch(h.type){case"num":return s(),r().type==="ident"&&(r().value==="i"||r().value==="j")?(s(),{type:"num",re:0,im:h.num}):{type:"num",re:h.num,im:0};case"ident":{s();const l=h.value;if(j[l]){const[x]=j[l];i("(",`"(" after ${l}`);const L=[M()];for(;r().type===",";)s(),L.push(M());if(i(")",`")" closing ${l}(`),L.length!==x)throw new Error(`${l} takes ${x} argument${x>1?"s":""}, got ${L.length}`);return{type:"call",name:l,args:L}}if(de.includes(l))return{type:"var"};if(Z[l])return{type:"num",...Z[l]};throw new Error(`unknown name "${l}" at ${h.pos+1}`)}case"(":{s();const l=M();return i(")",'")"'),l}}throw new Error(`unexpected ${h.type==="end"?"end of expression":`"${h.value}"`} at ${h.pos+1}`)}function n(){const h=u();return r().type==="op"&&r().value==="^"?(s(),{type:"bin",op:"^",left:h,right:m()}):h}function m(){if(r().type==="op"&&(r().value==="-"||r().value==="+")){const h=s().value,l=m();return h!=="-"?l:l.type==="num"?{type:"num",re:-l.re,im:-l.im}:{type:"neg",arg:l}}return n()}function b(){let h=m();for(;;){const l=r();if(l.type==="op"&&(l.value==="*"||l.value==="/"))s(),h={type:"bin",op:l.value,left:h,right:m()};else if(o(l))h={type:"bin",op:"*",left:h,right:n()};else break}return h}function M(){let h=b();for(;r().type==="op"&&(r().value==="+"||r().value==="-");)h={type:"bin",op:s().value,left:h,right:b()};return h}const ye=M();if(r().type!=="end")throw new Error(`unexpected "${r().value}" at ${r().pos+1}`);return ye},ve=e=>{if(!e||!e.trim())throw new Error("empty expression");return ke(Fe(e))},ce=e=>{if(!Number.isFinite(e))throw new Error(`cannot encode ${e} as a shader constant`);return Number.isInteger(e)&&Math.abs(e)<1e7?`${e}.0`:e.toExponential(9)},De=6,Le=24,P=e=>{switch(e.type){case"num":return`vec2(${ce(e.re)}, ${ce(e.im)})`;case"var":return"z";case"neg":return`(-${P(e.arg)})`;case"bin":{const t=P(e.left),r=P(e.right);switch(e.op){case"+":return`(${t} + ${r})`;case"-":return`(${t} - ${r})`;case"*":return`cMul(${t}, ${r})`;case"/":return`cDiv(${t}, ${r})`;case"^":{const s=e.right;if(s.type==="num"&&s.im===0&&Number.isInteger(s.re)&&Math.abs(s.re)<=De&&t.length<=Le){const i=Math.abs(s.re);if(i===0)return"vec2(1.0, 0.0)";let o=t;for(let u=1;u<i;++u)o=`cMul(${o}, ${t})`;return s.re>0?o:`cDiv(vec2(1.0, 0.0), ${o})`}return`cPow(${t}, ${r})`}}throw new Error(`unsupported operator "${e.op}"`)}case"call":return`${j[e.name][1]}(${e.args.map(P).join(", ")})`}throw new Error("malformed expression tree")},ae=e=>P(ve(e)),E=(e,t)=>({re:e.re+t.re,im:e.im+t.im}),N=(e,t)=>({re:e.re-t.re,im:e.im-t.im}),f=(e,t)=>({re:e.re*t.re-e.im*t.im,im:e.re*t.im+e.im*t.re}),g=(e,t)=>{const r=t.re*t.re+t.im*t.im;return{re:(e.re*t.re+e.im*t.im)/r,im:(e.im*t.re-e.re*t.im)/r}},B=e=>Math.hypot(e.re,e.im),te=e=>Math.atan2(e.im,e.re),re=e=>{const t=Math.exp(e.re);return{re:t*Math.cos(e.im),im:t*Math.sin(e.im)}},D=e=>({re:Math.log(B(e)),im:te(e)}),se=(e,t)=>e.re===0&&e.im===0?t.re===0&&t.im===0?{re:1,im:0}:t.re<0?{re:1/0,im:0}:{re:0,im:0}:re(f(t,D(e))),fe=e=>{const t=B(e);if(t===0)return{re:0,im:0};const r=Math.sqrt(.5*(t+e.re)),s=Math.sqrt(.5*(t-e.re));return{re:r,im:e.im<0?-s:s}},F=e=>({re:Math.sin(e.re)*Math.cosh(e.im),im:Math.cos(e.re)*Math.sinh(e.im)}),O=e=>({re:Math.cos(e.re)*Math.cosh(e.im),im:-Math.sin(e.re)*Math.sinh(e.im)}),he=e=>({re:Math.sinh(e.re)*Math.cos(e.im),im:Math.cosh(e.re)*Math.sin(e.im)}),le=e=>({re:Math.cosh(e.re)*Math.cos(e.im),im:Math.sinh(e.re)*Math.sin(e.im)}),z={re:1,im:0},ge={re:0,im:1},ue=e=>{const t=fe(N(z,f(e,e)));return f({re:0,im:-1},D(E(f(ge,e),t)))},_e=e=>{const t=f(ge,e);return f({re:0,im:-.5},D(g(E(z,t),N(z,t))))},Q=[.9999999999998099,676.5203681218851,-1259.1392167224028,771.3234287776531,-176.6150291621406,12.507343278686905,-.13857109526572012,9984369578019572e-21,15056327351493116e-23],We=Math.sqrt(2*Math.PI),xe=e=>{if(e.re<.5){const i=xe(N(z,e));return g({re:Math.PI,im:0},f(F(f({re:Math.PI,im:0},e)),i))}const t=N(e,z);let r={re:Q[0],im:0};for(let i=1;i<Q.length;++i)r=E(r,g({re:Q[i],im:0},E(t,{re:i,im:0})));const s=E(t,{re:7.5,im:0});return f(f({re:We,im:0},se(s,E(t,{re:.5,im:0}))),f(re({re:-s.re,im:-s.im}),r))},qe={exp:re,log:D,ln:D,sqrt:fe,abs:e=>({re:B(e),im:0}),arg:e=>({re:te(e),im:0}),conj:e=>({re:e.re,im:-e.im}),re:e=>({re:e.re,im:0}),im:e=>({re:e.im,im:0}),sin:F,cos:O,tan:e=>g(F(e),O(e)),cot:e=>g(O(e),F(e)),sec:e=>g(z,O(e)),csc:e=>g(z,F(e)),sinh:he,cosh:le,tanh:e=>g(he(e),le(e)),asin:ue,acos:e=>N({re:Math.PI/2,im:0},ue(e)),atan:_e,gamma:xe,pow:se},k=(e,t)=>{switch(e.type){case"num":return{re:e.re,im:e.im};case"var":return t;case"neg":{const r=k(e.arg,t);return{re:-r.re,im:-r.im}}case"bin":{const r=k(e.left,t),s=k(e.right,t);switch(e.op){case"+":return E(r,s);case"-":return N(r,s);case"*":return f(r,s);case"/":return g(r,s);case"^":return se(r,s)}throw new Error(`unsupported operator "${e.op}"`)}case"call":{const r=e.args.map(s=>k(s,t));return qe[e.name](r[0],r[1])}}throw new Error("malformed expression tree")},Oe=(e,t)=>k(e,t),Ve=B,Ue=te,Ge=`
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
`,H="(1+z^2)^-1",C={expression:"complexFunction.expression",favorites:"complexFunction.favorites",shading:"complexFunction.shading"},a={expression:"f",centerX:"cx",centerY:"cy",viewWidth:"w",brightness:"b",contours:"c",grid:"g"},Ye=600,He=2e3,je=400,Be=[{label:"z",expression:"z",hint:"the identity: one zero, hue winding once"},{label:"z²",expression:"z^2",hint:"a double zero: hue winds twice"},{label:"1/z",expression:"1/z",hint:"a simple pole, hue winding backwards"},{label:"1/(1+z²)",expression:"(1+z^2)^-1",hint:"poles at ±i"},{label:"log z",expression:"log(z)",hint:"the branch cut along the negative reals"},{label:"√z",expression:"sqrt(z)",hint:"two sheets, one cut"},{label:"eᶻ",expression:"exp(z)",hint:"periodic in the imaginary direction"},{label:"sin z",expression:"sin(z)",hint:"zeros at every multiple of pi"},{label:"tan z",expression:"tan(z)",hint:"alternating zeros and poles"},{label:"e^(1/z)",expression:"exp(1/z)",hint:"an essential singularity at the origin"},{label:"Γ(z)",expression:"gamma(z)",hint:"poles at the non-positive integers"},{label:"Joukowsky",expression:"(z+1/z)/2",hint:"the aerofoil map"},{label:"rational",expression:"(z^2-1)(z-2-i)^2/(z^2+2+2i)",hint:"the Wikipedia domain-coloring example"}],Xe=`
		varying vec2 vUv;

		void main () {
			vUv = uv;
			gl_Position = vec4(position.xy, 0.0, 1.0);
		}
	`,Qe=e=>`
		precision highp float;

		varying vec2 vUv;

		uniform vec2 uCenter;
		uniform vec2 uSpan;
		uniform float uBrightness;
		uniform float uContours;
		uniform float uGrid;
		uniform float uGridStep;
		uniform float uPixel;

		${Ge}

		vec2 f (vec2 z) {
			return ${e};
		}

		void main () {
			vec2 z = uCenter + (vUv - 0.5) * uSpan;
			vec2 w = f(z);

			float mag = length(w);
			vec3 rgb;

			// NaN and infinity both fail this comparison, which is the portable test in GLSL ES 1.00.
			// A pole reads white, matching the limit of the lightness ramp below.
			if (!(mag < 1e30)) {
				rgb = vec3(1.0);
			}
			else {
				float hue = atan(w.y, w.x) / (2.0 * PI);
				float lightness = atan(mag * uBrightness) * (2.0 / PI);
				rgb = hsl2rgb(hue, 1.0, clamp(lightness, 0.0, 1.0));

				if (uContours > 0.5) {
					// |f| doubling: fract(log2) is 0 on each contour, so the sawtooth's distance to an
					// end marks it. Skipped where mag is 0, whose log2 is undefined.
					if (mag > 0.0) {
						float band = fract(log2(mag));
						float edge = min(band, 1.0 - band);
						rgb *= mix(0.82, 1.0, smoothstep(0.0, 0.06, edge));
					}

					// arg f in twelfths of a turn.
					float phase = fract(atan(w.y, w.x) / (2.0 * PI) * 12.0);
					float phaseEdge = min(phase, 1.0 - phase);
					rgb *= mix(0.88, 1.0, smoothstep(0.0, 0.10, phaseEdge));
				}
			}

			if (uGrid > 0.5) {
				// Lines are drawn a fixed number of pixels wide, so they stay hairline at any zoom.
				vec2 toLine = abs(fract(z / uGridStep + 0.5) - 0.5) * uGridStep;
				float line = min(toLine.x, toLine.y);
				rgb = mix(rgb, vec3(1.0), 0.16 * (1.0 - smoothstep(0.0, uPixel, line)));

				float axis = min(abs(z.x), abs(z.y));
				rgb = mix(rgb, vec3(1.0), 0.5 * (1.0 - smoothstep(0.0, uPixel * 1.2, axis)));
			}

			gl_FragColor = vec4(rgb, 1.0);
		}
	`,Je=e=>{const t=e/8,r=Math.pow(10,Math.floor(Math.log10(t))),s=t/r;return(s>=5?5:s>=2?2:1)*r},w=e=>{if(e===0)return"0";const t=Math.abs(e)>=1e-6&&Math.abs(e)<1e6?e.toPrecision(10):e.toExponential(8);return t.includes("e")?t:t.replace(/\.?0+$/,"")||"0"},y=(e,t,r=Number.isFinite)=>{if(e==null||String(e).trim()==="")return t;const s=Number(e);return r(s)?s:t},V=e=>Number.isFinite(e)&&e>0,U=(e,t)=>{const r=String(e??"").trim().toLowerCase();return["1","true","yes","on"].includes(r)?!0:["0","false","no","off"].includes(r)?!1:t},A={x:0,y:0},$=8,ee=1,me=!0,pe=!0,Ke=[a.expression],Ze={[a.expression]:H,[a.centerX]:w(A.x),[a.centerY]:w(A.y),[a.viewWidth]:w($),[a.brightness]:w(ee),[a.contours]:"1",[a.grid]:"1"},J=(e,t)=>{try{const r=window.localStorage.getItem(e);return r===null?t:JSON.parse(r)}catch(r){return console.warn("cannot read",e,r),t}},K=(e,t)=>{try{window.localStorage.setItem(e,JSON.stringify(t))}catch(r){console.warn("cannot persist",e,r)}},G=1e-4,Y=1e4,$e={name:"complex-function",directives:{resize:Ne},data(){const e=J(C.shading,{}),t=this.$route&&this.$route.query||{},r=Object.values(a).some(u=>t[u]!==void 0),s=r?{}:e,i=t[a.expression]||(r?H:J(C.expression,H)),o=Math.min(Math.max(y(t[a.brightness],Number.isFinite(s.brightness)?s.brightness:ee,V),.2),3);return{PRESETS:Be,size:{width:800,height:600},expression:i,expressionInput:i,error:null,favorites:J(C.favorites,[]),panelIsOn:!0,brightness:o,contours:U(t[a.contours],s.contours!==void 0?s.contours!==!1:me),grid:U(t[a.grid],s.grid!==void 0?s.grid!==!1:pe),center:{x:y(t[a.centerX],A.x),y:y(t[a.centerY],A.y)},viewWidth:Math.min(Math.max(y(t[a.viewWidth],$,V),G),Y),cursor:null,cursorValue:null,pendingExpression:null}},computed:{viewHeight(){return this.viewWidth*this.size.height/this.size.width},gridStep(){return Je(this.viewWidth)},cursorAbs(){return this.cursorValue?Ve(this.cursorValue):null},cursorArg(){return this.cursorValue?Ue(this.cursorValue)/Math.PI:null},isFavorite(){return this.favorites.includes(this.expression)},shadingState(){return{brightness:this.brightness,contours:this.contours,grid:this.grid}},urlQuery(){const e={[a.expression]:this.expression,[a.centerX]:w(this.center.x),[a.centerY]:w(this.center.y),[a.viewWidth]:w(this.viewWidth),[a.brightness]:w(this.brightness),[a.contours]:this.contours?"1":"0",[a.grid]:this.grid?"1":"0"};return Object.fromEntries(Object.entries(e).filter(([t,r])=>Ke.includes(t)||r!==Ze[t]))},realTicks(){return this.ticksAlong("real")},imaginaryTicks(){return this.ticksAlong("imaginary")}},mounted(){this.initializeRenderer(),this.updateExpression(this.expression),this.rendererActive=!0,this.requestRender(),this.syncQuery()},beforeUnmount(){this.rendererActive=!1,this.clearExpressionTimer(),this.queryTimer&&clearTimeout(this.queryTimer),this.frameHandle&&cancelAnimationFrame(this.frameHandle),this.material&&this.material.dispose(),this.quad&&this.quad.geometry.dispose(),this.renderer&&this.renderer.dispose()},methods:{initializeRenderer(){this.renderer=T(new be({canvas:this.$refs.canvas,antialias:!1})),this.renderer.setSize(this.size.width,this.size.height,!1),this.scene=T(new Me),this.camera=T(new Ee),this.uniforms=T({uCenter:{value:new ie(0,0)},uSpan:{value:new ie(8,6)},uBrightness:{value:this.brightness},uContours:{value:this.contours?1:0},uGrid:{value:this.grid?1:0},uGridStep:{value:1},uPixel:{value:.01}}),this.quad=T(new ze(new Se(2,2))),this.scene.add(this.quad)},updateExpression(e){let t;try{t=ae(e),this.tree=ve(e)}catch(i){return this.error=i.message,!1}const r=T(new we({uniforms:this.uniforms,vertexShader:Xe,fragmentShader:Qe(t)})),s=this.material;this.material=r,this.quad.material=r;try{this.renderer.compile(this.scene,this.camera)}catch(i){return console.warn("shader compilation failed for",e,i),this.error="cannot render this expression",this.material=s,this.quad.material=s,r.dispose(),!1}return s&&s.dispose(),this.error=null,this.expression=e,this.shaderBody=t,K(C.expression,e),this.updateCursorValue(),this.requestRender(),!0},onExpressionInput(){const e=this.expressionInput.trim();let t;try{t=e?ae(e):null}catch(r){this.armErrorReport(r.message);return}if(this.clearErrorTimer(),!t||t===this.shaderBody){this.error=null;return}this.expressionTimer?this.pendingExpression=e:this.applyAndHold(e)},applyAndHold(e){this.pendingExpression=null,this.updateExpression(e),this.expressionTimer=setTimeout(()=>{this.expressionTimer=null;const t=this.pendingExpression;this.pendingExpression=null,t&&t!==this.expression&&this.applyAndHold(t)},Ye)},armErrorReport(e){this.clearErrorTimer(),this.errorTimer=setTimeout(()=>{this.errorTimer=null,this.error=e},He)},clearErrorTimer(){this.errorTimer&&(clearTimeout(this.errorTimer),this.errorTimer=null)},clearExpressionTimer(){this.expressionTimer&&(clearTimeout(this.expressionTimer),this.expressionTimer=null),this.pendingExpression=null,this.clearErrorTimer()},commitExpression(){this.clearExpressionTimer();const e=this.expressionInput.trim();!e||e===this.expression||this.applyAndHold(e)},syncQuery(){this.queryTimer&&clearTimeout(this.queryTimer),this.queryTimer=setTimeout(()=>{this.queryTimer=null;const e=this.$route.query,t=this.urlQuery;if(Object.values(a).every(s=>e[s]===t[s]))return;const r=Object.fromEntries(Object.entries(e).filter(([s])=>!Object.values(a).includes(s)));this.$router.replace({path:this.$route.path,query:{...r,...t}}).catch(s=>{(!s||s.name!=="NavigationDuplicated")&&console.warn("cannot sync the URL query",s)})},je)},applyQuery(e){const t=e[a.expression]||H;t!==this.expression&&(this.expressionInput=t,this.clearExpressionTimer(),this.updateExpression(t));const r=y(e[a.centerX],A.x),s=y(e[a.centerY],A.y);(r!==this.center.x||s!==this.center.y)&&(this.center={x:r,y:s});const i=Math.min(Math.max(y(e[a.viewWidth],$,V),G),Y);i!==this.viewWidth&&(this.viewWidth=i),this.brightness=Math.min(Math.max(y(e[a.brightness],ee,V),.2),3),this.contours=U(e[a.contours],me),this.grid=U(e[a.grid],pe),this.requestRender()},applyExpression(e){this.clearExpressionTimer(),this.expressionInput=e,this.updateExpression(e)},requestRender(){this.frameHandle||!this.rendererActive||(this.frameHandle=requestAnimationFrame(()=>{this.frameHandle=null,this.draw()}))},draw(){!this.renderer||!this.material||(this.uniforms.uCenter.value.set(this.center.x,this.center.y),this.uniforms.uSpan.value.set(this.viewWidth,this.viewHeight),this.uniforms.uBrightness.value=this.brightness,this.uniforms.uContours.value=this.contours?1:0,this.uniforms.uGrid.value=this.grid?1:0,this.uniforms.uGridStep.value=this.gridStep,this.uniforms.uPixel.value=this.viewWidth/Math.max(this.size.width,1),this.renderer.render(this.scene,this.camera))},pointToComplex(e,t){return{re:this.center.x+(e/this.size.width-.5)*this.viewWidth,im:this.center.y-(t/this.size.height-.5)*this.viewHeight}},complexToPoint(e,t){return{x:(e-this.center.x)/this.viewWidth*this.size.width+this.size.width/2,y:this.size.height/2-(t-this.center.y)/this.viewHeight*this.size.height}},ticksAlong(e){const t=this.gridStep,r=[],[s,i]=e==="real"?[this.center.x-this.viewWidth/2,this.center.x+this.viewWidth/2]:[this.center.y-this.viewHeight/2,this.center.y+this.viewHeight/2],o=Math.ceil(s/t),u=Math.floor(i/t);if(!Number.isFinite(o)||!Number.isFinite(u)||u-o>200)return r;for(let n=o;n<=u;++n){if(n===0)continue;const m=n*t,b=e==="real"?this.complexToPoint(m,this.center.y):this.complexToPoint(this.center.x,m),M=this.complexToPoint(0,0);r.push({value:m,x:e==="real"?b.x:Math.min(Math.max(M.x+6,4),this.size.width-40),y:e==="real"?Math.min(Math.max(M.y+14,14),this.size.height-6):b.y-4,label:this.formatTick(m,t,e)})}return r},formatTick(e,t,r){const s=Math.max(0,Math.min(6,-Math.floor(Math.log10(t)))),i=e.toFixed(s);return r==="real"?i:`${i}i`},formatNumber(e){if(e==null||!Number.isFinite(e))return"∞";const t=Math.abs(e);return t!==0&&(t<1e-4||t>=1e5)?e.toExponential(3):e.toFixed(4)},formatComplex(e){if(!Number.isFinite(e.re)||!Number.isFinite(e.im))return"∞";const t=e.im<0?"−":"+";return`${this.formatNumber(e.re)} ${t} ${this.formatNumber(Math.abs(e.im))}i`},updateCursorValue(){if(!this.cursor||!this.tree){this.cursorValue=null;return}try{this.cursorValue=Oe(this.tree,{re:this.cursor.z.re,im:this.cursor.z.im})}catch{this.cursorValue=null}},onResize(){this.size={width:Math.max(this.$el.clientWidth,1),height:Math.max(this.$el.clientHeight,1)},this.renderer&&(this.renderer.setSize(this.size.width,this.size.height,!1),this.requestRender())},onMouseDown(e){this.dragging={x:e.offsetX,y:e.offsetY,center:{...this.center}}},onMouseMove(e){if(this.dragging){const t=(e.offsetX-this.dragging.x)/this.size.width*this.viewWidth,r=(e.offsetY-this.dragging.y)/this.size.height*this.viewHeight;this.center={x:this.dragging.center.x-t,y:this.dragging.center.y+r}}this.cursor={z:this.pointToComplex(e.offsetX,e.offsetY)},this.updateCursorValue(),this.requestRender()},onMouseUp(){this.dragging=null},onMouseLeave(){this.dragging=null,this.cursor=null,this.cursorValue=null},onWheel(e){const t=this.pointToComplex(e.offsetX,e.offsetY),r=Math.exp(e.deltaY*.001),s=Math.min(Math.max(this.viewWidth*r,G),Y),i=s/this.viewWidth;this.center={x:t.re+(this.center.x-t.re)*i,y:t.im+(this.center.y-t.im)*i},this.viewWidth=s,this.updateCursorValue(),this.requestRender()},touchToOffset(e){const t=this.$refs.canvas.getBoundingClientRect();return{offsetX:e.clientX-t.left,offsetY:e.clientY-t.top}},touchSpread(e){return Math.hypot(e[0].clientX-e[1].clientX,e[0].clientY-e[1].clientY)},onTouchStart(e){e.touches.length===1?this.onMouseDown(this.touchToOffset(e.touches[0])):e.touches.length===2&&(this.dragging=null,this.pinch={spread:this.touchSpread(e.touches),width:this.viewWidth})},onTouchMove(e){if(e.touches.length===1&&this.dragging)this.onMouseMove(this.touchToOffset(e.touches[0]));else if(e.touches.length===2&&this.pinch){const t=this.touchSpread(e.touches);t>0&&(this.viewWidth=Math.min(Math.max(this.pinch.width*this.pinch.spread/t,G),Y),this.requestRender())}},onTouchEnd(){this.dragging=null,this.pinch=null},resetView(){this.center={x:0,y:0},this.viewWidth=8,this.requestRender()},toggleFavorite(){this.isFavorite?this.removeFavorite(this.expression):this.favorites=[...this.favorites,this.expression]},removeFavorite(e){this.favorites=this.favorites.filter(t=>t!==e)}},watch:{favorites:{handler(e){K(C.favorites,e)},deep:!0},size:"requestRender",shadingState(e){K(C.shading,e),this.requestRender()},urlQuery:{handler(){this.syncQuery()},deep:!0},$route(e){const t=e.query||{},r=this.urlQuery;Object.values(a).every(s=>t[s]===r[s])||this.applyQuery(t)}}},et={class:"complex-function"},tt=["width","height"],rt=["viewBox","width","height"],st={class:"real"},it=["x","y"],nt={class:"imaginary"},ot=["x","y"],ct={class:"formula"},at=["title"],ht={key:0,class:"error"},lt={key:1,class:"config"},ut={class:"row"},mt={class:"chips"},pt=["title","onClick"],dt={key:0,class:"row"},vt={class:"chips"},ft=["onClick"],gt=["onClick"],xt={class:"row"},yt={class:"value"},wt={class:"check"},bt={class:"check"},Mt={key:0},Et={class:"item"},zt={class:"item"},St={key:0,class:"item"},Tt={key:1,class:"item"},Ct={class:"item scale"};function At(e,t,r,s,i,o){const u=Ce("resize");return I((d(),p("div",et,[c("canvas",{ref:"canvas",width:i.size.width,height:i.size.height,onMousedown:t[0]||(t[0]=R((...n)=>o.onMouseDown&&o.onMouseDown(...n),["prevent"])),onMousemove:t[1]||(t[1]=(...n)=>o.onMouseMove&&o.onMouseMove(...n)),onMouseup:t[2]||(t[2]=(...n)=>o.onMouseUp&&o.onMouseUp(...n)),onMouseleave:t[3]||(t[3]=(...n)=>o.onMouseLeave&&o.onMouseLeave(...n)),onWheel:t[4]||(t[4]=R((...n)=>o.onWheel&&o.onWheel(...n),["prevent"])),onTouchstart:t[5]||(t[5]=R((...n)=>o.onTouchStart&&o.onTouchStart(...n),["prevent"])),onTouchmove:t[6]||(t[6]=R((...n)=>o.onTouchMove&&o.onTouchMove(...n),["prevent"])),onTouchend:t[7]||(t[7]=(...n)=>o.onTouchEnd&&o.onTouchEnd(...n))},null,40,tt),(d(),p("svg",{class:"labels",viewBox:`0 0 ${i.size.width} ${i.size.height}`,width:i.size.width,height:i.size.height},[c("g",st,[(d(!0),p(_,null,W(o.realTicks,n=>(d(),p("text",{key:`r${n.value}`,x:n.x,y:n.y},v(n.label),9,it))),128))]),c("g",nt,[(d(!0),p(_,null,W(o.imaginaryTicks,n=>(d(),p("text",{key:`i${n.value}`,x:n.x,y:n.y},v(n.label),9,ot))),128))])],8,rt)),c("header",null,[c("div",ct,[t[18]||(t[18]=c("label",null,"f(z) =",-1)),I(c("input",{type:"text",spellcheck:!1,autocomplete:"off",autocapitalize:"off",placeholder:"(1+z^2)^-1","onUpdate:modelValue":t[8]||(t[8]=n=>i.expressionInput=n),onInput:t[9]||(t[9]=(...n)=>o.onExpressionInput&&o.onExpressionInput(...n)),onKeydown:t[10]||(t[10]=Ae((...n)=>o.commitExpression&&o.commitExpression(...n),["enter"])),onBlur:t[11]||(t[11]=(...n)=>o.commitExpression&&o.commitExpression(...n))},null,544),[[ne,i.expressionInput]]),c("button",{class:q(["favorite",{on:o.isFavorite}]),title:o.isFavorite?"Remove from favorites":"Add to favorites",onClick:t[12]||(t[12]=(...n)=>o.toggleFavorite&&o.toggleFavorite(...n))},v(o.isFavorite?"★":"☆"),11,at),c("button",{class:q(["settings",{on:i.panelIsOn}]),title:"Settings",onClick:t[13]||(t[13]=n=>i.panelIsOn=!i.panelIsOn)},"⚙",2)]),i.error?(d(),p("div",ht,v(i.error),1)):S("",!0),i.panelIsOn?(d(),p("div",lt,[c("div",ut,[t[19]||(t[19]=c("label",null,"examples",-1)),c("div",mt,[(d(!0),p(_,null,W(i.PRESETS,n=>(d(),p("button",{key:n.expression,class:q({on:n.expression===i.expression}),title:n.hint,onClick:m=>o.applyExpression(n.expression)},v(n.label),11,pt))),128))])]),i.favorites.length?(d(),p("div",dt,[t[20]||(t[20]=c("label",null,"favorites",-1)),c("div",vt,[(d(!0),p(_,null,W(i.favorites,n=>(d(),p("button",{key:n,class:q({on:n===i.expression}),onClick:m=>o.applyExpression(n)},[X(v(n),1),c("i",{class:"drop",title:"Remove",onClick:R(m=>o.removeFavorite(n),["stop"])},"×",8,gt)],10,ft))),128))])])):S("",!0),c("div",xt,[t[23]||(t[23]=c("label",null,"brightness",-1)),I(c("input",{type:"range",min:"0.2",max:"3",step:"0.05","onUpdate:modelValue":t[14]||(t[14]=n=>i.brightness=n)},null,512),[[ne,i.brightness,void 0,{number:!0}]]),c("span",yt,v(i.brightness.toFixed(2)),1),c("label",wt,[I(c("input",{type:"checkbox","onUpdate:modelValue":t[15]||(t[15]=n=>i.contours=n)},null,512),[[oe,i.contours]]),t[21]||(t[21]=X(" contours",-1))]),c("label",bt,[I(c("input",{type:"checkbox","onUpdate:modelValue":t[16]||(t[16]=n=>i.grid=n)},null,512),[[oe,i.grid]]),t[22]||(t[22]=X(" grid",-1))]),c("button",{class:"reset",onClick:t[17]||(t[17]=(...n)=>o.resetView&&o.resetView(...n))},"reset view")])])):S("",!0)]),i.cursor?(d(),p("footer",Mt,[c("span",Et,[t[24]||(t[24]=c("label",null,"z",-1)),c("em",null,v(o.formatComplex(i.cursor.z)),1)]),c("span",zt,[t[25]||(t[25]=c("label",null,"f(z)",-1)),c("em",null,v(i.cursorValue?o.formatComplex(i.cursorValue):"—"),1)]),i.cursorValue?(d(),p("span",St,[t[26]||(t[26]=c("label",null,"|f|",-1)),c("em",null,v(o.formatNumber(o.cursorAbs)),1)])):S("",!0),i.cursorValue?(d(),p("span",Tt,[t[27]||(t[27]=c("label",null,"arg f",-1)),c("em",null,v(o.formatNumber(o.cursorArg))+"π",1)])):S("",!0),c("span",Ct,[t[28]||(t[28]=c("label",null,"view",-1)),c("em",null,v(o.formatNumber(i.viewWidth))+" wide",1)])])):S("",!0)])),[[u,o.onResize]])}const Pt=Te($e,[["render",At],["__scopeId","data-v-75858ee5"]]);export{Pt as default};
