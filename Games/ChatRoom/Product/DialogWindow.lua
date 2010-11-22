--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	DialogWindow.lua
--]]

Tanx.log("[ChatRoom\\DialogWindow.lua]: parsed.")

Tanx.require"Core:CeguiUtil.lua"


class "DialogWindow"

	function DialogWindow:__init(windowManager, hostname, members)
		self.WindowManager = windowManager

		self.NamePrefix = "Dialog_" .. hostname

		self.FrameWindow = self.WindowManager:loadWindowLayout(CEGUI.String"Dialog.layout", CEGUI.String(self.NamePrefix))
		self.FrameWindow:setText(CEGUI.String(hostname .. "'s Room"))

		self.MemberList = self.FrameWindow:getChildRecursive(CEGUI.String(self.NamePrefix .. "ChatRoom/Dialog/MemberList")):toDerived()
		--Tanx.log("self.MemberList: " .. type(self.MemberList))

		self.WindowManager:getWindow(CEGUI.String"ChatRoom/root"):addChildWindow(self.FrameWindow)

		self.Members = members or {}
		self:refreshMemberList()
	end

	function DialogWindow:refreshMemberList()
		local i, member
		for i, member in ipairs(self.Members) do
			local listboxitem = CEGUI.ListboxTextItem.new(CEGUI.String(member.nickname))
			listboxitem:setFont(CEGUI.String"BlueHighway-16")
			--listboxitem:setSelectionBrushImage(CEGUI.String"TaharezLook", CEGUI.String"ListboxSelectionBrush")
			self.MemberList:addItem(listboxitem)
		end
	end
