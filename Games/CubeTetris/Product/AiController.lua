--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	AiController.lua
--]]

Tanx.log("[Tetris\\AiController.lua]: parsed.")


local s_GridSize = 1.07

local s_MoveIntensity = 3
local s_RotateIntensity = 70

local s_MovingTimeMax = 6

local s_QuaterX = Tanx.Quaternion(Tanx.Radian(math.pi / 2), Tanx.Vector3.UNIT_X)
local s_QuaterY = Tanx.Quaternion(Tanx.Radian(math.pi / 2), Tanx.Vector3.UNIT_Y)
local s_QuaterZ = Tanx.Quaternion(Tanx.Radian(math.pi / 2), Tanx.Vector3.UNIT_Z)
local s_QuaterXn = Tanx.Quaternion(Tanx.Radian(-math.pi / 2), Tanx.Vector3.UNIT_X)
local s_QuaterYn = Tanx.Quaternion(Tanx.Radian(-math.pi / 2), Tanx.Vector3.UNIT_Y)
local s_QuaterZn = Tanx.Quaternion(Tanx.Radian(-math.pi / 2), Tanx.Vector3.UNIT_Z)

local s_RegularOrientations =
{
	Tanx.Quaternion.IDENTITY,							-- 1
	s_QuaterY,											-- 2
	s_QuaterY * s_QuaterY,								-- 3
	s_QuaterYn,											-- 4

	s_QuaterX,											-- 5
	s_QuaterX * s_QuaterY,								-- 6
	s_QuaterX * s_QuaterY * s_QuaterY,					-- 7
	s_QuaterX * s_QuaterYn,								-- 8

	s_QuaterXn,											-- 9
	s_QuaterXn * s_QuaterY,								-- 10
	s_QuaterXn * s_QuaterY * s_QuaterY,					-- 11
	s_QuaterXn * s_QuaterYn,							-- 12

	s_QuaterZ,											-- 13
	s_QuaterZ * s_QuaterY,								-- 14
	s_QuaterZ * s_QuaterY * s_QuaterY,					-- 15
	s_QuaterZ * s_QuaterYn,								-- 16

	s_QuaterZn,											-- 17
	s_QuaterZn * s_QuaterY,								-- 18
	s_QuaterZn * s_QuaterY * s_QuaterY,					-- 19
	s_QuaterZn * s_QuaterYn,							-- 20

	s_QuaterX * s_QuaterX,								-- 21
	s_QuaterX * s_QuaterX * s_QuaterY,					-- 22
	s_QuaterX * s_QuaterX * s_QuaterY * s_QuaterY,		-- 23
	s_QuaterX * s_QuaterX * s_QuaterYn,					-- 24
}

local s_BrickLattices =
{
	["Tetris/Brick4_0"] = {CubeGrid{
		{{true}},
		{{true}},
		{{true}},
		{{true}},
	}},
	["Tetris/Brick4_1"] = {CubeGrid{
		{{true},	{true}},
		{{true}},
		{{true}},
	}},
	["Tetris/Brick4_2"] = {CubeGrid{
		{{true}},
		{{true},	{true}},
		{{true}},
	}},
	["Tetris/Brick4_3"] = {CubeGrid{
		{{true},	{true}},
		{{true},	{true}},
	}},
	["Tetris/Brick4_4"] = {CubeGrid{
		{{true},	{true}},
		{nil,		{true},		{true}},
	}},
	["Tetris/Brick4_5"] = {CubeGrid{
		{{true, true},	{true}},
		{{true}},
	}},
	["Tetris/Brick4_6"] = {CubeGrid{
		{{true},	{true, true}},
		{{true}},
	}},
	["Tetris/Brick4_7"] = {CubeGrid{
		{{true},	{[0] = true, [1] = true}},
		{{true}},
	}},
}

local function appendRotatedBrickLattice(name, index)
	s_BrickLattices[name][index] = CubeGrid(s_BrickLattices[name][1].Blocks)
	s_BrickLattices[name][index]:rotate(s_RegularOrientations[index])
end

local function appendRotatedBrickLattices(name, indecies)
	local k, v
	for k, v in pairs(indecies) do
		appendRotatedBrickLattice(name, v)
	end
end

appendRotatedBrickLattices("Tetris/Brick4_0", {5, 13})
appendRotatedBrickLattices("Tetris/Brick4_1", {2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24})
appendRotatedBrickLattices("Tetris/Brick4_2", {5, 3, 7, 13, 6, 17, 8, 2, 14, 4, 16})
appendRotatedBrickLattices("Tetris/Brick4_3", {2, 5})
appendRotatedBrickLattices("Tetris/Brick4_4", {13, 5, 14, 2, 6, 3, 15, 7, 16, 4, 8})
appendRotatedBrickLattices("Tetris/Brick4_5", {2, 3, 4, 21, 22, 23, 24})
appendRotatedBrickLattices("Tetris/Brick4_6", {2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24})	-- TODO: not the simplist
appendRotatedBrickLattices("Tetris/Brick4_7", {2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24})		-- TODO: not the simplist


local function isCollided(heap, points, translate)
	local i, point
	for i, point in pairs(points) do
		if point.y + translate.y < 1 or heap:get(point.x + translate.x, point.y + translate.y, point.z + translate.z) then
			return true
		end
	end

	return false
end

local function countHoleSpace(heap, lattice, points, translate)
	local count = 0
	local i, point
	for i, point in pairs(points) do
		if not lattice:get(point.x, point.y - 1, point.z) then
			local y = point.y + translate.y - 1
			while y >= 1 and not heap:get(point.x + translate.x, y, point.z + translate.z) do
				--Tanx.log("[Tetris\\AiController.lua]: countHoleSpace, y: " .. y)
				count = count + 1
				y = y - 1
			end

			if y > 1 and not heap:get(point.x + translate.x, y - 1, point.z + translate.z) then
				count = count + 0.2
			end
		end
	end

	return count
end

local function countSideFaces(heap, lattice, points, translate)
	local count = 0
	local i, point
	for i, point in pairs(points) do
		local look = function(offsetx, offsetz)
			local x = point.x + offsetx
			local z = point.z + offsetz
			local tx = x + translate.x
			local tz = z + translate.z

			if tx < 1 or tx > 4 or tz < 1 or tz > 4 then
				return 0.3
			end
			if lattice:get(x, point.y, z) or heap:get(tx, point.y + translate.y, tz) then
				return 0
			end
			if (point.y + translate.y > 1) and (not heap:get(tx, point.y + translate.y - 1, tz)) then
				return 1.6
			end
			return 1
		end
		count = count + look(1, 0)
		count = count + look(-1, 0)
		count = count + look(0, 1)
		count = count + look(0, -1)
	end

	return count
end

local function evaluateTargetState(heap, lattice, state)
	local height = heap:maxY() + 1 - lattice:minY()
	local points = lattice:toPointList()
	while not isCollided(heap, points, {x = state.translate.x - 1, y = height - 1, z = state.translate.z - 1}) do
		height = height - 1
	end
	state.translate.y = height

	local worth = 0

	local i, point
	for i, point in pairs(points) do
		worth = worth + height + point.y
	end

	local translate = {x = state.translate.x - 1, y = height, z = state.translate.z - 1}

	worth = countSideFaces(heap, lattice, points, translate) + worth * worth / 36
	worth = countHoleSpace(heap, lattice, points, translate) + worth / 40
	--Tanx.log("[Tetris\\AiController.lua]: worth: " .. worth)

	return worth
end


local function computeTargetState(heap, config)
	assert(heap)

	-- collect all candidate states
	local candidate_states = {}
	local index, lattice
	for index, lattice in pairs(s_BrickLattices[config]) do
		local x, z
		for x = 2 - lattice:minX(), 5 - lattice:maxX() do
			for z = 2 - lattice:minZ(), 5 - lattice:maxZ() do
				local state = {translate = {x = x, z = z}, rotate = index}
				local worth = evaluateTargetState(heap, lattice, state)
				table.insert(candidate_states, {state = state, worth = worth})
			end
		end
	end

	table.sort(candidate_states, function(_1, _2) return _1.worth < _2.worth end)
	Tanx.log("[Tetris\\AiController.lua]: candidates state count: " .. table.maxn(candidate_states), Ogre.LogMessageLevel.TRIVIAL)
	Tanx.log("[Tetris\\AiController.lua]: best worth: " .. candidate_states[1].worth .. ", " .. candidate_states[1].state.translate.x .. ", " .. candidate_states[1].state.translate.z .. ", " .. candidate_states[1].state.rotate, Ogre.LogMessageLevel.TRIVIAL)

	return candidate_states[1].state
end


local function computeManipulatorState(self)
	local focusbrick = self.FocusBrick:lock()
	if focusbrick:get() and self.TargetState then
		local node = focusbrick:get():getMainNode()

		self.ManipulatorState.MoveX = -s_MoveIntensity * (self.TargetState.translate.x - (node:getPosition().x - self.Center.x) / s_GridSize - 2.5)
		self.ManipulatorState.MoveZ = s_MoveIntensity * (self.TargetState.translate.z - (node:getPosition().z - self.Center.z) / s_GridSize - 2.5)

		local rotation = s_RegularOrientations[self.TargetState.rotate] * node:getOrientation():Inverse()
		local angle = Tanx.Radian(0)
		local axis = Tanx.Vector3()
		rotation:ToAngleAxis(angle, axis)
		angle = angle:valueRadians()
		if angle > math.pi then
			angle = angle - math.pi * 2
		end
		local torque = axis * angle * s_RotateIntensity
		local divisor = math.max(math.abs(angle) ^ 0.3, 1e-5)
		self.ManipulatorState.RotateX = -torque.x / divisor
		self.ManipulatorState.RotateY = torque.y / divisor
		self.ManipulatorState.RotateZ = torque.z / divisor

		-- zero effect when it's little enough
		if math.abs(self.ManipulatorState.MoveX) + math.abs(self.ManipulatorState.MoveZ) < 0.3 then
			self.ManipulatorState.MoveX = 0
			self.ManipulatorState.MoveZ = 0
			self.ManipulatorState.MoveY = 0
			if node:getPosition().y - 1 > self.TargetState.translate.y then
				self.ManipulatorState.MoveY = -0.12
				--Tanx.log("Y sub: " .. node:getPosition().y - self.TargetState.translate.y - 1)
			end
		--else
		--	Tanx.log("linear differ: " .. math.abs(self.ManipulatorState.MoveX) + math.abs(self.ManipulatorState.MoveZ))
		end

		if math.abs(self.ManipulatorState.RotateX) + math.abs(self.ManipulatorState.RotateY) + math.abs(self.ManipulatorState.RotateZ) < 2.8 then
			self.ManipulatorState.RotateX = 0
			self.ManipulatorState.RotateY = 0
			self.ManipulatorState.RotateZ = 0
		--else
		--	Tanx.log("angular differ: " .. math.abs(self.ManipulatorState.RotateX) + math.abs(self.ManipulatorState.RotateY) + math.abs(self.ManipulatorState.RotateZ))
		end
		--Tanx.log(string.format("[Tetris\\AiController.lua]: ManipulatorState: %f, %f;\t%f, %f, %f", self.ManipulatorState.MoveX, self.ManipulatorState.MoveZ, self.ManipulatorState.RotateX, self.ManipulatorState.RotateY, self.ManipulatorState.RotateZ))
	end
end


class "AiController"

	function AiController:__init(game)
		self.Game = game

		self.ManipulatorState =
		{
			MoveX = 0,
			MoveY = 0,
			MoveZ = 0,

			RotateX = 0,
			RotateY = 0,
			RotateZ = 0,

			ViewX = 0,
			ViewZ = 0,
		}
		self.Center = {x = 0, z = 0}
		self.BrickTime = 0
	end

	function AiController:dispose()
	end

	function AiController:brickDropped(brick, config)
		self.FocusBrick = brick
		self.BrickTime = 0

		self.TargetState = computeTargetState(self.Heap, config)
	end

	function AiController:step(elapsed)
		if self.BrickTime < s_MovingTimeMax and self.FocusBrick then
			computeManipulatorState(self)
		else
			self.ManipulatorState.MoveX = 0
			self.ManipulatorState.MoveY = 0
			self.ManipulatorState.MoveZ = 0
			self.ManipulatorState.RotateX = 0
			self.ManipulatorState.RotateY = 0
			self.ManipulatorState.RotateZ = 0
		end
		self.BrickTime = self.BrickTime + elapsed
	end

	function AiController:getManipulatorState()
		return self.ManipulatorState
	end
