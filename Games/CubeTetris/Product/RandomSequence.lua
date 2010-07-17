--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	RandomSequence.lua
--]]

Tanx.log("[Tetris\\RandomSequence.lua]: parsed.")


local s_RandomMax = 0x8000


class "RandomSequence"

	function RandomSequence:__init(seed)
		if seed then
			Tanx.randomseed(seed)
		end

		self.Sequence = {}
	end

	function RandomSequence:get(index, range)
		local i
		for i = #self.Sequence + 1, index do
			table.insert(self.Sequence, Tanx.random(s_RandomMax))
		end
		assert(#self.Sequence >= index)

		local raw = self.Sequence[index]
		if range then
			return raw % range + 1
		end
		return (raw - 1) / s_RandomMax
	end

	function RandomSequence:newIterator()
		local index = 0

		return function(range)
			index = index + 1

			return self:get(index, range)
		end
	end
