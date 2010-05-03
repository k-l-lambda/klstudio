--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	AiCar.agent.lua
--]]

Tanx.log("[Dodgem\\AiCar.agent.lua]: parsed.")

Tanx.dofile"Core:utility.lua"
Tanx.dofile"Dodgem.lua"


local function computeOrientationAngle(orientation, rel_position)
	--return g_Time * 0.6
	-- TODO:
end

local function computeOrientationVector(orientation, rel_position)
	local v = Tanx.Vector2(rel_position:dotProduct(orientation:xAxis()), rel_position:dotProduct(orientation:zAxis()))

	return v:normalisedCopy()
end

local function chaseTarget(target, driverstate)
	--[[local orientagnle = computeOrientationAngle(g_Agent:getMainBody():get():getOrientation(), g_Target:get():getMainBody():get():getPosition() - g_Agent:getMainBody():get():getPosition())
	orientagnle = orientagnle / (math.pi * 2)
	orientagnle = orientagnle - math.floor(orientagnle)
	if orientagnle > 0.5 then
		orientagnle = orientagnle - 1
	end
	orientagnle = orientagnle * math.pi * 2]]

	local tbodies = target:get():getBodies()
	local body = target:get():getBodies():at(iif(tbodies:size() >= 3, 2, 0))
	local orientvector = computeOrientationVector(g_Agent:getMainBody():get():getOrientation(), body:get():getPosition() - g_Agent:getMainBody():get():getPosition())

	local reverse = orientvector.y < iif(driverstate.y < 0, -0.3, -0.7)
	if reverse then
		return {x = iif(orientvector.x > 0, 1, -1), y = -1}
	end

	local x = math.pow(math.abs(orientvector.x), 0.3)
	x = iif(orientvector.x > 0, x, -x)
	local y = math.pow((orientvector.y + 1) / 2, 4.2) + 0.2

	return {x = -x, y = y * 0.6}
end


host =
{
	preCreate = function(world, config, params)
		g_World = world

		g_Target = params:at"target":get()
	end,

	postCreate = function(controller)
		g_Agent = controller:agent()

		g_Car = Dodgem(g_World, g_Agent:getMainBody(), "Dodgem/Dodgem", {Engine = "EngineEnemy"})

		g_Time = 0
	end,

	onStep = function(elapsed)
		local driver = chaseTarget(g_Target, {x = g_Car.Driver.m_positionX, y = g_Car.Driver.m_positionY})

		g_Car.Driver.m_positionX = driver.x
		g_Car.Driver.m_positionY = driver.y

		g_Car:step(elapsed)

		g_Time = g_Time + elapsed
	end,
}
