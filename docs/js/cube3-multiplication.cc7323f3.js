(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["cube3-multiplication"],{"12a8":function(e,t,s){"use strict";s.d(t,"a",(function(){return o})),s.d(t,"b",(function(){return a}));const i=["&alpha;","&beta;","&gamma;","&delta;","&epsilon;","&zeta;","&eta;","&theta;","&iota;","&kappa;","&lambda;","&mu;","&nu;","&xi;","&omicron;","&pi;","&rho;","&sigma;","&tau;","&upsilon;","&phi;","&chi;","&psi;","&omega;"],o=i,a=[0,4,5,6,7,8,9,1,2,3,10,14,20,11,15,21,12,16,22,13,17,23,18,19]},"3e6b":function(e,t,s){"use strict";var i=function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("canvas",{ref:"canvas",attrs:{width:e.size.width,height:e.size.height},on:{mousemove:e.onMouseMove,mousedown:function(t){return t.preventDefault(),e.onMouseDown(t)},mouseup:e.onMouseUp,touchstart:e.onTouchStart,touchmove:e.onTouchMove,touchend:e.onTouchEnd}})},o=[],a=s("5a89"),n=s("5027"),r=s("1761");const c=["#f90","#d00","#ff2","white","blue","#0e0","black"].map(e=>new a["V"]({color:new a["j"](e)})),u=["#fc6","#d66","#ff8","#ccc","#44f","#6e6","#222"].map(e=>new a["V"]({color:new a["j"](e)})),h=e=>{const t=[Math.abs(e.x),Math.abs(e.y),Math.abs(e.z)],s=Math.max(...t);return t[0]===s?e.x>0?1:0:t[1]===s?e.y>0?3:2:e.z>0?5:4},l=1.5,b=[new a["Rb"](-l,0,0),new a["Rb"](+l,0,0),new a["Rb"](0,-l,0),new a["Rb"](0,+l,0),new a["Rb"](0,0,-l),new a["Rb"](0,0,+l)];var f={name:"cube3",props:{size:{type:Object,default:()=>({width:800,height:800})},code:String,meshSchema:{type:String,default:"cube"},material:{type:[Object,Array],default:()=>c},highlightMaterial:{type:[Object,Array],default:()=>u}},mounted(){this.rendererActive=!0,this.initializeRenderer(),this.cube=new r["a"]({materials:this.material,onChange:e=>this.onChange(e),meshSchema:this.meshSchema}),this.scene.add(this.cube.graph),this.$emit("cubeCreated",this.cube),this.raycaster=new a["wb"],this.holdingAxis=null,this.$emit("sceneInitialized",this),this.render()},beforeDestroy(){this.rendererActive=!1},methods:{initializeRenderer(){this.renderer=new a["Vb"]({antialias:!0,canvas:this.$refs.canvas,alpha:!0}),this.renderer.setClearColor(new a["j"]("black"),0),this.renderer.setSize(this.size.width,this.size.height,!1),this.camera=new a["nb"](60,this.size.width/this.size.height,3,12),this.camera.position.set(0,0,6.4),this.camera.lookAt(0,0,0),this.scene=new a["zb"]},async render(){let e=performance.now(),t=Math.floor(e/1e3),s=0,i=0;while(this.rendererActive){this.$emit("beforeRender",this),this.renderer.render(this.scene,this.camera),this.$emit("afterRender",this),++s;const o=performance.now();i=Math.max(i,o-e);const a=Math.floor(o/1e3);if(a>t){const e=s/(a-t);this.$emit("fps",{fps:e,stuck:i}),s=0,i=0,t=a}e=o,await Object(n["a"])()}},normalizeScreenPoint(e){return new a["Rb"](e.offsetX/this.$refs.canvas.clientWidth*2-1,1-e.offsetY/this.$refs.canvas.clientHeight*2,0)},raycastAxis(e){if(this.raycaster){const t=this.normalizeScreenPoint(e);this.raycaster.setFromCamera(t,this.camera);const s=this.raycaster.intersectObject(this.cube.graph,!0);if(s[0]){const e=this.cube.graph.worldToLocal(s[0].point);return h(e)}}return null},onMouseMove(e){if(this.cube)if(Number.isInteger(this.holdingAxis)&&4!==e.buttons){const t=this.normalizeScreenPoint(e),s=t.clone().sub(this.holdPosition.start),i=this.holdPosition.start.clone().sub(this.holdPosition.pivot).normalize(),o=3*-i.clone().cross(s).z;this.cube.twistGraph(this.holdingAxis,o)}else switch(e.buttons){case 1:case 4:this.cube.graph.rotateOnWorldAxis(new a["Rb"](0,1,0),.01*e.movementX),this.cube.graph.rotateOnWorldAxis(new a["Rb"](1,0,0),.01*e.movementY);break;case 0:this.cube.cubeMeshes.forEach(e=>e.material=this.material);const t=this.raycastAxis(e);if(Number.isInteger(t)){const e=this.cube.algebra.faceIndicesFromAxis(t);e.forEach(e=>this.cube.cubeMeshes[e].material=this.highlightMaterial)}break}},onMouseDown(e){switch(e.buttons){case 1:const t=this.raycastAxis(e);if(Number.isInteger(t)){const s=this.cube.graph.localToWorld(b[t].clone());s.project(this.camera),s.z=0,this.holdingAxis=t,this.holdPosition={pivot:s,start:this.normalizeScreenPoint(e)}}break}},onMouseUp(){Number.isInteger(this.holdingAxis)&&(this.cube.releaseGraph(),this.holdingAxis=null)},touchToOffsetPoint(e,t={buttons:0}){const s=this.$el.getBoundingClientRect();return{offsetX:e.pageX-s.x,offsetY:e.pageY-s.y,...t}},onTouchStart(e){this.rendererActive&&1===e.touches.length&&(this.onMouseDown(this.touchToOffsetPoint(e.touches[0],{buttons:1})),e.preventDefault())},onTouchMove(e){switch(e.touches.length){case 1:const t=this.touchToOffsetPoint(e.touches[0]);this.onMouseMove(t),this.lastTouchPoint={offsetX:t.offsetX,offsetY:t.offsetY},e.preventDefault();break;case 2:{const t=this.touchToOffsetPoint(e.touches[0],{buttons:1});this.lastTouchPoint&&(t.movementX=t.offsetX-this.lastTouchPoint.offsetX,t.movementY=t.offsetY-this.lastTouchPoint.offsetY,this.holdingAxis=null,this.onMouseMove(t)),this.lastTouchPoint={offsetX:t.offsetX,offsetY:t.offsetY}}e.preventDefault();break}},onTouchEnd(){this.onMouseUp(),this.lastTouchPoint=null},onChange(e){this.innerCode=e.encode(),this.$emit("update:code",this.innerCode)}},watch:{size(e){this.camera.aspect=e.width/e.height,this.camera.updateProjectionMatrix(),this.renderer.setSize(e.width,e.height,!1)},code(e){this.innerCode!==e&&this.cube.setState(e)}}},d=f,m=s("0c7c"),w=Object(m["a"])(d,i,o,!1,null,"03c4666e",null);t["a"]=w.exports},"4d8b":function(e,t,s){"use strict";var i=s("75ee"),o=s.n(i);o.a},5027:function(e,t,s){"use strict";s.d(t,"b",(function(){return i})),s.d(t,"a",(function(){return o}));const i=e=>new Promise(t=>setTimeout(t,e));function o(){return new Promise(e=>requestAnimationFrame(e))}},54284:function(e,t,s){"use strict";var i=function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("table",{staticClass:"cube3-matrix",class:{"hide-corners":!e.showCorners,"hide-edges":!e.showEdges,"hide-axes":!e.showAxes},on:{mouseleave:function(t){e.focusColumn=e.focusRow=null}}},[s("thead",[s("tr",[s("th",{staticClass:"corner-cell"}),e._l(26,(function(t){return s("th",{key:t,class:{corner:t<=8,edge:t>8&&t<=20,axis:t>20,focus:t===e.focusColumn}},[e._v(e._s(e.labels[t-1]))])}))],2)]),e.matrix?s("tbody",e._l(26,(function(t){return s("tr",{key:t,class:{corner:t<=8,edge:t>8&&t<=20,axis:t>20,focus:t===e.focusRow,activated:e.activatedRows[t-1]}},[s("th",{staticClass:"column"},[e._v(e._s(e.labels[t-1]))]),e._l(26,(function(i){return s("td",{key:i,class:{corner:i<=8,edge:i>8&&i<=20,axis:i>20,focus:i===e.focusColumn},domProps:{innerHTML:e._s(e.matrix[t-1][i-1])},on:{mouseenter:function(s){e.focusColumn=i,e.focusRow=t}}})}))],2)})),0):e._e()])},o=[],a=s("e831"),n=s("12a8"),r=s("5027");const c="A".charCodeAt(0),u=a["a"].split("").map(e=>e.charCodeAt(0)-c),h=Array(26).fill().map((e,t)=>u.indexOf(t)).map(e=>e>12?e+1:e);var l={name:"cube3-matrix",props:{cube:Object,showCorners:{type:Boolean,default:!0},showEdges:{type:Boolean,default:!0},showAxes:{type:Boolean,default:!0}},data(){return{labels:"ABCDEFGHIJKLMNOPQRSTUVWXYZ",vector:null,matrix:null,focusColumn:null,focusRow:null,activatedRows:Array(26).fill(!1)}},created(){this.updateMatrix()},methods:{updateMatrix(){if(!this.cube)return null;const e=Array.from(this.cube.positions),t=h.map(t=>h.indexOf(e[t]));this.vector=t.map((e,t)=>this.cube.units[h[t]]),this.matrix=t.map((e,t)=>Array(26).fill().map((s,i)=>i===e?n["a"][n["b"][this.vector[t]]]:""))}},watch:{async vector(e,t){e&&t&&(this.activatedRows=e.map((e,s)=>e!==t[s])),await Object(r["b"])(100),this.activatedRows=Array(26).fill(!1)}}},b=l,f=(s("9346"),s("0c7c")),d=Object(f["a"])(b,i,o,!1,null,"2c7c9bb0",null);t["a"]=d.exports},"75ee":function(e,t,s){},9346:function(e,t,s){"use strict";var i=s("ec5d"),o=s.n(i);o.a},aaad:function(e,t,s){"use strict";s.r(t);var i=function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("div",{directives:[{name:"resize",rawName:"v-resize",value:e.onResize,expression:"onResize"}],staticClass:"cube3-multiplication",on:{mousemove:e.onMouseMove,mousedown:function(t){return t.preventDefault(),e.onMouseDown(t)},mouseup:e.onMouseUp,touchstart:e.onTouchStart,touchmove:e.onTouchMove,touchend:e.onTouchEnd}},[s("div",{staticClass:"cubes"},[s("Cube3",{ref:"cube1",attrs:{size:e.cubeCanvasSize},on:{cubeCreated:function(t){return e.onCubeCreated(0,t)},"update:code":function(t){return e.onCubeChanged(0)}}}),s("span",{staticClass:"symbol"},[e._v("×")]),s("Cube3",{ref:"cube2",attrs:{size:e.cubeCanvasSize},on:{cubeCreated:function(t){return e.onCubeCreated(1,t)},"update:code":function(t){return e.onCubeChanged(1)}}}),s("span",{staticClass:"symbol"},[e._v("=")]),s("Cube3",{ref:"cube3",attrs:{size:e.cubeCanvasSize},on:{cubeCreated:function(t){return e.onCubeCreated(2,t)},"update:code":function(t){return e.onCubeChanged(2)}}})],1),s("div",{staticClass:"formula"},[s("div",{staticClass:"matrix"},[e.cubes[0]?s("Cube3Matrix",{ref:"matrix1",attrs:{cube:e.cubes[0]}}):e._e()],1),s("span",{staticClass:"symbol"},[e._v("×")]),s("div",{staticClass:"matrix"},[e.cubes[1]?s("Cube3Matrix",{ref:"matrix2",attrs:{cube:e.cubes[1]}}):e._e()],1),s("span",{staticClass:"symbol"},[e._v("=")]),s("div",{staticClass:"matrix"},[e.cubes[2]?s("Cube3Matrix",{ref:"matrix3",attrs:{cube:e.cubes[2]}}):e._e()],1)])])},o=[],a=s("428d"),n=s.n(a),r=s("5a89"),c=s("5027"),u=s("cbb5"),h=s("3e6b"),l=s("54284"),b={name:"cube3-multiplication",directives:{resize:n.a},components:{Cube3:h["a"],Cube3Matrix:l["a"]},props:{demo:Boolean},data(){return{size:void 0,cubes:[]}},computed:{$cubes(){return[this.$refs.cube1,this.$refs.cube2,this.$refs.cube3]},cubeCanvasSize(){return this.size&&{width:.25*this.size.width,height:.4*this.size.height}}},async mounted(){if(this.demo){while(!this.$refs.cube1||!this.$refs.cube1.cube||!this.$refs.cube2||!this.$refs.cube2.cube||!this.$refs.cube3||!this.$refs.cube3.cube)await Object(c["b"])(50);this.$refs.cube1.cube.graph.quaternion.setFromEuler(new r["s"](.16*Math.PI,-.2*Math.PI,0)),this.$refs.cube2.cube.graph.quaternion.setFromEuler(new r["s"](.16*Math.PI,-.2*Math.PI,0)),this.$refs.cube3.cube.graph.quaternion.setFromEuler(new r["s"](.16*Math.PI,-.2*Math.PI,0)),await Object(c["b"])(1e3),this.animate()}},methods:{onResize(){this.size={width:this.$el.clientWidth,height:this.$el.clientHeight}},forEachViewer(e){this.$cubes.forEach(t=>t&&e(t))},onMouseMove(e){this.forEachViewer(t=>t.onMouseMove(e))},onMouseDown(e){this.forEachViewer(t=>t.onMouseDown(e))},onMouseUp(e){this.forEachViewer(t=>t.onMouseUp(e))},onTouchStart(e){this.forEachViewer(t=>t.onTouchStart(e))},onTouchMove(e){this.forEachViewer(t=>t.onTouchMove(e))},onTouchEnd(e){this.forEachViewer(t=>t.onTouchEnd(e))},onCubeCreated(e,t){console.log("onCubeCreated:",e,t),this.cubes[e]=t.algebra},matrices(e){return[this.$refs.matrix1,this.$refs.matrix2,this.$refs.matrix3][e]},onCubeChanged(e){this.matrices(e)&&this.matrices(e).updateMatrix()},async animate(){this.animating=!0;while(this.animating){const e=Math.floor(Math.random()*Math.random()*24+1),t=Array(e).fill().map(()=>Math.floor(12*Math.random())),s=Object(u["invertPath"])(t);for(const o of t)this.$refs.cube2.cube.twist(o),await this.$refs.cube3.cube.twist(o),await Object(c["b"])(600);await Object(c["b"])(1e3);for(const o of s)this.$refs.cube2.cube.twist(o),await this.$refs.cube3.cube.twist(o),await Object(c["b"])(600);await Object(c["b"])(1e3);const i=Math.floor(12*Math.random());this.$refs.cube1.cube.twist(i),await this.$refs.cube3.cube.twist(i),await Object(c["b"])(1200)}}}},f=b,d=(s("c755"),s("4d8b"),s("0c7c")),m=Object(d["a"])(f,i,o,!1,null,"0763d97f",null);t["default"]=m.exports},b237:function(e,t,s){},c755:function(e,t,s){"use strict";var i=s("b237"),o=s.n(i);o.a},e831:function(e,t,s){"use strict";s.d(t,"a",(function(){return i}));const i="EJFTVSGNHKXLYZOWPAIBQURCMD"},ec5d:function(e,t,s){}}]);
//# sourceMappingURL=cube3-multiplication.cc7323f3.js.map