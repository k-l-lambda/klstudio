--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	AiCar.agent.lua
--]]

Tanx.log("[Dodgem\\AiCar.agent.lua]: parsed.")

Tanx.require"Core:utility.lua"
Tanx.require"Core:StateMachine.lua"
Tanx.dofile"Dodgem.lua"


g_BackOffRemain = 0


local function computeOrientationVector(orientation, rel_position)
	local v = Tanx.Vector2(rel_position:dotProduct(orientation:xAxis()), rel_position:dotProduct(orientation:zAxis()))

	return v:normalisedCopy()
end

local function chaseTarget(target, driverstate)
	local orientvector = computeOrientationVector(g_Agent:getMainBody():get():getOrientation(), target:get():getPosition() - g_Agent:getMainBody():get():getPosition())

	local reverse = orientvector.y < iif(driverstate.y < 0, -0.3, -0.7)
	if reverse then
		return {x = iif(orientvector.x > 0, 1, -1), y = -1}
	end

	local x = math.pow(math.abs(orientvector.x), 0.3)
	x = iif(orientvector.x > 0, x, -x)
	local y = math.pow((orientvector.y + 1) / 2, 4.2) + 0.2

	return {x = -x, y = y * 0.6}
end


g_AgentInterfaces =
{
	enable = function(enabled)
		g_Enabled = enabled
	end
}


g_StateMachine = TanxStateMachine({
	Advancing =
	{
		step = function(state, elapsed)
			local orientvector = computeOrientationVector(g_Agent:getMainBody():get():getOrientation(), g_TargetBody:get():getPosition() - g_Agent:getMainBody():get():getPosition())

			if orientvector.y < -0.7 then
				g_StateMachine:switch"Backoff"
				return
			end

			local x = math.pow(math.abs(orientvector.x), 0.3)
			x = iif(orientvector.x > 0, x, -x)
			local y = math.pow((orientvector.y + 1) / 2, 4.2) + 0.2

			g_Car.Driver.m_positionX = -x
			g_Car.Driver.m_positionY = math.min(y, g_MaxPower)
		end,
	},

	Backoff =
	{
		step = function(state, elapsed)
			local orientvector = computeOrientationVector(g_Agent:getMainBody():get():getOrientation(), g_TargetBody:get():getPosition() - g_Agent:getMainBody():get():getPosition())

			g_Car.Driver.m_positionX = iif(orientvector.x > 0, 1, -1)
			g_Car.Driver.m_positionY = -1

			if orientvector.y > -0.3 and g_BackOffRemain <=0 then
				g_StateMachine:switch"Advancing"
			end

			if g_BackOffRemain > 0 then
				g_BackOffRemain = g_BackOffRemain - elapsed
			end
		end,
	},
}, "Advancing")


host =
{
	preCreate = function(world, config, params)
		g_World = world
		params = params:to_table()

		g_Target = params.target:get()
		g_TargetBody = g_Target:get():findBody"tail"
		if g_TargetBody:get() == nil then
			Tanx.log("[Dodgem\\AiCar.agent.lua]: host.preCreate: cannot find body \"tail\" in target agent.")
			g_TargetBody = target:get():getMainBody()
		end

		onHitTail = Tanx.tofunction(params.onHitTail:get())

		g_MaxPower = 0.6
		if params.MaxPower then
			g_MaxPower = params.MaxPower:get()
		end
	end,

	postCreate = function(controller)
		g_Agent = controller:agent()

		local tailid = g_TargetBody:get():getRigidBody():get():getUid()
		g_Car = Dodgem(g_World, g_Agent, "Dodgem/Dodgem", {Engine = "EngineEnemy"}, {onHitTail = function(id, power) if id == tailid then onHitTail(power) end end})

		g_Time = 0
		g_Enabled = false
	end,

	onStep = function(elapsed)
		if g_Enabled then
			local state = g_StateMachine:state()
			if state and state.step then
				state:step(elapsed)
			end
		end

		g_Car:step(elapsed)

		g_Time = g_Time + elapsed
	end,

	call = Tanx.makeCallFuntor(g_AgentInterfaces)
}
