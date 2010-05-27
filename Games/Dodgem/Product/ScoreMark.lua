--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	Dodgem\ScoreMark.lua
--]]

Tanx.log("[Dodgem\\ScoreMark.lua]: parsed.")

Tanx.require"Core:utility.lua"


g_MarkWindowCount = 0


function colorString(tl, tr, bl, br)
	tr = tr or tl
	bl = bl or tr
	br = br or bl

	return CEGUI.String(string.format("tl:%x tr:%x bl:%x br:%x", tl, tr, bl, br))
end


class "ScoreMark"

	function ScoreMark:__init(windowManager, score)
		self.WindowManager = windowManager

		self.Window = windowManager:createWindow(CEGUI.String"TaharezLook/StaticText", CEGUI.String("ScoreMark" .. g_MarkWindowCount))
		self.Window:setPosition(CEGUI.UVector2(CEGUI.UDim(0.28, 0), CEGUI.UDim(0.6, 0)))
		self.Window:setSize(CEGUI.UVector2(CEGUI.UDim(0.08, 0), CEGUI.UDim(0.1, 0)))
		self.Window:setProperty(CEGUI.String"BackgroundEnabled", CEGUI.String"false")
		self.Window:setProperty(CEGUI.String"FrameEnabled", CEGUI.String"false")
		self.Window:setFont(CEGUI.String"BlueHighway-32")

		self.Window:setProperty(CEGUI.String"TextColours", iif(score > 0, colorString(0xff00ff00), colorString(0xffff0000)))
		self.Window:setText(CEGUI.String(iif(score > 0, "+", "-") .. math.abs(score)))

		local root = windowManager:getWindow(CEGUI.String"root")
		root:addChildWindow(self.Window)

		self.LifeTime = 1.6
		self.RemainTime = self.LifeTime

		g_MarkWindowCount = g_MarkWindowCount + 1
	end

	function ScoreMark:__finalize()
		if CEGUI.System.getSingletonPtr() then
			self.WindowManager:destroyWindow(self.Window)
			self.Window = nil
		end
	end

	function ScoreMark:step(elapsed)
		self.RemainTime = self.RemainTime - elapsed

		-- fade
		local alpha = math.max(self.RemainTime / self.LifeTime, 0) ^ 0.4
		self.Window:setAlpha(alpha)

		-- raise
		if self.RemainTime > 0 then
			local y = self.Window:getYPosition().d_scale - elapsed * 0.18
			self.Window:setYPosition(CEGUI.UDim(y, 0))
		end
	end
