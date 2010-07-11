--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	TitleState.lua
--]]


Tanx.log("[Tetris\\TitleState.lua]: parsed.")

Tanx.require"Core:StateMachine.lua"


local s_StateLogo = 0
local s_StateScrolling = 1
local s_StateTransiting = 2
local s_StateSurrounding = 3

local s_CameraInitialHeight = 80
local s_CameraAxisPosition = Tanx.Vector3(0, 18, 0)
local s_CameraTrackEndPosition = Tanx.Vector3(24, 30, 0)
local s_CameraTrackLength = 14

local s_BlocksHeight = 24
local s_BlocksFillInterval = 0.12


local function initCameraTrack()
	if not g_CameraTrackExist then
		local rootnode = g_World:getRootSceneNode()
		local scenemgr = g_World:getSceneManager()
		local anim = scenemgr:createAnimation("CameraTrack", s_CameraTrackLength)
		anim:setInterpolationMode(Ogre.Animation.InterpolationMode.SPLINE)
		local track = anim:createNodeTrack(0, g_CameraNode)
		track:createNodeKeyFrame(0):setTranslate(Tanx.Vector3(-1, s_CameraInitialHeight, 10))
		track:createNodeKeyFrame(2):setTranslate(Tanx.Vector3(-1, 72, 12))
		track:createNodeKeyFrame(5):setTranslate(Tanx.Vector3(4, 55, 28))
		track:createNodeKeyFrame(10):setTranslate(Tanx.Vector3(12, 40, 18))
		track:createNodeKeyFrame(s_CameraTrackLength):setTranslate(s_CameraTrackEndPosition)

		local parentnode = g_MainCamera:getParentSceneNode()
		if parentnode then
			g_MainCamera:getParentSceneNode():detachObject(g_MainCamera:getName())
		end
		g_CameraNode:attachObject(g_MainCamera)
		g_MainCamera:setPosition(Tanx.Vector3.ZERO)

		g_AnimState = scenemgr:createAnimationState("CameraTrack")
		g_AnimState:setLoop(false)

		g_CameraTrackExist = true
	end
end


local function clearAnimation()
	if g_AnimState then
		g_AnimState:setEnabled(false)
	end

	g_CameraNode:setPosition(s_CameraAxisPosition)

	local parentnode = g_MainCamera:getParentSceneNode()
	if parentnode then
		g_MainCamera:getParentSceneNode():detachObject(g_MainCamera:getName())
	end
	g_CameraNode:attachObject(g_MainCamera)
	--g_MainCamera:setPosition(s_CameraTrackEndPosition - s_CameraAxisPosition)
	g_MainCamera:setPosition(Tanx.Vector3(0, 12, -24))
	g_MainCamera:lookAt(s_CameraAxisPosition)
	g_MainCamera:setFOVy(Tanx.Radian(math.pi * 0.32))
end


g_TitleStateMachine = TanxStateMachine({
	Logo =
	{
		__enter = function(state, parent)
			parent.AnimationTime = 0

			parent.MirrorCube = g_Pool1:dropBigCube{material = "Tetris/TitleMirror", height = s_CameraInitialHeight}
			parent.MirrorCube:get():freeze()

			g_CameraNode:setPosition(Tanx.Vector3(-1, s_CameraInitialHeight, 10))
			g_MainCamera:setFOVy(Tanx.Radian(math.pi * 0.039))
			g_MainCamera:setPosition(Tanx.Vector3.ZERO)
			g_MainCamera:lookAt(parent.MirrorCube:get():getMainNode():getPosition() + Tanx.Vector3(0.2, 0, 1))

			if parent.Fireworks then
				parent.Fireworks:get():getNode():setVisible(true)
			else
				parent.Fireworks = g_World:createAgent("Tetris/Fireworks", "fireworks", Tanx.RigidBodyState.make(Tanx.Vector3(0, -1, 0)))
			end

			g_GuiWindows.PromptStart:hide()
			g_GuiWindows.Close:hide()
			g_GuiWindows.BrickFreezeClock:hide()
			g_GuiWindows.Layers:hide()
			g_GuiSystem:hideMouseCursor()

			parent.ActiveLayer = 21
		end,

		step = function(parent, parent, elapsed)
			if parent.AnimationTime > 1 then
				g_TitleStateMachine:switch"Scrolling"

				--Tanx.log("[Tetris\\TitleState.lua]: title parent to: Scrolling, time: " .. parent.AnimationTime, Ogre.LogMessageLevel.TRIVIAL)
			end
		end,
	},

	Scrolling =
	{
		step = function(state, parent, elapsed)
			local i
			for i = 0, parent.MirrorCube:get():getBodies():size() - 1 do
				local body = parent.MirrorCube:get():getBodies():at(i)
				body:get():getRigidBody():get():setPosition(Tanx.madp(body:get():getPosition() - Tanx.Vector3(0, elapsed * 0.19, 0)))
			end

			g_MainCamera:lookAt(parent.MirrorCube:get():getMainNode():getPosition() + Tanx.Vector3(0.2, 0, 1))

			if parent.AnimationTime > 6 then
				g_TitleStateMachine:switch("Transiting", parent)
			end
		end,
	},

	Transiting =
	{
		__enter = function(state, parent)
			parent.MirrorCube:get():unfreeze()

			initCameraTrack()
			g_AnimState:setTimePosition(0)
			g_AnimState:setEnabled(true)

			parent.StateTimeBegin = parent.AnimationTime

			parent.BlocksFillTime = 0

			--Tanx.log("[Tetris\\TitleState.lua]: title state to: Transiting, time: " .. parent.AnimationTime, Ogre.LogMessageLevel.TRIVIAL)
		end,

		step = function(state, parent, elapsed)
			local time = (parent.AnimationTime - parent.StateTimeBegin) / s_CameraTrackLength
			local lookatRate = math.pow(time, math.exp((0.32 - time) * 10))

			local fov = math.min(g_MainCamera:getFOVy():valueRadians() + 0.064 * elapsed, math.pi * 0.32)
			g_MainCamera:setFOVy(Tanx.Radian(fov))
			if parent.MirrorCube:get():getMainNode() then
				parent.MirrorCubePosition = parent.MirrorCube:get():getMainNode():getPosition() + Tanx.Vector3(0.2, 0, 1)
			else
				parent.BlocksFillTime = parent.BlocksFillTime + elapsed
			end
			g_MainCamera:lookAt(parent.MirrorCubePosition * (1 - lookatRate) + s_CameraAxisPosition * lookatRate)

			if parent.BlocksFillTime > s_BlocksFillInterval and g_Pool1:heapHeight() < s_BlocksHeight then
				parent.BlocksFillTime = 0

				g_Pool1:fillBlocksLayer()
			end

			g_AnimState:addTime(elapsed)

			if g_AnimState:hasEnded() then
				g_TitleStateMachine:switch("Surrounding", parent)
			end
		end,
	},

	Surrounding =
	{
		__enter = function(state, parent)
			if parent.MirrorCube and parent.MirrorCube:get() then
				parent.MirrorCube:get():unfreeze()
			end

			clearAnimation()
			g_CameraNode:setOrientation(Tanx.Quaternion(Tanx.Radian(-math.pi / 2), Tanx.Vector3.UNIT_Y))

			--g_GuiWindows.PromptStart:show()
			g_GuiWindows.Close:show()
			g_GuiWindows.Layers:show()
			g_GuiSystem:setDefaultMouseCursor(CEGUI.String"TaharezLook", CEGUI.String"MouseArrow")

			if g_TitlePanelStateMachine:stateKey() == "Hiden" then
				g_TitlePanelStateMachine:switch("Sleep", parent)
			end

			--Tanx.log("[Tetris\\TitleState.lua]: title state to: Surrounding, time: " .. parent.AnimationTime, Ogre.LogMessageLevel.TRIVIAL)
		end,

		step = function(state, parent, elapsed)
			if g_Pool1 then
				g_Pool1:step(elapsed)
			end

			local yaw = elapsed * 0.2

			if g_TitlePanelStateMachine:stateKey() == "Sleep" then
				if g_Mouse then
					local mousestate = g_Mouse:getMouseState()
					if mousestate:buttonDown(OIS.MouseButtonID.Left) then
						yaw = -mousestate.X.rel * 0.01
					end
				end

				if g_JoyStick then
					local jsstate = g_JoyStick:getJoyStickState()
					if jsstate.mButtons:at(g_ButtonMap.YawL) then
						yaw = yaw + 2.4 * elapsed
					end
					if jsstate.mButtons:at(g_ButtonMap.YawR) then
						yaw = yaw - 2.4 * elapsed
					end
				end
			end

			g_CameraNode:yaw(Tanx.Radian(yaw))
		end,
	},
}, nil, nil, false)


local s_PanelSleepAlpha = 0.1
local s_PanelActiveAlpha = 0.9


g_TitlePanelStateMachine = TanxStateMachine{
	Hiden =
	{
		__enter = function(state, parent)
			g_GuiWindows.InitialPanel:hide()
			g_GuiWindows.InitialPanel:setAlpha(s_PanelSleepAlpha)
		end,

		keyPressed = function(state, parent, e)
			if g_TitleStateMachine:stateKey() ~= "Surrounding" and e.key == OIS.KeyCode.RETURN then
				g_TitleStateMachine:switch("Surrounding", parent)
				g_TitlePanelStateMachine:switch"Active"
			end
		end,

		buttonPressed = function(state, parent, arg, button)
			if g_TitleStateMachine:stateKey() ~= "Surrounding" and button == g_ButtonMap.Start then
				g_TitleStateMachine:switch("Surrounding", parent)
				g_TitlePanelStateMachine:switch"Active"
			end
		end,
	},

	Sleep =
	{
		__enter = function(state, parent)
			g_GuiWindows.InitialPanel:show()
		end,

		step = function(state, parent, elapsed)
			local alpha = g_GuiWindows.InitialPanel:getAlpha()
			local delta = math.max(s_PanelSleepAlpha - alpha, -elapsed * 1.4)
			g_GuiWindows.InitialPanel:setAlpha(alpha + delta)
		end,
	},

	Active =
	{
		__enter = function(state, parent)
			g_GuiWindows.InitialPanel:show()

			state.MouseIn = true
			state.MouseLeaveTime = 0
		end,

		step = function(state, parent, elapsed)
			local alpha = g_GuiWindows.InitialPanel:getAlpha()
			local delta = math.min(s_PanelActiveAlpha - alpha, elapsed * 1.4)
			g_GuiWindows.InitialPanel:setAlpha(alpha + delta)

			if not state.MouseIn then
				state.MouseLeaveTime = state.MouseLeaveTime + elapsed
				if state.MouseLeaveTime > 4 then
					g_TitlePanelStateMachine:switch"Sleep"
				end
			end
		end,

		mousePressed = function(state, parent, e, id)
			local focuswindow = CEGUI.System.getSingleton():getWindowContainingMouse():getName():c_str()
			if focuswindow == "root" then
				g_TitlePanelStateMachine:switch"Sleep"
			end
		end,

		keyPressed = function(state, parent, e)
			if e.key == OIS.KeyCode.RETURN then
				g_GameStateMachine:switch("Transition", "Gaming")
			end
		end,

		buttonPressed = function(state, parent, arg, button)
			if button == g_ButtonMap.Start then
				g_GameStateMachine:switch("Transition", "Gaming")
			end
		end,

		mouseEntersPanel = function(state)
			state.MouseIn = true
			state.MouseLeaveTime = 0
		end,

		mouseLeavesPanel = function(state)
			local focuswindow = CEGUI.System.getSingleton():getWindowContainingMouse():getName():c_str()
			if focuswindow == "root" then
				state.MouseIn = false
				state.MouseLeaveTime = 0
			end
		end,
	},
}

local function onPanelMouseEnters()
	if not g_Mouse:getMouseState():buttonDown(OIS.MouseButtonID.Left) then
		if g_TitlePanelStateMachine:stateKey() == "Sleep" then
			g_TitlePanelStateMachine:switch"Active"
		end
	end

	g_TitlePanelStateMachine:callState("mouseEntersPanel")
end

local function onPanelMouseLeaves()
	g_TitlePanelStateMachine:callState("mouseLeavesPanel")
end


TitleState =
{
	__enter = function(state)
		g_Pool1 = TetrisPool(g_Game, g_AiController, nil, {Center = {x = 0, z = 0}, FreezeTime = 0.2, BlockLayers = 0, ShowBrickFreezeClock = false})

		if g_BackgroundMusic then
			g_BackgroundMusic:get():stop()
			--g_BackgroundMusic:get():play(g_TitleMusic)
			g_NsfStream:get():toDerived():setTrack(g_MusicIndex.Title)
			g_BackgroundMusic:get():play(g_NsfStream)
		end

		g_GuiWindows.InitialPanel:subscribeEvent(CEGUI.Window.EventMouseEnters, CEGUI.EventSubscriber(onPanelMouseEnters))
		g_GuiWindows.InitialPanel:subscribeEvent(CEGUI.Window.EventMouseLeaves, CEGUI.EventSubscriber(onPanelMouseLeaves))

		g_TitleStateMachine:switch("Logo", state)
		g_TitlePanelStateMachine:switch("Hiden", state)
	end,

	__leave = function(state)
		clearAnimation()

		if g_Pool1 then
			g_Pool1:stop()
		end
		g_Pool1 = nil

		state.Fireworks:get():getNode():setVisible(false)

		g_GuiWindows.PromptStart:hide()
		g_GuiWindows.InitialPanel:hide()
		g_GuiWindows.Close:hide()
		g_GuiWindows.Layers:hide()

		if g_BackgroundMusic then
			g_BackgroundMusic:get():stop()
		end

		g_CameraNode:setOrientation(Tanx.Quaternion.IDENTITY)
	end,

	step = function(state, elapsed)
		g_TitleStateMachine:callState("step", state, elapsed)
		g_TitlePanelStateMachine:callState("step", state, elapsed)

		state.AnimationTime = state.AnimationTime + elapsed
	end,

	mousePressed = function(state, e, id)
		g_TitlePanelStateMachine:callState("mousePressed", state, e, id)
	end,

	keyPressed = function(state, e)
		if e.key == OIS.KeyCode.DOWN then
			if g_Pool1 and state.ActiveLayer > 0 then
				g_Pool1:activateBlocks(state.ActiveLayer)
				Tanx.log("[Tetris\\TitleState.lua]: layer " .. state.ActiveLayer .. " actived.")
				state.ActiveLayer = state.ActiveLayer - 1
			end
		elseif e.key == OIS.KeyCode.ESCAPE then
			g_Game:exit()
		end

		g_TitlePanelStateMachine:callState("keyPressed", state, e)
	end,

	buttonPressed = function(state, arg, button)
		--[[if button == g_ButtonMap.Start then
			g_GameStateMachine:switch("Transition", "Gaming")
		end]]

		g_TitlePanelStateMachine:callState("buttonPressed", state, arg, button)
	end,
}
