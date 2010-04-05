--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	AlignAction.lua
--]]

Tanx.log("[Tetris\\AlignAction.lua]: parsed.")



local g_GridSize = 1.07

local g_LinearAlignIntensity = 70
local g_AngularAlignIntensity = 28



local function alignedAxis(v)
	local absv = {x = math.abs(v.x), y = math.abs(v.y), z = math.abs(v.z)}
	if absv.x >= absv.y and absv.x >= absv.z then
		return Tanx.Vector3.UNIT_X * v.x / absv.x
	elseif absv.y >= absv.x and absv.y >= absv.z then
		return Tanx.Vector3.UNIT_Y * v.y / absv.y
	else
		return Tanx.Vector3.UNIT_Z * v.z / absv.z
	end
end


function alignRigidbody(rb, elapsed, center)
	center = center or {x = 0, z = 0}

	local position = Tanx.madp(rb:getPosition())

	local frac = function(num)
		local result = math.fmod(num, 1)
		if result < 0 then
			result = 1 + result
		end

		return result
	end

	local offset =
	{
		x = frac((position.x - center.x) / g_GridSize) - 0.5,
		z = frac((position.z - center.z) / g_GridSize) - 0.5,
	}
	--local divisor = (offset.x * offset.x + offset.z * offset.z) ^ 0.2
	--Tanx.log(string.format("[Tetris\\TetrisScene.lua]: alignRigidbody: x: %f, z: %f", offset.x, offset.z), Ogre.LogMessageLevel.TRIVIAL, true)
	local force = Tanx.Vector3(-offset.x * g_LinearAlignIntensity, 0, -offset.z * g_LinearAlignIntensity)
	rb:applyForce(elapsed, Tanx.madp(force))

	local orientation = Tanx.madp(rb:getRotation())
	local xaxis = alignedAxis(orientation:xAxis())
	local yaxis = alignedAxis(orientation:yAxis())
	local aligned = Tanx.Quaternion(xaxis, yaxis, xaxis:crossProduct(yaxis))
	--Tanx.log("[Tetris\\AlignAction.lua]: aligned: " .. tostring(xaxis) .. ", " .. tostring(yaxis) .. ",\t" .. tostring(aligned))
	local rotation = aligned * orientation:Inverse()
	local angle = Tanx.Radian(0)
	local axis = Tanx.Vector3()
	rotation:ToAngleAxis(angle, axis)
	--angle = math.fmod(angle:valueRadians(), math.pi)
	angle = angle:valueRadians()
	if angle > math.pi then
		angle = angle - math.pi * 2
	end
	--Tanx.log(string.format("[Tetris\\TetrisScene.lua]: alignRigidbody: angle: %s, axis: %s, o: %s", tostring(angle), tostring(axis), tostring(orientation)), Ogre.LogMessageLevel.TRIVIAL, true)
	local torque = axis * (math.abs(angle) ^ 0.3) * g_AngularAlignIntensity
	if angle < 0 then
		torque = torque * -1
	end
	rb:applyTorque(elapsed, Tanx.madp(torque))
end


class "AlignAction" (Tanx.ArrayAction)

	function AlignAction:__init(agent)
		if _LUABIND_VERSION and _LUABIND_VERSION >= 800 then
			Tanx.ArrayAction.__init(self, agent)
		else
			super(agent)
		end
	end

	function AlignAction:applyAction(elapsed)
		local i
		for i = 0, self.m_RigidBodies:size() - 1 do
			alignRigidbody(self.m_RigidBodies:at(i):get(), elapsed)
		end
	end
