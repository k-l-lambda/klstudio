/*
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.
*/

var tanxjs = tanxjs || {};

tanxjs.util = tanxjs.util || {};

tanxjs.util.PLUGIN_NAME = 'K.L.\'s Tanx';


tanxjs.util.getPluginVersion = function()
{
	var version = null;
	var description = null;
	if(navigator.plugins != null && navigator.plugins.length > 0)
	{
		navigator.plugins.refresh();
		var plugin = navigator.plugins[tanxjs.util.PLUGIN_NAME];
		if (plugin)
		{
			description = plugin.description;
		}
	}
	else if(tanxjs.util.IsMSIE())
	{
		try
		{
			var activeXObject = new ActiveXObject('TanxPluginHost.TanxPluginHostControl');
			description = activeXObject.description;
		}
		catch(e)
		{
			// Tanx plugin was not found.
		}
	}

	if(description)
	{
		var re = /.*version:\s*(\d+)\.(\d+)\.(\d+)\.(\d+).*/;
		// Parse the version out of the description.
		var parts = re.exec(description);
		if (parts && parts.length == 5)
		{
			// make sure the format is #.#.#.#  no whitespace, no trailing comments
			version = '' + parseInt(parts[1], 10) + '.' + parseInt(parts[2], 10) + '.' + parseInt(parts[3], 10) + '.' + parseInt(parts[4], 10);
		}
	}

	return version;
};


tanxjs.util.requiredVersionAvailable = function(requiredVersion)
{
	var version = tanxjs.util.getPluginVersion();
	if(!version)
		return false;

	var haveParts = version.split('.');
	var requiredParts = requiredVersion.split('.');
	if(requiredParts.length > 4)
		throw Error('requiredVersion has more than 4 parts!');

	for(var pp = 0; pp < requiredParts.length; ++pp)
	{
		var have = parseInt(haveParts[pp], 10);
		var required = parseInt(requiredParts[pp], 10);
		if(have < required)
			return false;

		if(have > required)
			return true;
	}

	return true;
};


tanxjs.util.IsMSIE = function() {
	var ua = navigator.userAgent.toLowerCase();
	var msie = /msie/.test(ua) && !/opera/.test(ua);
	return msie;
};
