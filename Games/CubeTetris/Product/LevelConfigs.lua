--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	LevelConfigs.lua
--]]


Tanx.log("[Tetris\\LevelConfigs.lua]: parsed.")


g_DigLevelConfigs =
{
	[1] =
	{
		BlockLayers		= 4,
		ColorCode		= 1,
		Music			= "Music1",
		LayerSpace		= {min = 1, max = 2},
		Descend			= 0,
	},

	[2] =
	{
		BlockLayers		= 6,
		ColorCode		= 2,
		Music			= "Music3",
		LayerSpace		= {min = 1, max = 3},
		Descend			= 0.08,
	},

	[3] =
	{
		BlockLayers		= 8,
		ColorCode		= 3,
		Music			= "Music2",
		LayerSpace		= {min = 2, max = 3},
		Descend			= 0.14,
	},

	[4] =
	{
		BlockLayers		= 10,
		ColorCode		= 4,
		Music			= "Music1",
		LayerSpace		= {min = 3, max = 4},
		Descend			= 0.14,
	},

	[5] =
	{
		BlockLayers		= 16,
		ColorCode		= 9,
		Music			= "Music4",
		LayerSpace		= {min = 3, max = 7},
		Descend			= 0.24,
	},
}
