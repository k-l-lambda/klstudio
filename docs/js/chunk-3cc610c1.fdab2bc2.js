(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-3cc610c1"],{"407d":function(e,n,a){var c={"./nx.jpg":["b3cf","chunk-2d20f92a"],"./ny.jpg":["613c","chunk-2d0ceb81"],"./nz.jpg":["72ba","chunk-2d0d6950"],"./px.jpg":["de12","chunk-2d229758"],"./py.jpg":["c4e6","chunk-2d217158"],"./pz.jpg":["56cc","chunk-2d0c8fb7"]};function t(e){if(!a.o(c,e))return Promise.resolve().then((function(){var n=new Error("Cannot find module '"+e+"'");throw n.code="MODULE_NOT_FOUND",n}));var n=c[e],t=n[0];return a.e(n[1]).then((function(){return a.t(t,7)}))}t.keys=function(){return Object.keys(c)},t.id="407d",e.exports=t},6445:function(e,n,a){"use strict";n["a"]={created(){this.quitCleaner=new Promise(e=>this.quitClear=e)},methods:{async appendCleaner(e){"pending"!==await Promise.race([this.quitCleaner,"pending"])?e():this.quitCleaner=this.quitCleaner.then(e)}},beforeDestroy(){this.quitClear()}}},"91b5":function(e,n,a){"use strict";var c=a("dd1c"),t=a.n(c);t.a},"9f72":function(e,n,a){"use strict";a.r(n);var c=function(){var e=this,n=e.$createElement,a=e._self._c||n;return a("div",{directives:[{name:"resize",rawName:"v-resize",value:e.onResize,expression:"onResize"}],staticClass:"globe-cube3"},[a("Cube3",{ref:"cube3",staticClass:"viewer",attrs:{size:e.size,code:e.code,material:e.cubeMaterial,highlightMaterial:e.cubeHighlightMaterial,meshSchema:"spherical"},on:{"update:code":function(n){e.code=n},fps:e.onFps,sceneInitialized:e.onSceneInitialized,beforeRender:e.onBeforeRender}})],1)},t=[],r=a("428d"),i=a.n(r),s=a("5a89"),d=a("3e6b"),u=a("6445");const o=["px","nx","py","ny","pz","nz"],h={color:"#1340a7",specular:"#fff1a6",shininess:8,shading:s["t"]},l=.01,b=.001;var p={name:"globe-cube3",props:{rendererActive:!0},directives:{resize:i.a},mixins:[u["a"]],components:{Cube3:d["a"]},data(){const e=new s["m"](h);return{size:void 0,fps:null,code:null,cubeMaterial:e,cubeHighlightMaterial:e}},mounted(){this.sensorAcceleration=[0,0,0],this.sensorVelocity=[0,0,0],"undefined"!==typeof LinearAccelerationSensor&&navigator.permissions.query({name:"accelerometer"}).then(e=>{if("granted"===e.state){const e=new LinearAccelerationSensor({frequency:60}),n=()=>{this.sensorAcceleration=[e.x,e.y,e.z],this.sensorVelocity.forEach((e,n)=>{this.sensorVelocity[n]+=this.sensorAcceleration[n],this.sensorVelocity[n]*=1-l})};e.addEventListener("reading",n),this.appendCleaner(()=>e.removeEventListener("reading",n)),e.start()}}),this.rendererActive||(this.$refs.cube3.rendererActive=this.rendererActive)},methods:{onResize(){this.size={width:this.$el.clientWidth,height:this.$el.clientHeight}},onFps(e){this.fps=e.fps},async onSceneInitialized(e){e.camera.near=.1,e.camera.position.set(0,0,4.5);const n=new s["f"](16777215,1.6);n.position.set(0,0,10),n.target=e.cube.graph,e.scene.add(n),e.scene.add(e.camera),this.textureLoader=new s["v"],this.cubeMaterial.specularMap=await this.loadTexture("earth/earth_specular.jpg"),this.cubeMaterial.needsUpdate=!0,this.cubeMaterial.normalMap=await this.loadTexture("earth/earth_normal.jpg"),this.cubeMaterial.needsUpdate=!0;const c=(await Promise.all(o.map(e=>a("407d")(`./${e}.jpg`)))).map(({default:e})=>e),t=(new s["e"]).load(c);this.cubeMaterial.envMap=t,this.cubeMaterial.needsUpdate=!0,this.cubeHighlightMaterial=this.cubeMaterial.clone(),this.cubeHighlightMaterial.emissive=new s["c"]("#35ac7e"),this.cubeHighlightMaterial.shininess=16},onBeforeRender(e){e.scene.rotation.set(0,4e-5*Date.now(),0),this.sensorVelocity&&(e.cube.graph.rotateOnWorldAxis(new s["x"](0,0,1),this.sensorVelocity[0]*b*.1),e.cube.graph.rotateOnWorldAxis(new s["x"](0,1,0),this.sensorVelocity[2]*b),e.cube.graph.rotateOnWorldAxis(new s["x"](1,0,0),this.sensorVelocity[1]*b*.2))},async loadTexture(e){const{default:n}=await a("e465")(`./${e}`);return new Promise(e=>this.textureLoader.load(n,n=>e(n)))}},watch:{rendererActive(e){this.$refs.cube3.rendererActive=e,e&&this.$refs.cube3.render()}}},g=p,k=(a("91b5"),a("0c7c")),f=Object(k["a"])(g,c,t,!1,null,"4ee5316a",null);n["default"]=f.exports},dd1c:function(e,n,a){},e465:function(e,n,a){var c={"./app-covers/SpiralPiano.png":["ffdf",7,"chunk-2d238a38"],"./chess-knight":["ad0d",3,"chunk-2d21368d"],"./chess-knight.json":["ad0d",3,"chunk-2d21368d"],"./cube-algebra/1.png":["583d",7,"chunk-2d0c916a"],"./cube-algebra/2i-.png":["db40",7,"chunk-2d228c70"],"./cube-algebra/2i.png":["c577",7,"chunk-2d216f88"],"./cube-algebra/2j-.png":["fabc",7,"chunk-2d237732"],"./cube-algebra/2j.png":["9cc1",7,"chunk-2d0f09ee"],"./cube-algebra/2k-.png":["5bb6",7,"chunk-2d0d3497"],"./cube-algebra/2k.png":["b4d8",7,"chunk-2d20fcdc"],"./cube-algebra/i-.png":["83fc",7,"chunk-2d0de1ee"],"./cube-algebra/i-j-k.png":["ccc5",7,"chunk-2d222188"],"./cube-algebra/i-jk-.png":["8942",7,"chunk-2d0df235"],"./cube-algebra/i.png":["8f30",7,"chunk-2d0e9b01"],"./cube-algebra/i2.png":["68a7",7,"chunk-2d0d0b2e"],"./cube-algebra/ij-k-.png":["a9d3",7,"chunk-2d209b3d"],"./cube-algebra/ijk.png":["8f69",7,"chunk-2d0e9b67"],"./cube-algebra/j-.png":["cda7",7,"chunk-2d22250d"],"./cube-algebra/j.png":["ca3b",7,"chunk-2d221463"],"./cube-algebra/j2.png":["e955",7,"chunk-2d22670a"],"./cube-algebra/k-.png":["8e60",7,"chunk-2d0e979d"],"./cube-algebra/k-j-i-.png":["30b3",7,"chunk-2d0b9024"],"./cube-algebra/k-ji.png":["9034",7,"chunk-2d0e44ae"],"./cube-algebra/k.png":["e713",7,"chunk-2d225f0a"],"./cube-algebra/k2.png":["4143",7,"chunk-2d0c02b2"],"./cube-algebra/kj-i.png":["8293",7,"chunk-2d0dd88a"],"./cube-algebra/kji-.png":["ca5c",7,"chunk-2d2214a2"],"./earth/earth_normal.jpg":["45e0",7,"chunk-2d0c17a2"],"./earth/earth_specular.jpg":["b7fd",7,"chunk-2d210889"],"./f=2^x_12.svg":["3477",7,"chunk-2d0b99f7"],"./loading-5d.gif":["1823",7,"chunk-2d0abf9e"],"./skybox-space/nx.jpg":["b3cf",7,"chunk-2d20f92a"],"./skybox-space/ny.jpg":["613c",7,"chunk-2d0ceb81"],"./skybox-space/nz.jpg":["72ba",7,"chunk-2d0d6950"],"./skybox-space/px.jpg":["de12",7,"chunk-2d229758"],"./skybox-space/py.jpg":["c4e6",7,"chunk-2d217158"],"./skybox-space/pz.jpg":["56cc",7,"chunk-2d0c8fb7"]};function t(e){if(!a.o(c,e))return Promise.resolve().then((function(){var n=new Error("Cannot find module '"+e+"'");throw n.code="MODULE_NOT_FOUND",n}));var n=c[e],t=n[0];return a.e(n[2]).then((function(){return a.t(t,n[1])}))}t.keys=function(){return Object.keys(c)},t.id="e465",e.exports=t}}]);
//# sourceMappingURL=chunk-3cc610c1.fdab2bc2.js.map