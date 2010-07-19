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
		--Tanx.log("position: " .. position.x .. ", " .. position.y)

		self.Window = windowManager:createWindow(CEGUI.String"TaharezLook/StaticText", CEGUI.String("ScoreMark" .. s_MarkWindowId))
		self.Window:setSize(CEGUI.UVector2(CEGUI.UDim(0.2, 0), CEGUI.UDim(0.1, 0)))
		self.Window:setProperty(CEGUI.String"BackgroundEnabled", CEGUI.String"false")
		self.Window:setProperty(CEGUI.String"FrameEnabled", CEGUI.String"false")
		self.Window:setFont(CEGUI.String"Tetris/BlueHighway-24")

		self.Window:setProperty(CEGUI.String"TextColours", CEGUI.colorString"ffff0000")
		self.Window:setText(CEGUI.String(tostring(score)))

		local root = windowManager:getWindow(CEGUI.String"root")
		root:addChildWindow(self.Window)

		self.Position = position
		self:updatePosition()

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
		self:updatePosition()

		self.RemainTime = self.RemainTime - elapsed
		if self.RemainTime <= 0 then
			self.Window:hide()
		end
	end

	function ScoreMark:updatePosition()
		local rect = g_MainCamera:projectSphere(Ogre.Sphere(self.Position, 2))
		local x = (rect.right + 1) / 2
		local y = (-(rect.top + rect.bottom) / 2 + 1) / 2
		--Tanx.log("position: " .. x .. ", " .. y)

		self.Window:setPosition(CEGUI.UVector2(CEGUI.UDim(x, 0), CEGUI.UDim(y, 0)))
	end
