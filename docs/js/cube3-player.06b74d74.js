(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["cube3-player"],{"08dc":function(e,t,s){"use strict";s.r(t);var i=function(){var e=this,t=e.$createElement,s=e._self._c||t;return s("div",{directives:[{name:"resize",rawName:"v-resize",value:e.onResize,expression:"onResize"}],staticClass:"cube3-player"},[s("Cube3",{ref:"viewer",staticClass:"viewer",attrs:{size:e.size,code:e.code},on:{"update:code":function(t){e.code=t},fps:e.onFps}}),s("span",{staticClass:"status"},[e.fps?s("span",{staticClass:"fps"},[e._v("fps "),s("em",[e._v(e._s(e.fps))])]):e._e()])],1)},n=[],a=s("0b16"),c=s.n(a),r=s("428d"),o=s.n(r),h=s("3e6b"),u=s("cbb5");const d="LrDuBflRdUbF";var f={name:"cube3-player",directives:{resize:o.a},components:{Cube3:h["a"]},data(){return{size:void 0,fps:null,code:null}},mounted(){window.$cube=this.$refs.viewer.cube,document.addEventListener("keydown",e=>{switch(e.key){case"Home":this.$refs.viewer&&this.$refs.viewer.cube.reset();break;default:const t=d.indexOf(e.key);t>=0&&this.$refs.viewer&&this.$refs.viewer.cube.twist(t)}}),window.onhashchange=()=>this.onHashChange(),this.onHashChange()},methods:{onResize(){this.size={width:this.$el.clientWidth,height:this.$el.clientHeight}},onFps(e){this.fps=e.fps},onHashChange(){let e=location.hash.substr(1);"/"!==e[0]||/#/.test(e)||(e+="#"),e=e.replace(/.*#/,"");const t=c.a.parse(e,!0),s=t.pathname;if(s&&(this.code=s),t.query.path){const e=Object(u["parsePath"])(t.query.path);if(e.length){const t=e[0];t>=0&&this.$refs.viewer.cube.twist(t).then(()=>{const t=Object(u["stringifyPath"])(e.slice(1));location.hash=`${this.getRouterPath()}${this.code}?path=${t}`})}}},getRouterPath(){const[e]=location.hash.match(/^#\/[^#]*/)||[];return e?e+"#":""}},watch:{code(e){location.hash=this.getRouterPath()+e}}},l=f,p=(s("edbf"),s("0c7c")),w=Object(p["a"])(l,i,n,!1,null,"2c10a6cd",null);t["default"]=w.exports},"41ca":function(e,t,s){},5027:function(e,t,s){"use strict";s.d(t,"a",(function(){return i}));function i(){return new Promise(e=>requestAnimationFrame(e))}},edbf:function(e,t,s){"use strict";var i=s("41ca"),n=s.n(i);n.a}}]);
//# sourceMappingURL=cube3-player.06b74d74.js.map