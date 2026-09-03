import{S as ce,ak as he,al as le,az as ue,V as j,M as me,P as ve}from"./three.module-B96IhAFS.js";import{_ as pe,y as de,w as C,c as m,o as v,a,p as z,j as T,F as R,g as F,C as p,M as fe,q as Y,h as L,A as q,D as J,z as M}from"./router-CiGFl28j.js";import{r as ge}from"./vue-resize-directive-CDf_Yp3t.js";const re=["z","x"],U={i:{re:0,im:1},j:{re:0,im:1},pi:{re:Math.PI,im:0},e:{re:Math.E,im:0}},_={exp:[1,"cExp"],log:[1,"cLog"],ln:[1,"cLog"],sqrt:[1,"cSqrt"],abs:[1,"cAbs"],arg:[1,"cArg"],conj:[1,"cConj"],re:[1,"cReal"],im:[1,"cImag"],sin:[1,"cSin"],cos:[1,"cCos"],tan:[1,"cTan"],cot:[1,"cCot"],sec:[1,"cSec"],csc:[1,"cCsc"],sinh:[1,"cSinh"],cosh:[1,"cCosh"],tanh:[1,"cTanh"],asin:[1,"cAsin"],acos:[1,"cAcos"],atan:[1,"cAtan"],gamma:[1,"cGamma"],pow:[2,"cPow"]},xe=/^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/,we=/^[A-Za-z]+/,ye=[...Object.keys(_),...Object.keys(U),...re].sort((e,t)=>t.length-e.length),be=e=>{const t=[];let r=0;for(;r<e.length;){const o=e.substr(r);if(/^\s/.test(o)){++r;continue}const i=xe.exec(o);if(i){t.push({type:"num",value:i[0],num:Number(i[0]),pos:r}),r+=i[0].length;continue}const n=we.exec(o);if(n){const s=n[0].toLowerCase(),u=ye.find(x=>s.startsWith(x));if(!u)throw new Error(`unknown name "${s}" at ${r+1}`);t.push({type:"ident",value:u,pos:r}),r+=u.length;continue}const l=o[0];if("+-*/^".includes(l))t.push({type:"op",value:l,pos:r});else if(l==="("||l===")"||l===",")t.push({type:l,value:l,pos:r});else if(l==="π")t.push({type:"ident",value:"pi",pos:r});else throw new Error(`unexpected character "${l}" at ${r+1}`);++r}return t.push({type:"end",value:"",pos:e.length}),t},ze=e=>{let t=0;const r=()=>e[t],o=()=>e[t++],i=(c,h)=>{const g=r();if(g.type!==c)throw new Error(`expected ${h} at ${g.pos+1}${g.value?`, got "${g.value}"`:""}`);return o()},n=c=>c.type==="num"||c.type==="ident"||c.type==="(";function l(){const c=r();switch(c.type){case"num":return o(),r().type==="ident"&&(r().value==="i"||r().value==="j")?(o(),{type:"num",re:0,im:c.num}):{type:"num",re:c.num,im:0};case"ident":{o();const h=c.value;if(_[h]){const[g]=_[h];i("(",`"(" after ${h}`);const P=[w()];for(;r().type===",";)o(),P.push(w());if(i(")",`")" closing ${h}(`),P.length!==g)throw new Error(`${h} takes ${g} argument${g>1?"s":""}, got ${P.length}`);return{type:"call",name:h,args:P}}if(re.includes(h))return{type:"var"};if(U[h])return{type:"num",...U[h]};throw new Error(`unknown name "${h}" at ${c.pos+1}`)}case"(":{o();const h=w();return i(")",'")"'),h}}throw new Error(`unexpected ${c.type==="end"?"end of expression":`"${c.value}"`} at ${c.pos+1}`)}function s(){const c=l();return r().type==="op"&&r().value==="^"?(o(),{type:"bin",op:"^",left:c,right:u()}):c}function u(){if(r().type==="op"&&(r().value==="-"||r().value==="+")){const c=o().value,h=u();return c!=="-"?h:h.type==="num"?{type:"num",re:-h.re,im:-h.im}:{type:"neg",arg:h}}return s()}function x(){let c=u();for(;;){const h=r();if(h.type==="op"&&(h.value==="*"||h.value==="/"))o(),c={type:"bin",op:h.value,left:c,right:u()};else if(n(h))c={type:"bin",op:"*",left:c,right:s()};else break}return c}function w(){let c=x();for(;r().type==="op"&&(r().value==="+"||r().value==="-");)c={type:"bin",op:o().value,left:c,right:x()};return c}const ae=w();if(r().type!=="end")throw new Error(`unexpected "${r().value}" at ${r().pos+1}`);return ae},se=e=>{if(!e||!e.trim())throw new Error("empty expression");return ze(be(e))},K=e=>{if(!Number.isFinite(e))throw new Error(`cannot encode ${e} as a shader constant`);return Number.isInteger(e)&&Math.abs(e)<1e7?`${e}.0`:e.toExponential(9)},Me=6,Se=24,A=e=>{switch(e.type){case"num":return`vec2(${K(e.re)}, ${K(e.im)})`;case"var":return"z";case"neg":return`(-${A(e.arg)})`;case"bin":{const t=A(e.left),r=A(e.right);switch(e.op){case"+":return`(${t} + ${r})`;case"-":return`(${t} - ${r})`;case"*":return`cMul(${t}, ${r})`;case"/":return`cDiv(${t}, ${r})`;case"^":{const o=e.right;if(o.type==="num"&&o.im===0&&Number.isInteger(o.re)&&Math.abs(o.re)<=Me&&t.length<=Se){const i=Math.abs(o.re);if(i===0)return"vec2(1.0, 0.0)";let n=t;for(let l=1;l<i;++l)n=`cMul(${n}, ${t})`;return o.re>0?n:`cDiv(vec2(1.0, 0.0), ${n})`}return`cPow(${t}, ${r})`}}throw new Error(`unsupported operator "${e.op}"`)}case"call":return`${_[e.name][1]}(${e.args.map(A).join(", ")})`}throw new Error("malformed expression tree")},Ee=e=>A(se(e)),y=(e,t)=>({re:e.re+t.re,im:e.im+t.im}),E=(e,t)=>({re:e.re-t.re,im:e.im-t.im}),d=(e,t)=>({re:e.re*t.re-e.im*t.im,im:e.re*t.im+e.im*t.re}),f=(e,t)=>{const r=t.re*t.re+t.im*t.im;return{re:(e.re*t.re+e.im*t.im)/r,im:(e.im*t.re-e.re*t.im)/r}},D=e=>Math.hypot(e.re,e.im),H=e=>Math.atan2(e.im,e.re),B=e=>{const t=Math.exp(e.re);return{re:t*Math.cos(e.im),im:t*Math.sin(e.im)}},I=e=>({re:Math.log(D(e)),im:H(e)}),X=(e,t)=>e.re===0&&e.im===0?t.re===0&&t.im===0?{re:1,im:0}:t.re<0?{re:1/0,im:0}:{re:0,im:0}:B(d(t,I(e))),ie=e=>{const t=D(e);if(t===0)return{re:0,im:0};const r=Math.sqrt(.5*(t+e.re)),o=Math.sqrt(.5*(t-e.re));return{re:r,im:e.im<0?-o:o}},N=e=>({re:Math.sin(e.re)*Math.cosh(e.im),im:Math.cos(e.re)*Math.sinh(e.im)}),V=e=>({re:Math.cos(e.re)*Math.cosh(e.im),im:-Math.sin(e.re)*Math.sinh(e.im)}),Q=e=>({re:Math.sinh(e.re)*Math.cos(e.im),im:Math.cosh(e.re)*Math.sin(e.im)}),Z=e=>({re:Math.cosh(e.re)*Math.cos(e.im),im:Math.sinh(e.re)*Math.sin(e.im)}),b={re:1,im:0},ne={re:0,im:1},$=e=>{const t=ie(E(b,d(e,e)));return d({re:0,im:-1},I(y(d(ne,e),t)))},Ce=e=>{const t=d(ne,e);return d({re:0,im:-.5},I(f(y(b,t),E(b,t))))},W=[.9999999999998099,676.5203681218851,-1259.1392167224028,771.3234287776531,-176.6150291621406,12.507343278686905,-.13857109526572012,9984369578019572e-21,15056327351493116e-23],Te=Math.sqrt(2*Math.PI),oe=e=>{if(e.re<.5){const i=oe(E(b,e));return f({re:Math.PI,im:0},d(N(d({re:Math.PI,im:0},e)),i))}const t=E(e,b);let r={re:W[0],im:0};for(let i=1;i<W.length;++i)r=y(r,f({re:W[i],im:0},y(t,{re:i,im:0})));const o=y(t,{re:7.5,im:0});return d(d({re:Te,im:0},X(o,y(t,{re:.5,im:0}))),d(B({re:-o.re,im:-o.im}),r))},Ae={exp:B,log:I,ln:I,sqrt:ie,abs:e=>({re:D(e),im:0}),arg:e=>({re:H(e),im:0}),conj:e=>({re:e.re,im:-e.im}),re:e=>({re:e.re,im:0}),im:e=>({re:e.im,im:0}),sin:N,cos:V,tan:e=>f(N(e),V(e)),cot:e=>f(V(e),N(e)),sec:e=>f(b,V(e)),csc:e=>f(b,N(e)),sinh:Q,cosh:Z,tanh:e=>f(Q(e),Z(e)),asin:$,acos:e=>E({re:Math.PI/2,im:0},$(e)),atan:Ce,gamma:oe,pow:X},k=(e,t)=>{switch(e.type){case"num":return{re:e.re,im:e.im};case"var":return t;case"neg":{const r=k(e.arg,t);return{re:-r.re,im:-r.im}}case"bin":{const r=k(e.left,t),o=k(e.right,t);switch(e.op){case"+":return y(r,o);case"-":return E(r,o);case"*":return d(r,o);case"/":return f(r,o);case"^":return X(r,o)}throw new Error(`unsupported operator "${e.op}"`)}case"call":{const r=e.args.map(o=>k(o,t));return Ae[e.name](r[0],r[1])}}throw new Error("malformed expression tree")},Ne=(e,t)=>k(e,t),ke=D,Ie=H,Pe=`
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
`,Re="(1+z^2)^-1",S={expression:"complexFunction.expression",favorites:"complexFunction.favorites",shading:"complexFunction.shading"},Fe=[{label:"z",expression:"z",hint:"the identity: one zero, hue winding once"},{label:"z²",expression:"z^2",hint:"a double zero: hue winds twice"},{label:"1/z",expression:"1/z",hint:"a simple pole, hue winding backwards"},{label:"1/(1+z²)",expression:"(1+z^2)^-1",hint:"poles at ±i"},{label:"log z",expression:"log(z)",hint:"the branch cut along the negative reals"},{label:"√z",expression:"sqrt(z)",hint:"two sheets, one cut"},{label:"eᶻ",expression:"exp(z)",hint:"periodic in the imaginary direction"},{label:"sin z",expression:"sin(z)",hint:"zeros at every multiple of pi"},{label:"tan z",expression:"tan(z)",hint:"alternating zeros and poles"},{label:"e^(1/z)",expression:"exp(1/z)",hint:"an essential singularity at the origin"},{label:"Γ(z)",expression:"gamma(z)",hint:"poles at the non-positive integers"},{label:"Joukowsky",expression:"(z+1/z)/2",hint:"the aerofoil map"},{label:"rational",expression:"(z^2-1)(z-2-i)^2/(z^2+2+2i)",hint:"the Wikipedia domain-coloring example"}],Le=`
		varying vec2 vUv;

		void main () {
			vUv = uv;
			gl_Position = vec4(position.xy, 0.0, 1.0);
		}
	`,Ve=e=>`
		precision highp float;

		varying vec2 vUv;

		uniform vec2 uCenter;
		uniform vec2 uSpan;
		uniform float uBrightness;
		uniform float uContours;
		uniform float uGrid;
		uniform float uGridStep;
		uniform float uPixel;

		${Pe}

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
	`,_e=e=>{const t=e/8,r=Math.pow(10,Math.floor(Math.log10(t))),o=t/r;return(o>=5?5:o>=2?2:1)*r},G=(e,t)=>{try{const r=window.localStorage.getItem(e);return r===null?t:JSON.parse(r)}catch(r){return console.warn("cannot read",e,r),t}},O=(e,t)=>{try{window.localStorage.setItem(e,JSON.stringify(t))}catch(r){console.warn("cannot persist",e,r)}},ee=1e-4,te=1e4,De={name:"complex-function",directives:{resize:ge},data(){const e=G(S.shading,{}),t=G(S.expression,Re);return{PRESETS:Fe,size:{width:800,height:600},expression:t,expressionInput:t,error:null,favorites:G(S.favorites,[]),panelIsOn:!0,brightness:Number.isFinite(e.brightness)?e.brightness:1,contours:e.contours!==!1,grid:e.grid!==!1,center:{x:0,y:0},viewWidth:8,cursor:null,cursorValue:null}},computed:{viewHeight(){return this.viewWidth*this.size.height/this.size.width},gridStep(){return _e(this.viewWidth)},cursorAbs(){return this.cursorValue?ke(this.cursorValue):null},cursorArg(){return this.cursorValue?Ie(this.cursorValue)/Math.PI:null},isFavorite(){return this.favorites.includes(this.expression)},shadingState(){return{brightness:this.brightness,contours:this.contours,grid:this.grid}},realTicks(){return this.ticksAlong("real")},imaginaryTicks(){return this.ticksAlong("imaginary")}},mounted(){this.initializeRenderer(),this.updateExpression(this.expression),this.rendererActive=!0,this.requestRender()},beforeUnmount(){this.rendererActive=!1,this.frameHandle&&cancelAnimationFrame(this.frameHandle),this.material&&this.material.dispose(),this.quad&&this.quad.geometry.dispose(),this.renderer&&this.renderer.dispose()},methods:{initializeRenderer(){this.renderer=M(new he({canvas:this.$refs.canvas,antialias:!1})),this.renderer.setSize(this.size.width,this.size.height,!1),this.scene=M(new le),this.camera=M(new ue),this.uniforms=M({uCenter:{value:new j(0,0)},uSpan:{value:new j(8,6)},uBrightness:{value:this.brightness},uContours:{value:this.contours?1:0},uGrid:{value:this.grid?1:0},uGridStep:{value:1},uPixel:{value:.01}}),this.quad=M(new me(new ve(2,2))),this.scene.add(this.quad)},updateExpression(e){let t;try{t=Ee(e),this.tree=se(e)}catch(i){return this.error=i.message,!1}const r=M(new ce({uniforms:this.uniforms,vertexShader:Le,fragmentShader:Ve(t)})),o=this.material;this.material=r,this.quad.material=r;try{this.renderer.compile(this.scene,this.camera)}catch(i){return console.warn("shader compilation failed for",e,i),this.error="cannot render this expression",this.material=o,this.quad.material=o,r.dispose(),!1}return o&&o.dispose(),this.error=null,this.expression=e,O(S.expression,e),this.updateCursorValue(),this.requestRender(),!0},commitExpression(){const e=this.expressionInput.trim();!e||e===this.expression||this.updateExpression(e)},applyExpression(e){this.expressionInput=e,this.updateExpression(e)},requestRender(){this.frameHandle||!this.rendererActive||(this.frameHandle=requestAnimationFrame(()=>{this.frameHandle=null,this.draw()}))},draw(){!this.renderer||!this.material||(this.uniforms.uCenter.value.set(this.center.x,this.center.y),this.uniforms.uSpan.value.set(this.viewWidth,this.viewHeight),this.uniforms.uBrightness.value=this.brightness,this.uniforms.uContours.value=this.contours?1:0,this.uniforms.uGrid.value=this.grid?1:0,this.uniforms.uGridStep.value=this.gridStep,this.uniforms.uPixel.value=this.viewWidth/Math.max(this.size.width,1),this.renderer.render(this.scene,this.camera))},pointToComplex(e,t){return{re:this.center.x+(e/this.size.width-.5)*this.viewWidth,im:this.center.y-(t/this.size.height-.5)*this.viewHeight}},complexToPoint(e,t){return{x:(e-this.center.x)/this.viewWidth*this.size.width+this.size.width/2,y:this.size.height/2-(t-this.center.y)/this.viewHeight*this.size.height}},ticksAlong(e){const t=this.gridStep,r=[],[o,i]=e==="real"?[this.center.x-this.viewWidth/2,this.center.x+this.viewWidth/2]:[this.center.y-this.viewHeight/2,this.center.y+this.viewHeight/2],n=Math.ceil(o/t),l=Math.floor(i/t);if(!Number.isFinite(n)||!Number.isFinite(l)||l-n>200)return r;for(let s=n;s<=l;++s){if(s===0)continue;const u=s*t,x=e==="real"?this.complexToPoint(u,this.center.y):this.complexToPoint(this.center.x,u),w=this.complexToPoint(0,0);r.push({value:u,x:e==="real"?x.x:Math.min(Math.max(w.x+6,4),this.size.width-40),y:e==="real"?Math.min(Math.max(w.y+14,14),this.size.height-6):x.y-4,label:this.formatTick(u,t,e)})}return r},formatTick(e,t,r){const o=Math.max(0,Math.min(6,-Math.floor(Math.log10(t)))),i=e.toFixed(o);return r==="real"?i:`${i}i`},formatNumber(e){if(e==null||!Number.isFinite(e))return"∞";const t=Math.abs(e);return t!==0&&(t<1e-4||t>=1e5)?e.toExponential(3):e.toFixed(4)},formatComplex(e){if(!Number.isFinite(e.re)||!Number.isFinite(e.im))return"∞";const t=e.im<0?"−":"+";return`${this.formatNumber(e.re)} ${t} ${this.formatNumber(Math.abs(e.im))}i`},updateCursorValue(){if(!this.cursor||!this.tree){this.cursorValue=null;return}try{this.cursorValue=Ne(this.tree,{re:this.cursor.z.re,im:this.cursor.z.im})}catch{this.cursorValue=null}},onResize(){this.size={width:Math.max(this.$el.clientWidth,1),height:Math.max(this.$el.clientHeight,1)},this.renderer&&(this.renderer.setSize(this.size.width,this.size.height,!1),this.requestRender())},onMouseDown(e){this.dragging={x:e.offsetX,y:e.offsetY,center:{...this.center}}},onMouseMove(e){if(this.dragging){const t=(e.offsetX-this.dragging.x)/this.size.width*this.viewWidth,r=(e.offsetY-this.dragging.y)/this.size.height*this.viewHeight;this.center={x:this.dragging.center.x-t,y:this.dragging.center.y+r}}this.cursor={z:this.pointToComplex(e.offsetX,e.offsetY)},this.updateCursorValue(),this.requestRender()},onMouseUp(){this.dragging=null},onMouseLeave(){this.dragging=null,this.cursor=null,this.cursorValue=null},onWheel(e){const t=this.pointToComplex(e.offsetX,e.offsetY),r=Math.exp(e.deltaY*.001),o=Math.min(Math.max(this.viewWidth*r,ee),te),i=o/this.viewWidth;this.center={x:t.re+(this.center.x-t.re)*i,y:t.im+(this.center.y-t.im)*i},this.viewWidth=o,this.updateCursorValue(),this.requestRender()},touchToOffset(e){const t=this.$refs.canvas.getBoundingClientRect();return{offsetX:e.clientX-t.left,offsetY:e.clientY-t.top}},touchSpread(e){return Math.hypot(e[0].clientX-e[1].clientX,e[0].clientY-e[1].clientY)},onTouchStart(e){e.touches.length===1?this.onMouseDown(this.touchToOffset(e.touches[0])):e.touches.length===2&&(this.dragging=null,this.pinch={spread:this.touchSpread(e.touches),width:this.viewWidth})},onTouchMove(e){if(e.touches.length===1&&this.dragging)this.onMouseMove(this.touchToOffset(e.touches[0]));else if(e.touches.length===2&&this.pinch){const t=this.touchSpread(e.touches);t>0&&(this.viewWidth=Math.min(Math.max(this.pinch.width*this.pinch.spread/t,ee),te),this.requestRender())}},onTouchEnd(){this.dragging=null,this.pinch=null},resetView(){this.center={x:0,y:0},this.viewWidth=8,this.requestRender()},toggleFavorite(){this.isFavorite?this.removeFavorite(this.expression):this.favorites=[...this.favorites,this.expression]},removeFavorite(e){this.favorites=this.favorites.filter(t=>t!==e)}},watch:{favorites:{handler(e){O(S.favorites,e)},deep:!0},size:"requestRender",shadingState(e){O(S.shading,e),this.requestRender()}}},qe={class:"complex-function"},We=["width","height"],Ge=["viewBox","width","height"],Oe={class:"real"},Ue=["x","y"],He={class:"imaginary"},Be=["x","y"],Xe={class:"formula"},je=["title"],Ye={key:0,class:"error"},Je={key:1,class:"config"},Ke={class:"row"},Qe={class:"chips"},Ze=["title","onClick"],$e={key:0,class:"row"},et={class:"chips"},tt=["onClick"],rt=["onClick"],st={class:"row"},it={class:"value"},nt={class:"check"},ot={class:"check"},at={key:0},ct={class:"item"},ht={class:"item"},lt={key:0,class:"item"},ut={key:1,class:"item"},mt={class:"item scale"};function vt(e,t,r,o,i,n){const l=de("resize");return C((v(),m("div",qe,[a("canvas",{ref:"canvas",width:i.size.width,height:i.size.height,onMousedown:t[0]||(t[0]=T((...s)=>n.onMouseDown&&n.onMouseDown(...s),["prevent"])),onMousemove:t[1]||(t[1]=(...s)=>n.onMouseMove&&n.onMouseMove(...s)),onMouseup:t[2]||(t[2]=(...s)=>n.onMouseUp&&n.onMouseUp(...s)),onMouseleave:t[3]||(t[3]=(...s)=>n.onMouseLeave&&n.onMouseLeave(...s)),onWheel:t[4]||(t[4]=T((...s)=>n.onWheel&&n.onWheel(...s),["prevent"])),onTouchstart:t[5]||(t[5]=T((...s)=>n.onTouchStart&&n.onTouchStart(...s),["prevent"])),onTouchmove:t[6]||(t[6]=T((...s)=>n.onTouchMove&&n.onTouchMove(...s),["prevent"])),onTouchend:t[7]||(t[7]=(...s)=>n.onTouchEnd&&n.onTouchEnd(...s))},null,40,We),(v(),m("svg",{class:"labels",viewBox:`0 0 ${i.size.width} ${i.size.height}`,width:i.size.width,height:i.size.height},[a("g",Oe,[(v(!0),m(R,null,F(n.realTicks,s=>(v(),m("text",{key:`r${s.value}`,x:s.x,y:s.y},p(s.label),9,Ue))),128))]),a("g",He,[(v(!0),m(R,null,F(n.imaginaryTicks,s=>(v(),m("text",{key:`i${s.value}`,x:s.x,y:s.y},p(s.label),9,Be))),128))])],8,Ge)),a("header",null,[a("div",Xe,[t[17]||(t[17]=a("label",null,"f(z) =",-1)),C(a("input",{type:"text",spellcheck:!1,autocomplete:"off",autocapitalize:"off",placeholder:"(1+z^2)^-1","onUpdate:modelValue":t[8]||(t[8]=s=>i.expressionInput=s),onKeydown:t[9]||(t[9]=fe((...s)=>n.commitExpression&&n.commitExpression(...s),["enter"])),onBlur:t[10]||(t[10]=(...s)=>n.commitExpression&&n.commitExpression(...s))},null,544),[[Y,i.expressionInput]]),a("button",{class:L(["favorite",{on:n.isFavorite}]),title:n.isFavorite?"Remove from favorites":"Add to favorites",onClick:t[11]||(t[11]=(...s)=>n.toggleFavorite&&n.toggleFavorite(...s))},p(n.isFavorite?"★":"☆"),11,je),a("button",{class:L(["settings",{on:i.panelIsOn}]),title:"Settings",onClick:t[12]||(t[12]=s=>i.panelIsOn=!i.panelIsOn)},"⚙",2)]),i.error?(v(),m("div",Ye,p(i.error),1)):z("",!0),i.panelIsOn?(v(),m("div",Je,[a("div",Ke,[t[18]||(t[18]=a("label",null,"examples",-1)),a("div",Qe,[(v(!0),m(R,null,F(i.PRESETS,s=>(v(),m("button",{key:s.expression,class:L({on:s.expression===i.expression}),title:s.hint,onClick:u=>n.applyExpression(s.expression)},p(s.label),11,Ze))),128))])]),i.favorites.length?(v(),m("div",$e,[t[19]||(t[19]=a("label",null,"favorites",-1)),a("div",et,[(v(!0),m(R,null,F(i.favorites,s=>(v(),m("button",{key:s,class:L({on:s===i.expression}),onClick:u=>n.applyExpression(s)},[q(p(s),1),a("i",{class:"drop",title:"Remove",onClick:T(u=>n.removeFavorite(s),["stop"])},"×",8,rt)],10,tt))),128))])])):z("",!0),a("div",st,[t[22]||(t[22]=a("label",null,"brightness",-1)),C(a("input",{type:"range",min:"0.2",max:"3",step:"0.05","onUpdate:modelValue":t[13]||(t[13]=s=>i.brightness=s)},null,512),[[Y,i.brightness,void 0,{number:!0}]]),a("span",it,p(i.brightness.toFixed(2)),1),a("label",nt,[C(a("input",{type:"checkbox","onUpdate:modelValue":t[14]||(t[14]=s=>i.contours=s)},null,512),[[J,i.contours]]),t[20]||(t[20]=q(" contours",-1))]),a("label",ot,[C(a("input",{type:"checkbox","onUpdate:modelValue":t[15]||(t[15]=s=>i.grid=s)},null,512),[[J,i.grid]]),t[21]||(t[21]=q(" grid",-1))]),a("button",{class:"reset",onClick:t[16]||(t[16]=(...s)=>n.resetView&&n.resetView(...s))},"reset view")])])):z("",!0)]),i.cursor?(v(),m("footer",at,[a("span",ct,[t[23]||(t[23]=a("label",null,"z",-1)),a("em",null,p(n.formatComplex(i.cursor.z)),1)]),a("span",ht,[t[24]||(t[24]=a("label",null,"f(z)",-1)),a("em",null,p(i.cursorValue?n.formatComplex(i.cursorValue):"—"),1)]),i.cursorValue?(v(),m("span",lt,[t[25]||(t[25]=a("label",null,"|f|",-1)),a("em",null,p(n.formatNumber(n.cursorAbs)),1)])):z("",!0),i.cursorValue?(v(),m("span",ut,[t[26]||(t[26]=a("label",null,"arg f",-1)),a("em",null,p(n.formatNumber(n.cursorArg))+"π",1)])):z("",!0),a("span",mt,[t[27]||(t[27]=a("label",null,"view",-1)),a("em",null,p(n.formatNumber(i.viewWidth))+" wide",1)])])):z("",!0)])),[[l,n.onResize]])}const gt=pe(De,[["render",vt],["__scopeId","data-v-e9e91e83"]]);export{gt as default};
