(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chess-lab~cube3-player~cube3-solver~dynamic-labeled-cube3~writer"],{"0b16":function(t,e,r){"use strict";var n=r("9d88"),s=r("35e8");function o(){this.protocol=null,this.slashes=null,this.auth=null,this.host=null,this.port=null,this.hostname=null,this.hash=null,this.search=null,this.query=null,this.pathname=null,this.path=null,this.href=null}e.parse=O,e.resolve=x,e.resolveObject=A,e.format=w,e.Url=o;var h=/^([a-z0-9.+-]+:)/i,a=/:[0-9]*$/,i=/^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,c=["<",">",'"',"`"," ","\r","\n","\t"],u=["{","}","|","\\","^","`"].concat(c),l=["'"].concat(u),p=["%","/","?",";","#"].concat(l),f=["/","?","#"],m=255,v=/^[+a-z0-9A-Z_-]{0,63}$/,d=/^([+a-z0-9A-Z_-]{0,63})(.*)$/,b={javascript:!0,"javascript:":!0},y={javascript:!0,"javascript:":!0},g={http:!0,https:!0,ftp:!0,gopher:!0,file:!0,"http:":!0,"https:":!0,"ftp:":!0,"gopher:":!0,"file:":!0},j=r("b383");function O(t,e,r){if(t&&s.isObject(t)&&t instanceof o)return t;var n=new o;return n.parse(t,e,r),n}function w(t){return s.isString(t)&&(t=O(t)),t instanceof o?t.format():o.prototype.format.call(t)}function x(t,e){return O(t,!1,!0).resolve(e)}function A(t,e){return t?O(t,!1,!0).resolveObject(e):e}o.prototype.parse=function(t,e,r){if(!s.isString(t))throw new TypeError("Parameter 'url' must be a string, not "+typeof t);var o=t.indexOf("?"),a=-1!==o&&o<t.indexOf("#")?"?":"#",c=t.split(a),u=/\\/g;c[0]=c[0].replace(u,"/"),t=c.join(a);var O=t;if(O=O.trim(),!r&&1===t.split("#").length){var w=i.exec(O);if(w)return this.path=O,this.href=O,this.pathname=w[1],w[2]?(this.search=w[2],this.query=e?j.parse(this.search.substr(1)):this.search.substr(1)):e&&(this.search="",this.query={}),this}var x=h.exec(O);if(x){x=x[0];var A=x.toLowerCase();this.protocol=A,O=O.substr(x.length)}if(r||x||O.match(/^\/\/[^@\/]+@[^@\/]+/)){var C="//"===O.substr(0,2);!C||x&&y[x]||(O=O.substr(2),this.slashes=!0)}if(!y[x]&&(C||x&&!g[x])){for(var I,q,U=-1,k=0;k<f.length;k++){var R=O.indexOf(f[k]);-1!==R&&(-1===U||R<U)&&(U=R)}q=-1===U?O.lastIndexOf("@"):O.lastIndexOf("@",U),-1!==q&&(I=O.slice(0,q),O=O.slice(q+1),this.auth=decodeURIComponent(I)),U=-1;for(k=0;k<p.length;k++){R=O.indexOf(p[k]);-1!==R&&(-1===U||R<U)&&(U=R)}-1===U&&(U=O.length),this.host=O.slice(0,U),O=O.slice(U),this.parseHost(),this.hostname=this.hostname||"";var S="["===this.hostname[0]&&"]"===this.hostname[this.hostname.length-1];if(!S)for(var N=this.hostname.split(/\./),P=(k=0,N.length);k<P;k++){var E=N[k];if(E&&!E.match(v)){for(var F="",$=0,z=E.length;$<z;$++)E.charCodeAt($)>127?F+="x":F+=E[$];if(!F.match(v)){var L=N.slice(0,k),T=N.slice(k+1),H=E.match(d);H&&(L.push(H[1]),T.unshift(H[2])),T.length&&(O="/"+T.join(".")+O),this.hostname=L.join(".");break}}}this.hostname.length>m?this.hostname="":this.hostname=this.hostname.toLowerCase(),S||(this.hostname=n.toASCII(this.hostname));var J=this.port?":"+this.port:"",K=this.hostname||"";this.host=K+J,this.href+=this.host,S&&(this.hostname=this.hostname.substr(1,this.hostname.length-2),"/"!==O[0]&&(O="/"+O))}if(!b[A])for(k=0,P=l.length;k<P;k++){var Z=l[k];if(-1!==O.indexOf(Z)){var _=encodeURIComponent(Z);_===Z&&(_=escape(Z)),O=O.split(Z).join(_)}}var M=O.indexOf("#");-1!==M&&(this.hash=O.substr(M),O=O.slice(0,M));var B=O.indexOf("?");if(-1!==B?(this.search=O.substr(B),this.query=O.substr(B+1),e&&(this.query=j.parse(this.query)),O=O.slice(0,B)):e&&(this.search="",this.query={}),O&&(this.pathname=O),g[A]&&this.hostname&&!this.pathname&&(this.pathname="/"),this.pathname||this.search){J=this.pathname||"";var D=this.search||"";this.path=J+D}return this.href=this.format(),this},o.prototype.format=function(){var t=this.auth||"";t&&(t=encodeURIComponent(t),t=t.replace(/%3A/i,":"),t+="@");var e=this.protocol||"",r=this.pathname||"",n=this.hash||"",o=!1,h="";this.host?o=t+this.host:this.hostname&&(o=t+(-1===this.hostname.indexOf(":")?this.hostname:"["+this.hostname+"]"),this.port&&(o+=":"+this.port)),this.query&&s.isObject(this.query)&&Object.keys(this.query).length&&(h=j.stringify(this.query));var a=this.search||h&&"?"+h||"";return e&&":"!==e.substr(-1)&&(e+=":"),this.slashes||(!e||g[e])&&!1!==o?(o="//"+(o||""),r&&"/"!==r.charAt(0)&&(r="/"+r)):o||(o=""),n&&"#"!==n.charAt(0)&&(n="#"+n),a&&"?"!==a.charAt(0)&&(a="?"+a),r=r.replace(/[?#]/g,(function(t){return encodeURIComponent(t)})),a=a.replace("#","%23"),e+o+r+a+n},o.prototype.resolve=function(t){return this.resolveObject(O(t,!1,!0)).format()},o.prototype.resolveObject=function(t){if(s.isString(t)){var e=new o;e.parse(t,!1,!0),t=e}for(var r=new o,n=Object.keys(this),h=0;h<n.length;h++){var a=n[h];r[a]=this[a]}if(r.hash=t.hash,""===t.href)return r.href=r.format(),r;if(t.slashes&&!t.protocol){for(var i=Object.keys(t),c=0;c<i.length;c++){var u=i[c];"protocol"!==u&&(r[u]=t[u])}return g[r.protocol]&&r.hostname&&!r.pathname&&(r.path=r.pathname="/"),r.href=r.format(),r}if(t.protocol&&t.protocol!==r.protocol){if(!g[t.protocol]){for(var l=Object.keys(t),p=0;p<l.length;p++){var f=l[p];r[f]=t[f]}return r.href=r.format(),r}if(r.protocol=t.protocol,t.host||y[t.protocol])r.pathname=t.pathname;else{var m=(t.pathname||"").split("/");while(m.length&&!(t.host=m.shift()));t.host||(t.host=""),t.hostname||(t.hostname=""),""!==m[0]&&m.unshift(""),m.length<2&&m.unshift(""),r.pathname=m.join("/")}if(r.search=t.search,r.query=t.query,r.host=t.host||"",r.auth=t.auth,r.hostname=t.hostname||t.host,r.port=t.port,r.pathname||r.search){var v=r.pathname||"",d=r.search||"";r.path=v+d}return r.slashes=r.slashes||t.slashes,r.href=r.format(),r}var b=r.pathname&&"/"===r.pathname.charAt(0),j=t.host||t.pathname&&"/"===t.pathname.charAt(0),O=j||b||r.host&&t.pathname,w=O,x=r.pathname&&r.pathname.split("/")||[],A=(m=t.pathname&&t.pathname.split("/")||[],r.protocol&&!g[r.protocol]);if(A&&(r.hostname="",r.port=null,r.host&&(""===x[0]?x[0]=r.host:x.unshift(r.host)),r.host="",t.protocol&&(t.hostname=null,t.port=null,t.host&&(""===m[0]?m[0]=t.host:m.unshift(t.host)),t.host=null),O=O&&(""===m[0]||""===x[0])),j)r.host=t.host||""===t.host?t.host:r.host,r.hostname=t.hostname||""===t.hostname?t.hostname:r.hostname,r.search=t.search,r.query=t.query,x=m;else if(m.length)x||(x=[]),x.pop(),x=x.concat(m),r.search=t.search,r.query=t.query;else if(!s.isNullOrUndefined(t.search)){if(A){r.hostname=r.host=x.shift();var C=!!(r.host&&r.host.indexOf("@")>0)&&r.host.split("@");C&&(r.auth=C.shift(),r.host=r.hostname=C.shift())}return r.search=t.search,r.query=t.query,s.isNull(r.pathname)&&s.isNull(r.search)||(r.path=(r.pathname?r.pathname:"")+(r.search?r.search:"")),r.href=r.format(),r}if(!x.length)return r.pathname=null,r.search?r.path="/"+r.search:r.path=null,r.href=r.format(),r;for(var I=x.slice(-1)[0],q=(r.host||t.host||x.length>1)&&("."===I||".."===I)||""===I,U=0,k=x.length;k>=0;k--)I=x[k],"."===I?x.splice(k,1):".."===I?(x.splice(k,1),U++):U&&(x.splice(k,1),U--);if(!O&&!w)for(;U--;U)x.unshift("..");!O||""===x[0]||x[0]&&"/"===x[0].charAt(0)||x.unshift(""),q&&"/"!==x.join("/").substr(-1)&&x.push("");var R=""===x[0]||x[0]&&"/"===x[0].charAt(0);if(A){r.hostname=r.host=R?"":x.length?x.shift():"";C=!!(r.host&&r.host.indexOf("@")>0)&&r.host.split("@");C&&(r.auth=C.shift(),r.host=r.hostname=C.shift())}return O=O||r.host&&x.length,O&&!R&&x.unshift(""),x.length?r.pathname=x.join("/"):(r.pathname=null,r.path=null),s.isNull(r.pathname)&&s.isNull(r.search)||(r.path=(r.pathname?r.pathname:"")+(r.search?r.search:"")),r.auth=t.auth||r.auth,r.slashes=r.slashes||t.slashes,r.href=r.format(),r},o.prototype.parseHost=function(){var t=this.host,e=a.exec(t);e&&(e=e[0],":"!==e&&(this.port=e.substr(1)),t=t.substr(0,t.length-e.length)),t&&(this.hostname=t)}},"35e8":function(t,e,r){"use strict";t.exports={isString:function(t){return"string"===typeof t},isObject:function(t){return"object"===typeof t&&null!==t},isNull:function(t){return null===t},isNullOrUndefined:function(t){return null==t}}},"62e4":function(t,e){t.exports=function(t){return t.webpackPolyfill||(t.deprecate=function(){},t.paths=[],t.children||(t.children=[]),Object.defineProperty(t,"loaded",{enumerable:!0,get:function(){return t.l}}),Object.defineProperty(t,"id",{enumerable:!0,get:function(){return t.i}}),t.webpackPolyfill=1),t}},"91dd":function(t,e,r){"use strict";function n(t,e){return Object.prototype.hasOwnProperty.call(t,e)}t.exports=function(t,e,r,o){e=e||"&",r=r||"=";var h={};if("string"!==typeof t||0===t.length)return h;var a=/\+/g;t=t.split(e);var i=1e3;o&&"number"===typeof o.maxKeys&&(i=o.maxKeys);var c=t.length;i>0&&c>i&&(c=i);for(var u=0;u<c;++u){var l,p,f,m,v=t[u].replace(a,"%20"),d=v.indexOf(r);d>=0?(l=v.substr(0,d),p=v.substr(d+1)):(l=v,p=""),f=decodeURIComponent(l),m=decodeURIComponent(p),n(h,f)?s(h[f])?h[f].push(m):h[f]=[h[f],m]:h[f]=m}return h};var s=Array.isArray||function(t){return"[object Array]"===Object.prototype.toString.call(t)}},"9d88":function(t,e,r){(function(t,n){var s;/*! https://mths.be/punycode v1.4.1 by @mathias */(function(o){e&&e.nodeType,t&&t.nodeType;var h="object"==typeof n&&n;h.global!==h&&h.window!==h&&h.self;var a,i=2147483647,c=36,u=1,l=26,p=38,f=700,m=72,v=128,d="-",b=/^xn--/,y=/[^\x20-\x7E]/,g=/[\x2E\u3002\uFF0E\uFF61]/g,j={overflow:"Overflow: input needs wider integers to process","not-basic":"Illegal input >= 0x80 (not a basic code point)","invalid-input":"Invalid input"},O=c-u,w=Math.floor,x=String.fromCharCode;function A(t){throw new RangeError(j[t])}function C(t,e){var r=t.length,n=[];while(r--)n[r]=e(t[r]);return n}function I(t,e){var r=t.split("@"),n="";r.length>1&&(n=r[0]+"@",t=r[1]),t=t.replace(g,".");var s=t.split("."),o=C(s,e).join(".");return n+o}function q(t){var e,r,n=[],s=0,o=t.length;while(s<o)e=t.charCodeAt(s++),e>=55296&&e<=56319&&s<o?(r=t.charCodeAt(s++),56320==(64512&r)?n.push(((1023&e)<<10)+(1023&r)+65536):(n.push(e),s--)):n.push(e);return n}function U(t){return C(t,(function(t){var e="";return t>65535&&(t-=65536,e+=x(t>>>10&1023|55296),t=56320|1023&t),e+=x(t),e})).join("")}function k(t){return t-48<10?t-22:t-65<26?t-65:t-97<26?t-97:c}function R(t,e){return t+22+75*(t<26)-((0!=e)<<5)}function S(t,e,r){var n=0;for(t=r?w(t/f):t>>1,t+=w(t/e);t>O*l>>1;n+=c)t=w(t/O);return w(n+(O+1)*t/(t+p))}function N(t){var e,r,n,s,o,h,a,p,f,b,y=[],g=t.length,j=0,O=v,x=m;for(r=t.lastIndexOf(d),r<0&&(r=0),n=0;n<r;++n)t.charCodeAt(n)>=128&&A("not-basic"),y.push(t.charCodeAt(n));for(s=r>0?r+1:0;s<g;){for(o=j,h=1,a=c;;a+=c){if(s>=g&&A("invalid-input"),p=k(t.charCodeAt(s++)),(p>=c||p>w((i-j)/h))&&A("overflow"),j+=p*h,f=a<=x?u:a>=x+l?l:a-x,p<f)break;b=c-f,h>w(i/b)&&A("overflow"),h*=b}e=y.length+1,x=S(j-o,e,0==o),w(j/e)>i-O&&A("overflow"),O+=w(j/e),j%=e,y.splice(j++,0,O)}return U(y)}function P(t){var e,r,n,s,o,h,a,p,f,b,y,g,j,O,C,I=[];for(t=q(t),g=t.length,e=v,r=0,o=m,h=0;h<g;++h)y=t[h],y<128&&I.push(x(y));n=s=I.length,s&&I.push(d);while(n<g){for(a=i,h=0;h<g;++h)y=t[h],y>=e&&y<a&&(a=y);for(j=n+1,a-e>w((i-r)/j)&&A("overflow"),r+=(a-e)*j,e=a,h=0;h<g;++h)if(y=t[h],y<e&&++r>i&&A("overflow"),y==e){for(p=r,f=c;;f+=c){if(b=f<=o?u:f>=o+l?l:f-o,p<b)break;C=p-b,O=c-b,I.push(x(R(b+C%O,0))),p=w(C/O)}I.push(x(R(p,0))),o=S(r,j,n==s),r=0,++n}++r,++e}return I.join("")}function E(t){return I(t,(function(t){return b.test(t)?N(t.slice(4).toLowerCase()):t}))}function F(t){return I(t,(function(t){return y.test(t)?"xn--"+P(t):t}))}a={version:"1.4.1",ucs2:{decode:q,encode:U},decode:N,encode:P,toASCII:F,toUnicode:E},s=function(){return a}.call(e,r,e,t),void 0===s||(t.exports=s)})()}).call(this,r("62e4")(t),r("c8ba"))},b383:function(t,e,r){"use strict";e.decode=e.parse=r("91dd"),e.encode=e.stringify=r("e099")},e099:function(t,e,r){"use strict";var n=function(t){switch(typeof t){case"string":return t;case"boolean":return t?"true":"false";case"number":return isFinite(t)?t:"";default:return""}};t.exports=function(t,e,r,a){return e=e||"&",r=r||"=",null===t&&(t=void 0),"object"===typeof t?o(h(t),(function(h){var a=encodeURIComponent(n(h))+r;return s(t[h])?o(t[h],(function(t){return a+encodeURIComponent(n(t))})).join(e):a+encodeURIComponent(n(t[h]))})).join(e):a?encodeURIComponent(n(a))+r+encodeURIComponent(n(t)):""};var s=Array.isArray||function(t){return"[object Array]"===Object.prototype.toString.call(t)};function o(t,e){if(t.map)return t.map(e);for(var r=[],n=0;n<t.length;n++)r.push(e(t[n],n));return r}var h=Object.keys||function(t){var e=[];for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&e.push(r);return e}}}]);
//# sourceMappingURL=chess-lab~cube3-player~cube3-solver~dynamic-labeled-cube3~writer.6356a121.js.map