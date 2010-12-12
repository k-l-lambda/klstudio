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


function reportState(state)
	g_GuiWindows.StateLabel:setText(CEGUI.String(state))
end


s_WebServiceLocation = "http://localhost:8080/tanx-web-service/v1/"


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
	Tanx.log(string.format("message arrived in session %s: %s", session_id, message.data))
end


function setupRoom()
	g_GuiWindows.StateLabel:setText(CEGUI.String("Setting up room..."))

	--[[local s, e = pcall(function()
		g_OwnSession = g_WebService:getApplication"ChatRoom":setupSession(reportState)
	end)
	if not s then
		g_GuiWindows.StateLabel:setText(CEGUI.String("Room setup failed: " .. e))
	end

	return s]]
	g_OwnSession = g_WebService:getApplication"ChatRoom":setupSession(reportState)
	return true
end


function refreshRoomList()
	g_GuiWindows.RoomList.Refresh:disable()
	g_GuiWindows.StateLabel:setText(CEGUI.String("Loading room list..."))

	--local result = Tanx.serializer.load(g_WebClient:getUrlSync(s_WebAppLocation .. "session-list", reportState))
	local result = g_WebService:getApplication"ChatRoom":getSessionList(reportState)

	if result then
		g_GuiWindows.RoomList.List:resetList()
		local i, room
		for i, room in ipairs(result.list) do
			local listboxitem = CEGUI.ListboxTextItem.new(CEGUI.String(room.host.nickname))
			listboxitem:setFont(CEGUI.String"BlueHighway-24")
			listboxitem:setSelectionBrushImage(CEGUI.String"TaharezLook", CEGUI.String"ListboxSelectionBrush")
			g_GuiWindows.RoomList.List:addItem(listboxitem)
		end
	else
		g_GuiWindows.StateLabel:setText(CEGUI.String"Room list loading failed.")
	end

	g_GuiWindows.RoomList.Refresh:enable()
	g_GuiWindows.StateLabel:setText(CEGUI.String"Ready.")
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
	g_GuiWindows.RoomList.Refresh:subscribeEvent(CEGUI.PushButton.EventClicked, CEGUI.EventSubscriber(function() g_ThreadManager:addThread(refreshRoomList) end))


	-- setup viewport
	g_MainCamera = game:getWorld():createCamera"Main"
	g_MainCamera:setAspectRatio(game:getWindow():getWidth() / game:getWindow():getHeight())

	g_Viewport = game:getWindow():addViewport(g_MainCamera)
	g_Viewport:setBackgroundColour(Ogre.ColourValue(0.234, 0.382, 0.633))


	g_GuiWindows.StateLabel:setText(CEGUI.String"Ready")

	g_ThreadManager = TanxThreadManager()

	g_WebClient = g_Game:getWebClient(params)
	if g_WebClient then
		g_WebService = TanxWebService(g_WebClient, s_WebServiceLocation)

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
