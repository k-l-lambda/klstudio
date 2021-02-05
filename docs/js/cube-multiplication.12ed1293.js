(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["cube-multiplication","flipping-cube"],{"12a8":function(e,t,n){"use strict";n.d(t,"a",(function(){return s})),n.d(t,"b",(function(){return r}));const i=["&alpha;","&beta;","&gamma;","&delta;","&epsilon;","&zeta;","&eta;","&theta;","&iota;","&kappa;","&lambda;","&mu;","&nu;","&xi;","&omicron;","&pi;","&rho;","&sigma;","&tau;","&upsilon;","&phi;","&chi;","&psi;","&omega;"],s=i,r=[0,4,5,6,7,8,9,1,2,3,10,14,20,11,15,21,12,16,22,13,17,23,18,19]},"2bbb":function(e,t,n){"use strict";var i=n("6e95"),s=n.n(i);s.a},3017:function(e,t,n){"use strict";n.r(t);var i=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("MeshViewer",e._b({ref:"viewer",staticClass:"flipping-cube",on:{sceneReady:e.onSceneReady}},"MeshViewer",e.param,!1))},s=[],r=n("5a89"),o=n("12a8"),u=n("819c"),a=n("5027"),c=n("dc0d");const h=u["l"].map(e=>e.toQuaternion());var l={name:"flipping-cube",components:{MeshViewer:c["default"]},props:{demo:Boolean},data(){return{orientation:0,target:0,randomFlipping:!1}},computed:{param(){return{entities:[{name:"cube",label:o["a"][o["b"][this.orientation]],labelOffset:[0,0,0],euler:[0,-Math.PI/2,0],prototype:"cube.gltf"},{prototype:"coordinate-frame.gltf",position:[-3.6,-2,-1],scale:[.4,.4,.4]}],cameraInit:{radius:6,theta:-.12*Math.PI,phi:-.08*Math.PI}}}},methods:{flip(e){return this.flipTo(u["k"][e][this.orientation])},async flipTo(e){const t=30,n=new r["sb"](...h[e]),i=new r["sb"](...h[this.orientation]);this.target=e;for(let s=0;s<t;++s){const e=s/t,o=3*e**2-2*e**3;r["sb"].slerp(i,n,this.cube.quaternion,o),await Object(a["a"])()}this.orientation=e},async randomFlip(){this.randomFlipping=!0;while(this.randomFlipping)await this.flip(Math.floor(6*Math.random())+1),await Object(a["b"])(800)},onSceneReady(){this.cube=this.$refs.viewer.scene.children.find(e=>"cube"===e.name),console.assert(this.cube,"cube not found"),this.demo&&this.randomFlip()}},watch:{orientation(){this.$refs.viewer.labels[0].content=o["a"][o["b"][this.orientation]]}}},p=l,f=(n("2bbb"),n("0c7c")),m=Object(f["a"])(p,i,s,!1,null,null,null);t["default"]=m.exports},6962:function(e,t,n){"use strict";var i=n("f908"),s=n.n(i);s.a},"6e95":function(e,t,n){},"776a":function(e,t,n){"use strict";var i=n("e9bc"),s=n.n(i);s.a},"819c":function(e,t,n){"use strict";n.d(t,"b",(function(){return c})),n.d(t,"d",(function(){return h})),n.d(t,"c",(function(){return l})),n.d(t,"e",(function(){return p})),n.d(t,"g",(function(){return f})),n.d(t,"f",(function(){return m})),n.d(t,"h",(function(){return b})),n.d(t,"j",(function(){return d})),n.d(t,"i",(function(){return w})),n.d(t,"l",(function(){return g})),n.d(t,"k",(function(){return M})),n.d(t,"a",(function(){return x}));const i=0,s=1,r=2,o=([e,t,n,i],[s,r,o,u])=>[u*e+s*i+r*n-o*t,u*t-s*n+r*i+o*e,u*n+s*t-r*e+o*i,u*i-s*e-r*t-o*n];class u{constructor(e,t){this.unit=e,this.exponent=t}toString(){let e;switch(this.exponent){case 0:return"";case-1:e="'";break;case 1:e="";break;default:e=this.exponent.toString();break}return"ijk"[this.unit]+e}toQuaternion(){const e=[0,0,0];e[this.unit]=1;const t=.5*-Math.PI*this.exponent,n=Math.sin(t/2),i=Math.cos(t/2);return[e[0]*n,e[1]*n,e[2]*n,i]}normalized(){let e=this.exponent%4;switch(e){case 3:e=-1;break;case-3:e=1;break;case-2:e=2;break}return e===this.exponent?this:new u(this.unit,e)}inverted(){return new u(this.unit,-this.exponent)}mul(e){return console.assert(this.unit===e.unit),new u(this.unit,this.exponent+e.exponent)}static supplementaryUnit(e,t){return 3-e.unit-t.unit}static sqauredReduce(e,t){return 2===e.exponent&&2===t.exponent?[new u(this.supplementaryUnit(e,t),2)]:2===t.exponent&&t.unit===r&&e.unit===i?[e.inverted(),m]:null}static exchangeReduce(e,t){if(e.unit===i)return null;if(e.unit===t.unit)return null;const n=(t.unit-e.unit+3)%3===1,o=n?s:r,a=e.exponent*t.exponent*(n?1:-1),c=u.supplementaryUnit(e,t),h=new u(c,a),l=[e,t,h].reduce((e,t)=>(e[t.unit]=t.exponent,e),[]);return[new u(i,l[i]),new u(o,l[o])]}}class a{constructor(e=[]){this.items=e}toString(){return this.items.length?this.items.map(e=>e.toString()).join(""):"1"}toQuaternion(){return this.items.reduce((e,t)=>o(e,t.toQuaternion()),[0,0,0,1])}normalize(){this.items=this.items.map(e=>e.normalized());for(let e=0;e<this.items.length;++e)if(2===this.items[e].exponent){const t=new u(this.items[e].unit,1);this.items.splice(e,1,t,t),++e}while(1){let e=null;for(let t=1;t<this.items.length;++t)if(e=u.exchangeReduce(this.items[t-1],this.items[t]),e){this.items.splice(t-1,2,...e);break}if(!e)break}for(let e=1;e<this.items.length;++e)this.items[e].unit===this.items[e-1].unit&&(this.items.splice(e-1,2,this.items[e-1].mul(this.items[e])),--e);if(this.items=this.items.map(e=>e.normalized()).filter(e=>0!==e.exponent),this.items.length>=2){const e=u.sqauredReduce(...this.items);e&&this.items.splice(0,2,...e)}return this}mul(e){return new a(this.items.concat(e.items))}}const c=new u(i,1),h=new u(i,-1),l=new u(i,2),p=new u(s,1),f=new u(s,-1),m=new u(s,2),b=new u(r,1),d=new u(r,-1),w=new u(r,2),g=[[],[c],[p],[b],[h],[f],[d],[l],[m],[w],[c,p],[h,p],[l,p],[c,f],[h,f],[l,f],[c,b],[h,b],[l,b],[c,d],[h,d],[l,d],[c,m],[h,m]].map(e=>new a(e)),v=g.map(e=>e.toString()),M=g.map(e=>g.map(t=>v.indexOf(e.mul(t).normalize().toString()))),x=M.map(e=>Array(e.length).fill(null).map((t,n)=>e.indexOf(n)))},e9bc:function(e,t,n){},f20b:function(e,t,n){"use strict";n.r(t);var i=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{staticClass:"cube-multiplication",on:{mousemove:e.onMouseMove,mousewheel:function(t){return t.preventDefault(),e.onMouseWheel(t)},touchmove:function(t){return t.preventDefault(),e.onTouchMove(t)},touchend:e.onTouchEnd}},[n("FlippingCube",{ref:"cube1"}),n("span",{staticClass:"symbol"},[e._v("×")]),n("FlippingCube",{ref:"cube2"}),n("span",{staticClass:"symbol"},[e._v("=")]),n("FlippingCube",{ref:"cube3"})],1)},s=[],r=n("5027"),o=n("819c"),u=n("3017");const a=()=>Math.floor(6*Math.random())+1;var c={name:"cube-multiplication",components:{FlippingCube:u["default"]},props:{demo:Boolean},computed:{$cubes(){return[this.$refs.cube1,this.$refs.cube2,this.$refs.cube3]}},async mounted(){if(this.demo){while(!this.$refs.cube1||!this.$refs.cube1.cube||!this.$refs.cube2||!this.$refs.cube2.cube||!this.$refs.cube3||!this.$refs.cube3.cube)await Object(r["b"])(50);await Object(r["b"])(1e3),this.randomFlip()}},methods:{forEachViewer(e){this.$cubes.forEach(t=>t&&e(t.$refs.viewer))},onMouseMove(e){this.forEachViewer(t=>t.onMouseMove(e))},onMouseWheel(e){this.forEachViewer(t=>t.onMouseWheel(e))},onTouchMove(e){this.forEachViewer(t=>t.onTouchMove(e))},onTouchEnd(e){this.forEachViewer(t=>t.onTouchEnd(e))},async randomFlip(){this.randomFlipping=!0;while(this.randomFlipping){for(let e=0;e<3;++e)this.$refs.cube2.flip(a()),await this.updateResultCube(),await Object(r["b"])(1e3);this.$refs.cube1.flip(a()),await this.updateResultCube(),await Object(r["b"])(1e3)}},updateResultCube(){const e=o["k"][this.$refs.cube1.target][this.$refs.cube2.target];return this.$refs.cube3.flipTo(e)}}},h=c,l=(n("6962"),n("776a"),n("0c7c")),p=Object(l["a"])(h,i,s,!1,null,"55d78361",null);t["default"]=p.exports},f908:function(e,t,n){}}]);
//# sourceMappingURL=cube-multiplication.12ed1293.js.map