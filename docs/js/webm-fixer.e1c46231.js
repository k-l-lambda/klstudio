(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["webm-fixer"],{"66f1":function(e,t,n){"use strict";n.r(t);var a=function(){var e=this,t=e.$createElement,n=e._self._c||t;return n("div",{staticClass:"webm-fixer",class:{"drag-hover":e.drageHover},on:{dragover:function(t){t.preventDefault(),e.drageHover=!0},dragleave:function(t){e.drageHover=!1},drop:function(t){return t.preventDefault(),e.onDropFiles(t)}}},[n("main",[e.videoURL?n("video",{ref:"video",attrs:{controls:"",src:e.videoURL},on:{loadedmetadata:e.onVideoLoadMeta,seeked:e.onVideoSeeked}}):e._e(),n("p",[e.fixedURL?n("a",{attrs:{download:e.fileName,href:e.fixedURL}},[e._v(e._s(e.fileName))]):e._e()])])])},i=[],r=n("ec99"),o=n.n(r),p=(n("8701"),{name:"webm-fixer",data(){return{drageHover:!1,videoURL:null,fixedURL:null,fileName:null}},methods:{onDropFiles(e){this.drageHover=!1,this.fixedURL=null,this.fileName=null;const t=e.dataTransfer.files[0];"video/webm"===t.type&&this.fixFile(t)},async fixFile(e){if(this.videoURL=URL.createObjectURL(e),await new Promise(e=>this.onLoadMetaCallback=e),Number.isFinite(this.$refs.video.duration))console.log("Duation is valid, no need to fix:",this.$refs.video.duration);else{if(this.$refs.video.currentTime=1e9,await new Promise(e=>this.onSeekedCallback=e),console.debug("duration:",this.$refs.video.duration),!Number.isFinite(this.$refs.video.duration))return void console.warn("Did not get a valid duration:",this.$refs.video.duration);const t=await new Promise(t=>o()(e,1e3*this.$refs.video.duration,t));this.fixedURL=URL.createObjectURL(t),this.fileName=e.name.replace(/\.\w+$/,"")+"-fixed.webm"}},onVideoLoadMeta(){this.onLoadMetaCallback&&(this.onLoadMetaCallback(),this.onLoadMetaCallback=null)},onVideoSeeked(){this.onSeekedCallback&&(this.onSeekedCallback(),this.onSeekedCallback=null)}}}),y=p,m=(n("843c"),n("0c7c")),s=Object(m["a"])(y,a,i,!1,null,"b85baa74",null);t["default"]=s.exports},"843c":function(e,t,n){"use strict";var a=n("e61f"),i=n.n(a);i.a},8701:function(e,t,n){"use strict";"function"===typeof File&&(File.prototype.readAs=function(e){return new Promise(t=>{const n=new FileReader;n.onload=()=>t(n.result),n[`readAs${e}`](this)})})},e61f:function(e,t,n){},ec99:function(e,t,n){var a,i;(function(r,o){a=o,i="function"===typeof a?a.call(t,n,t,e):a,void 0===i||(e.exports=i)})(0,(function(){var e={172351395:{name:"EBML",type:"Container"},646:{name:"EBMLVersion",type:"Uint"},759:{name:"EBMLReadVersion",type:"Uint"},754:{name:"EBMLMaxIDLength",type:"Uint"},755:{name:"EBMLMaxSizeLength",type:"Uint"},642:{name:"DocType",type:"String"},647:{name:"DocTypeVersion",type:"Uint"},645:{name:"DocTypeReadVersion",type:"Uint"},108:{name:"Void",type:"Binary"},63:{name:"CRC-32",type:"Binary"},190023271:{name:"SignatureSlot",type:"Container"},16010:{name:"SignatureAlgo",type:"Uint"},16026:{name:"SignatureHash",type:"Uint"},16037:{name:"SignaturePublicKey",type:"Binary"},16053:{name:"Signature",type:"Binary"},15963:{name:"SignatureElements",type:"Container"},15995:{name:"SignatureElementList",type:"Container"},9522:{name:"SignedElement",type:"Binary"},139690087:{name:"Segment",type:"Container"},21863284:{name:"SeekHead",type:"Container"},3515:{name:"Seek",type:"Container"},5035:{name:"SeekID",type:"Binary"},5036:{name:"SeekPosition",type:"Uint"},88713574:{name:"Info",type:"Container"},13220:{name:"SegmentUID",type:"Binary"},13188:{name:"SegmentFilename",type:"String"},1882403:{name:"PrevUID",type:"Binary"},1868715:{name:"PrevFilename",type:"String"},2013475:{name:"NextUID",type:"Binary"},1999803:{name:"NextFilename",type:"String"},1092:{name:"SegmentFamily",type:"Binary"},10532:{name:"ChapterTranslate",type:"Container"},10748:{name:"ChapterTranslateEditionUID",type:"Uint"},10687:{name:"ChapterTranslateCodec",type:"Uint"},10661:{name:"ChapterTranslateID",type:"Binary"},710577:{name:"TimecodeScale",type:"Uint"},1161:{name:"Duration",type:"Float"},1121:{name:"DateUTC",type:"Date"},15273:{name:"Title",type:"String"},3456:{name:"MuxingApp",type:"String"},5953:{name:"WritingApp",type:"String"},103:{name:"Timecode",type:"Uint"},6228:{name:"SilentTracks",type:"Container"},6359:{name:"SilentTrackNumber",type:"Uint"},39:{name:"Position",type:"Uint"},43:{name:"PrevSize",type:"Uint"},35:{name:"SimpleBlock",type:"Binary"},32:{name:"BlockGroup",type:"Container"},33:{name:"Block",type:"Binary"},34:{name:"BlockVirtual",type:"Binary"},13729:{name:"BlockAdditions",type:"Container"},38:{name:"BlockMore",type:"Container"},110:{name:"BlockAddID",type:"Uint"},37:{name:"BlockAdditional",type:"Binary"},27:{name:"BlockDuration",type:"Uint"},122:{name:"ReferencePriority",type:"Uint"},123:{name:"ReferenceBlock",type:"Int"},125:{name:"ReferenceVirtual",type:"Int"},36:{name:"CodecState",type:"Binary"},13730:{name:"DiscardPadding",type:"Int"},14:{name:"Slices",type:"Container"},104:{name:"TimeSlice",type:"Container"},76:{name:"LaceNumber",type:"Uint"},77:{name:"FrameNumber",type:"Uint"},75:{name:"BlockAdditionID",type:"Uint"},78:{name:"Delay",type:"Uint"},79:{name:"SliceDuration",type:"Uint"},72:{name:"ReferenceFrame",type:"Container"},73:{name:"ReferenceOffset",type:"Uint"},74:{name:"ReferenceTimeCode",type:"Uint"},47:{name:"EncryptedBlock",type:"Binary"},106212971:{name:"Tracks",type:"Container"},46:{name:"TrackEntry",type:"Container"},87:{name:"TrackNumber",type:"Uint"},13253:{name:"TrackUID",type:"Uint"},3:{name:"TrackType",type:"Uint"},57:{name:"FlagEnabled",type:"Uint"},8:{name:"FlagDefault",type:"Uint"},5546:{name:"FlagForced",type:"Uint"},28:{name:"FlagLacing",type:"Uint"},11751:{name:"MinCache",type:"Uint"},11768:{name:"MaxCache",type:"Uint"},254851:{name:"DefaultDuration",type:"Uint"},216698:{name:"DefaultDecodedFieldDuration",type:"Uint"},209231:{name:"TrackTimecodeScale",type:"Float"},4991:{name:"TrackOffset",type:"Int"},5614:{name:"MaxBlockAdditionID",type:"Uint"},4974:{name:"Name",type:"String"},177564:{name:"Language",type:"String"},6:{name:"CodecID",type:"String"},9122:{name:"CodecPrivate",type:"Binary"},362120:{name:"CodecName",type:"String"},13382:{name:"AttachmentLink",type:"Uint"},1742487:{name:"CodecSettings",type:"String"},1785920:{name:"CodecInfoURL",type:"String"},438848:{name:"CodecDownloadURL",type:"String"},42:{name:"CodecDecodeAll",type:"Uint"},12203:{name:"TrackOverlay",type:"Uint"},5802:{name:"CodecDelay",type:"Uint"},5819:{name:"SeekPreRoll",type:"Uint"},9764:{name:"TrackTranslate",type:"Container"},9980:{name:"TrackTranslateEditionUID",type:"Uint"},9919:{name:"TrackTranslateCodec",type:"Uint"},9893:{name:"TrackTranslateTrackID",type:"Binary"},96:{name:"Video",type:"Container"},26:{name:"FlagInterlaced",type:"Uint"},5048:{name:"StereoMode",type:"Uint"},5056:{name:"AlphaMode",type:"Uint"},5049:{name:"OldStereoMode",type:"Uint"},48:{name:"PixelWidth",type:"Uint"},58:{name:"PixelHeight",type:"Uint"},5290:{name:"PixelCropBottom",type:"Uint"},5307:{name:"PixelCropTop",type:"Uint"},5324:{name:"PixelCropLeft",type:"Uint"},5341:{name:"PixelCropRight",type:"Uint"},5296:{name:"DisplayWidth",type:"Uint"},5306:{name:"DisplayHeight",type:"Uint"},5298:{name:"DisplayUnit",type:"Uint"},5299:{name:"AspectRatioType",type:"Uint"},963876:{name:"ColourSpace",type:"Binary"},1029411:{name:"GammaValue",type:"Float"},230371:{name:"FrameRate",type:"Float"},97:{name:"Audio",type:"Container"},53:{name:"SamplingFrequency",type:"Float"},14517:{name:"OutputSamplingFrequency",type:"Float"},31:{name:"Channels",type:"Uint"},15739:{name:"ChannelPositions",type:"Binary"},8804:{name:"BitDepth",type:"Uint"},98:{name:"TrackOperation",type:"Container"},99:{name:"TrackCombinePlanes",type:"Container"},100:{name:"TrackPlane",type:"Container"},101:{name:"TrackPlaneUID",type:"Uint"},102:{name:"TrackPlaneType",type:"Uint"},105:{name:"TrackJoinBlocks",type:"Container"},109:{name:"TrackJoinUID",type:"Uint"},64:{name:"TrickTrackUID",type:"Uint"},65:{name:"TrickTrackSegmentUID",type:"Binary"},70:{name:"TrickTrackFlag",type:"Uint"},71:{name:"TrickMasterTrackUID",type:"Uint"},68:{name:"TrickMasterTrackSegmentUID",type:"Binary"},11648:{name:"ContentEncodings",type:"Container"},8768:{name:"ContentEncoding",type:"Container"},4145:{name:"ContentEncodingOrder",type:"Uint"},4146:{name:"ContentEncodingScope",type:"Uint"},4147:{name:"ContentEncodingType",type:"Uint"},4148:{name:"ContentCompression",type:"Container"},596:{name:"ContentCompAlgo",type:"Uint"},597:{name:"ContentCompSettings",type:"Binary"},4149:{name:"ContentEncryption",type:"Container"},2017:{name:"ContentEncAlgo",type:"Uint"},2018:{name:"ContentEncKeyID",type:"Binary"},2019:{name:"ContentSignature",type:"Binary"},2020:{name:"ContentSigKeyID",type:"Binary"},2021:{name:"ContentSigAlgo",type:"Uint"},2022:{name:"ContentSigHashAlgo",type:"Uint"},206814059:{name:"Cues",type:"Container"},59:{name:"CuePoint",type:"Container"},51:{name:"CueTime",type:"Uint"},55:{name:"CueTrackPositions",type:"Container"},119:{name:"CueTrack",type:"Uint"},113:{name:"CueClusterPosition",type:"Uint"},112:{name:"CueRelativePosition",type:"Uint"},50:{name:"CueDuration",type:"Uint"},4984:{name:"CueBlockNumber",type:"Uint"},106:{name:"CueCodecState",type:"Uint"},91:{name:"CueReference",type:"Container"},22:{name:"CueRefTime",type:"Uint"},23:{name:"CueRefCluster",type:"Uint"},4959:{name:"CueRefNumber",type:"Uint"},107:{name:"CueRefCodecState",type:"Uint"},155296873:{name:"Attachments",type:"Container"},8615:{name:"AttachedFile",type:"Container"},1662:{name:"FileDescription",type:"String"},1646:{name:"FileName",type:"String"},1632:{name:"FileMimeType",type:"String"},1628:{name:"FileData",type:"Binary"},1710:{name:"FileUID",type:"Uint"},1653:{name:"FileReferral",type:"Binary"},1633:{name:"FileUsedStartTime",type:"Uint"},1634:{name:"FileUsedEndTime",type:"Uint"},4433776:{name:"Chapters",type:"Container"},1465:{name:"EditionEntry",type:"Container"},1468:{name:"EditionUID",type:"Uint"},1469:{name:"EditionFlagHidden",type:"Uint"},1499:{name:"EditionFlagDefault",type:"Uint"},1501:{name:"EditionFlagOrdered",type:"Uint"},54:{name:"ChapterAtom",type:"Container"},13252:{name:"ChapterUID",type:"Uint"},5716:{name:"ChapterStringUID",type:"String"},17:{name:"ChapterTimeStart",type:"Uint"},18:{name:"ChapterTimeEnd",type:"Uint"},24:{name:"ChapterFlagHidden",type:"Uint"},1432:{name:"ChapterFlagEnabled",type:"Uint"},11879:{name:"ChapterSegmentUID",type:"Binary"},11964:{name:"ChapterSegmentEditionUID",type:"Uint"},9155:{name:"ChapterPhysicalEquiv",type:"Uint"},15:{name:"ChapterTrack",type:"Container"},9:{name:"ChapterTrackNumber",type:"Uint"},0:{name:"ChapterDisplay",type:"Container"},5:{name:"ChapString",type:"String"},892:{name:"ChapLanguage",type:"String"},894:{name:"ChapCountry",type:"String"},10564:{name:"ChapProcess",type:"Container"},10581:{name:"ChapProcessCodecID",type:"Uint"},1293:{name:"ChapProcessPrivate",type:"Binary"},10513:{name:"ChapProcessCommand",type:"Container"},10530:{name:"ChapProcessTime",type:"Uint"},10547:{name:"ChapProcessData",type:"Binary"},39109479:{name:"Tags",type:"Container"},13171:{name:"Tag",type:"Container"},9152:{name:"Targets",type:"Container"},10442:{name:"TargetTypeValue",type:"Uint"},9162:{name:"TargetType",type:"String"},9157:{name:"TagTrackUID",type:"Uint"},9161:{name:"TagEditionUID",type:"Uint"},9156:{name:"TagChapterUID",type:"Uint"},9158:{name:"TagAttachmentUID",type:"Uint"},10184:{name:"SimpleTag",type:"Container"},1443:{name:"TagName",type:"String"},1146:{name:"TagLanguage",type:"String"},1156:{name:"TagDefault",type:"Uint"},1159:{name:"TagString",type:"String"},1157:{name:"TagBinary",type:"Binary"}};function t(e,t){e.prototype=Object.create(t.prototype),e.prototype.constructor=e}function n(e,t){this.name=e||"Unknown",this.type=t||"Unknown"}function a(e,t){n.call(this,e,t||"Uint")}function i(e){return e.length%2===1?"0"+e:e}function r(e,t){n.call(this,e,t||"Float")}function o(e,t){n.call(this,e,t||"Container")}function p(e){o.call(this,"File","File"),this.setSource(e)}return n.prototype.updateBySource=function(){},n.prototype.setSource=function(e){this.source=e,this.updateBySource()},n.prototype.updateByData=function(){},n.prototype.setData=function(e){this.data=e,this.updateByData()},t(a,n),a.prototype.updateBySource=function(){this.data="";for(var e=0;e<this.source.length;e++){var t=this.source[e].toString(16);this.data+=i(t)}},a.prototype.updateByData=function(){var e=this.data.length/2;this.source=new Uint8Array(e);for(var t=0;t<e;t++){var n=this.data.substr(2*t,2);this.source[t]=parseInt(n,16)}},a.prototype.getValue=function(){return parseInt(this.data,16)},a.prototype.setValue=function(e){this.setData(i(e.toString(16)))},t(r,n),r.prototype.getFloatArrayType=function(){return this.source&&4===this.source.length?Float32Array:Float64Array},r.prototype.updateBySource=function(){var e=this.source.reverse(),t=this.getFloatArrayType(),n=new t(e.buffer);this.data=n[0]},r.prototype.updateByData=function(){var e=this.getFloatArrayType(),t=new e([this.data]),n=new Uint8Array(t.buffer);this.source=n.reverse()},r.prototype.getValue=function(){return this.data},r.prototype.setValue=function(e){this.setData(e)},t(o,n),o.prototype.readByte=function(){return this.source[this.offset++]},o.prototype.readUint=function(){for(var e=this.readByte(),t=8-e.toString(2).length,n=e-(1<<7-t),a=0;a<t;a++)n*=256,n+=this.readByte();return n},o.prototype.updateBySource=function(){for(this.data=[],this.offset=0;this.offset<this.source.length;this.offset=p){var t=this.readUint(),i=this.readUint(),p=Math.min(this.offset+i,this.source.length),y=this.source.slice(this.offset,p),m=e[t]||{name:"Unknown",type:"Unknown"},s=n;switch(m.type){case"Container":s=o;break;case"Uint":s=a;break;case"Float":s=r;break}var c=new s(m.name,m.type);c.setSource(y),this.data.push({id:t,idHex:t.toString(16),data:c})}},o.prototype.writeUint=function(e,t){for(var n=1,a=128;e>=a&&n<8;n++,a*=128);if(!t)for(var i=a+e,r=n-1;r>=0;r--){var o=i%256;this.source[this.offset+r]=o,i=(i-o)/256}this.offset+=n},o.prototype.writeSections=function(e){this.offset=0;for(var t=0;t<this.data.length;t++){var n=this.data[t],a=n.data.source,i=a.length;this.writeUint(n.id,e),this.writeUint(i,e),e||this.source.set(a,this.offset),this.offset+=i}return this.offset},o.prototype.updateByData=function(){var e=this.writeSections("draft");this.source=new Uint8Array(e),this.writeSections()},o.prototype.getSectionById=function(e){for(var t=0;t<this.data.length;t++){var n=this.data[t];if(n.id===e)return n.data}return null},t(p,o),p.prototype.fixDuration=function(e){var t=this.getSectionById(139690087);if(!t)return console.log("[fix-webm-duration] Segment section is missing"),!1;var n=t.getSectionById(88713574);if(!n)return console.log("[fix-webm-duration] Info section is missing"),!1;var a=n.getSectionById(710577);if(!a)return console.log("[fix-webm-duration] TimecodeScale section is missing"),!1;var i=n.getSectionById(1161);if(i){if(!(i.getValue()<=0))return console.log("[fix-webm-duration] Duration section is present"),!1;console.log("[fix-webm-duration] Duration section is present, but the value is empty"),i.setValue(e)}else console.log("[fix-webm-duration] Duration section is missing"),i=new r("Duration","Float"),i.setValue(e),n.data.push({id:1161,data:i});return a.setValue(1e6),n.updateByData(),t.updateByData(),this.updateByData(),!0},p.prototype.toBlob=function(){return new Blob([this.source.buffer],{type:"video/webm"})},function(e,t,n){try{var a=new FileReader;a.onloadend=function(){try{var i=new p(new Uint8Array(a.result));i.fixDuration(t)&&(e=i.toBlob())}catch(r){}n(e)},a.readAsArrayBuffer(e)}catch(i){n(e)}}}))}}]);
//# sourceMappingURL=webm-fixer.e1c46231.js.map