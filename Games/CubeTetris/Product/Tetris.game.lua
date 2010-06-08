--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	Tetris.game.lua
--]]

Tanx.log("[Tetris\\Tetris.game.lua]: parsed.")

Tanx.require"Core:utility.lua"
Tanx.dofile"CubeGrid.lua"
Tanx.dofile"AlignAction.lua"
Tanx.dofile"PlayerController.lua"
Tanx.dofile"AiController.lua"
Tanx.dofile"TetrisPool.lua"
Tanx.dofile"TitleState.lua"


-- holder lua objects in a table to prevent garbage recycling
g_Holders = {}

g_JoyStickScheme = {
	[0] = {
		YawL = 5,
		YawR = 4,
		Start = 9,
	},

	["USB/PS2 Vibration Pad"] = {
		YawL = 5,
		YawR = 4,
		Start = 9,
	},
}


local function loadSound()
	g_TitleMusic = openalpp.StreamPtr(openalpp.FileStream.new(g_Game:getResourcePackage():get():open("Tetris (Tengen) 5.ogg")))
	g_BackgroundMusic = openalpp.Source.new()

	local createSoundSource = function(filename)
		return openalpp.Source.new(openalpp.Sample.new(g_Game:getResourcePackage():get():open(filename):get()):get())
	end

	g_Sounds = {
		GlassCollision	= createSoundSource"glass collision.wav",
		BrickCollision	= createSoundSource"brick collision.wav",
		BrickFreeze		= createSoundSource"brick freeze.wav",
		LayerClearSound	= createSoundSource"layer clear.wav",
		GameOver		= createSoundSource"game over.wav",
	}
end


function state(s, ...)
	if g_State and g_State.leaveState then
		g_State.leaveState()
	end

	Tanx.log(string.format("[Tetris\\Tetris.game.lua]: swtich state fromt \"%s\" to \"%s\".", (g_State or {}).name or "", (s or {}).name or ""), Ogre.LogMessageLevel.TRIVIAL)

	g_State = s

	if g_State and g_State.enterState then
		g_State.enterState(unpack(arg))
	end
end


local onPromptStart = function()
	state(TransitionState, GamingState)
end


function initialize(game)
	g_Game = game
	g_World = game:getWorld()
	g_Keyboard = game:getKeyboard()
	g_Mouse = game:getMouse()

	-- load scene
	local scene = Tanx.SceneConfig()
	Tanx.GenericArchive.load(game:getResourcePackage():get():open("Tetris.scene"):get(), scene)
	game:getWorld():loadScene(scene, game:getResourcePackage())

	-- create viewport
	g_MainCamera = game:getWorld():createCamera"Main"
	g_CameraNode = g_World:getRootSceneNode():createChildSceneNode(Tanx.Vector3(0, 18, 0))
	g_CameraNode:attachObject(g_MainCamera)
	g_MainCamera:setNearClipDistance(0.1)
	g_MainCamera:setPosition(Tanx.Vector3(0, 12, -24))
	g_MainCamera:lookAt(g_CameraNode:getPosition())
	g_MainCamera:setFOVy(Tanx.Radian(math.pi * 0.32))
	g_MainCamera:setAspectRatio(game:getWindow():getWidth() / game:getWindow():getHeight())

	local viewport = game:getWindow():addViewport(g_MainCamera)
	viewport:setBackgroundColour(Ogre.ColourValue(0.2, 0.3, 0.5))

	-- create control indicators
	do
		local arrowconfig = Tanx.EntityAppearanceConfig()
		arrowconfig.MeshName = "arrow.mesh"
		arrowconfig.CastShadows = false
		arrowconfig.Scale = Tanx.Vector3(0.2)
		local arrownode = g_World:createAppearance("ControlArrow", arrowconfig):getParentSceneNode()
		arrownode:getParent():removeChild(arrownode)
		g_CameraNode:addChild(arrownode)
		arrownode:setVisible(false)
		arrownode:setInheritOrientation(false)
		arrownode:setPosition(Tanx.Vector3(6, 0, 0))

		local ballconfig = Tanx.EntityAppearanceConfig()
		ballconfig.MeshName = "Prefab_Sphere"
		ballconfig.CastShadows = false
		ballconfig.Scale = Tanx.Vector3(0.036)
		ballconfig.MaterialMap:at(0).MaterialName = "Tetris/ControlIndicatorBall"
		local ballnode = g_World:createAppearance("ControlBall", ballconfig):getParentSceneNode()
		ballnode:getParent():removeChild(ballnode)
		g_CameraNode:addChild(ballnode)
		ballnode:setVisible(false)
		ballnode:setInheritOrientation(false)
		ballnode:setPosition(Tanx.Vector3(-6.4, 0, 0))

		g_ControlIndicatorNodes = {
			Arrow = arrownode,
			Ball = ballnode,
		}
	end

	-- setup GUI
	g_GuiSystem = CEGUI.System.getSingleton()
	CEGUI.SchemeManager.getSingleton():loadScheme(CEGUI.String(iif(viewport:getActualWidth() > viewport:getActualHeight(), "Font16_9.scheme", "Font2_3.scheme")))
	CEGUI.SchemeManager.getSingleton():loadScheme(CEGUI.String"TaharezLookSkin.scheme")
	g_GuiSystem:setDefaultMouseCursor(CEGUI.String"TaharezLook", CEGUI.String"MouseArrow")
	g_GuiSystem:setDefaultTooltip(CEGUI.String"TaharezLook/Tooltip")
	if g_Mouse then
		CEGUI.System.getSingleton():injectMousePosition(g_Mouse:getMouseState().X.abs, g_Mouse:getMouseState().Y.abs)
	end

	local sheet = CEGUI.WindowManager.getSingleton():loadWindowLayout(CEGUI.String"Tetris.layout")
	g_GuiSystem:setGUISheet(sheet)
	local windowManager = CEGUI.WindowManager.getSingleton()

	g_GuiWindows =
	{
		PromptStart			= windowManager:getWindow(CEGUI.String"Tetris/PromptStart"),
		Close				= windowManager:getWindow(CEGUI.String"Tetris/Close"),
		BrickFreezeClock	= windowManager:getWindow(CEGUI.String"Tetris/BrickFreezeClock"),
		Layers				= windowManager:getWindow(CEGUI.String"Tetris/Layers"),
		GamingMenu			= windowManager:getWindow(CEGUI.String"Tetris/GamingMenu"),
		GamingMenu_Resume	= windowManager:getWindow(CEGUI.String"Tetris/GamingMenu/Resume"),
		GamingMenu_Restart	= windowManager:getWindow(CEGUI.String"Tetris/GamingMenu/Restart"),
		GamingMenu_Exit		= windowManager:getWindow(CEGUI.String"Tetris/GamingMenu/Exit"),
	}
	g_GuiWindows.PromptStart:subscribeEvent(CEGUI.Window.EventMouseClick, CEGUI.EventSubscriber(onPromptStart))
	g_GuiWindows.Close:subscribeEvent(CEGUI.Window.EventMouseClick, CEGUI.EventSubscriber(function() g_Game:exit() end))
	g_GuiWindows.GamingMenu_Resume:subscribeEvent(CEGUI.Window.EventMouseClick, CEGUI.EventSubscriber(GamingMenuState.EventHandles.onResume))
	g_GuiWindows.GamingMenu_Restart:subscribeEvent(CEGUI.Window.EventMouseClick, CEGUI.EventSubscriber(GamingMenuState.EventHandles.onRestart))
	g_GuiWindows.GamingMenu_Exit:subscribeEvent(CEGUI.Window.EventMouseClick, CEGUI.EventSubscriber(GamingMenuState.EventHandles.onExit))

	-- setup input devices
	local s, joystick = pcall(createJoyStick, g_Game)
	if s then
		if joystick then
			g_ButtonMap = g_JoyStickScheme[joystick:vendor()] or g_JoyStickScheme[0]
		end
	else
		Tanx.log("[Tetris\\PlayerController.lua]: createJoyStick failed: " .. joystick, Ogre.LogMessageLevel.TRIVIAL)
		joystick = nil
	end

	g_KeyListener = KeyListener()
	if g_Keyboard then
		g_Keyboard:setEventCallback(g_KeyListener)
	end
	g_MouseListener = MouseListener()
	if g_Mouse then
		g_Mouse:setEventCallback(g_MouseListener)
	end

	if joystick then
		g_JoyStick = joystick
		g_JoyStickListener = JoyStickListener()
		g_JoyStick:setEventCallback(g_JoyStickListener)
	end

	g_PlayerController = PlayerController(g_Game, g_JoyStick)
	g_AiController = AiController(g_Game)

	pcall(loadSound)

	state(TitleState)
end


function dispose()
	if g_PlayerController then
		g_PlayerController:dispose()
	end
	if g_AiController then
		g_AiController:dispose()
	end

	if g_Game:getKeyboard() then
		g_Game:getKeyboard():clearEventCallback()
	end
	if g_Game:getMouse() then
		g_Game:getMouse():clearEventCallback()
	end
end


function onStep(elapsed)
	if g_JoyStick then
		g_JoyStick:capture()
	end

	if g_State and g_State.step then
		g_State.step(elapsed)
	end
end


--function frameEnded(e)
--	return not g_ExitGame
--end


function windowClosing(window)
	g_Game:exit()

	return false
end


OisButtonIdToCegui =
{
	[OIS.MouseButtonID.Left]	= CEGUI.MouseButton.LeftButton,
	[OIS.MouseButtonID.Right]	= CEGUI.MouseButton.RightButton,
	[OIS.MouseButtonID.Middle]	= CEGUI.MouseButton.MiddleButton,
	[OIS.MouseButtonID.Button3]	= CEGUI.MouseButton.X1Button,
	[OIS.MouseButtonID.Button4]	= CEGUI.MouseButton.X2Button,
}


class "KeyListener" (OIS.KeyListener)

	function KeyListener:__init()
		if _LUABIND_VERSION and _LUABIND_VERSION >= 800 then
			OIS.KeyListener.__init(self)
		else
			super()
		end
	end

	function KeyListener:keyPressed(e)
		--Tanx.log("keyPressed " .. e.key)

		if g_State and g_State.keyPressed then
			g_State.keyPressed(e)
		end

		return true
	end

	function KeyListener:keyReleased(e)
		--Tanx.log("keyReleased " .. e.key)

		if g_State and g_State.keyReleased then
			g_State.keyReleased(e)
		end

		return true
	end


class "MouseListener" (OIS.MouseListener)

	function MouseListener:__init()
		if _LUABIND_VERSION and _LUABIND_VERSION >= 800 then
			OIS.MouseListener.__init(self)
		else
			super()
		end
	end

	function MouseListener:mousePressed(e, id)
		--Tanx.log("mousePressed " .. id)

		CEGUI.System.getSingleton():injectMouseButtonDown(OisButtonIdToCegui[id])

		if g_State and g_State.mousePressed then
			g_State.mousePressed(e)
		end

		return true
	end

	function MouseListener:mouseReleased(e, id)
		--Tanx.log("mouseReleased " .. id)

		CEGUI.System.getSingleton():injectMouseButtonUp(OisButtonIdToCegui[id])

		if g_State and g_State.mouseReleased then
			g_State.mouseReleased(e)
		end

		return true
	end

	function MouseListener:mouseMoved(e)
		--Tanx.log(string.format("mouseMoved: %d, %d, %d", e:state().X.rel, e:state().Y.rel, e:state().Z.rel))

		CEGUI.System.getSingleton():injectMousePosition(e:state().X.abs, e:state().Y.abs)
		CEGUI.System.getSingleton():injectMouseWheelChange(e:state().Z.rel)

		if g_State and g_State.mouseMoved then
			g_State.mouseMoved(e)
		end

		return true
	end


class "JoyStickListener" (OIS.JoyStickListener)

	function JoyStickListener:__init()
		if _LUABIND_VERSION and _LUABIND_VERSION >= 800 then
			OIS.JoyStickListener.__init(self)
		else
			super()
		end
	end

	function JoyStickListener:buttonPressed(arg, button)
		--Tanx.log("buttonPressed " .. button)

		if g_State and g_State.buttonPressed then
			g_State.buttonPressed(arg, button)
		end

		return true
	end

	function JoyStickListener:buttonReleased(arg, button)
		--Tanx.log("buttonReleased " .. button)

		if g_State and g_State.buttonReleased then
			g_State.buttonReleased(arg, button)
		end

		return true
	end

	function JoyStickListener:axisMoved(arg, axis)
		--Tanx.log("axisMoved " .. axis .. ", " .. arg:state().mAxes:at(axis).abs)

		if g_State and g_State.axisMoved then
			g_State.axisMoved(arg, axis)
		end

		return true
	end

	function JoyStickListener:sliderMoved(arg, id)
		--Tanx.log(string.format("sliderMoved %d, %d, %d", id, arg:state():mSliders(id).abX, arg:state():mSliders(id):get().abY))

		if g_State and g_State.sliderMoved then
			g_State.sliderMoved(arg, id)
		end

		return true
	end

	function JoyStickListener:povMoved(arg, id)
		--Tanx.log(string.format("povMoved %d, %x", id, arg:state():mPOV(id):get().direction))

		if g_State and g_State.povMoved then
			g_State.povMoved(arg, id)
		end

		return true
	end



local function suspendGaming()
	GamingState.Suspended = true

	if g_Pool1 then
		g_Pool1:pause()
	end

	state(GamingMenuState)
end

GamingState =
{
	name = "Gaming",

	enterState = function()
		if GamingState.Suspended then
			if g_Pool1 then
				g_Pool1:activate()
			end
		else
			g_Pool1 = TetrisPool(g_Game, g_PlayerController, g_CameraNode, {BlockLayers = 12, ControlIndicatorNodes = g_ControlIndicatorNodes})
			g_ReturnTitleWaitTime = 15

			g_GuiWindows.Layers:show()
		end

		g_GuiSystem:hideMouseCursor()
	end,

	leaveState = function()
		if not GamingState.Suspended then
			g_Pool1:stop()
			g_Pool1 = nil

			g_GuiWindows.Layers:hide()
		end
	end,

	step = function(elapsed)
		if g_Pool1 then
			g_Pool1:step(elapsed)

			local end1, end2 = g_Pool1:isEnd()
			if end2 then
				g_ReturnTitleWaitTime = g_ReturnTitleWaitTime - elapsed
				if g_ReturnTitleWaitTime <= 0 then
					g_Pool1:stop()
					state(TransitionState, TitleState)
				end
			end
		end
	end,

	keyPressed = function(e)
		if e.key == OIS.KeyCode.ESCAPE then
			suspendGaming()
		elseif e.key == OIS.KeyCode.RETURN then
			if g_Pool1 and g_Pool1:isEnd() then
				g_Pool1:stop()
				state(TransitionState, TitleState)
			end
		end
	end,

	buttonPressed = function(arg, button)
		if button == g_ButtonMap.Start then
			if g_Pool1 and g_Pool1:isEnd() then
				g_Pool1:stop()
				state(TransitionState, TitleState)
			else
				suspendGaming()
			end
		end
	end,
}


TransitionState =
{
	name = "Transition",

	enterState = function(targetstate)
		TransitionState.TargetState = targetstate
		TransitionState.Frames = 2
	end,

	step = function(elapsed)
		TransitionState.Frames = TransitionState.Frames - 1
		if TransitionState.Frames <= 0 then
			state(TransitionState.TargetState)
		end
	end
}



GamingMenuState =
{
	name = "GamingMenu",

	enterState = function()
		g_GuiWindows.GamingMenu:show()
		g_GuiSystem:setDefaultMouseCursor(CEGUI.String"TaharezLook", CEGUI.String"MouseArrow")
	end,

	leaveState = function()
		g_GuiWindows.GamingMenu:hide()
	end,

	keyPressed = function(e)
		if e.key == OIS.KeyCode.ESCAPE then
			state(GamingState)
		end
	end,

	buttonPressed = function(arg, button)
		if button == 9 then
			state(GamingState)
		end
	end,


	EventHandles = {
		onResume = function()
			state(GamingState)
		end,

		onRestart = function()
			if g_Pool1 then
				g_Pool1:stop()
				g_Pool1 = nil
			end

			GamingState.Suspended = false

			state(TransitionState, TitleState)
		end,

		onExit = function()
			g_Game:exit()
		end,
	},
}
