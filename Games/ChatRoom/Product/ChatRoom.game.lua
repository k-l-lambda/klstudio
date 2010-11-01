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


function reportFinish(result, handler)
	g_StateLabel:setText(CEGUI.String"Loading finished.")

	Tanx.log("[ChatRoom\\ChatRoom.game.lua]: web result: " .. result)

	if handler then
		local r = Tanx.serializer.load(result)
		handler(r)
		--g_StateLabel:setText(CEGUI.String("result: " .. r.result))
	end
end

function reportState(state)
	g_StateLabel:setText(CEGUI.String("Loading: " .. state))
end


function initialize(game, params)
	g_Game = game

	-- setup GUI
	g_GuiSystem = CEGUI.System.getSingleton()
	CEGUI.SchemeManager.getSingleton():loadScheme(CEGUI.String"TaharezLookSkin.scheme")
	--g_GuiSystem:setDefaultMouseCursor(CEGUI.String"TaharezLook", CEGUI.String"MouseArrow")
	g_GuiSystem:setDefaultTooltip(CEGUI.String"TaharezLook/Tooltip")

	local sheet = CEGUI.WindowManager.getSingleton():loadWindowLayout(CEGUI.String"Dialog.layout")
	g_GuiSystem:setGUISheet(sheet)

	g_StateLabel = CEGUI.WindowManager.getSingleton():getWindow(CEGUI.String"Dialog/State")


	-- setup viewport
	g_MainCamera = game:getWorld():createCamera"Main"
	g_MainCamera:setAspectRatio(game:getWindow():getWidth() / game:getWindow():getHeight())

	g_Viewport = game:getWindow():addViewport(g_MainCamera)
	g_Viewport:setBackgroundColour(Ogre.ColourValue.Black)

	g_StateLabel:setText(CEGUI.String"ChatRoom")

	g_WebClient = g_Game:getWebClient(params)
	g_LoadEntry = g_WebClient:getUrl("http://localhost:8080/tanx-web-service/v1/user-info", Tanx.bind(reportFinish, Tanx._1, function(data) g_StateLabel:setText(CEGUI.String(string.format("nickname: %s\nemail: %s\nuser_id: %s", data.nickname or "", data.email or "", data.user_id or ""))) end), reportState)
	--g_LoadEntry = g_WebClient:postUrl("http://localhost:8080/tanx-web-service/v1/", "Content-Type:\tapplication/x-www-form-urlencoded\n\narg=hello;data={a=\"abc\\;def\"}", reportFinish, reportState)
end


function onStep(elapsed)
	if g_LoadEntry and g_LoadEntry:get() then
		if g_LoadEntry:get():checkState() then
			g_LoadEntry = nil
		end
	end
end
