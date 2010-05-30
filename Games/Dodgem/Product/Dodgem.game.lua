--[[
**	This source file is part of Tanx.
**
**	Copyright (c) 2009-2010	K.L.'s Studio	<xxxk.l.xxx@gmail.com>
**	This program is free software without any warranty.

	Dodgem\Dodgem.game.lua
--]]

Tanx.log("[Dodgem\\Dodgem.game.lua]: parsed.")

Tanx.require"Core:utility.lua"
Tanx.require"Core:StateMachine.lua"
Tanx.dofile"VehicleCamera.lua"
Tanx.dofile"Dodgem.lua"
Tanx.dofile"ScoreMark.lua"
Tanx.dofile"TailState.lua"


s_PreparingDuration = 5.6
s_GamingDuration = 100
s_PostGameDuration = 8


g_AutomobileList = {}
g_AiCarList = {}
g_ScoreMarks = {}

g_TailStates = {}


function onPlayerHitTail(id, power)
	if g_StateMachine:stateKey() == "Gaming" then
		local score = math.floor(power / 3)
		g_Score = g_Score + score

		if score > 0 then
			assert(g_WindowManager)
			local mark = ScoreMark(g_WindowManager, score)
			table.insert(g_ScoreMarks, mark)

			g_TailStates.Ai[id]:flicker()
		end
	end
end

function onAiHitTail(power)
	if g_StateMachine:stateKey() == "Gaming" then
		local score = math.floor(power / 5)

		if score > 0 then
			if g_ProtectedTime <= 0 then
				g_Score = g_Score - score
				g_ProtectedTime = 0.4

				assert(g_WindowManager)
				local mark = ScoreMark(g_WindowManager, -score)
				table.insert(g_ScoreMarks, mark)

				g_TailStates.Player:flicker()
			end
		end
	end
end


function resetGame()
	g_World:reset()

	-- load scene
	local scene = g_Game:getResourcePackage():get():getResource("Park.scene")
	g_World:loadScene(scene, g_Game:getResourcePackage())

	g_AutomobileList = {}

	local car1 = g_World:createAgent("Dodgem/Dodgem", "player%index", Tanx.RigidBodyState.make(Tanx.Vector3(0, 0.8, -20)))
	g_PlayerCar = Dodgem(g_World, car1:get(), "Dodgem/Dodgem", nil, {onHitTail = onPlayerHitTail})
	table.insert(g_AutomobileList, g_PlayerCar)
	g_TailStates.Player = TailState(car1)

	-- create AI cars
	g_AiCarList = {}
	g_TailStates.Ai = {}
	local aiparams = Tanx.tableToMap{target = car1, onHitTail = Tanx.functor(onAiHitTail)}
	local i
	for i = 1, 5 do
		local ai = g_World:createAgent("Dodgem/AiCar", "aicar%index", Tanx.RigidBodyState.make(Tanx.Vector3((i - 3) * 8, 0.8, 20)), g_Game:getResourcePackage(), aiparams)
		table.insert(g_AiCarList, ai)

		local tailid = ai:get():findBody"tail":get():getRigidBody():get():getUid()
		g_TailStates.Ai[tailid] = TailState(ai)
	end

	-- create main camera
	g_MainCamera = VehicleCamera(car1, g_World, "Main", {Radius = 7, AspectRatio = g_Game:getWindow():getWidth() / g_Game:getWindow():getHeight(), RearCamera = {}})

	g_Game:getWindow():removeAllViewports()
	local viewport = g_Game:getWindow():addViewport(g_MainCamera:getCamera())
	viewport:setBackgroundColour(Ogre.ColourValue(0.2, 0.3, 0.5))

	Ogre.CompositorManager.getSingleton():addCompositor(viewport, "Dodgem/Curtain")
	Ogre.CompositorManager.getSingleton():setCompositorEnabled(viewport, "Dodgem/Curtain", true)
	g_CompositorChain = Ogre.CompositorManager.getSingleton():getCompositorChain(viewport)

	local rearview = g_Game:getWindow():addViewport(g_MainCamera:getRearCamera(), 1, 0.3, 0.01, 0.4, 0.2)
	rearview:setBackgroundColour(Ogre.ColourValue(0.2, 0.3, 0.5))
	rearview:setOverlaysEnabled(false)

	-- create sound listener
	if g_SoundListener == nil then
		local s, r = pcall(openalpp.Listener.new)
		if s then
			g_SoundListener = r
		end
	end
	if g_SoundListener then
		updateSoundListenerByCamera(g_SoundListener, g_MainCamera:getCamera())
	end

	g_Score = 0
	g_GameTimeRemain = s_GamingDuration

	g_ProtectedTime = 0
end


function setCurtainIntensity(intensity)
	intensity = math.min(math.max(intensity, 0), 1)

	g_CurtainMaterial = g_CurtainMaterial or Ogre.MaterialManager.getSingleton():getByName"Dodgem/Curtain":get():toDerived()
	--assert(g_CurtainCompositor)
	--g_CurtainMaterial = g_CurtainMaterial or g_CurtainCompositor:getTechnique():getOutputTargetPass():getPass(0):getMaterial():get()

	local color = Ogre.ColourValue.White * (1 - intensity)

	local texunit = g_CurtainMaterial:getTechnique(0):getPass(0):getTextureUnitState"Mask"
	local blendop = texunit:getColourBlendMode()
	if blendop.colourArg1 ~= color then
		texunit:setColourOperationEx(blendop.operation, blendop.source1, blendop.source2, color)

		assert(g_CompositorChain)
		g_CompositorChain:_markDirty()
	end
end


function setHudVisible(visible)
	g_GuiWindows.Score:setVisible(visible)
	g_GuiWindows.Timer:setVisible(visible)

	local rearview = g_Game:getWindow():getViewport(1)
	if visible then
		rearview:setDimensions(0.3, 0.01, 0.4, 0.2)
	else
		rearview:setDimensions(0, 0, 0, 0)
	end
end


function initialize(game)
	g_Game = game
	g_World = game:getWorld()
	g_Keyboard = game:getKeyboard()
	g_Mouse = game:getMouse()

	-- setup GUI
	g_GuiSystem = CEGUI.System.getSingleton()
	CEGUI.SchemeManager.getSingleton():loadScheme(CEGUI.String"TaharezLookSkin.scheme")
	g_WindowManager = CEGUI.WindowManager.getSingleton()
	local sheet = g_WindowManager:loadWindowLayout(CEGUI.String"Dodgem.layout")
	g_GuiSystem:setGUISheet(sheet)

	g_GuiWindows =
	{
		Score		= g_WindowManager:getWindow(CEGUI.String"Dodgem/Score"),
		Timer		= g_WindowManager:getWindow(CEGUI.String"Dodgem/Timer"),
		Prompt		= g_WindowManager:getWindow(CEGUI.String"Dodgem/Prompt"),
		Countdown	= g_WindowManager:getWindow(CEGUI.String"Dodgem/Countdown"),
	}
	g_GuiWindows.Prompt:hide()

	g_StateMachine:switch"Preparing"
end


function onStep(elapsed)
	g_MainCamera:step(elapsed)

	-- player control
	do
		local driver = g_PlayerCar.Driver
		driver.m_positionX = 0
		driver.m_positionY = 0
		driver.m_handbrakeButtonPressed:set(g_Keyboard ~= nil and g_Keyboard:isKeyDown(OIS.KeyCode.SPACE))
		driver.m_reverseButtonPressed:set(g_Keyboard ~= nil and g_Keyboard:isKeyDown(OIS.KeyCode.LCONTROL))

		if g_Keyboard then
			if g_Keyboard:isKeyDown(OIS.KeyCode.W) or g_Keyboard:isKeyDown(OIS.KeyCode.UP) then
				driver.m_positionY = driver.m_positionY + 1
			end

			if g_Keyboard:isKeyDown(OIS.KeyCode.S) or g_Keyboard:isKeyDown(OIS.KeyCode.DOWN) then
				driver.m_positionY = driver.m_positionY - 1
			end

			if g_Keyboard:isKeyDown(OIS.KeyCode.A) or g_Keyboard:isKeyDown(OIS.KeyCode.LEFT) then
				driver.m_positionX = driver.m_positionX - 1
			end

			if g_Keyboard:isKeyDown(OIS.KeyCode.D) or g_Keyboard:isKeyDown(OIS.KeyCode.RIGHT) then
				driver.m_positionX = driver.m_positionX + 1
			end
		end
	end

	local k, i, v

	for i, v in ipairs(g_AutomobileList) do
		v:step(elapsed)
	end

	for i, v in ipairs(g_ScoreMarks) do
		repeat
			v:step(elapsed)

			local next = true
			if v.RemainTime <= 0 then
				table.remove(g_ScoreMarks, i)
				v = g_ScoreMarks[i]
				next = false
			end
		until next or v == nil
	end

	if g_SoundListener then
		updateSoundListenerByCamera(g_SoundListener, g_MainCamera:getCamera(), elapsed)
	end

	g_GuiWindows.Score:setText(CEGUI.String("S " .. g_Score))
	g_GuiWindows.Timer:setText(CEGUI.String(string.format("%6.2f", g_GameTimeRemain)))

	local state = g_StateMachine:state()
	if state and state.step then
		state:step(elapsed)
	end

	g_TailStates.Player:step(elapsed)
	for k, v in pairs(g_TailStates.Ai) do
		v:step(elapsed)
	end
end


function windowClosing(window)
	g_Game:exit()

	return false
end


function updateSoundListenerByCamera(listener, camera, elapsed)
	elapsed = elapsed or 1

	local chassis = g_PlayerCar.Chassis:lock()

	if chassis:get() then
		--local position = camera:getRealPosition()
		local position = chassis:get():getPosition()
		local velocity = chassis:get():getLinearVelocity()
		local direction = camera:getRealDirection()
		local up = camera:getRealUp()

		--g_LastPosition = g_LastPosition or position
		--local velocity = (position - g_LastPosition) / elapsed

		listener:get():setPosition(position.x, position.y, position.z)
		listener:get():setOrientation(direction.x, direction.y, direction.z, up.x, up.y, up.z)
		listener:get():setVelocity(velocity.x, velocity.y, velocity.z)

		--g_LastPosition = position
	end
end



g_StateMachine = TanxStateMachine{
	Preparing =
	{
		SubState = TanxStateMachine{
			FadeIn =
			{
				enterState = function(state, parent)
					state.CurtainIntensity = 1.2

					setHudVisible(false)

					setCurtainIntensity(state.CurtainIntensity)
				end,

				step = function(state, parent, elapsed)
					state.CurtainIntensity = state.CurtainIntensity - elapsed * 0.7
					setCurtainIntensity(state.CurtainIntensity)

					if state.CurtainIntensity < 0 then
						parent.SubState:switch("Countdown", parent)
					end
				end,
			},

			Countdown =
			{
				enterState = function(state, parent)
					g_GuiWindows.Countdown:setText(CEGUI.String(tostring(math.ceil(s_PreparingDuration - parent.Time))))
					g_GuiWindows.Countdown:show()
				end,

				step = function(state, parent, elapsed)
					g_GuiWindows.Countdown:setText(CEGUI.String(tostring(math.ceil(s_PreparingDuration - parent.Time))))
				end,
			},
		},

		enterState = function(state)
			resetGame()

			state.Time = 0

			state.SubState:switch("FadeIn", state)
		end,

		leaveState = function(state)
			g_GuiWindows.Countdown:hide()
		end,

		step = function(state, elapsed)
			state.Time = state.Time + elapsed

			local substate = state.SubState:state()
			if substate and substate.step then
				substate:step(state, elapsed)
			end

			if state.Time > s_PreparingDuration then
				g_StateMachine:switch"Gaming"
				return
			end
		end,
	},


	Gaming =
	{
		enterState = function(state)
			setHudVisible(true)

			local i, v
			for i, v in ipairs(g_AiCarList) do
				v:get():callHost(Tanx.param"enable", Tanx.param(true))
			end
		end,

		leaveState = function(state)
			local i, v
			for i, v in ipairs(g_AiCarList) do
				v:get():callHost(Tanx.param"enable", Tanx.param(false))
			end
		end,

		step = function(state, elapsed)
			if g_ProtectedTime > 0 then
				g_ProtectedTime = g_ProtectedTime - elapsed
			end

			if g_GameTimeRemain > 0 then
				g_GameTimeRemain = g_GameTimeRemain - elapsed

				if g_GameTimeRemain < 0 then
					g_GameTimeRemain = 0
					g_StateMachine:switch"PostGame"
				end
			end
		end,
	},


	PostGame =
	{
		SubState = TanxStateMachine{
			Idle =
			{
				step = function(state, parent, elapsed)
					if parent.RemainTime < 2 then
						parent.SubState:switch("FadeOut", parent)
					end
				end,
			},

			FadeOut =
			{
				enterState = function(state, parent)
					setHudVisible(false)
					state.CurtainIntensity = 0
				end,

				step = function(state, parent, elapsed)
					state.CurtainIntensity = state.CurtainIntensity + elapsed * 0.7
					setCurtainIntensity(state.CurtainIntensity)
				end,
			},
		},

		enterState = function(state)
			state.RemainTime = s_PostGameDuration

			g_GuiWindows.Prompt:setAlpha(0)
			g_GuiWindows.Prompt:setText(CEGUI.String("TOTAL: " .. g_Score))
			g_GuiWindows.Prompt:show()

			-- TODO: play a sound

			state.SubState:switch("Idle", state)
		end,

		leaveState = function(state)
			g_GuiWindows.Prompt:hide()
			setCurtainIntensity(1)
		end,

		step = function(state, elapsed)
			state.RemainTime = state.RemainTime - elapsed
			if state.RemainTime <= 0 then
				g_StateMachine:switch"Preparing"
				return
			end

			local substate = state.SubState:state()
			if substate and substate.step then
				substate:step(state, elapsed)
			end

			g_GuiWindows.Prompt:setAlpha(math.min(math.max((s_PostGameDuration - state.RemainTime - 2) * 0.4, 0), 1))
		end,
	},
}
