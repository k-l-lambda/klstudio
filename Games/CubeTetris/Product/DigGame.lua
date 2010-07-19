--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	DigGame.lua
--]]

Tanx.log"[Tetris\\DigGame.lua]: parsed."

Tanx.require"Core:bind.lua"
Tanx.require"Core:Timer.lua"

Tanx.require"TetrisPool.lua"
Tanx.require"ScoreMark.lua"


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
			TopHeight				= blockheight + 10,
			Center					= paramters.Center,
			RootNode				= paramters.RootNode,
			FreezeTime				= paramters.FreezeTime,
			ShowBrickFreezeClock	= paramters.ShowBrickFreezeClock,
			Random					= paramters.Random,
			Callbacks = {
				onLayersCleared = Tanx.bind(self.onPoolLayersCleared, self, Tanx._2, Tanx._3),
				onDropingBrick = Tanx.bind(self.onPoolDropingBrick, self),
				onBrickFrozen = Tanx.bind(self.onPoolBrickFrozen, self, Tanx._2),
				onGameOver = Tanx.bind(self.onPoolGameOver, self),
				},
			})
		self.BlockLayers = {}
		for i = #self.Configs, g_GameConfig.BeginLevel, -1 do
			local config = self.Configs[i]
			for ii = 1, config.BlockLayers do
				local layer = self.Pool:fillBlocksLayer(nil, config.ColorCode, config.LayerSpace)

				self.BlockLayers[layer] = i
			end
		end
		self.Pool:adaptCameraHeight()

		self:beginLevel(g_GameConfig.BeginLevel)

		self.ClearedLayers = 0
		self.Score = 0

		self.ScorePanel = paramters.ScorePanel or {}
		self:updateScorePanel()
		if self.ScorePanel.Frame then
			self.ScorePanel.Frame:show()
		end

		self.ScoreMarks = {}
	end

	function DigGame:__finalize()
		--self.Pool:stop()
	end

	function DigGame:step(elapsed)
		if self.Pool then
			self.Pool:step(elapsed)
		end

		local i, mark
		for i, mark in ipairs(self.ScoreMarks) do
			mark:step(elapsed)
		end
		tableext.remove_if(self.ScoreMarks, function(m) return m.RemainTime <= 0 end)

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

		assert(#layers > 0)

		local i, layer
		local bonus = 0
		for i, layer in ipairs(layers) do
			if self.BlockLayers[layer] then
				bonus = bonus + self.BlockLayers[layer] * (#layers) * 16

				self.BlockLayers[layer] = nil
			else
				bonus = bonus + math.floor(self.CurrentLevel * (8 + math.max(8 - self.Pool.TopHeight + layer, 0)))
			end
		end
		Tanx.log("bonus: " .. bonus)
		self.Score = self.Score + bonus

		self.ClearedLayers = self.ClearedLayers + #layers
		self:updateScorePanel()

		self:addScoreMark(bonus, Tanx.Vector3(self.Pool.Center.x, layers[0] * s_GridYSize, self.Pool.Center.z))
	end

	function DigGame:onPoolDropingBrick()
		if self.CurrentLevel then
			self.Pool:changeTopHeight(-self.Configs[self.CurrentLevel].Descend)
		end
	end

	function DigGame:onPoolBrickFrozen(yset)
		local height = 0
		local count = 0
		local y, _
		for y, _ in pairs(yset) do
			count = count + 1
			height = height + y
		end
		height = height / count

		local bonus = math.floor(math.max(50 - height, 1))
		Tanx.log("bonus: " .. bonus)
		self.Score = self.Score + bonus
		self:updateScorePanel()

		self:addScoreMark(bonus, Tanx.Vector3(self.Pool.Center.x, height * s_GridYSize, self.Pool.Center.z))
	end

	function DigGame:onPoolGameOver()
		if g_BackgroundMusic then
			g_BackgroundMusic:get():stop()
		end
	end

	function DigGame:updateScorePanel()
		if self.ScorePanel.Score then
			self.ScorePanel.Score:setText(CEGUI.String(string.format("SCORE  %d", self.Score)))
		end
		if self.ScorePanel.Layers then
			self.ScorePanel.Layers:setText(CEGUI.String(string.format("LAYERS %d", self.ClearedLayers)))
		end
		if self.ScorePanel.Level then
			self.ScorePanel.Level:setText(CEGUI.String(string.format("LEVEL    %d", self.CurrentLevel)))
		end
	end

	function DigGame:addScoreMark(score, position)
		local l, t, r, b = g_MainCamera:projectSphereEx(Ogre.Sphere(position, 2))

		table.insert(self.ScoreMarks, ScoreMark(CEGUI.WindowManager.getSingleton(), score, {x = l, y = (t + b) / 2}))
	end
