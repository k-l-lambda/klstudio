(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["equal-temperament","chunk-2d0b99f7"],{"22df":function(t,e,s){"use strict";var i=s("5de7"),a=s.n(i);a.a},3477:function(t,e,s){t.exports=s.p+"img/f=2^x_12.fd10b3fe.svg"},"5de7":function(t,e,s){},6307:function(t,e,s){"use strict";s.r(e);var i=function(){var t=this,e=t.$createElement,s=t._self._c||e;return s("div",{directives:[{name:"resize",rawName:"v-resize",value:t.onResize,expression:"onResize"}],staticClass:"equal-temperament",on:{click:t.onClick}},[s("article",[s("SvgMap",{ref:"cartesian",staticClass:"cartesian",attrs:{width:t.cartesianWidth,height:.7*t.cartesianWidth,initViewWidth:24,initViewCenter:{x:6,y:-7}}},[s("g",{staticClass:"axes"},[s("line",{attrs:{x1:"-100",y1:"0",x2:"100",y2:"0"}}),s("line",{attrs:{x1:"0",y1:"-100",x2:"0",y2:"100"}})]),s("path",{staticClass:"curve",attrs:{d:t.curvePath}}),s("g",{staticClass:"axis-points"},t._l(t.stepPoints,(function(t){return s("circle",{attrs:{cx:t.x,cy:0}})})),0),s("g",{staticClass:"steps"},t._l(t.steps,(function(e){return e.name?s("text",{staticClass:"label",class:{focus:t.focusPoints[0]&&t.focusPoints[0].x==e.pitch,chosen:e.chosen},attrs:{x:e.pitch,y:.6}},[t._v(t._s(e.name))]):t._e()})),0),s("g",{staticClass:"curve-points"},t._l(t.stepPoints,(function(e){return s("g",{class:{bold:e.C,chosen:t.steps[e.x]&&t.steps[e.x].chosen}},[s("line",{staticClass:"vertical",attrs:{x1:e.x,y1:0,x2:e.x,y2:e.y}}),e.C?s("line",{staticClass:"horizontal",attrs:{x1:0,y1:e.y,x2:e.x,y2:e.y}}):t._e(),s("circle",{attrs:{cx:e.x,cy:e.y}})])})),0),s("g",{staticClass:"band-f"},[t._l([1,2,4,8],(function(e){return s("g",[s("line",{staticClass:"scale-line",attrs:{x1:0,y1:e*t.CARTESIAN_Y_SCALE,x2:-.2,y2:e*t.CARTESIAN_Y_SCALE}}),s("text",{staticClass:"label",attrs:{transform:"translate(-0.4, "+e*t.CARTESIAN_Y_SCALE+")"}},[t._v(t._s(e))])])})),s("rect",{staticClass:"pad",attrs:{x:-1.6,y:-100,width:2.4,height:100},on:{mousemove:t.onFPadMoving}})],2),s("g",{staticClass:"band-x"},[s("rect",{staticClass:"pad",attrs:{x:-100,y:-.6,width:200,height:2.4},on:{mousemove:t.onXPadMoving}})]),s("g",{staticClass:"focus-pionts"},t._l(t.focusPoints,(function(e,i){return s("g",{key:i},[s("line",{attrs:{x1:0,y1:e.y,x2:e.x,y2:e.y}}),s("line",{attrs:{x1:e.x,y1:0,x2:e.x,y2:e.y}}),s("circle",{staticClass:"dot",attrs:{cx:e.x,cy:e.y}}),s("text",{staticClass:"label",attrs:{transform:"translate(-1.6, "+e.y+")"}},[t._v(t._s((e.y/t.CARTESIAN_Y_SCALE).toPrecision(4)))]),s("text",{staticClass:"label",attrs:{transform:"translate("+e.x+", 1.2)"}},[t._v(t._s(e.x.toFixed(1)))])])})),0),t.cursorPoint?s("circle",{staticClass:"cursor",attrs:{r:"0.2",fill:"red",cx:t.cursorPoint.x,cy:t.cursorPoint.y}}):t._e()]),s("svg",{staticClass:"clock",attrs:{width:t.clockSize,height:t.clockSize,viewBox:"-300 -300 600 600"},on:{mousemove:t.onClockMoving}},[s("circle",{staticClass:"frame",attrs:{r:t.CLOCK_RADIUS,cx:"0",cy:"0"}}),s("g",{staticClass:"steps"},t._l(t.steps,(function(e){return e.name?s("text",{staticClass:"label",class:{focus:t.focusPoints[0]&&t.focusPoints[0].x==e.pitch,chosen:e.chosen},attrs:{x:t.pToCX(e.pitch,1.08),y:t.pToCY(e.pitch,1.08)+14}},[t._v(t._s(e.name))]):t._e()})),0),s("g",{staticClass:"scales"},t._l(t.steps,(function(e){return s("g",{key:e.pitch,class:{chosen:e.chosen}},[e.chosen?s("path",{staticClass:"fan",attrs:{d:"M0 0 L"+t.pToCX(e.pitch-.5)+" "+t.pToCY(e.pitch-.5)+" A"+t.CLOCK_RADIUS+" "+t.CLOCK_RADIUS+" 0 0 1 "+t.pToCX(e.pitch+.5)+" "+t.pToCY(e.pitch+.5)+" Z"}}):t._e(),s("line",{attrs:{x1:t.pToCX(e.pitch),y1:t.pToCY(e.pitch),x2:t.pToCX(e.pitch,.98),y2:t.pToCY(e.pitch,.98)}}),s("circle",{staticClass:"dot",attrs:{cx:t.pToCX(e.pitch),cy:t.pToCY(e.pitch)},on:{click:function(t){e.chosen=!e.chosen}}})])})),0),t.focusPoints[0]?s("g",{staticClass:"focus"},[s("line",{attrs:{x1:0,y1:0,x2:t.pToCX(t.focusPoints[0].x),y2:t.pToCY(t.focusPoints[0].x)}}),s("circle",{staticClass:"dot",attrs:{cx:t.pToCX(t.focusPoints[0].x),cy:t.pToCY(t.focusPoints[0].x)}})]):t._e()])],1),s("header",[s("div",{staticClass:"formations"},[s("div",{staticClass:"inner"},[s("img",{style:{zoom:3},attrs:{src:t.url12Equal}})])])])])},a=[],c=s("428d"),n=s.n(c),o=s("ab92"),h=s("3477"),r=s.n(h);const l=-4,u=240;var p={name:"equal-temperament",props:{cartesianWidth:{type:Number,default:()=>800},clockSize:{type:Number,default:()=>600}},directives:{resize:n.a},components:{SvgMap:o["a"]},data(){return{size:{},curvePoints:Array(1080).fill().map((t,e)=>({x:(e-480)/10,y:l*2**((e-480)/120)})),stepPoints:Array(88).fill().map((t,e)=>({pitch:e+21,C:(e+21)%12===0,x:e-39,y:l*2**((e-39)/12)})),url12Equal:r.a,CARTESIAN_Y_SCALE:l,CLOCK_RADIUS:u,cursorPoint:null,focusPoints:[],steps:[{pitch:0,name:"C"},{pitch:1},{pitch:2,name:"D"},{pitch:3},{pitch:4,name:"E"},{pitch:5,name:"F"},{pitch:6},{pitch:7,name:"G"},{pitch:8},{pitch:9,name:"A"},{pitch:10},{pitch:11,name:"B"}]}},computed:{curvePath(){return"M"+this.curvePoints.map(t=>`${t.x} ${t.y.toFixed(6)}`).join(" L")}},mounted(){},methods:{onResize(){this.size={width:this.$el.clientWidth,height:this.$el.clientHeight}},onClick(){this.focusPoints=[]},onFPadMoving(t){const e=this.$refs.cartesian.clientToView({x:t.offsetX,y:t.offsetY}),s=12*Math.log2(e.y/l);this.focusPoints=[{x:s,y:e.y}]},onXPadMoving(t){const e=this.$refs.cartesian.clientToView({x:t.offsetX,y:t.offsetY});e.x=Math.round(10*e.x)/10;const s=l*2**(e.x/12);this.focusPoints=[{x:e.x,y:s}]},onClockMoving(t){const e={x:600*t.offsetX/this.clockSize-300,y:600*t.offsetY/this.clockSize-300},s=Math.atan(e.y/e.x)/Math.PI+(e.x<0?1:0)+.5,i=6*(s<0?s+2:s),a=Math.round(10*i)/10;this.focusPoints=[a,a-12,a+12].map(t=>({x:t,y:l*2**(t/12)}))},pToCX(t,e=1){return Math.cos((t-3)*Math.PI*2/12)*u*e},pToCY(t,e=1){return Math.sin((t-3)*Math.PI*2/12)*u*e}}},x=p,C=(s("22df"),s("0c7c")),v=Object(C["a"])(x,i,a,!1,null,"0c66848e",null);e["default"]=v.exports},ab92:function(t,e,s){"use strict";var i=function(){var t=this,e=t.$createElement,s=t._self._c||e;return s("svg",{attrs:{width:t.width,height:t.height,viewBox:t.viewBox.left+" "+t.viewBox.top+" "+t.viewBox.width+" "+t.viewBox.height},on:{mousemove:t.onMouseMove,mousewheel:t.onMouseWheel}},[s("g",{attrs:{transform:"scale("+t.viewScale+") translate("+-t.viewCenter.x+", "+-t.viewCenter.y+")"}},[t._t("default")],2)])},a=[],c={name:"svg-map",props:{width:Number,height:Number,initViewCenter:{type:Object,default:()=>({x:0,y:0})},initViewWidth:{type:Number,default:()=>1}},data(){const t=this.aspect||1;return{viewCenter:this.initViewCenter,viewSize:{width:this.initViewWidth,height:this.initViewWidth/t},viewScale:1}},computed:{viewBox(){return{left:-this.viewSize.width/2,top:-this.viewSize.height/2,width:this.viewSize.width,height:this.viewSize.height}},aspect(){return this.width&&this.height?this.width/this.height:1}},mounted(){this.viewSize.height=this.initViewWidth/this.aspect},methods:{onMouseMove(t){switch(t.buttons){case 1:const e=this.viewBox.width/(this.width*this.viewScale);this.viewCenter.x-=t.movementX*e,this.viewCenter.y-=t.movementY*e,this.$emit("update:viewCenter",this.viewCenter);break}this.$emit("mousemove",t)},onMouseWheel(t){this.viewScale*=Math.exp(-.001*t.deltaY),this.$emit("update:viewScale",this.viewScale)},clientToView(t){return{x:(t.x*this.viewBox.width/this.width+this.viewBox.left)/this.viewScale+this.viewCenter.x,y:(t.y*this.viewBox.height/this.height+this.viewBox.top)/this.viewScale+this.viewCenter.y}}}},n=c,o=s("0c7c"),h=Object(o["a"])(n,i,a,!1,null,null,null);e["a"]=h.exports}}]);
//# sourceMappingURL=equal-temperament.8b71f887.js.map