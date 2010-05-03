--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	AiCar.agent.lua
--]]

Tanx.log("[Dodgem\\Sparks.agent.lua]: parsed.")


host =
{
	preCreate = function(world, config, params)
		g_LifeTime = 0.8
		if params then
			g_LifeTime = params:at"life":get() or g_LifeTime
		end
	end,

	postCreate = function(controller)
		g_Controller = controller

		g_Time = 0
	end,

	onStep = function(elapsed)
		g_Time = g_Time + elapsed

		if g_Time > g_LifeTime then
			g_Controller:detachAgent()
		end
	end,
}
