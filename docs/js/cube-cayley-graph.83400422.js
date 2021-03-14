(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["cube-cayley-graph"],{"0b62":function(e,t,n){"use strict";var i=n("aad3"),s=n.n(i);s.a},5027:function(e,t,n){"use strict";n.d(t,"b",(function(){return i})),n.d(t,"a",(function(){return s})),n.d(t,"c",(function(){return o}));const i=e=>new Promise(t=>setTimeout(t,e));function s(){return new Promise(e=>requestAnimationFrame(e))}const a={};function o(e,t){const n={};return a[e]=n,new Promise(i=>setTimeout(()=>i(a[e]===n),t))}},"604b":function(e,t,n){"use strict";n.r(t);var i=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{directives:[{name:"resize",rawName:"v-resize",value:e.onResize,expression:"onResize"}],staticClass:"cube-cayley-graph"},[n("article",{on:{mousemove:e.onMouseMove,mousewheel:function(t){return t.preventDefault(),e.onMouseWheel(t)},touchmove:function(t){return t.preventDefault(),e.onTouchMove(t)},touchend:e.onTouchEnd}},[n("canvas",{ref:"canvas",attrs:{width:e.size.width,height:e.size.height}}),n("span",{staticClass:"status"},[e.fps?n("span",{staticClass:"fps"},[e._v("fps "),n("em",[e._v(e._s(e.fps))])]):e._e()])]),n("header",[n("svg",{staticClass:"control",attrs:{width:"240",height:"240",viewBox:"-120 -120 240 240"}},[n("g",e._l(6,(function(t){return n("g",{key:t,class:"unit"+t},[n("line",{staticClass:"track",attrs:{x1:"0",y1:"0",x2:100*Math.cos((t+3.5)*Math.PI/3),y2:100*Math.sin((t+3.5)*Math.PI/3)}}),n("circle",{staticClass:"tip",attrs:{cx:100*Math.cos((t+3.5)*Math.PI/3),cy:100*Math.sin((t+3.5)*Math.PI/3)},on:{click:function(n){return e.rotate(t)},touchstart:function(n){return n.preventDefault(),e.rotate(t)}}})])})),0),n("g",{staticClass:"handle"},[n("circle",{attrs:{cx:e.handlePosition.x,cy:e.handlePosition.y}})])])])])},s=[],a=n("428d"),o=n.n(a),r=n("5a89"),h=n("5027"),c=n("819c"),u=n("6445"),l=n("c638");const d=Math.PI/6,p=Math.PI-Math.atan(2*Math.sqrt(2)),m=Math.sqrt(2+2*Math.sqrt(3)/9),f=2*Math.asin(m/2),w=2*Math.PI-p-f,g=(e,t,n)=>new r["ub"](e*Math.sin(t)*Math.cos(n),e*Math.cos(t),e*Math.sin(t)*Math.sin(n)),k=(e,t,n,i=1)=>({index:e,label:t,position:g(i,...n)}),v=[k(0,"1",[0,0]),k(7,"i2",[p,0]),k(8,"j2",[p,4*d]),k(9,"k2",[p,-4*d]),k(1,"i",[p/2,d]),k(2,"j",[p/2,5*d]),k(3,"k",[p/2,-3*d]),k(4,"i-",[p/2,-d]),k(5,"j-",[p/2,3*d]),k(6,"k-",[p/2,-5*d]),k(22,"2i",[w,6*d]),k(23,"2i-",[f,6*d]),k(12,"2j",[w,-2*d]),k(15,"2j-",[f,-2*d]),k(21,"2k",[w,2*d]),k(18,"2k-",[f,2*d])],x=e=>e.reduce((e,t)=>e.add(t),new r["ub"]).multiplyScalar(1/e.length),M=(e,t,n,i=1)=>({index:e,label:t,position:x(n.map(e=>v[e].position)).multiplyScalar(i)});[[10,"ijk",[4,5,6,10,12,14]],[19,"k-ji",[4,5,9,11,13,14],3],[16,"kj-i",[4,8,6,11,12,15],3],[13,"ij-k-",[4,8,9,10,13,15]],[17,"kji-",[7,5,6,10,13,15],3],[11,"i-jk-",[7,5,9,11,12,15]],[14,"i-j-k",[7,8,6,11,13,14]],[20,"k-j-i-",[7,8,9,10,12,14],3]].forEach(e=>v.push(M(...e)));const b=4e-4;var y={name:"cube-cayley-graph",directives:{resize:o.a},mixins:[u["a"],l["a"]],data(){return{size:{width:800,height:800},fps:0,rotationIndex:0,rotationT:0}},computed:{handlePosition(){if(0===this.rotationIndex)return{x:0,y:0};const e=Math.PI*(this.rotationIndex+3.5)/3,t=100,n=3*this.rotationT**2-2*this.rotationT**3;return{x:Math.cos(e)*t*n,y:Math.sin(e)*t*n}}},mounted(){this.initializeRenderer(),this.createElements(),this.createEdges(),this.render()},beforeDestroy(){this.rendererActive=!1},methods:{onResize(){this.size={width:this.$el.clientWidth,height:this.$el.clientHeight}},initializeRenderer(){this.renderer=new r["wb"]({antialias:!0,canvas:this.$refs.canvas,alpha:!0}),this.renderer.setClearColor(new r["i"]("lightblue"),1),this.renderer.setSize(this.size.width,this.size.height,!1),this.camera=new r["X"](60,this.size.width/this.size.height,10,1e3),this.viewTheta=.3*Math.PI,this.viewPhi=.6*Math.PI,this.viewRadius=300,this.scene=new r["hb"],this.rendererActive=!0,this.sphere=new r["mb"](8,32,16),this.cone=new r["j"](1,1,16)},async render(){let e=performance.now(),t=Math.floor(e/1e3),n=0,i=0;while(this.rendererActive){this.sensorVelocity&&(this.viewTheta+=this.sensorVelocity[1]*b,this.viewPhi+=this.sensorVelocity[0]*b*.1,this.viewTheta=Math.max(Math.min(this.viewTheta,Math.PI-.01),.01)),this.camera.position.copy(g(this.viewRadius,this.viewTheta,this.viewPhi)),this.camera.lookAt(0,0,0),this.renderer.render(this.scene,this.camera),++n;const s=performance.now();i=Math.max(i,s-e);const a=Math.floor(s/1e3);a>t&&(this.fps=n/(a-t),n=0,i=0,t=a),this.rotationIndex>0&&(this.rotationT+=.002*(s-e),this.rotationT>=1?this.permute(this.rotationIndex):this.elements.forEach((e,t)=>{const n=c["k"][v[t].index][this.rotationIndex],i=this.elementPositions[v[t].index],s=this.elementPositions[n],a=3*this.rotationT**2-2*this.rotationT**3;e.position.copy(i.clone().lerp(s,a))})),e=s,await Object(h["a"])()}},async createElements(){this.elements=[],await Promise.all(v.map(async e=>{const{default:t}=await n("628f")(`./${e.label}.png`),i=new r["K"](this.sphere,new r["L"]({map:(new r["qb"]).load(t)}));this.elements.push(i),i.position.copy(e.position.clone().multiplyScalar(100)),this.scene.add(i)})),this.elementPositions=this.elements.reduce((e,t,n)=>(e[v[n].index]=t.position.clone(),e),[])},createEdges(){const e=["red","green","blue"],t=new r["ub"](0,1,0);v.forEach(n=>{for(let i=1;i<=3;++i){const s=c["k"][n.index][i],a=n.position,o=v.find(e=>e.index===s).position,h=o.clone().sub(a),u=t.clone().cross(h).normalize(),l=Math.acos(h.clone().normalize().dot(t)),d=new r["U"];d.position.copy(a.clone().multiplyScalar(100)),d.quaternion.setFromAxisAngle(u,l),d.scale.x=d.scale.z=1,d.scale.y=100*h.length();const p=new r["K"](this.cone,new r["L"]({color:new r["i"](e[i-1])}));p.position.y=.5,d.add(p),this.scene.add(d)}})},onMouseMove(e){1===e.buttons&&(this.viewPhi+=.01*e.movementX,this.viewTheta-=.01*e.movementY,this.viewTheta=Math.max(Math.min(this.viewTheta,Math.PI-.01),.01))},onMouseWheel(e){this.viewRadius*=Math.exp(.001*e.deltaY)},onTouchMove(e){const t=e.touches[0];if(this.lastTouchPoint){const e=t.pageX-this.lastTouchPoint.pageX,n=t.pageY-this.lastTouchPoint.pageY;this.viewPhi+=.01*e,this.viewTheta-=.01*n,this.viewTheta=Math.max(Math.min(this.viewTheta,Math.PI-.01),.01)}this.lastTouchPoint={pageX:t.pageX,pageY:t.pageY}},onTouchEnd(){this.lastTouchPoint=null},rotate(e){this.rotationIndex=e},permute(e){this.elements.forEach((t,n)=>{const i=c["k"][v[n].index][e];t.position.copy(this.elementPositions[i])}),this.elementPositions=this.elements.reduce((e,t,n)=>(e[v[n].index]=t.position.clone(),e),[]),this.rotationIndex=0,this.rotationT=0}},watch:{size(e){this.camera.aspect=e.width/e.height,this.camera.updateProjectionMatrix(),this.renderer.setSize(e.width,e.height,!1)}}},P=y,j=(n("0b62"),n("0c7c")),T=Object(j["a"])(P,i,s,!1,null,"6610e4e4",null);t["default"]=T.exports},"628f":function(e,t,n){var i={"./1.png":["583d","chunk-2d0c916a"],"./2i-.png":["db40","chunk-2d228c70"],"./2i.png":["c577","chunk-2d216f88"],"./2j-.png":["fabc","chunk-2d237732"],"./2j.png":["9cc1","chunk-2d0f09ee"],"./2k-.png":["5bb6","chunk-2d0d3497"],"./2k.png":["b4d8","chunk-2d20fcdc"],"./i-.png":["83fc","chunk-2d0de1ee"],"./i-j-k.png":["ccc5","chunk-2d222188"],"./i-jk-.png":["8942","chunk-2d0df235"],"./i.png":["8f30","chunk-2d0e9b01"],"./i2.png":["68a7","chunk-2d0d0b2e"],"./ij-k-.png":["a9d3","chunk-2d209b3d"],"./ijk.png":["8f69","chunk-2d0e9b67"],"./j-.png":["cda7","chunk-2d22250d"],"./j.png":["ca3b","chunk-2d221463"],"./j2.png":["e955","chunk-2d22670a"],"./k-.png":["8e60","chunk-2d0e979d"],"./k-j-i-.png":["30b3","chunk-2d0b9024"],"./k-ji.png":["9034","chunk-2d0e44ae"],"./k.png":["e713","chunk-2d225f0a"],"./k2.png":["4143","chunk-2d0c02b2"],"./kj-i.png":["8293","chunk-2d0dd88a"],"./kji-.png":["ca5c","chunk-2d2214a2"]};function s(e){if(!n.o(i,e))return Promise.resolve().then((function(){var t=new Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}));var t=i[e],s=t[0];return n.e(t[1]).then((function(){return n.t(s,7)}))}s.keys=function(){return Object.keys(i)},s.id="628f",e.exports=s},6445:function(e,t,n){"use strict";t["a"]={created(){this.quitCleaner=new Promise(e=>this.quitClear=e)},methods:{async appendCleaner(e){"pending"!==await Promise.race([this.quitCleaner,"pending"])?e():this.quitCleaner=this.quitCleaner.then(e)}},beforeDestroy(){this.quitClear()}}},"819c":function(e,t,n){"use strict";n.d(t,"b",(function(){return c})),n.d(t,"d",(function(){return u})),n.d(t,"c",(function(){return l})),n.d(t,"e",(function(){return d})),n.d(t,"g",(function(){return p})),n.d(t,"f",(function(){return m})),n.d(t,"h",(function(){return f})),n.d(t,"j",(function(){return w})),n.d(t,"i",(function(){return g})),n.d(t,"l",(function(){return k})),n.d(t,"k",(function(){return x})),n.d(t,"a",(function(){return M}));const i=0,s=1,a=2,o=([e,t,n,i],[s,a,o,r])=>[r*e+s*i+a*n-o*t,r*t-s*n+a*i+o*e,r*n+s*t-a*e+o*i,r*i-s*e-a*t-o*n];class r{constructor(e,t){this.unit=e,this.exponent=t}toString(){let e;switch(this.exponent){case 0:return"";case-1:e="'";break;case 1:e="";break;default:e=this.exponent.toString();break}return"ijk"[this.unit]+e}toQuaternion(){const e=[0,0,0];e[this.unit]=1;const t=.5*-Math.PI*this.exponent,n=Math.sin(t/2),i=Math.cos(t/2);return[e[0]*n,e[1]*n,e[2]*n,i]}normalized(){let e=this.exponent%4;switch(e){case 3:e=-1;break;case-3:e=1;break;case-2:e=2;break}return e===this.exponent?this:new r(this.unit,e)}inverted(){return new r(this.unit,-this.exponent)}mul(e){return console.assert(this.unit===e.unit),new r(this.unit,this.exponent+e.exponent)}static supplementaryUnit(e,t){return 3-e.unit-t.unit}static sqauredReduce(e,t){return 2===e.exponent&&2===t.exponent?[new r(this.supplementaryUnit(e,t),2)]:2===t.exponent&&t.unit===a&&e.unit===i?[e.inverted(),m]:null}static exchangeReduce(e,t){if(e.unit===i)return null;if(e.unit===t.unit)return null;const n=(t.unit-e.unit+3)%3===1,o=n?s:a,h=e.exponent*t.exponent*(n?1:-1),c=r.supplementaryUnit(e,t),u=new r(c,h),l=[e,t,u].reduce((e,t)=>(e[t.unit]=t.exponent,e),[]);return[new r(i,l[i]),new r(o,l[o])]}}class h{constructor(e=[]){this.items=e}toString(){return this.items.length?this.items.map(e=>e.toString()).join(""):"1"}toQuaternion(){return this.items.reduce((e,t)=>o(e,t.toQuaternion()),[0,0,0,1])}normalize(){this.items=this.items.map(e=>e.normalized());for(let e=0;e<this.items.length;++e)if(2===this.items[e].exponent){const t=new r(this.items[e].unit,1);this.items.splice(e,1,t,t),++e}while(1){let e=null;for(let t=1;t<this.items.length;++t)if(e=r.exchangeReduce(this.items[t-1],this.items[t]),e){this.items.splice(t-1,2,...e);break}if(!e)break}for(let e=1;e<this.items.length;++e)this.items[e].unit===this.items[e-1].unit&&(this.items.splice(e-1,2,this.items[e-1].mul(this.items[e])),--e);if(this.items=this.items.map(e=>e.normalized()).filter(e=>0!==e.exponent),this.items.length>=2){const e=r.sqauredReduce(...this.items);e&&this.items.splice(0,2,...e)}return this}mul(e){return new h(this.items.concat(e.items))}}const c=new r(i,1),u=new r(i,-1),l=new r(i,2),d=new r(s,1),p=new r(s,-1),m=new r(s,2),f=new r(a,1),w=new r(a,-1),g=new r(a,2),k=[[],[c],[d],[f],[u],[p],[w],[l],[m],[g],[c,d],[u,d],[l,d],[c,p],[u,p],[l,p],[c,f],[u,f],[l,f],[c,w],[u,w],[l,w],[c,m],[u,m]].map(e=>new h(e)),v=k.map(e=>e.toString()),x=k.map(e=>k.map(t=>v.indexOf(e.mul(t).normalize().toString()))),M=x.map(e=>Array(e.length).fill(null).map((t,n)=>e.indexOf(n)))},aad3:function(e,t,n){},c638:function(e,t,n){"use strict";const i=.01;t["a"]={created(){this.sensorAcceleration=[0,0,0],this.sensorVelocity=[0,0,0],this.sensorDamping=i,"undefined"!==typeof LinearAccelerationSensor&&navigator.permissions.query({name:"accelerometer"}).then(e=>{if("granted"===e.state){const e=new LinearAccelerationSensor({frequency:60}),t=()=>{this.sensorAcceleration=[e.x,e.y,e.z],this.sensorVelocity.forEach((e,t)=>{this.sensorVelocity[t]+=this.sensorAcceleration[t],this.sensorVelocity[t]*=1-this.sensorDamping})};e.addEventListener("reading",t),this.appendCleaner(()=>e.removeEventListener("reading",t)),e.start()}})}}}}]);
//# sourceMappingURL=cube-cayley-graph.83400422.js.map