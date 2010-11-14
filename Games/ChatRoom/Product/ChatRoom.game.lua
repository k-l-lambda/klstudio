--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	ChatRoom.game.lua
--]]

Tanx.log("[ChatRoom\\ChatRoom.game.lua]: parsed.")

Tanx.require"Core:WebClient.lua"
Tanx.require"Core:serializer.lua"
Tanx.require"Core:bind.lua"
Tanx.require"Core:CeguiKeyListener.lua"
Tanx.require"Core:CeguiMouseListener.lua"


function reportState(state)
	g_StateLabel:setText(CEGUI.String("Loading: " .. state))
end


s_WebServiceLocation = "http://localhost:8080/tanx-web-service/v1/"
s_WebAppLocation = s_WebServiceLocation .. "app/ChatRoom/"


function setupRoom()
	g_StateLabel:setText(CEGUI.String("Seting up room..."))

	local result
	local entry = g_WebClient:postUrl(s_WebAppLocation .. "setup-session", "Content-Type:\tapplication/x-www-form-urlencoded\n\n", function(response) result = Tanx.serializer.load(response) end, reportState)

	while not entry:get():checkState() do
		coroutine.yield()
	end

	--Tanx.log("session-list: " .. archive)
	g_StateLabel:setText(CEGUI.String"Ready.")

	if result then
		g_OwnSessionId = result.id
		Tanx.log("g_OwnSessionId: " .. g_OwnSessionId)

		refreshRoomList()
	else
		g_StateLabel:setText(CEGUI.String"Room setup failed.")
	end
end


function refreshRoomList()
	g_StateLabel:setText(CEGUI.String("Loading room list..."))

	local result
	local entry = g_WebClient:getUrl(s_WebAppLocation .. "session-list", function(response) result = Tanx.serializer.load(response) end, reportState)

	while not entry:get():checkState() do
		coroutine.yield()
	end

	g_StateLabel:setText(CEGUI.String"Ready.")

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
	--g_GuiSystem:setDefaultMouseCursor(CEGUI.String"TaharezLook", CEGUI.String"MouseArrow")
	g_GuiSystem:setDefaultTooltip(CEGUI.String"TaharezLook/Tooltip")

	local sheet = g_WindowManager:loadWindowLayout(CEGUI.String"ChatRoom.layout")
	g_GuiSystem:setGUISheet(sheet)

	g_RootWindow = g_WindowManager:getWindow(CEGUI.String"ChatRoom/root")
	g_StateLabel = g_WindowManager:getWindow(CEGUI.String"ChatRoom/State")

	g_RootWindow:addChildWindow(g_WindowManager:loadWindowLayout(CEGUI.String"RoomList.layout"))
	g_RoomList = g_WindowManager:getWindow(CEGUI.String"ChatRoom/RoomList/List"):toDerived()


	-- setup viewport
	g_MainCamera = game:getWorld():createCamera"Main"
	g_MainCamera:setAspectRatio(game:getWindow():getWidth() / game:getWindow():getHeight())

	g_Viewport = game:getWindow():addViewport(g_MainCamera)
	g_Viewport:setBackgroundColour(Ogre.ColourValue(0.234, 0.382, 0.633))


	g_StateLabel:setText(CEGUI.String"Ready")

	g_WebClient = g_Game:getWebClient(params)

	g_WebThread = coroutine.create(setupRoom)
end


function onStep(elapsed)
	if g_WebThread and coroutine.status(g_WebThread) == "suspended" then
		local s, e = coroutine.resume(g_WebThread)
		if not s then
			error(e)
		end
	end
end
