/*
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.
*/

init = function() {
	var canvas = document.getElementById("tanx");

	var requestVersion = canvas.attributes["requestVersion"].value;
	if (tanxjs.util.requiredVersionAvailable(requestVersion)) {
		var pack = canvas.attributes["package"].value;
		var game = canvas.attributes["game"].value;
		var envelopePathFormat = canvas.attributes["envelopePathFormat"];
		var envelope = canvas.attributes["envelope"];

		var inner = ""
		inner += '<object classid="CLSID:E8C87B51-B729-41bc-8510-404ACB3225B5" style="width: 100%; height: 100%;">';
		inner += '	<param name="type" value="application/x-klstudio.tanx" />';
		inner += '	<param name="src" value="' + pack + '" />';
		inner += '	<param name="game" value="' + game + '" />';
		if (envelopePathFormat)
			inner += '	<param name="envelopepathformat" value="' + envelopePathFormat.value + '" />';
		if (envelope)
			inner += '	<param name="envelope" value="' + envelope.value + '" />';
		inner += '</object>';

		canvas.innerHTML = inner;
	}
	else {
		var subMessage = tanxjs.util.getPluginVersion() ? "This page requires a newer version of the K.L.'s Tanx plugin." : "This page requires the K.L.'s Tanx plugin to be installed.";
		canvas.innerHTML =
			'<div style="background: lightblue; width: 100%; height: 100%; text-align:center;">' +
			'	<img src="res/Cover_Threebody.png" style="width:100%; max-width:640px">' +
			'	<br/><br/>' + subMessage + '<br/>' +
			'	<a href="../tanx.html">Click here to download.</a>' +
			'</div>'
			;
	}
};
