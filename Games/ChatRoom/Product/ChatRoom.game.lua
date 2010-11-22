--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	ChatRoom.game.lua
--]]

Tanx.log("[ChatRoom\\ChatRoom.game.lua]: parsed.")

Tanx.require"Core:bind.lua"
Tanx.require"Core:WebClient.lua"
Tanx.require"Core:serializer.lua"
Tanx.require"Core:CeguiKeyListener.lua"
Tanx.require"Core:CeguiMouseListener.lua"
Tanx.require"Core:ThreadManager.lua"

Tanx.dofile"DialogWindow.lua"


function reportState(state)
	g_StateLabel:setText(CEGUI.String(state))
end


s_WebServiceLocation = "http://localhost:8080/tanx-web-service/v1/"
s_WebAppLocation = s_WebServiceLocation .. "app/ChatRoom/"


function onPostMessage(session_id, message)
	Tanx.log(string.format("message post in session %s: %s", session_id, message))
end


function setupRoom()
	g_StateLabel:setText(CEGUI.String("Setting up room..."))

	local result = Tanx.serializer.load(g_WebClient:postUrlSync(s_WebAppLocation .. "setup-session", "", reportState))

	--Tanx.log("session-list: " .. archive)
	g_StateLabel:setText(CEGUI.String"Ready.")

	if result then
		g_OwnSessionId = result.id

		return true
	else
		g_StateLabel:setText(CEGUI.String"Room setup failed.")

		return false
	end
end


function keepAlive(location)
	location = location or g_SelfSessionLocation

	while g_WebClient do
		g_WebClient:postUrl(location .. "keep-alive", Tanx.WebClient.FormHeader)

		-- sleep 1 minute
		Tanx.sleep(60)
	end
end


function refreshRoomList()
	g_StateLabel:setText(CEGUI.String("Loading room list..."))

	local result = Tanx.serializer.load(g_WebClient:getUrlSync(s_WebAppLocation .. "session-list", reportState))

	if result then
		local i, room
		for i, room in ipairs(result.list) do
			local listboxitem = CEGUI.ListboxTextItem.new(CEGUI.String(room.host.nickname))
			listboxitem:setFont(CEGUI.String"BlueHighway-24")
			listboxitem:setSelectionBrushImage(CEGUI.String"TaharezLook", CEGUI.String"ListboxSelectionBrush")
			g_RoomList:addItem(listboxitem)
		end
	else
		g_StateLabel:setText(CEGUI.String"Room list loading failed.")
	end

	g_StateLabel:setText(CEGUI.String"Ready.")
end


function startSync()
	g_SelfUserInfo = Tanx.serializer.load(g_WebClient:getUrlSync(s_WebServiceLocation .. "user-info", reportState))
	if not g_SelfUserInfo then
		g_StateLabel:setText(CEGUI.String"Get user info failed.")

		return false
	end

	if setupRoom() then
		g_SelfSessionLocation = s_WebAppLocation .. "session/" .. g_OwnSessionId .. "/"
		g_SelfDialogWindow = DialogWindow(CEGUI.WindowManager.getSingleton(), g_SelfUserInfo.nickname, {g_SelfUserInfo}, {PostMessage = Tanx.bind(onPostMessage, g_OwnSessionId, Tanx._1)})

		g_ThreadManager:addThread(keepAlive)

		refreshRoomList()
	end
end


function updateRoomListSize()
	--Tanx.log("[ChatRoom\\ChatRoom.game.lua]: onRoomListSized.")
	local titleheight = 0.056
	local frameheight = g_RoomList:getParent():getHeight():asRelative(g_RoomList:getParent():getParentPixelHeight())

	local y = titleheight / frameheight
	--Tanx.log("[ChatRoom\\ChatRoom.game.lua]: frameheight: " .. g_RoomList:getParent():getHeight():asRelative(g_RoomList:getParent():getParentPixelHeight()))
	g_RoomList:setYPosition(CEGUI.UDim(y, 0))
	g_RoomList:setHeight(CEGUI.UDim(1 - y - 0.1, 0))
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

	g_RootWindow = g_WindowManager:getWindow(CEGUI.String"ChatRoom/root")
	g_StateLabel = g_WindowManager:getWindow(CEGUI.String"ChatRoom/State")

	g_RootWindow:addChildWindow(g_WindowManager:loadWindowLayout(CEGUI.String"RoomList.layout"))
	g_RoomList = g_WindowManager:getWindow(CEGUI.String"ChatRoom/RoomList/List"):toDerived()
	updateRoomListSize()
	g_RoomList:getParent():subscribeEvent(CEGUI.Window.EventSized, CEGUI.EventSubscriber(updateRoomListSize))


	-- setup viewport
	g_MainCamera = game:getWorld():createCamera"Main"
	g_MainCamera:setAspectRatio(game:getWindow():getWidth() / game:getWindow():getHeight())

	g_Viewport = game:getWindow():addViewport(g_MainCamera)
	g_Viewport:setBackgroundColour(Ogre.ColourValue(0.234, 0.382, 0.633))


	g_StateLabel:setText(CEGUI.String"Ready")

	g_ThreadManager = TanxThreadManager()

	g_WebClient = g_Game:getWebClient(params)
	if g_WebClient then
		g_ThreadManager:addThread(startSync)
	else
		g_StateLabel:setText(CEGUI.String"Web client is not available")
	end
end


function dispose()
	--[[if g_WebClient then
		--g_WebClient:postUrl(g_SelfSessionLocation .. "end", Tanx.WebClient.FormHeader)
		g_WebClient:postUrlSync(g_SelfSessionLocation .. "end", "", function() end)
	end]]
end


function onStep(elapsed)
	g_ThreadManager:resume()
end
