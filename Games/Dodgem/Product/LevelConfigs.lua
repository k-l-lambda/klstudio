--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	Dodgem\LevelConfigs.lua
--]]

Tanx.log("[Dodgem\\LevelConfigs.lua]: parsed.")


g_LevelConfigs =
{
	[1] =
	{
		AiLayouts =
		{
			{
				{0, 3},
			},
		},
	},

	[2] =
	{
		AiLayouts =
		{
			{
				{-1, 3}, {1, 3},
			},
		},
	},

	[3] =
	{
		AiLayouts =
		{
			{
				{0, 2}, {-1, 4}, {1, 4},
			},
			{
				{-2, 3}, {0, 3}, {2, 3},
			},
		},
	},

	[4] =
	{
		AiLayouts =
		{
			{
				{-1, 2}, {1, 2}, {-1, 4}, {1, 4},
			},
			{
				{0, 2}, {-1, 4}, {1, 4}, {0, 6},
			},
		},
	},
}
