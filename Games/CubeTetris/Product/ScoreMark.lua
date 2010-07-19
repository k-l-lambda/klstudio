--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	CubeTetris\ScoreMark.lua
--]]

Tanx.log("[CubeTetris\\ScoreMark.lua]: parsed.")

Tanx.require"Core:utility.lua"
Tanx.require"Core:CeguiUtil.lua"


local s_MarkWindowId = 0


class "ScoreMark"

	function ScoreMark:__init(windowManager, score, position)
		self.WindowManager = windowManager

		self.Window = windowManager:createWindow(CEGUI.String"TaharezLook/StaticText", CEGUI.String("ScoreMark" .. s_MarkWindowId))
		self.Window:setPosition(CEGUI.UVector2(CEGUI.UDim(0, position.x), CEGUI.UDim(0, position.y)))
		self.Window:setSize(CEGUI.UVector2(CEGUI.UDim(0.08, 0), CEGUI.UDim(0.1, 0)))
		self.Window:setProperty(CEGUI.String"BackgroundEnabled", CEGUI.String"false")
		self.Window:setProperty(CEGUI.String"FrameEnabled", CEGUI.String"false")
		self.Window:setFont(CEGUI.String"BlueHighway-24")

		self.Window:setProperty(CEGUI.String"TextColours", CEGUI.colorString"ffff0000")
		self.Window:setText(CEGUI.String(tostring(score)))

		local root = windowManager:getWindow(CEGUI.String"root")
		root:addChildWindow(self.Window)

		self.RemainTime = 2

		s_MarkWindowId = s_MarkWindowId + 1
	end

	function ScoreMark:__finalize()
		if CEGUI.System.getSingletonPtr() then
			self.WindowManager:destroyWindow(self.Window)
			self.Window = nil
		end
	end

	function ScoreMark:step(elapsed)
		self.RemainTime = self.RemainTime - elapsed

		if self.RemainTime <= 0 then
			self.Window:hide()
		end
	end
