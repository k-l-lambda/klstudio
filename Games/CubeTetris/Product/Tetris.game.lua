--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	Tetris.game.lua
--]]

Tanx.log("[Tetris\\Tetris.game.lua]: parsed.")

Tanx.require"Core:utility.lua"
Tanx.require"Core:StateMachine.lua"
Tanx.require"Core:CeguiUtil.lua"
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


local onPromptStart = function()
	g_GameStateMachine:switch("Transition", "Gaming")
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
	g_GuiWindows.GamingMenu_Resume:subscribeEvent(CEGUI.Window.EventMouseClick, CEGUI.EventSubscriber(g_GameStates.GamingMenu.EventHandles.onResume))
	g_GuiWindows.GamingMenu_Restart:subscribeEvent(CEGUI.Window.EventMouseClick, CEGUI.EventSubscriber(g_GameStates.GamingMenu.EventHandles.onRestart))
	g_GuiWindows.GamingMenu_Exit:subscribeEvent(CEGUI.Window.EventMouseClick, CEGUI.EventSubscriber(g_GameStates.GamingMenu.EventHandles.onExit))

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

	g_GameStateMachine:switch"Title"
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

	local state = g_GameStateMachine:state()
	if state and state.step then
		state:step(elapsed)
	end
end


function windowClosing(window)
	g_Game:exit()

	return false
end


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

		local state = g_GameStateMachine:state()
		if state and state.keyPressed then
			state:keyPressed(e)
		end

		return true
	end

	function KeyListener:keyReleased(e)
		--Tanx.log("keyReleased " .. e.key)

		local state = g_GameStateMachine:state()
		if state and state.keyReleased then
			state:keyReleased(e)
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

		CEGUI.System.getSingleton():injectMouseButtonDown(CEGUI.ButtonIdFromOis[id])

		local state = g_GameStateMachine:state()
		if state and state.mousePressed then
			state:mousePressed(e)
		end

		return true
	end

	function MouseListener:mouseReleased(e, id)
		--Tanx.log("mouseReleased " .. id)

		CEGUI.System.getSingleton():injectMouseButtonUp(CEGUI.ButtonIdFromOis[id])

		local state = g_GameStateMachine:state()
		if state and state.mouseReleased then
			state:mouseReleased(e)
		end

		return true
	end

	function MouseListener:mouseMoved(e)
		--Tanx.log(string.format("mouseMoved: %d, %d, %d", e:state().X.rel, e:state().Y.rel, e:state().Z.rel))

		CEGUI.System.getSingleton():injectMousePosition(e:state().X.abs, e:state().Y.abs)
		CEGUI.System.getSingleton():injectMouseWheelChange(e:state().Z.rel)

		local state = g_GameStateMachine:state()
		if state and state.mouseMoved then
			state:mouseMoved(e)
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

		local state = g_GameStateMachine:state()
		if state and state.buttonPressed then
			state:buttonPressed(arg, button)
		end

		return true
	end

	function JoyStickListener:buttonReleased(arg, button)
		--Tanx.log("buttonReleased " .. button)

		local state = g_GameStateMachine:state()
		if state and state.buttonReleased then
			state:buttonReleased(arg, button)
		end

		return true
	end

	function JoyStickListener:axisMoved(arg, axis)
		--Tanx.log("axisMoved " .. axis .. ", " .. arg:state().mAxes:at(axis).abs)

		local state = g_GameStateMachine:state()
		if state and state.axisMoved then
			state:axisMoved(arg, axis)
		end

		return true
	end

	function JoyStickListener:sliderMoved(arg, id)
		--Tanx.log(string.format("sliderMoved %d, %d, %d", id, arg:state():mSliders(id).abX, arg:state():mSliders(id):get().abY))

		local state = g_GameStateMachine:state()
		if state and state.sliderMoved then
			state:sliderMoved(arg, id)
		end

		return true
	end

	function JoyStickListener:povMoved(arg, id)
		--Tanx.log(string.format("povMoved %d, %x", id, arg:state():mPOV(id):get().direction))

		local state = g_GameStateMachine:state()
		if state and state.povMoved then
			state:povMoved(arg, id)
		end

		return true
	end



local function suspendGaming(state)
	state.Suspended = true

	if g_Pool1 then
		g_Pool1:pause()
	end

	g_GameStateMachine:switch"GamingMenu"
end

g_GameStates =
{
	Title = TitleState,


	Gaming =
	{
		enterState = function(state)
			if state.Suspended then
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

		leaveState = function(state)
			if not state.Suspended then
				g_Pool1:stop()
				g_Pool1 = nil

				g_GuiWindows.Layers:hide()
			end
		end,

		step = function(state, elapsed)
			if g_Pool1 then
				g_Pool1:step(elapsed)

				local end1, end2 = g_Pool1:isEnd()
				if end2 then
					g_ReturnTitleWaitTime = g_ReturnTitleWaitTime - elapsed
					if g_ReturnTitleWaitTime <= 0 then
						g_Pool1:stop()
						g_GameStateMachine:switch("Transition", "Title")
					end
				end
			end
		end,

		keyPressed = function(state, e)
			if e.key == OIS.KeyCode.ESCAPE then
				suspendGaming(state)
			elseif e.key == OIS.KeyCode.RETURN then
				if g_Pool1 and g_Pool1:isEnd() then
					g_Pool1:stop()
					g_GameStateMachine:switch("Transition", "Title")
				end
			end
		end,

		buttonPressed = function(state, arg, button)
			if button == g_ButtonMap.Start then
				if g_Pool1 and g_Pool1:isEnd() then
					g_Pool1:stop()
					g_GameStateMachine:switch("Transition", "Title")
				else
					suspendGaming(state)
				end
			end
		end,
	},


	Transition =
	{
		enterState = function(state, targetstate)
			state.TargetState = targetstate
			state.Frames = 2
		end,

		step = function(state, elapsed)
			state.Frames = state.Frames - 1
			if state.Frames <= 0 then
				g_GameStateMachine:switch(state.TargetState)
			end
		end
	},


	GamingMenu =
	{
		enterState = function(state)
			g_GuiWindows.GamingMenu:show()
			g_GuiSystem:setDefaultMouseCursor(CEGUI.String"TaharezLook", CEGUI.String"MouseArrow")
		end,

		leaveState = function(state)
			g_GuiWindows.GamingMenu:hide()
		end,

		keyPressed = function(state, e)
			if e.key == OIS.KeyCode.ESCAPE then
				g_GameStateMachine:switch"Gaming"
			end
		end,

		buttonPressed = function(state, arg, button)
			if button == 9 then
				g_GameStateMachine:switch"Gaming"
			end
		end,


		EventHandles = {
			onResume = function()
				g_GameStateMachine:switch"Gaming"
			end,

			onRestart = function()
				if g_Pool1 then
					g_Pool1:stop()
					g_Pool1 = nil
				end

				g_GameStateMachine:getStateSet().Gaming.Suspended = false

				g_GameStateMachine:switch("Transition", "Title")
			end,

			onExit = function()
				g_Game:exit()
			end,
		},
	},
}

g_GameStateMachine = TanxStateMachine(g_GameStates)
