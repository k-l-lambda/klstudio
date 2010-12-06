--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	DialogWindow.lua
--]]

Tanx.log("[ChatRoom\\DialogWindow.lua]: parsed.")

Tanx.require"Core:bind.lua"
Tanx.require"Core:OsUtil.lua"
Tanx.require"Core:CeguiUtil.lua"

class "DialogWindow"

	function DialogWindow:__init(windowManager, hostname, members, callbacks)
		self.WindowManager = windowManager

		self.Callbacks = callbacks or {}

		self.NamePrefix = "Dialog_" .. hostname

		self.FrameWindow = self.WindowManager:loadWindowLayout(CEGUI.String"Dialog.layout", CEGUI.String(self.NamePrefix))
		self.FrameWindow:setText(CEGUI.String(hostname .. "'s Room"))

		self.WindowManager:getWindow(CEGUI.String"ChatRoom/root"):addChildWindow(self.FrameWindow)

		self.MemberList = self.FrameWindow:getChildRecursive(CEGUI.String(self.NamePrefix .. "ChatRoom/Dialog/MemberList")):toDerived()
		self.Records = self.FrameWindow:getChildRecursive(CEGUI.String(self.NamePrefix .. "ChatRoom/Dialog/Records")):toDerived()
		self.EditBox = self.FrameWindow:getChildRecursive(CEGUI.String(self.NamePrefix .. "ChatRoom/Dialog/Edit")):toDerived()

		self.EditBox:subscribeEvent(CEGUI.Editbox.EventTextAccepted, CEGUI.EventSubscriber(Tanx.bind(self.onEditTextAccepted, self)))

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

	function DialogWindow:onEditTextAccepted()
		--Tanx.log"DialogWindow:onEditTextAccepted"
		if self.Callbacks.PostMessage then
			self.Callbacks.PostMessage(self.EditBox:getText():c_str())
		end

		self.EditBox:setText(CEGUI.String"")
	end

	function DialogWindow:showMessage(author, message, date)
		date = date or OsUtil.getUniversalTime()

		local record = string.format("%s %s\n  %s\n", author, date, message)

		self.Records:setText(CEGUI.String(self.Records:getText():c_str() .. record))
	end
