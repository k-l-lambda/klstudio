--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	TitleState.lua
--]]


Tanx.log("[Tetris\\TitleState.lua]: parsed.")

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


TitleState =
{
	enterState = function(state)
		state.AnimationState = s_StateLogo
		state.AnimationTime = 0

		g_Pool1 = TetrisPool(g_Game, g_AiController, nil, {Center = {x = 0, z = 0}, FreezeTime = 0.2, BlockLayers = 0, ShowBrickFreezeClock = false})

		state.MirrorCube = g_Pool1:dropBigCube{material = "Tetris/TitleMirror", height = s_CameraInitialHeight}
		state.MirrorCube:get():freeze()

		g_CameraNode:setPosition(Tanx.Vector3(-1, s_CameraInitialHeight, 10))
		g_MainCamera:setFOVy(Tanx.Radian(math.pi * 0.039))
		g_MainCamera:setPosition(Tanx.Vector3.ZERO)
		g_MainCamera:lookAt(state.MirrorCube:get():getMainNode():getPosition() + Tanx.Vector3(0.2, 0, 1))

		if state.Fireworks then
			state.Fireworks:get():getNode():setVisible(true)
		else
			state.Fireworks = g_World:createAgent("Tetris/Fireworks", "fireworks", Tanx.RigidBodyState.make(Tanx.Vector3(0, -1, 0)))
		end

		g_GuiWindows.PromptStart:hide()
		g_GuiWindows.Close:hide()
		g_GuiWindows.BrickFreezeClock:hide()
		g_GuiWindows.Layers:hide()
		g_GuiSystem:hideMouseCursor()

		state.ActiveLayer = 21

		if g_BackgroundMusic then
			g_BackgroundMusic:get():play(g_TitleMusic)
		end
	end,

	leaveState = function(state)
		clearAnimation()

		if g_Pool1 then
			g_Pool1:stop()
		end
		g_Pool1 = nil

		state.Fireworks:get():getNode():setVisible(false)

		g_GuiWindows.PromptStart:hide()
		g_GuiWindows.Close:hide()
		g_GuiWindows.Layers:hide()

		if g_BackgroundMusic then
			g_BackgroundMusic:get():stop()
		end
	end,

	step = function(state, elapsed)
		if state.AnimationState == s_StateLogo then
			if state.AnimationTime > 1 then
				--local mm = Ogre.MaterialManager.getSingleton()
				--local mat = mm:getByName("Tetris/WellWallWithTitle"):get():toDerived()
				--mat:getTechnique(0):getPass(1):getTextureUnitState(0):setScrollAnimation(0, -0.04)

				state.AnimationState = s_StateScrolling

				Tanx.log("[Tetris\\state.lua]: title state to: Scrolling, time: " .. state.AnimationTime, Ogre.LogMessageLevel.TRIVIAL)
			end
		elseif state.AnimationState == s_StateScrolling then
			local i
			for i = 0, state.MirrorCube:get():getBodies():size() - 1 do
				local body = state.MirrorCube:get():getBodies():at(i)
				body:get():getRigidBody():get():setPosition(Tanx.madp(body:get():getPosition() - Tanx.Vector3(0, elapsed * 0.19, 0)))
			end

			g_MainCamera:lookAt(state.MirrorCube:get():getMainNode():getPosition() + Tanx.Vector3(0.2, 0, 1))

			if state.AnimationTime > 6 then
				state.MirrorCube:get():unfreeze()

				initCameraTrack()
				g_AnimState:setTimePosition(0)
				g_AnimState:setEnabled(true)

				state.AnimationState = s_StateTransiting
				state.StateTimeBegin = state.AnimationTime

				state.BlocksFillTime = 0

				Tanx.log("[Tetris\\state.lua]: title state to: Transiting, time: " .. state.AnimationTime, Ogre.LogMessageLevel.TRIVIAL)
			end
		elseif state.AnimationState == s_StateTransiting then
			local time = (state.AnimationTime - state.StateTimeBegin) / s_CameraTrackLength
			local lookatRate = math.pow(time, math.exp((0.32 - time) * 10))

			local fov = math.min(g_MainCamera:getFOVy():valueRadians() + 0.064 * elapsed, math.pi * 0.32)
			g_MainCamera:setFOVy(Tanx.Radian(fov))
			if state.MirrorCube:get():getMainNode() then
				state.MirrorCubePosition = state.MirrorCube:get():getMainNode():getPosition() + Tanx.Vector3(0.2, 0, 1)
			else
				state.BlocksFillTime = state.BlocksFillTime + elapsed
			end
			g_MainCamera:lookAt(state.MirrorCubePosition * (1 - lookatRate) + s_CameraAxisPosition * lookatRate)

			if state.BlocksFillTime > s_BlocksFillInterval and g_Pool1.Heap:maxY() < s_BlocksHeight then
				state.BlocksFillTime = 0

				g_Pool1:fillBlocksLayer()
			end

			g_AnimState:addTime(elapsed)

			if g_AnimState:hasEnded() then
				clearAnimation()
				g_CameraNode:setOrientation(Tanx.Quaternion(Tanx.Radian(-math.pi / 2), Tanx.Vector3.UNIT_Y))

				g_GuiWindows.PromptStart:show()
				g_GuiWindows.Close:show()
				g_GuiWindows.Layers:show()
				g_GuiSystem:setDefaultMouseCursor(CEGUI.String"TaharezLook", CEGUI.String"MouseArrow")

				state.AnimationState = s_StateSurrounding

				Tanx.log("[Tetris\\state.lua]: title state to: Surrounding, time: " .. state.AnimationTime, Ogre.LogMessageLevel.TRIVIAL)
			end
		elseif state.AnimationState == s_StateSurrounding then
			if g_Pool1 then
				g_Pool1:step(elapsed)
			end

			local yaw = elapsed * 0.2
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

			g_CameraNode:yaw(Tanx.Radian(yaw))
		end

		state.AnimationTime = state.AnimationTime + elapsed
	end,

	keyPressed = function(state, e)
		if e.key == OIS.KeyCode.RETURN then
			g_GameStateMachine:switch("Transition", "Gaming")
		elseif e.key == OIS.KeyCode.DOWN then
			if g_Pool1 and state.ActiveLayer > 0 then
				g_Pool1:activateBlocks(state.ActiveLayer)
				Tanx.log("[Tetris\\TetrisGame.lua]: layer " .. state.ActiveLayer .. " actived.")
				state.ActiveLayer = state.ActiveLayer - 1
			end
		elseif e.key == OIS.KeyCode.ESCAPE then
			g_Game:exit()
		end
	end,

	buttonPressed = function(state, arg, button)
		if button == 9 then
			g_GameStateMachine:switch("Transition", "Gaming")
		end
	end,
}
