--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	AiCar.agent.lua
--]]

Tanx.log("[Dodgem\\AiCar.agent.lua]: parsed.")

Tanx.dofile"Automobile.lua"


iif = iif or function(condition, truepart, falsepart)
	if condition then
		return truepart
	end

	return falsepart
end


local function computeOrientationAngle(orientation, rel_position)
	--return g_Time * 0.6
	-- TODO:
end

local function computeOrientationVector(orientation, rel_position)
	local v = Tanx.Vector2(rel_position:dotProduct(orientation:xAxis()), rel_position:dotProduct(orientation:zAxis()))

	return v:normalisedCopy()
end

local function chaseTarget(target)
	--return {x = math.sin(g_Time * 0.4), y = 0.3}

	--[[local orientagnle = computeOrientationAngle(g_Agent:getMainBody():get():getOrientation(), g_Target:get():getMainBody():get():getPosition() - g_Agent:getMainBody():get():getPosition())
	orientagnle = orientagnle / (math.pi * 2)
	orientagnle = orientagnle - math.floor(orientagnle)
	if orientagnle > 0.5 then
		orientagnle = orientagnle - 1
	end
	orientagnle = orientagnle * math.pi * 2]]

	local orientvector = computeOrientationVector(g_Agent:getMainBody():get():getOrientation(), g_Target:get():getMainBody():get():getPosition() - g_Agent:getMainBody():get():getPosition())
	local x = math.pow(math.abs(orientvector.x), 0.3)
	x = iif(orientvector.x > 0, x, -x)
	local y = math.pow((orientvector.y + 1) / 2, 4.2) + 0.1

	return {x = -x, y = y}
end


host =
{
	preCreate = function(world, config, params)
		g_World = world

		g_Target = params:at"target":get()
		--Tanx.log("[Dodgem\\AiCar.agent.lua]: target: " .. g_Target:get():getName())
	end,

	postCreate = function(agent)
		g_Agent = agent

		--local action = Tanx.VehicleBook.getSingleton():at"Dodgem/Dodgem":make(agent:getMainBody())
		--g_Driver = action:get().m_deviceStatus:toDerived()
		g_PlayerAutomobile = Automobile(g_Agent:getMainBody(), "Dodgem/Dodgem")

		g_Time = 0
	end,

	onStep = function(elapsed)
		local driver = chaseTarget(g_Target)

		g_PlayerAutomobile.Driver.m_positionX = driver.x
		g_PlayerAutomobile.Driver.m_positionY = driver.y

		g_PlayerAutomobile:step(elapsed)

		g_Time = g_Time + elapsed
	end,
}
