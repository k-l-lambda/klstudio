(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["cube3-player"],{"08dc":function(e,t,s){"use strict";s.r(t);var i=function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("div",{directives:[{name:"resize",rawName:"v-resize",value:e.onResize,expression:"onResize"}],staticClass:"cube3-player"},[s("Cube3",{ref:"viewer",staticClass:"viewer",attrs:{size:e.size,code:e.code},on:{"update:code":function(t){e.code=t},fps:e.onFps}}),s("span",{staticClass:"status"},[e.fps?s("span",{staticClass:"fps"},[e._v("fps "),s("em",[e._v(e._s(e.fps))])]):e._e()])],1)},n=[],o=s("0b16"),a=s.n(o),h=s("428d"),r=s.n(h),c=s("3e6b"),u=s("cbb5");const l="LrDuBflRdUbF";var f={name:"cube3-player",directives:{resize:r.a},components:{Cube3:c["a"]},data(){return{size:void 0,fps:null,code:null}},mounted(){window.$cube=this.$refs.viewer.cube,document.addEventListener("keydown",e=>{switch(e.key){case"Home":this.$refs.viewer&&this.$refs.viewer.cube.reset();break;default:const t=l.indexOf(e.key);t>=0&&this.$refs.viewer&&this.$refs.viewer.cube.twist(t)}}),window.onhashchange=()=>this.onHashChange(),this.onHashChange()},methods:{onResize(){this.size={width:this.$el.clientWidth,height:this.$el.clientHeight}},onFps(e){this.fps=e.fps},onHashChange(){let e=location.hash.substr(1);"/"!==e[0]||/#/.test(e)||(e+="#"),e=e.replace(/.*#/,"");const t=a.a.parse(e,!0),s=t.pathname;if(s&&(this.code=s),t.query.path){const e=Object(u["parsePath"])(t.query.path);if(e.length){const t=e[0];t>=0&&this.$refs.viewer.cube.twist(t).then(()=>{const t=Object(u["stringifyPath"])(e.slice(1));location.hash=`${this.getRouterPath()}${this.code}?path=${t}`})}}},getRouterPath(){const[e]=location.hash.match(/^#\/[^#]*/)||[];return e?e+"#":""}},watch:{code(e){location.hash=this.getRouterPath()+e}}},d=f,b=(s("edbf"),s("0c7c")),m=Object(b["a"])(d,i,n,!1,null,"2c10a6cd",null);t["default"]=m.exports},"3e6b":function(e,t,s){"use strict";var i=function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("canvas",{ref:"canvas",attrs:{width:e.size.width,height:e.size.height},on:{mousemove:e.onMouseMove,mousedown:function(t){return t.preventDefault(),e.onMouseDown(t)},mouseup:e.onMouseUp,touchstart:e.onTouchStart,touchmove:e.onTouchMove,touchend:e.onTouchEnd}})},n=[],o=s("5a89"),a=s("5027"),h=s("1761");const r=["#f90","#d00","#ff2","white","blue","#0e0","black"].map(e=>new o["V"]({color:new o["j"](e)})),c=["#fc6","#d66","#ff8","#ccc","#44f","#6e6","#222"].map(e=>new o["V"]({color:new o["j"](e)})),u=e=>{const t=[Math.abs(e.x),Math.abs(e.y),Math.abs(e.z)],s=Math.max(...t);return t[0]===s?e.x>0?1:0:t[1]===s?e.y>0?3:2:e.z>0?5:4},l=1.5,f=[new o["Rb"](-l,0,0),new o["Rb"](+l,0,0),new o["Rb"](0,-l,0),new o["Rb"](0,+l,0),new o["Rb"](0,0,-l),new o["Rb"](0,0,+l)];var d={name:"cube3",props:{size:{type:Object,default:()=>({width:800,height:800})},code:String,meshSchema:{type:String,default:"cube"},material:{type:[Object,Array],default:()=>r},highlightMaterial:{type:[Object,Array],default:()=>c}},mounted(){this.rendererActive=!0,this.initializeRenderer(),this.cube=new h["a"]({materials:this.material,onChange:e=>this.onChange(e),meshSchema:this.meshSchema}),this.scene.add(this.cube.graph),this.raycaster=new o["wb"],this.holdingAxis=null,this.$emit("sceneInitialized",this),this.render()},beforeDestroy(){this.rendererActive=!1},methods:{initializeRenderer(){this.renderer=new o["Vb"]({antialias:!0,canvas:this.$refs.canvas,alpha:!0}),this.renderer.setClearColor(new o["j"]("black"),0),this.renderer.setSize(this.size.width,this.size.height,!1),this.camera=new o["nb"](60,this.size.width/this.size.height,3,12),this.camera.position.set(0,0,6.4),this.camera.lookAt(0,0,0),this.scene=new o["zb"]},async render(){let e=performance.now(),t=Math.floor(e/1e3),s=0,i=0;while(this.rendererActive){this.$emit("beforeRender",this),this.renderer.render(this.scene,this.camera),this.$emit("afterRender",this),++s;const n=performance.now();i=Math.max(i,n-e);const o=Math.floor(n/1e3);if(o>t){const e=s/(o-t);this.$emit("fps",{fps:e,stuck:i}),s=0,i=0,t=o}e=n,await Object(a["a"])()}},normalizeScreenPoint(e){return new o["Rb"](e.offsetX/this.$refs.canvas.clientWidth*2-1,1-e.offsetY/this.$refs.canvas.clientHeight*2,0)},raycastAxis(e){if(this.raycaster){const t=this.normalizeScreenPoint(e);this.raycaster.setFromCamera(t,this.camera);const s=this.raycaster.intersectObject(this.cube.graph,!0);if(s[0]){const e=this.cube.graph.worldToLocal(s[0].point);return u(e)}}return null},onMouseMove(e){if(this.cube)if(Number.isInteger(this.holdingAxis)&&4!==e.buttons){const t=this.normalizeScreenPoint(e),s=t.clone().sub(this.holdPosition.start),i=this.holdPosition.start.clone().sub(this.holdPosition.pivot).normalize(),n=3*-i.clone().cross(s).z;this.cube.twistGraph(this.holdingAxis,n)}else switch(e.buttons){case 1:case 4:this.cube.graph.rotateOnWorldAxis(new o["Rb"](0,1,0),.01*e.movementX),this.cube.graph.rotateOnWorldAxis(new o["Rb"](1,0,0),.01*e.movementY);break;case 0:this.cube.cubeMeshes.forEach(e=>e.material=this.material);const t=this.raycastAxis(e);if(Number.isInteger(t)){const e=this.cube.algebra.faceIndicesFromAxis(t);e.forEach(e=>this.cube.cubeMeshes[e].material=this.highlightMaterial)}break}},onMouseDown(e){switch(e.buttons){case 1:const t=this.raycastAxis(e);if(Number.isInteger(t)){const s=this.cube.graph.localToWorld(f[t].clone());s.project(this.camera),s.z=0,this.holdingAxis=t,this.holdPosition={pivot:s,start:this.normalizeScreenPoint(e)}}break}},onMouseUp(){Number.isInteger(this.holdingAxis)&&(this.cube.releaseGraph(),this.holdingAxis=null)},touchToOffsetPoint(e,t={buttons:0}){const s=this.$el.getBoundingClientRect();return{offsetX:e.pageX-s.x,offsetY:e.pageY-s.y,...t}},onTouchStart(e){this.rendererActive&&1===e.touches.length&&(this.onMouseDown(this.touchToOffsetPoint(e.touches[0],{buttons:1})),e.preventDefault())},onTouchMove(e){switch(e.touches.length){case 1:const t=this.touchToOffsetPoint(e.touches[0]);this.onMouseMove(t),this.lastTouchPoint={offsetX:t.offsetX,offsetY:t.offsetY},e.preventDefault();break;case 2:{const t=this.touchToOffsetPoint(e.touches[0],{buttons:1});this.lastTouchPoint&&(t.movementX=t.offsetX-this.lastTouchPoint.offsetX,t.movementY=t.offsetY-this.lastTouchPoint.offsetY,this.holdingAxis=null,this.onMouseMove(t)),this.lastTouchPoint={offsetX:t.offsetX,offsetY:t.offsetY}}e.preventDefault();break}},onTouchEnd(){this.onMouseUp(),this.lastTouchPoint=null},onChange(e){this.innerCode=e.encode(),this.$emit("update:code",this.innerCode)}},watch:{size(e){this.camera.aspect=e.width/e.height,this.camera.updateProjectionMatrix(),this.renderer.setSize(e.width,e.height,!1)},code(e){this.innerCode!==e&&this.cube.setState(e)}}},b=d,m=s("0c7c"),p=Object(m["a"])(b,i,n,!1,null,"1fa851f6",null);t["a"]=p.exports},"41ca":function(e,t,s){},5027:function(e,t,s){"use strict";s.d(t,"b",(function(){return i})),s.d(t,"a",(function(){return n}));const i=e=>new Promise(t=>setTimeout(t,e));function n(){return new Promise(e=>requestAnimationFrame(e))}},edbf:function(e,t,s){"use strict";var i=s("41ca"),n=s.n(i);n.a}}]);
//# sourceMappingURL=cube3-player.c182998f.js.map