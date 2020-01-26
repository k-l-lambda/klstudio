/*
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2011	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.
*/

init = function() {
	var canvas = document.getElementById("tanx");

	var requiredVersion = canvas.attributes["requiredVersion"].value;
	if (tanxjs.util.requiredVersionAvailable(requiredVersion)) {
		var pack = canvas.attributes["package"].value;
		var game = canvas.attributes["game"].value;
		var envelopePathFormat = canvas.attributes["envelopePathFormat"];
		var envelope = canvas.attributes["envelope"];
		var gameparams = canvas.attributes["gameparams"];

		var inner = ""
		if (tanxjs.util.IsMSIE()) {
			inner += '<object classid="CLSID:E8C87B51-B729-41bc-8510-404ACB3225B5" style="width: 100%; height: 100%;">';
			inner += '	<param name="type" value="application/x-klstudio.tanx" />';
			inner += '	<param name="src" value="' + pack + '" />';
			inner += '	<param name="game" value="' + game + '" />';
			if (gameparams)
				inner += '	<param name="gameparams" value="' + gameparams.value + '" />';
			if (envelopePathFormat)
				inner += '	<param name="envelopepathformat" value="' + envelopePathFormat.value + '" />';
			if (envelope)
				inner += '	<param name="envelope" value="' + envelope.value + '" />';
			inner += '</object>';
		}
		else {
			inner += '<embed type="application/x-klstudio.tanx" style="width: 100%; height: 100%;" src="' + pack + '" game="' + game + '"';
			if (gameparams)
				inner += ' gameparams="' + gameparams.value + '"';
			if (envelopePathFormat)
				inner += ' envelopepathformat="' + envelopePathFormat.value + '"';
			if (envelope)
				inner += ' envelope="' + envelope.value + '"';
			inner += ' />';
		}

		canvas.innerHTML = inner;
	}
	else {
		var cover = canvas.attributes["cover"];
		var subMessage = tanxjs.util.getPluginVersion() ? "This page requires a newer version of the K.L.'s Tanx plugin." : "This page requires the K.L.'s Tanx plugin to be installed.";
		var inner = '<div style="background: lightblue; width: 100%; height: 100%; text-align:center;">';

		if (cover)
			inner += '	<img src="' + cover.value + '" style="width:100%; max-width:640px" />';

		inner +=
			'	<br/><br/>' + subMessage + '<br/>' +
			'	<a href="../Tanx.html">Click here to download.</a>' +
			'</div>'
			;

		canvas.innerHTML = inner;
	}
};
