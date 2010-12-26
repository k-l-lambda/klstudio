--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	ChatRoom.game.lua
--]]

Tanx.log("[ChatRoom\\ChatRoom.game.lua]: parsed.")

Tanx.require"Core:bind.lua"
Tanx.require"Core:WebService.lua"
Tanx.require"Core:CeguiKeyListener.lua"
Tanx.require"Core:CeguiMouseListener.lua"
Tanx.require"Core:ThreadManager.lua"

Tanx.dofile"DialogWindow.lua"


g_GuiWindows = {}
g_GuestDialogWindows = {}


function reportState(state)
	g_GuiWindows.StateLabel:setText(CEGUI.String(state))
end


function onPostMessage(session, message)
	Tanx.log(string.format("message post in session %s: %s", session.ID, message))

	g_ThreadManager:addThread(function()
		local data = {
			action = "say",
			message = message,
		}
		if session.ID == g_OwnSession.ID then
			data.author = g_SelfUserInfo.email
		end

		session:postMessage(reportState, data, {"talk"})

		if session.ID == g_OwnSession.ID then
			g_SelfDialogWindow:showMessage(g_SelfUserInfo.nickname, message)
		end
	end)
end


function onMessageArrived(session_id, message)
	Tanx.log(string.format("message arrived in session %s: %s", session_id, Tanx.serializer.save(message.data)))

	local data = message.data

	if session_id == g_OwnSession.ID then
		if data.action == "join" then
			g_OwnSession:getChannel"talk":addMember(reportState, message.sender.email)

			g_OwnSession:postMessage(reportState, {action = "add-member", member = message.sender}, {"talk"})

			table.insert(g_SelfDialogWindow.Members, message.sender)
			g_SelfDialogWindow:refreshMemberList()
		elseif data.action == "say" then
			g_SelfDialogWindow:showMessage(message.sender.nickname, data.message)

			-- publish guest message
			local outdata = {
				action = "say",
				message = data.message,
				author = message.sender.email,
			}
			g_OwnSession:postMessage(reportState, outdata, {"talk"})
		end
	else
		local dialog_win = g_GuestDialogWindows[session_id]
		if dialog_win then
			if data.action == "say" then
				dialog_win:showMessage(data.author, data.message)
			elseif data.action == "add-member" then
				table.insert(dialog_win.Members, data.member)
				dialog_win:refreshMemberList()
			end
		else
			Tanx.log("[ChatRoom\\ChatRoom.game.lua]: cannot find guest dialog window for session " .. session_id, Ogre.LogMessageLevel.CRITICAL)
		end
	end
end


function setupRoom()
	g_GuiWindows.StateLabel:setText(CEGUI.String("Setting up room..."))

	--[[local s, e = pcall(function()
		g_OwnSession = g_ChatRoomApp:setupSession(reportState)
	end)
	if not s then
		g_GuiWindows.StateLabel:setText(CEGUI.String("Room setup failed: " .. e))
	end

	return s]]
	g_OwnSession = g_ChatRoomApp:setupSession(reportState)
	return true
end


function refreshRoomList()
	g_GuiWindows.RoomList.Refresh:disable()
	g_GuiWindows.StateLabel:setText(CEGUI.String("Loading room list..."))

	--local result = Tanx.serializer.load(g_WebClient:getUrlSync(s_WebAppLocation .. "session-list", reportState))
	local result = g_ChatRoomApp:getSessionList(reportState)

	if result then
		g_SessionList = result.list

		g_GuiWindows.RoomList.List:resetList()
		local i, room
		for i, room in ipairs(g_SessionList) do
			local listboxitem = CEGUI.ListboxTextItem.new(CEGUI.String(room.host.nickname))
			listboxitem:setFont(CEGUI.String"BlueHighway-24")
			listboxitem:setSelectionBrushImage(CEGUI.String"TaharezLook", CEGUI.String"ListboxSelectionBrush")
			listboxitem:setID(i)
			g_GuiWindows.RoomList.List:addItem(listboxitem)
		end
	else
		g_GuiWindows.StateLabel:setText(CEGUI.String"Room list loading failed.")
	end

	g_GuiWindows.RoomList.Refresh:enable()
	g_GuiWindows.StateLabel:setText(CEGUI.String"Ready.")
end


function onRoomListJoin()
	local selection = g_SessionList and g_SessionList[g_GuiWindows.RoomList.List:getFirstSelectedItem():getID()]
	if selection then
		local session = g_ChatRoomApp:getSession(selection.id)

		g_ThreadManager:addThread(function()
			session:postMessage(reportState, {action = "join"})

			-- create dialog window
			local session_info = session:getInfo(reportState).info
			g_GuestDialogWindows[session.ID] = DialogWindow(CEGUI.WindowManager.getSingleton(), session_info.host.nickname, {session_info.host}, {PostMessage = Tanx.bind(onPostMessage, session, Tanx._1)})

			session:fetchMessageLoop(reportState, onMessageArrived)
		end)
	end
end


function startSync()
	g_SelfUserInfo = g_WebService:getUserInfo(reportState)
	if not g_SelfUserInfo then
		g_GuiWindows.StateLabel:setText(CEGUI.String"Get user info failed.")

		return false
	end

	if setupRoom() then
		g_SelfDialogWindow = DialogWindow(CEGUI.WindowManager.getSingleton(), g_SelfUserInfo.nickname, {g_SelfUserInfo}, {PostMessage = Tanx.bind(onPostMessage, g_OwnSession, Tanx._1)})

		refreshRoomList()

		g_ThreadManager:addThread(Tanx.bind(g_OwnSession.fetchMessageLoop, g_OwnSession, reportState, onMessageArrived))

		g_OwnSession:keepAliveLoop()
	end
end


function updateRoomListSize()
	--Tanx.log("[ChatRoom\\ChatRoom.game.lua]: onRoomListSized.")
	local titleheight = 0.046
	local frameheight = g_GuiWindows.RoomList:getHeight():asRelative(g_GuiWindows.RoomList:getParent():getParentPixelHeight())

	local y = titleheight / frameheight
	--Tanx.log("[ChatRoom\\ChatRoom.game.lua]: frameheight: " .. g_GuiWindows.RoomList:getHeight():asRelative(g_GuiWindows.RoomList:getParentPixelHeight()))
	g_GuiWindows.RoomList.List:setYPosition(CEGUI.UDim(y, 0))
	g_GuiWindows.RoomList.List:setHeight(CEGUI.UDim(1 - y - 0.1, 0))
end


function RoomList_SelectionChanged()
	if g_SessionList then
		local selection = g_SessionList[g_GuiWindows.RoomList.List:getFirstSelectedItem():getID()]
		if selection then
			local can_join = selection.host.email ~= g_SelfUserInfo.email
			g_GuiWindows.RoomList.Join:setEnabled(can_join)
		end
	end
end


function initialize(game, params)
	g_Game = game

	g_Keyboard = g_Game:getKeyboard()
	g_KeyListener = CeguiKeyListener(g_Keyboard)
	g_Mouse = g_Game:getMouse()
	g_MouseListener = CeguiMouseListener(g_Mouse)

	-- setup GUI
	g_GuiSystem = CEGUI.System.getSingleton()
	g_WindowManager = CEGUI.WindowManager.getSingleton()
	CEGUI.SchemeManager.getSingleton():loadScheme(CEGUI.String"TaharezLookSkin.scheme")
	g_GuiSystem:setDefaultMouseCursor(CEGUI.String"TaharezLook", CEGUI.String"MouseArrow")
	g_GuiSystem:setDefaultTooltip(CEGUI.String"TaharezLook/Tooltip")

	local sheet = g_WindowManager:loadWindowLayout(CEGUI.String"ChatRoom.layout")
	g_GuiSystem:setGUISheet(sheet)

	g_GuiWindows.Root = g_WindowManager:getWindow(CEGUI.String"ChatRoom/root")
	g_GuiWindows.StateLabel = g_WindowManager:getWindow(CEGUI.String"ChatRoom/State")

	g_GuiWindows.Root:addChildWindow(g_WindowManager:loadWindowLayout(CEGUI.String"RoomList.layout"))
	g_GuiWindows.RoomList = g_WindowManager:getWindow(CEGUI.String"ChatRoom/RoomList"):toDerived()
	g_GuiWindows.RoomList.List = g_WindowManager:getWindow(CEGUI.String"ChatRoom/RoomList/List"):toDerived()
	g_GuiWindows.RoomList.Refresh = g_WindowManager:getWindow(CEGUI.String"ChatRoom/RoomList/Refresh"):toDerived()
	g_GuiWindows.RoomList.Join = g_WindowManager:getWindow(CEGUI.String"ChatRoom/RoomList/Join"):toDerived()
	updateRoomListSize()
	g_GuiWindows.RoomList:subscribeEvent(CEGUI.Window.EventSized, CEGUI.EventSubscriber(updateRoomListSize))
	g_GuiWindows.RoomList.List:subscribeEvent(CEGUI.Listbox.EventSelectionChanged, CEGUI.EventSubscriber(RoomList_SelectionChanged))
	g_GuiWindows.RoomList.Refresh:subscribeEvent(CEGUI.PushButton.EventClicked, CEGUI.EventSubscriber(function() g_ThreadManager:addThread(refreshRoomList) end))
	g_GuiWindows.RoomList.Join:subscribeEvent(CEGUI.PushButton.EventClicked, CEGUI.EventSubscriber(onRoomListJoin))


	-- setup viewport
	g_MainCamera = game:getWorld():createCamera"Main"
	g_MainCamera:setAspectRatio(game:getWindow():getWidth() / game:getWindow():getHeight())

	g_Viewport = game:getWindow():addViewport(g_MainCamera)
	g_Viewport:setBackgroundColour(Ogre.ColourValue(0.234, 0.382, 0.633))


	g_GuiWindows.StateLabel:setText(CEGUI.String"Ready")

	g_ThreadManager = TanxThreadManager()

	g_WebClient = g_Game:getWebClient(params)
	if g_WebClient then
		s_WebServiceLocation = params:at"WebServiceLocation":get()

		g_WebService = TanxWebService(g_WebClient, s_WebServiceLocation)
		g_ChatRoomApp = g_WebService:getApplication"ChatRoom"

		g_ThreadManager:addThread(startSync)
	else
		g_GuiWindows.StateLabel:setText(CEGUI.String"Web client is not available")
	end
end


function dispose()
	--[[if g_OwnSession then
		g_OwnSession:_end()
	end]]
end


function onStep(elapsed)
	g_ThreadManager:resume()
end
