--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	DigGame.lua
--]]

Tanx.log("[Tetris\\DigGame.lua]: parsed.")

Tanx.require"TetrisPool.lua"


class "DigGame"

	function DigGame:__init(game, controller, cameranode, paramters)
		self.Pool = TetrisPool(game, controller, cameranode, {ControlIndicatorNodes = paramters.ControlIndicatorNodes, TopHeight = 60})

		-- initial pool
		for i = 10, 1, -1 do
			for ii = 1, 5 do
				self.Pool:fillBlocksLayer(nil, i)
			end
		end
		self.Pool:adaptCameraHeight()
	end

	function DigGame:__finalize()
		--self.Pool:stop()
	end

	function DigGame:getPool()
		return self.Pool
	end
