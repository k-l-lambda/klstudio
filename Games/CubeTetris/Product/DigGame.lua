--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	DigGame.lua
--]]

Tanx.log("[Tetris\\DigGame.lua]: parsed.")

Tanx.require"Core:bind.lua"
Tanx.require"Core:Timer.lua"

Tanx.require"TetrisPool.lua"


class "DigGame"

	function DigGame:__init(configs, game, controller, cameranode, paramters)
		self.Configs = configs
		self.EnableBackgroundMusic = paramters.EnableBackgroundMusic or paramters.EnableBackgroundMusic == nil

		local blockheight = 0
		local i
		for i = g_GameConfig.BeginLevel, #self.Configs do
			blockheight = blockheight + self.Configs[i].BlockLayers
		end

		self.Timer = TanxTimer()

		-- initial pool
		self.Pool = TetrisPool(game, controller, cameranode, {
			ControlIndicatorNodes = paramters.ControlIndicatorNodes,
			TopHeight = blockheight + 10,
			Center = paramters.Center,
			RootNode = paramters.RootNode,
			Callbacks = {
				onLayersCleared = Tanx.bind(self.onPoolLayersCleared, self, Tanx._2, Tanx._3),
				onDropingBrick = Tanx.bind(self.onPoolDropingBrick, self),
				onGameOver = Tanx.bind(self.onPoolGameOver, self),
				},
			})
		for i = #self.Configs, g_GameConfig.BeginLevel, -1 do
			local config = self.Configs[i]
			for ii = 1, config.BlockLayers do
				self.Pool:fillBlocksLayer(nil, config.ColorCode, config.LayerSpace)
			end
		end
		self.Pool:adaptCameraHeight()

		self:beginLevel(g_GameConfig.BeginLevel)
	end

	function DigGame:__finalize()
		--self.Pool:stop()
	end

	function DigGame:step(elapsed)
		if self.Pool then
			self.Pool:step(elapsed)
		end

		self.Timer:tick(elapsed)
	end

	function DigGame:getPool()
		return self.Pool
	end

	function DigGame:beginLevel(level)
		local levelup = self.CurrentLevel and self.CurrentLevel < level
		self.CurrentLevel = level

		local config = self.Configs[level] or self.Configs[#self.Configs]

		self.PassHeight = 0
		local i
		for i = #self.Configs, level + 1, -1 do
			self.PassHeight = self.PassHeight + self.Configs[i].BlockLayers
		end

		-- play music
		if self.EnableBackgroundMusic and g_BackgroundMusic then
			local playmusic = function()
				g_BackgroundMusic:get():stop()
				if config.Music and g_GameConfig.BackgroundMusicEnabled then
					--g_BackgroundMusic:get():setGain(g_GameConfig.MusicVolume)
					g_NsfStream:get():toDerived():setTrack(g_MusicIndex[config.Music])
					g_BackgroundMusic:get():play(g_NsfStream)
				end
			end

			if levelup then
				g_BackgroundMusic:get():stop()
				g_NsfStream:get():toDerived():setTrack(g_MusicIndex.LevelUp)
				g_BackgroundMusic:get():play(g_NsfStream)

				self.Timer:commitEvent(3, playmusic)
			else
				playmusic()
			end
		end
	end

	function DigGame:onPoolLayersCleared(height, layers)
		--Tanx.log("[Tetris\\DigGame.lua]: DigGame:onPoolLayersCleared: " .. height)
		if height <= self.PassHeight + 1 then
			Tanx.log("[Tetris\\DigGame.lua]: level up: " .. self.CurrentLevel + 1)
			self:beginLevel(self.CurrentLevel + 1)
		end
	end

	function DigGame:onPoolDropingBrick()
		if self.CurrentLevel then
			self.Pool:changeTopHeight(-self.Configs[self.CurrentLevel].Descend)
		end
	end

	function DigGame:onPoolGameOver()
		if g_BackgroundMusic then
			g_BackgroundMusic:get():stop()
		end
	end
