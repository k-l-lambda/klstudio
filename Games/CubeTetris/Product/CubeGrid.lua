--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	CubeGrid.lua
--]]

Tanx.log("[Tetris\\CubeGrid.lua]: parsed.")


local function round(n)
	local result = math.floor(math.abs(n) + 0.5)
	if n < 0 then
		result = -result
	end

	return result
end


local function isEmptyTable(t)
	local k, v
	for k, v in pairs(t) do
		return false
	end

	return true
end


class "CubeGrid"

	function CubeGrid:__init(blocks)
		self.Blocks = blocks or {}
	end

	function CubeGrid:clear()
		self.Blocks = {}
	end

	function CubeGrid:get(x, y, z)
		if self.Blocks[y] then
			if self.Blocks[y][x] then
				return self.Blocks[y][x][z]
			end
		end

		return nil
	end

	function CubeGrid:set(x, y, z, value)
		self.Blocks[y] = self.Blocks[y] or {}
		self.Blocks[y][x] = self.Blocks[y][x] or {}
		self.Blocks[y][x][z] = value

		if isEmptyTable(self.Blocks[y][x]) then
			self.Blocks[y][x] = nil
			if isEmptyTable(self.Blocks[y]) then
				self.Blocks[y] = nil
			end
		end
	end

	function CubeGrid:minX()
		local min
		local y, layer
		for y, layer in pairs(self.Blocks) do
			if type(y) == "number" then
				local x, line
				for x, line in pairs(layer) do
					if type(x) == "number" then
						min = min or x
						min = math.min(min, x)
					end
				end
			end
		end

		return min or 0
	end

	function CubeGrid:maxX()
		local max
		local y, layer
		for y, layer in pairs(self.Blocks) do
			if type(y) == "number" then
				max = max or table.maxn(layer)
				max = math.max(max, table.maxn(layer))
			end
		end

		return max or 0
	end

	function CubeGrid:minY()
		local min = table.maxn(self.Blocks)
		local k, v
		for k, v in pairs(self.Blocks) do
			if type(k) == "number" then
				min = math.min(min, k)
			end
		end

		return min
	end

	function CubeGrid:maxY()
		return table.maxn(self.Blocks)
	end

	function CubeGrid:minZ()
		local min
		local y, layer
		for y, layer in pairs(self.Blocks) do
			if type(y) == "number" then
				local x, line
				for x, line in pairs(layer) do
					if type(x) == "number" then
						local z, v
						for z, v in pairs(line) do
							if type(z) == "number" then
								min = min or z
								min = math.min(min, z)
							end
						end
					end
				end
			end
		end

		return min or 0
	end

	function CubeGrid:maxZ()
		local max
		local y, layer
		for y, layer in pairs(self.Blocks) do
			if type(y) == "number" then
				local x, line
				for x, line in pairs(layer) do
					if type(x) == "number" then
						max = max or table.maxn(line)
						max = math.max(max, table.maxn(line))
					end
				end
			end
		end

		return max or 0
	end

	function CubeGrid:rotate(q)
		local old_blocks = self.Blocks
		self:clear()

		local y, layer
		for y, layer in pairs(old_blocks) do
			local x, line
			for x, line in pairs(layer) do
				local z, v
				for z, v in pairs(line) do
					if v then
						local point = Tanx.Vector3(x - 1, y - 1, z - 1)
						point = q * point
						--print("[Tetris\\CubeGrid.lua]: point: ", tostring(point))

						self:set(round(point.x + 1), round(point.y + 1), round(point.z + 1), true)
					end
				end
			end
		end
	end

	function CubeGrid:toPointList()
		local points = {}
		local y, layer
		for y, layer in pairs(self.Blocks) do
			local x, line
			for x, line in pairs(layer) do
				local z, v
				for z, v in pairs(line) do
					if v then
						table.insert(points, {x = x, y = y, z = z})
					end
				end
			end
		end

		return points
	end

	function CubeGrid:dump()
		local y, layer
		for y, layer in pairs(self.Blocks) do
			local x, line
			for x, line in pairs(layer) do
				local z, v
				for z, v in pairs(line) do
					if v then
						print(string.format("(%d, %d, %d)", x, y, z))
					end
				end
			end
		end
	end


local function testCubeGrid()
	local grid = CubeGrid()
	grid:set(2, 3, 4, true)
	grid:set(7, 8, 9, true)
	grid:set(-4, -4, -4, true)
	grid:set(12, 12, 12, true)
	grid:set(-4, -4, -4)
	grid:set(12, 12, 12)

	assert(grid:get(2, 3, 4))
	assert(grid:get(2, 2, 3) == nil)

	assert(grid:minX() == 2)
	assert(grid:maxX() == 7)
	assert(grid:minY() == 3)
	assert(grid:maxY() == 8)
	assert(grid:minZ() == 4)
	assert(grid:maxZ() == 9)

	grid:rotate(Tanx.Quaternion(Tanx.Radian(math.pi / 2), Tanx.Vector3.UNIT_Y))
	assert(grid:get(2, 3, 4) == nil)
	assert(grid:get(4, 3, 0))
	assert(grid:get(7, 8, 9) == nil)
	assert(grid:get(9, 8, -5))

	Tanx.log("[Tetris\\CubeGrid.lua]: testCubeGrid passed.")
end

--testCubeGrid()
