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
	--BeginLevel = 15,

	[1] =
	{
		AiPower = 0.3,
		AiLayouts =
		{
			{
				{0, 4},
			},
		},
	},

	[2] =
	{
		AiPower = 0.3,
		AiLayouts =
		{
			{
				{-1, 3}, {1, 3},
			},
		},
	},

	[3] =
	{
		AiPower = 0.3,
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
		Duration = 16,
		PassScore = 5,
		Player = {-14, -14, yaw = 45},
		AiLayouts =
		{
			{
				{12, 12, yaw = 45},
			},
		},
	},

	[5] =
	{
		AiPower = 0.3,
		AiLayouts =
		{
			{
				{-3, 3}, {-1, 3}, {1, 3}, {3, 3},
			},
			{
				{-1, 2}, {1, 2}, {-1, 4}, {1, 4},
			},
			{
				{0, 2}, {-1, 4}, {1, 4}, {0, 6},
			},
		},
	},

	[6] =
	{
		AiPower = 0.3,
		AiLayouts =
		{
			{
				{-4, 3}, {-2, 3}, {0, 3}, {2, 3}, {4, 3},
			},
			{
				{0, 2}, {-1, 4}, {1, 4}, {-2, 6}, {2, 6}
			},
			{
				{0, 2}, {-3, 4}, {-1, 4}, {1, 4}, {3, 4},
			},
			{
				{-1, 2}, {1, 2}, {-2, 4}, {0, 4}, {2, 4},
			},
		},
	},

	[7] =
	{
		AiPower = 0.3,
		AiLayouts =
		{
			{
				{-5, 3}, {-3, 3}, {-1, 3}, {1, 3}, {3, 3}, {5, 3},
			},
			{
				{-1, 2}, {1, 2}, {-1, 4}, {1, 4}, {-1, 6}, {1, 6},
			},
			{
				{-4, 2, yaw = 90}, {-4, 4, yaw = 90}, {-4, 6, yaw = 90}, {4, 2, yaw = -90}, {4, 4, yaw = -90}, {4, 6, yaw = -90},
			},
			{
				{-5, 2}, {-3, 3}, {-1, 4}, {1, 4}, {3, 3}, {5, 2},
			},
			{
				{0, 2}, {-1, 4}, {1, 4}, {-2, 6}, {0, 6}, {2, 6},
			},
		},
	},

	[8] =
	{
		Player = {0, 0},

		AiPower = 0.6,
		AiLayouts =
		{
			{
				{0, -3, yaw = 0},
			},
		},
	},

	[9] =
	{
		AiPower = 0.6,
		AiLayouts =
		{
			{
				{0, 1}, {-3, -6, yaw = 0}, {3, -6, yaw = 0},
			},
		},
	},

	[10] =
	{
		AiPower = 0.6,
		Player = {0, 0},

		AiLayouts =
		{
			{
				{-2, 5}, {2, 5}, {-2, -5, yaw = 0}, {2, -5, yaw = 0}, {-5, 0, yaw = 90}, {5, 0, yaw = -90},
			},
			{
				{5, -2, yaw = -90}, {5, 2, yaw = -90}, {-5, -2, yaw = 90}, {-5, 2, yaw = 90}, {0, -5, yaw = 0}, {0, 5},
			},
		},
	},

	[11] =
	{
		AiLayouts =
		{
			{
				{-6, 3}, {-4, 3}, {-2, 3}, {0, 3}, {2, 3}, {4, 3}, {6, 3},
			},
			{
				{-6, 4}, {-4, 3}, {-2, 2}, {0, 1}, {2, 2}, {4, 3}, {6, 4},
			},
			{
				{-2, 2}, {0, 2}, {2, 2}, {-1, 4}, {1, 4}, {-1, 6}, {1, 6},
			},
			{
				{-3, 4}, {0, 4}, {3, 4}, {-4, 0, yaw = 90}, {-4, -3, yaw = 90}, {4, 0, yaw = -90}, {4, -3, yaw = -90},
			},
			{
				{-2, 2}, {0, 2}, {2, 2}, {-3, 4}, {-1, 4}, {1, 4}, {3, 4},
			},
		},
	},

	[12] =
	{
		Duration = 4,
		PassScore = 10,
		Player = {-14, -14, yaw = 45},
		AiLayouts =
		{
			{
				{15, 15, yaw = 45},
			},
		},
	},

	[13] =
	{
		Player = {0, 0},

		AiLayouts =
		{
			{
				{0, 3, yaw = 180}, {0, -3, yaw = 0}, {3, 0, yaw = -90}, {-3, 0, yaw = 90}, {-2, 2, yaw = 135}, {2, 2, yaw = -135}, {-2, -2, yaw = 45}, {2, -2, yaw = -45},
			},
			{
				{-3, 3}, {-1, 3}, {1, 3}, {3, 3}, {-3, -3, yaw = 0}, {-1, -3, yaw = 0}, {1, -3, yaw = 0}, {3, -3, yaw = 0},
			},
			{
				{-3, -3, yaw = 90}, {-3, -1, yaw = 90}, {-3, 1, yaw = 90}, {-3, 3, yaw = 90}, {3, -3, yaw = -90}, {3, -1, yaw = -90}, {3, 1, yaw = -90}, {3, 3, yaw = -90},
			},
			{
				{0, 2, yaw = 180}, {0, 4, yaw = 180}, {0, -2, yaw = 0}, {0, -4, yaw = 0}, {2, 0, yaw = -90}, {4, 0, yaw = -90}, {-2, 0, yaw = 90}, {-4, 0, yaw = 90},
			},
		},
	},

	[14] =
	{
		AiPower = 1,
		PassScore = 30,
		AiLayouts =
		{
			{
				{0, 3}, {0, 3, y = 3.8}, {0, 3, y = 6.8}, {-2, 2}, {-2, 2, y = 3.8}, {-2, 2, y = 6.8}, {2, 2}, {2, 2, y = 3.8}, {2, 2, y = 6.8},
			},
		},
	},

	[15] =
	{
		AiPower = 1,
		PassScore = 45,
		AiLayouts =
		{
			{
				{0, 3}, {0, 3, y = 6.8}, {0, 3, y = 12.8}, {0, 3, y = 18.8}, {0, 3, y = 24.8}, {0, 3, y = 30.8}, {0, 3, y = 36.8}, {0, 3, y = 42.8}, {0, 3, y = 48.8},
			},
		},
	},

	[16] =
	{
		AiPower = 1,
		AiLayouts =
		{
			{
				{0, 3}, {0, -5.4, y = 60}, {-1, -4, y = 66}, {1, -2, y = 74}, {-3, 2, y = 82}, {2, 5, y = 98}, {-4, 4, y = 170}, {6, 1, y = 280},
			},
		},
	},

	[17] =
	{
		Duration = 1,
		PassScore = 18,
		Player = {-14, -14, yaw = 45},
		AiLayouts =
		{
			{
				{15, 15, yaw = 45},
			},
		},
	},

	[18] =
	{
		AiLayouts =
		{
			{
				{-9, 3}, {-7, 3}, {-5, 3}, {-3, 3}, {-1, 3}, {1, 3}, {3, 3}, {5, 3}, {7, 3}, {9, 3},
			},
			{
				{0, 0}, {-1, 2}, {1, 2}, {-2, 4}, {0, 4}, {2, 4}, {-4, 6}, {-2, 6}, {0, 6}, {2, 6}, {4, 6},
			},
		},
	},
}
