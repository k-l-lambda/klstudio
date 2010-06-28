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

		local blockheight = 0
		local i
		for i = g_GameConfig.BeginLevel, #self.Configs do
			blockheight = blockheight + self.Configs[i].BlockLayers
		end

		-- initial pool
		self.Pool = TetrisPool(game, controller, cameranode, {ControlIndicatorNodes = paramters.ControlIndicatorNodes, TopHeight = blockheight + 10})
		for i = #self.Configs, g_GameConfig.BeginLevel, -1 do
			local config = self.Configs[i]
			for ii = 1, config.BlockLayers do
				self.Pool:fillBlocksLayer(nil, config.ColorCode)
			end
		end
		self.Pool:adaptCameraHeight()

		self:beginLevel(g_GameConfig.BeginLevel)
	end

	function DigGame:__finalize()
		--self.Pool:stop()
	end

	function DigGame:getPool()
		return self.Pool
	end

	function DigGame:beginLevel(level)
		local config = self.Configs[level]

		-- play music
		if g_GameConfig.BackgroundMusicEnabled and config.Music and g_BackgroundMusic then
			g_BackgroundMusic:get():stop()
			--g_BackgroundMusic:get():setLooping(true)
			--g_BackgroundMusic:get():setGain(g_GameConfig.MusicVolume)
			g_BackgroundMusic:get():play(g_Musics[config.Music])
		end
	end
