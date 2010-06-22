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

	function DigGame:__init(configs, game, controller, cameranode, paramters)
		self.Configs = configs
		self.Pool = TetrisPool(game, controller, cameranode, {ControlIndicatorNodes = paramters.ControlIndicatorNodes, TopHeight = 60})

		-- initial pool
		for i = #self.Configs, 1, -1 do
			local config = self.Configs[i]
			for ii = 1, config.BlockLayers do
				self.Pool:fillBlocksLayer(nil, config.ColorCode)
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
