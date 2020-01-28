(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["cube-cayley-graph"],{"480a":function(e,t,i){},"604b":function(e,t,i){"use strict";i.r(t);var n=function(){var e=this,t=e.$createElement,i=e._self._c||t;return i("div",{directives:[{name:"resize",rawName:"v-resize",value:e.onResize,expression:"onResize"}],staticClass:"cube-cayley-graph"},[i("article",{on:{mousemove:e.onMouseMove,mousewheel:e.onMouseWheel}},[i("canvas",{ref:"canvas",attrs:{width:e.size.width,height:e.size.height}}),i("span",{staticClass:"status"},[e.fps?i("span",{staticClass:"fps"},[e._v("fps "),i("em",[e._v(e._s(e.fps))])]):e._e()])]),i("header",[i("svg",{staticClass:"control",attrs:{width:"240",height:"240",viewBox:"-120 -120 240 240"}},[i("g",e._l(6,(function(t){return i("g",{key:t,class:"unit"+t},[i("line",{staticClass:"track",attrs:{x1:"0",y1:"0",x2:100*Math.cos((t+3.5)*Math.PI/3),y2:100*Math.sin((t+3.5)*Math.PI/3)}}),i("circle",{staticClass:"tip",attrs:{cx:100*Math.cos((t+3.5)*Math.PI/3),cy:100*Math.sin((t+3.5)*Math.PI/3)},on:{click:function(i){return e.rotate(t)}}})])})),0),i("g",{staticClass:"handle"},[i("circle",{attrs:{cx:e.handlePosition.x,cy:e.handlePosition.y}})])])])])},s=[],a=i("428d"),h=i.n(a),o=i("5a89"),c=i("5027"),r=i("819c");const d=Math.PI/6,l=Math.PI-Math.atan(2*Math.sqrt(2)),u=Math.sqrt(2+2*Math.sqrt(3)/9),p=2*Math.asin(u/2),k=2*Math.PI-l-p,m=(e,t,i)=>new o["m"](e*Math.sin(t)*Math.cos(i),e*Math.cos(t),e*Math.sin(t)*Math.sin(i)),w=(e,t,i,n=1)=>({index:e,label:t,position:m(n,...i)}),f=[w(0,"1",[0,0]),w(7,"i2",[l,0]),w(8,"j2",[l,4*d]),w(9,"k2",[l,-4*d]),w(1,"i",[l/2,d]),w(2,"j",[l/2,5*d]),w(3,"k",[l/2,-3*d]),w(4,"i-",[l/2,-d]),w(5,"j-",[l/2,3*d]),w(6,"k-",[l/2,-5*d]),w(22,"2i",[k,6*d]),w(23,"2i-",[p,6*d]),w(12,"2j",[k,-2*d]),w(15,"2j-",[p,-2*d]),w(21,"2k",[k,2*d]),w(18,"2k-",[p,2*d])],g=e=>e.reduce((e,t)=>e.add(t),new o["m"]).multiplyScalar(1/e.length),M=(e,t,i,n=1)=>({index:e,label:t,position:g(i.map(e=>f[e].position)).multiplyScalar(n)});[[10,"ijk",[4,5,6,10,12,14]],[19,"k-ji",[4,5,9,11,13,14],3],[16,"kj-i",[4,8,6,11,12,15],3],[13,"ij-k-",[4,8,9,10,13,15]],[17,"kji-",[7,5,6,10,13,15],3],[11,"i-jk-",[7,5,9,11,12,15]],[14,"i-j-k",[7,8,6,11,13,14]],[20,"k-j-i-",[7,8,9,10,12,14],3]].forEach(e=>f.push(M(...e)));var v={name:"cube-cayley-graph",directives:{resize:h.a},data(){return{size:{width:800,height:800},fps:0,rotationIndex:0,rotationT:0}},computed:{handlePosition(){if(0===this.rotationIndex)return{x:0,y:0};const e=Math.PI*(this.rotationIndex+3.5)/3,t=100,i=3*this.rotationT**2-2*this.rotationT**3;return{x:Math.cos(e)*t*i,y:Math.sin(e)*t*i}}},created(){window.$main=this},mounted(){this.initializeRenderer(),this.createElements(),this.createEdges(),this.render()},beforeDestroy(){this.rendererActive=!1},methods:{onResize(){this.size={width:this.$el.clientWidth,height:this.$el.clientHeight}},initializeRenderer(){this.renderer=new o["n"]({antialias:!0,canvas:this.$refs.canvas,alpha:!0}),this.renderer.setClearColor(new o["a"]("lightblue"),1),this.renderer.setSize(this.size.width,this.size.height,!1),this.camera=new o["h"](60,this.size.width/this.size.height,10,1e3),this.viewTheta=.3*Math.PI,this.viewPhi=0,this.viewRadius=360,this.scene=new o["j"],this.rendererActive=!0,this.sphere=new o["k"](8,32,16),this.cone=new o["b"](1,1,16)},async render(){let e=performance.now(),t=Math.floor(e/1e3),i=0,n=0;while(this.rendererActive){this.camera.position.copy(m(this.viewRadius,this.viewTheta,this.viewPhi)),this.camera.lookAt(0,0,0),this.renderer.render(this.scene,this.camera),++i;const s=performance.now();n=Math.max(n,s-e);const a=Math.floor(s/1e3);a>t&&(this.fps=i/(a-t),i=0,n=0,t=a),this.rotationIndex>0&&(this.rotationT+=.002*(s-e),this.rotationT>=1?this.permute(this.rotationIndex):this.elements.forEach((e,t)=>{const i=r["k"][f[t].index][this.rotationIndex],n=this.elementPositions[f[t].index],s=this.elementPositions[i],a=3*this.rotationT**2-2*this.rotationT**3;e.position.copy(n.clone().lerp(s,a))})),e=s,await Object(c["a"])()}},async createElements(){this.elements=[],await Promise.all(f.map(async e=>{const{default:t}=await i("628f")(`./${e.label}.png`),n=new o["e"](this.sphere,new o["f"]({map:(new o["l"]).load(t)}));this.elements.push(n),n.position.copy(e.position.clone().multiplyScalar(100)),this.scene.add(n)})),this.elementPositions=this.elements.reduce((e,t,i)=>(e[f[i].index]=t.position.clone(),e),[])},createEdges(){const e=["red","green","blue"],t=new o["m"](0,1,0);f.forEach(i=>{for(let n=1;n<=3;++n){const s=r["k"][i.index][n],a=i.position,h=f.find(e=>e.index===s).position,c=h.clone().sub(a),d=t.clone().cross(c).normalize(),l=Math.acos(c.clone().normalize().dot(t)),u=new o["g"];u.position.copy(a.clone().multiplyScalar(100)),u.quaternion.setFromAxisAngle(d,l),u.scale.x=u.scale.z=1,u.scale.y=100*c.length();const p=new o["e"](this.cone,new o["f"]({color:new o["a"](e[n-1])}));p.position.y=.5,u.add(p),this.scene.add(u)}})},onMouseMove(e){1===e.buttons&&(this.viewPhi+=.01*e.movementX,this.viewTheta-=.01*e.movementY,this.viewTheta=Math.max(Math.min(this.viewTheta,Math.PI-.01),.01))},onMouseWheel(e){this.viewRadius*=Math.exp(.001*e.deltaY)},rotate(e){this.rotationIndex=e},permute(e){this.elements.forEach((t,i)=>{const n=r["k"][f[i].index][e];t.position.copy(this.elementPositions[n])}),this.elementPositions=this.elements.reduce((e,t,i)=>(e[f[i].index]=t.position.clone(),e),[]),this.rotationIndex=0,this.rotationT=0}},watch:{size(e){this.camera.aspect=e.width/e.height,this.camera.updateProjectionMatrix(),this.renderer.setSize(e.width,e.height,!1)}}},x=v,b=(i("997a"),i("0c7c")),j=Object(b["a"])(x,n,s,!1,null,"8711516a",null);t["default"]=j.exports},"628f":function(e,t,i){var n={"./1.png":["583d","chunk-2d0c916a"],"./2i-.png":["db40","chunk-2d228c70"],"./2i.png":["c577","chunk-2d216f88"],"./2j-.png":["fabc","chunk-2d237732"],"./2j.png":["9cc1","chunk-2d0f09ee"],"./2k-.png":["5bb6","chunk-2d0d3497"],"./2k.png":["b4d8","chunk-2d20fcdc"],"./i-.png":["83fc","chunk-2d0de1ee"],"./i-j-k.png":["ccc5","chunk-2d222188"],"./i-jk-.png":["8942","chunk-2d0df235"],"./i.png":["8f30","chunk-2d0e9b01"],"./i2.png":["68a7","chunk-2d0d0b2e"],"./ij-k-.png":["a9d3","chunk-2d209b3d"],"./ijk.png":["8f69","chunk-2d0e9b67"],"./j-.png":["cda7","chunk-2d22250d"],"./j.png":["ca3b","chunk-2d221463"],"./j2.png":["e955","chunk-2d22670a"],"./k-.png":["8e60","chunk-2d0e979d"],"./k-j-i-.png":["30b3","chunk-2d0b9024"],"./k-ji.png":["9034","chunk-2d0e44ae"],"./k.png":["e713","chunk-2d225f0a"],"./k2.png":["4143","chunk-2d0c02b2"],"./kj-i.png":["8293","chunk-2d0dd88a"],"./kji-.png":["ca5c","chunk-2d2214a2"]};function s(e){if(!i.o(n,e))return Promise.resolve().then((function(){var t=new Error("Cannot find module '"+e+"'");throw t.code="MODULE_NOT_FOUND",t}));var t=n[e],s=t[0];return i.e(t[1]).then((function(){return i.t(s,7)}))}s.keys=function(){return Object.keys(n)},s.id="628f",e.exports=s},"997a":function(e,t,i){"use strict";var n=i("480a"),s=i.n(n);s.a}}]);
//# sourceMappingURL=cube-cayley-graph.564d07e3.js.map